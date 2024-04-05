import { writable, Writable, get, derived } from "svelte/store";
import * as R from 'ramda';
import * as U from './utils';
import { constraintsPreset } from "./constraints";
import * as vec from './vec'
import { EventStore } from "./UIState";

let $E;

EventStore.subscribe(
    x => $E = x
)
interface Vec {
    x: number,
    y: number,
	movementX: number,
	movementY: number
}

type P<T> = Record<string, T> //record with fields of type t

let randomForward = axes => _n => R.zipObj(
	axes,
	axes.map(
		(_val) =>
			U.lerp(0, 1, 0, 2**32 - 1, Math.random())
	)
)


export function liftedConstraintStore(ranges: Array<[string, P<any>]>, _epsilon: number = 0.01):[any,Writable<string[]>] {
	//compute a default value for a parameter if the required attributes aren't all specified
	function computeDefault(p) {
		let r = p;
		r.z ??= p.c1 - p.c0;
		r.b ??= (p.c1 - p.c0) / 2
		r.a ??= U.lerp(0, 1, r.b - r.z / 2, r.b + r.z / 2, Math.random())
		r.locked ??= false;
		return r
	}

	//initialize object with default args in each field.
	let X0: P<P<any>> = R.map(computeDefault, R.fromPairs(ranges))
	let F0 = U.deepAlways(R.fromPairs(ranges))

	const Params = writable(U.liftSolve(U.solve(constraintsPreset), F0,X0)) //store of records
	const Keys: Writable<string[]> = writable(R.map(x => x[0], ranges))

	function evolve(transformer){
		Params.update(U.liftSolve(U.solve(constraintsPreset),transformer))
	}
	function set_S(X: P<P<number|boolean>>) {
		evolve(U.deepAlways(X))
	}

	return [
		{ subscribe: Params.subscribe, set: set_S, update: Params.update, evolve:evolve},
		{ subscribe: Keys.subscribe, set: Keys.set, update: Keys.update }
	]
}

export function MuesliStore(data) {
	// B = bits per dimensions, P = parameters, K = Keys, HF = Hilbert Forward, HR = Hilbert Reverse
	const [Params, Keys]:[any, Writable<string[]>] = liftedConstraintStore(data.inputSpace)
	const Bits: Writable<number> = writable(32)
	const Unlocked = derived([Keys,Params],([$K, $P])=>R.reject((x:string)=>R.prop('locked',$P[x]),$K))
	const MaxH = derived([Unlocked,Bits],([$U, $B])=>BigInt(2**($U.length*$B)-1))
	let $Params, $Bits:number, $Unlocked:Array<string>, $H_global, $H_local, $MaxH

	Bits.subscribe((b:number) => { $Bits = b })
	Params.subscribe(p => { $Params = p; })
	Unlocked.subscribe((u:Array<string>) => { $Unlocked = u; })
	MaxH.subscribe((u:bigint) => { $MaxH = u; })

	//initialize Hilbert indices to half of their max values if they aren't declared in the "data" argument 
	data.h_local ??= U.prod(0.5, $MaxH, 9)
	data.h_global ??= U.prod(0.5, $MaxH, 9)
	const [H_local, H_global] = [writable(data.h_local), writable(data.h_global)]

	H_global.subscribe(h => { $H_global = h })
	H_local.subscribe(h => { $H_local = h })

	//lens pattern to have a 2 way interpolation between the the parameter range and the hilbert coordinate
	let lensA = U.lerpLens('a', ({b,z}) => [b - z / 2, b + z / 2], [0, 2**$Bits - 1])
	let lensB = U.lerpLens('b', ({c0,c1,z}) => [c0+ z / 2, c1- z / 2], [0, 2**$Bits - 1])

	//setters just pass their arguments to an "Always" function then call the update with that function
	function setH_local(h) {
		updateH_local(R.always(R.clamp(0n, $MaxH, h)))
	}

	function setH_global(h) {
		updateH_global(R.always(R.clamp(0n, $MaxH, h)))
	}

	function updateH_local(f_h) {
		H_local.update(x => R.clamp(0n, $MaxH, f_h(x)))
		let hx = R.zipObj($Unlocked, U.HilbertForward($H_local, $Bits,  $Unlocked.length))
		Params.set(R.mergeWith(R.set(lensA), hx, $Params))
	}

	function updateH_global(f_h) {
		H_global.update(R.pipe(f_h, R.clamp(0n, $MaxH)))
		let hx = R.zipObj($Unlocked, U.HilbertForward($H_global, $Bits,  $Unlocked.length))
		Params.set(R.mergeWith(R.set(lensB), hx, $Params))
	}

	function evolveParams(X){
		updateParams(U.liftSolve(U.solve(constraintsPreset), R.pick($Unlocked,X)))
	}

	function updateParams(X) {
		Params.update(X)
		let [H_global_setters, H_local_setters] = [
			R.mapObjIndexed(R.view(lensB), $Params),
			R.mapObjIndexed(R.view(lensA), $Params)
		]
		//compute inverse for the subset of unlocked keys only
		H_local.set(U.HilbertInverse(Uint32Array.from(R.props($Unlocked, H_local_setters)), $Bits))
		//compute inverse for the subset of unlocked keys only
		H_global.set(U.HilbertInverse(Uint32Array.from(R.props($Unlocked, H_global_setters)), $Bits))
	}
	return [
		{ subscribe: H_global.subscribe, set: setH_global, update: updateH_global },
		{ subscribe: H_local.subscribe, set: setH_local, update: updateH_local },
		{ subscribe: Params.subscribe, set: Params.set, update: updateParams, evolve: evolveParams},
		Bits,
		Unlocked,
		derived(Params,R.pluck("a")),
		MaxH
	]
}

