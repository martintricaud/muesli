import { writable, Writable, get, derived } from "svelte/store";
import * as R from 'ramda';
import * as U from './utils';
import { wasm_functions as W } from '../main.js';
import { constraintsPreset } from "./constraints";
import { prng_alea } from 'esm-seedrandom';



type P<T> = Record<string, T> //record with fields of type t
let u32a = Uint32Array;
interface PresetV{
    h_local: string, h_global:string, ranges: Array<[string, Record<string, number|boolean>]>, z:number
}
interface Preset extends PresetV{
    name:string
}

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

	function set_S(X: P<P<number|boolean>>) {
		Params.update(U.liftSolve(U.solve(constraintsPreset), U.deepAlways(X)))
	}

	function updateItem(itemKey, itemModification){
		//console.log(get(Params)[itemKey][itemField])
		let target = get(Params)[itemKey]
		let f = U.solve(constraintsPreset,itemModification,target)
		let f2 = U.solve(constraintsPreset,{a: x=>x+2},target)
		let g = R.evolve(f,target)
		let g2 = R.evolve(f2,target)
		console.log(g2.a)

		// Params.update(R.modify(itemKey,item => R.evolve(
		// 	U.solve(constraintsPreset,itemModification,item))
		// ))
	}

	return [
		{ subscribe: Params.subscribe, set: set_S, update: Params.update, updateItem:updateItem},
		{ subscribe: Keys.subscribe, set: Keys.set, update: Keys.update }
	]
}

export function MuesliStore(data) {
	// B = bits per dimensions, P = parameters, K = Keys, HF = Hilbert Forward, HR = Hilbert Reverse
	const [Params, Keys] = liftedConstraintStore(data.ranges)
	const Bits: Writable<number> = writable(32)
	const Unlocked = derived([Keys,Params],([$K, $P])=>R.reject((x:string)=>R.prop('locked',$P[x]),$K))
	const MaxH = derived([Unlocked,Bits],([$U, $B])=>BigInt(2**($U.length*$B)-1).toString())
	let $Params, $Bits, $Unlocked, $H_global, $H_local, $MaxH

	Bits.subscribe(b => { $Bits = b })
	Params.subscribe(p => { $Params = p; })
	Unlocked.subscribe(u => { $Unlocked = u; })
	MaxH.subscribe(u => { $MaxH = u; })

	//initialize Hilbert indices to half of their max values if they aren't declared in the "data" argument 
	data.h_local ??= W.bigint_prod(0.5, U.fMAX_H($Bits, $Unlocked.length), 100)
	//todo data.h_local ??= W.bigint_prod(0.5, $MaxH, 100)
	data.h_global ??= W.bigint_prod(0.5, U.fMAX_H($Bits, $Unlocked.length), 100)
	//todo data.h_local ??= W.bigint_prod(0.5, $MaxH, 100)
	const [H_local, H_global] = [writable(data.h_local), writable(data.h_global)]

	//lens pattern to have a 2 way interpolation between the the parameter range and the hilbert coordinate
	let lensA = U.lerpLens('a', ({b,z}) => [b - z / 2, b + z / 2], [0, 2**$Bits - 1])
	let lensB = U.lerpLens('b', ({c0,c1,z}) => [c0+ z / 2, c1- z / 2], [0, 2**$Bits - 1])

	//setters just pass their arguments to an "Always" function then call the update with that function
	function setH_local(h: string) {
		updateH_local(R.always(U.clamp('0', U.fMAX_H($Bits, $Unlocked.length), h)))
		//todo updateH_local(R.always(U.clamp('0', $MaxH, h)))
	}

	function setH_global(h: string) {
		updateH_global(R.always(U.clamp('0', U.fMAX_H($Bits, $Unlocked.length), h)))
		//todo updateH_global(R.always(U.clamp('0', $MaxH, h)))
	}

	function updateH_local(f_h) {
		H_local.update(x => U.clamp('0', U.fMAX_H($Bits, $Unlocked.length), f_h(x)))
		//todo H_local.update(x => U.clamp('0', $MaxH, f_h(x)))
		let hx = R.zipObj($Unlocked, W.forward(get(H_local), $Bits,  $Unlocked.length))
		//todo hx = R.zipObj($Unlocked, U.HilbertForward($H_local, $Bits,  $Unlocked.length))
		Params.set(R.mergeWith(R.set(lensA), hx, $Params))
	}

	function updateH_global(f_h) {
		H_global.update(R.pipe(f_h, U.clamp('0', U.fMAX_H($Bits, $Unlocked.length))))
		//todo H_global.update(R.pipe(f_h, U.clamp('0', $MaxH)))
		let hx = R.zipObj($Unlocked, W.forward(get(H_global), $Bits,  $Unlocked.length))
		//todo hx = R.zipObj($Unlocked, U.HilbertForward($H_global, $Bits,  $Unlocked.length))
		Params.set(R.mergeWith(R.set(lensB), hx, $Params))
	}

	function updateParams(X) {
		Params.update(X)
		let [H_global_setters, H_local_setters] = [
			R.mapObjIndexed(R.view(lensB), $Params),
			R.mapObjIndexed(R.view(lensA), $Params)
		]
		//compute inverse for the subset of unlocked keys only
		H_local.set(W.inverse(u32a.from(R.props($Unlocked, H_local_setters)), $Bits))
		//todo H_local.set(U.HilbertInverse(u32a.from(R.props($Unlocked, H_local_setters)), $Bits))
		//compute inverse for the subset of unlocked keys only
		H_global.set(W.inverse(u32a.from(R.props($Unlocked, H_global_setters)), $Bits))
		//todo H_global.set(U.HilbertInverse(u32a.from(R.props($Unlocked, H_global_setters)), $Bits))
	}
	return [
		{ subscribe: H_global.subscribe, set: setH_global, update: updateH_global },
		{ subscribe: H_local.subscribe, set: setH_local, update: updateH_local },
		{ subscribe: Params.subscribe, set: Params.set, update: updateParams, updateItem: Params.updateItem },
		Bits,
		Unlocked
	]
}

export function PresetStore(init: Preset[] | []) {
	const Presets: Writable<Preset[] | []> = writable(init);

	function addPreset(v: Preset, i: number = 10) {
		let f = (newVal, id = 10) => (presets: Preset[]) => R.insert(
			id, { ...{ name: U.assignDefaultName(R.pluck('name', presets)) }, ...newVal, }, presets
		);
		Presets.update(f(v, i))
	}
	function deletePreset(id: number) {
		let f = (id: number) => (presets: Preset[]) => R.remove(id, 1, presets)
		Presets.update(f(id))
	}
	function modifyPreset(v: Preset, i: number) {
		let f = (newValue: Preset, id: number) => (presets: Preset[]) => R.adjust(id, R.mergeLeft(newValue), presets)
		Presets.update(f(v, i))
	}
	return { subscribe: Presets.subscribe, set: Presets.set, update: Presets.update, erase: deletePreset, modify: modifyPreset, add: addPreset }
}

