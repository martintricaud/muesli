import { writable, Writable, get, derived } from "svelte/store";
import * as R from 'ramda';
import * as U from './utils';
import { constraintsPreset } from "./constraints";
import { prng_alea } from 'esm-seedrandom';
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


export function liftedConstraintStore(ranges: Array<[string, P<any>]>, _epsilon: number = 0.01) {
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
	const [Params, Keys] = liftedConstraintStore(data.inputSpace)
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

export function AlignmentStore(A: Partial<Vec>, B: Partial<Vec>, C: Partial<Vec>) {
    const [P1, P2, P3] = [writable(A), writable(B), writable(C)]
    const K = writable(B)
    const [Shift, Click] = [writable(false), writable(false)]
    const [P1P2, P1P3, P2P3] = [
        derived([P1, P2], ([a, b]) => vec.sub(a, b)),
        derived([P1, P3], ([a, b]) => vec.sub(a, b)),
        derived([P2, P3], ([a, b]) => vec.sub(a, b))]
    const Target = writable(undefined)
	const Rot = derived([P1,P3],([p1,p3])=>{return {
		z: p1.movementX / (p1.y - p3.y)
	}})

    let $Shift, $Click, $P1, $P2, $P3, $P1P2, $P1P3, $P2P3, $Target, $K, $Rot

    Shift.subscribe(x => { $Shift = x })
    Click.subscribe(x => { $Click = x })
    P1.subscribe(x => { $P1 = x })
    P2.subscribe(x => { $P2 = x })
    P3.subscribe(x => { $P3 = x })
    P1P2.subscribe(x => { $P1P2 = x })
    P1P3.subscribe(x => { $P1P3 = x })
    P2P3.subscribe(x => { $P2P3 = x })
    Target.subscribe(x => { $Target = x })
    K.subscribe(x => { $K = x })
	Rot.subscribe(x => { $Rot = x })

    function ClickSet(value: boolean) {
        /** retrieve the list of movable elements at P2's position */
        let targetList = document
            .elementsFromPoint($P2.x, $P2.y)
            .filter(x => x.classList.contains('thumb') || x.classList.contains('range'))

        /** set target to undefined if targetList is empty */ 
        let res = targetList.length > 0 ? targetList[0] : undefined;

        /** set TargetStore to res on mouseDown, and to undefined on mouseUp */ 
        value ? Target.set({elem:res,offset:{
			offsetX: $P2.x-res.getBoundingClientRect().x-res.getBoundingClientRect().width/2,
			offsetY: $P2.y-res.getBoundingClientRect().y-res.getBoundingClientRect().height/2,
		}}) : Target.set(undefined)

		/** set Click to true on mouseDown, and to false on mouseUp */ 
        Click.set(value)
        K.set($P2)
        
    }
    function P1Set(v: any) {
        P1Update(R.mergeLeft(v))
    }

    function P1Update(u) {
        if ($Click) {
            if ($Shift) {
                let P1bis = vec.projectXAB(u($P1), $P1, $P3)
                let foo = vec.norm(vec.sub(P1bis, $P3))<=(vec.norm($P2P3)+1e-5) ? vec.add($P2, vec.setNorm(1e-5,vec.sub($P2,$P3))) : P1bis
                P1.set(foo)
            }
            else {
                /** movementX is the difference between the current position and the previous position */
                P1.update(u)
				let vP = (P:Partial<Vec>, Rotation) => {return {
					movementX: Rotation.z*(P.y-$P3.y),
					movementY: -Rotation.z*($P3.x-P.x),
				}}
                /** Slope of the line P1P3 */
                let slope = $P1P3.y/$P1P3.x
                /** Offset of the line P1P3 */
                let offset = $P3.y - $P3.x*$P1P3.y/$P1P3.x
                /** the x coordinate of the intersection between y = $K.y and P1P3 equals ($K.y - offset/slope) */
                let intersectionPos = {
                    x: ($K.y - offset)/slope,
                    y: $K.y, 
                }
                let intersectionMov =  vP(intersectionPos, $Rot)

                let P2new = Math.abs($P1P3.y)-0.01>Math.abs($P3.y-$K.y) ? {
                    x: intersectionPos.x + $P2.movementX,
                    y: intersectionPos.y + $P2.movementY,
                    movementX: intersectionMov.movementX,
                    movementY: 0,
                } : vec.add($P1, vec.scale(0.01,$P1P3))
            
                P2.update(R.mergeLeft(P2new))   
            }
        }
        else {
            if ($Shift) {
                let u3 = $P1P3
                P1.update(u)
                let newP3 = vec.norm($P1P2)>=vec.norm(u3) + 0.01? vec.add($P2,vec.setNorm(0.01,$P1P2)) :
                vec.add($P1,vec.setNorm(vec.norm(u3),$P1P2))
                P3.set(newP3)
            }
            else {
                let [u2, u3] = [$P1P2, $P1P3]
                P1.update(u)
                P2.set(vec.add($P1, u2))
                P3.set(vec.add($P1, u3))
            }
        }
    }

    return [
        { subscribe: P1.subscribe, set: P1Set, update: P1Update },
        { subscribe: P2.subscribe, set: ClickSet },
        { subscribe: P3.subscribe, set: Shift.set },
        { subscribe: Target.subscribe }
    ]
}