export function AlignmentStore(P1: Partial<Vec>, P2: Partial<Vec>, P3: Partial<Vec>) {
    const [A, B, C] = [writable(P1), writable(P2), writable(P3)]
    const K = writable(P2)
    const [Shift, Click] = [writable(false), writable(false)]
    const [AB, AC, BC] = [
        derived([A, B], ([a, b]) => vec.sub(a, b)),
        derived([A, C], ([a, c]) => vec.sub(a, c)),
        derived([B, C], ([b, c]) => vec.sub(b, c))]
    const Target = writable(undefined)
    let $Shift, $Click, $A, $B, $C, $AB, $AC, $BC, $Target, $K

    Shift.subscribe(x => { $Shift = x })
    Click.subscribe(x => { $Click = x })
    A.subscribe(x => { $A = x })
    B.subscribe(x => { $B = x })
    C.subscribe(x => { $C = x })
    AB.subscribe(x => { $AB = x })
    AC.subscribe(x => { $AC = x })
    BC.subscribe(x => { $BC = x })
    Target.subscribe(x => { $Target = x })
    K.subscribe(x => { $K = x })
    function ClickSet(value: boolean) {
        /** retrieve the list of movable elements at B's position */
        let targetList = document
            .elementsFromPoint($B.x, $B.y)
            .filter(x => x.classList.contains('thumb') || x.classList.contains('range'))

		// let targetList = U.targetAcquisition(document)($B.x, $B.y,x=>U.containsAny(x.classList,["thumb","range"]))
        /** set target to undefined if targetList is empty */ 
        let res = targetList.length > 0 ? targetList[0] : undefined;
		let rect = res?.getBoundingClientRect()

        /** set TargetStore to res on mouseDown, and to undefined on mouseUp */ 
        value ? Target.set({elem:res,offset:{
			offsetX: $B.x-rect?.x-rect?.width/2,
			offsetY: $B.y-rect?.y-rect?.height/2,
		}}) : Target.set(undefined)

		/** set Click to true on mouseDown, and to false on mouseUp */ 
        Click.set(value)
        K.set($B)
        
    }
    function ASet(v: any) {
        AUpdate(R.mergeLeft(v))
    }

	
    function AUpdate(u) {
        if ($Click) {
            if ($Shift) {
				A.set(vec.projectXAB(u($A), $A, $C))
            }
            else {
                A.update(u)
				console.log($B.movementX)
				let Bnew = Math.abs($AC.y)-0.01>Math.abs($C.y-$K.y) ? {
                    x: ($K.y - $C.y)*$AC.x/$AC.y + $C.x,
                    y: $K.y
                } : vec.add($A, vec.scale(0.01,$AC))
                B.update(R.mergeLeft(Bnew))   
            }
        }
        else {
            if ($Shift) {
				let u3 = $AC
                A.update(u)
                let newC = vec.norm($AB)>=vec.norm($AC) + 0.01? vec.add($B,vec.setNorm(0.01,$AB)) :
                vec.add($A,vec.setNorm(vec.norm(u3),$AB))
                C.set(newC)
            }
            else {
                let [u2, u3] = [$AB, $AC]
                A.update(u)
                B.set(vec.add($A, u2))
                C.set(vec.add($A, u3))
            }
        }
    }

    return [
        { subscribe: A.subscribe, set: ASet, update: AUpdate },
        { subscribe: B.subscribe, set: ClickSet },
        { subscribe: C.subscribe, set: Shift.set },
        { subscribe: Target.subscribe }
    ]
}

