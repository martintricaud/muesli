import { writable, Writable, get, derived } from "svelte/store";
import * as R from 'ramda';
import * as U from './utils';
import { wasm_functions as W } from '../main.js';
import { prng_alea } from 'esm-seedrandom';
import type * as T from './types'

type num = number
type bool = boolean
type str = string
type E<T> = (x: T) => T //endomorphism type
type P<T> = Record<str, T> //record with fields of type t
type T_Solver = (u: P<E<num|bool>>, p: P<num|bool>) => P<E<num|bool>>
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
			U.lerp(0, 1, 0, Math.pow(2, 32) - 1, Math.random())
	)
)

function randomReverse(X) {
	let a = R.mapObjIndexed((val, key, _obj) => val + key.toString(), X)
	let b = R.values(a).reduce((x, y) => x + y, "")
	let dim = R.values(a).length
	let max = W.max_hilbert(32, dim)
	let rand = prng_alea(b)
	let res = U.scale2bigint(0, 1, 0, max, rand)
	return res
}
export const random_adjunction = (axes) => [
	(n) => randomForward(axes)(n),
	(X) => randomReverse(X)
]

let e = 0.000001

export const solve = constraints => (update: P<E<num|bool>>, v: P<num|bool>) => {
	const g0: P<E<num|bool>> = R.mapObjIndexed((x: num,i) => update[i]== undefined ? R.identity: update[i], v) // fields that are not updated are updated with the identity
	return constraints.reduce((evolver, {predicate, g}) => U.constrainEvolver(v, evolver, predicate, g(evolver, v)), g0)
}

export const constraintsPreset = [
	{
		predicate: obj => obj.c1 - obj.c0 >= e,
		g: (f,v) => {
			return {
				c0: x => f.c1(x - e / 2) - e / 2,
				c1: x => f.c0(x + e / 2) + e / 2
			}
		}
	},
	{
		predicate: obj => obj.z <= obj.c1 - obj.c0 && obj.z >= e,
		g: (f,v) => {
			return {
				z: x=>R.clamp(e, f.c1(v.c1)-f.c0(v.c0),f.z(x))
			}
		}
	},
	{
		predicate: obj => obj.b >= obj.c0+obj.z/2 && obj.b <=  obj.c1-obj.z/2,
		g: (f,v) => {
			return {
				b: x=>R.clamp(f.c0(v.c0)+f.z(v.z)/2, f.c1(v.c1)-f.z(v.z)/2, f.b(x))
			}
		}
	},
	{
		predicate: obj => obj.a >= obj.b - obj.z / 2 && obj.a <= obj.b + obj.z / 2, 
		g: (f,v) => {
			return {
				a: x=> R.clamp(f.b(v.b) - f.z(v.z) / 2, f.b(v.b) + f.z(v.z) / 2, f.a(x))
			}
		}
	}
]
// lifts a solver to array of objects
export const liftSolve = (solver: T_Solver, F: P<P<E<num|bool>>>) => (X: P<P<num|bool>>) => R.evolve(U.mergePartialWith(solver, F, X), X)


export function liftedConstraintStore(ranges: Array<[str, P<any>]>, _epsilon: num = 0.01) {
	//compute a default value for a parameter
	function computeDefault(p) {
		let r = p;
		r.z ??= p.c1 - p.c0;
		r.b ??= (p.c1 - p.c0) / 2
		r.a ??= U.lerp(0, 1, r.b - r.z / 2, r.b + r.z / 2, Math.random())
		return r
	}
	//initialize object with default args in each field.
	let dataObj: P<P<num|bool>> = R.fromPairs(ranges)
	let X0: P<P<num|bool>> = R.map(computeDefault, dataObj)
	let F0 = U.deepMap(R.always, dataObj)
	const Params: Writable<P<P<num|bool>>> = writable(liftSolve(solve(constraintsPreset), F0)(X0)) //store of records
	const Keys: Writable<str[]> = writable(R.map(x => x[0], ranges))

	function set_S(X: P<P<num|bool>>) {
		Params.update(liftSolve(solve(constraintsPreset), U.deepMap(R.always, X)))
	}

	return [
		{ subscribe: Params.subscribe, set: set_S, update: Params.update },
		{ subscribe: Keys.subscribe, set: Keys.set, update: Keys.update }
	]
}

export function MuesliStore(data) {
	// B = bits per dimensions, P = parameters, K = Keys, HF = Hilbert Forward, HR = Hilbert Reverse
	const [Params, Keys, Bits] = [...liftedConstraintStore(data.ranges), writable(32)]
	let $Params, $Keys, $Bits
	Bits.subscribe(b => { $Bits = b })
	Params.subscribe(p => { $Params = p; })
	Keys.subscribe(k => { $Keys = k; })

	data.h_local ??= W.bigint_prod(0.5, U.fMAX_H($Bits, $Keys.length), 100)
	data.h_global ??= W.bigint_prod(0.5, U.fMAX_H($Bits, $Keys.length), 100)
	const [H_local, H_global] = [writable(data.h_local), writable(data.h_global)]

	let lensA = U.lerpLens('a', obj => [obj.b - obj.z / 2, obj.b + obj.z / 2], [0, U.fMAX_A($Bits)])
	let lensB = U.lerpLens('b', obj => [obj.c0+ obj.z / 2, obj.c1- obj.z / 2], [0, U.fMAX_A($Bits)])

	function setH_local(h: string) {
		updateH_local(R.always(U.clamp('0', U.fMAX_H($Bits, $Keys.length), h)))
	}

	function setH_global(h: string) {
		updateH_global(R.always(U.clamp('0', U.fMAX_H($Bits, $Keys.length), h)))
	}


	function updateH_local(f_h) {
		H_local.update(x => U.clamp('0', U.fMAX_H($Bits, $Keys.length), f_h(x)))
		let hx = R.zipObj($Keys, W.forward(get(H_local), $Bits, $Keys.length))
		Params.set(R.mergeWith(R.set(lensA), hx, $Params))
	}

	function updateH_global(f_h) {
		H_global.update(x => U.clamp('0', U.fMAX_H($Bits, $Keys.length), f_h(x)))
		let hx: P<num|bool> = R.zipObj($Keys, W.forward(get(H_global), $Bits, $Keys.length))
		Params.set(R.mergeWith(R.set(lensB), hx, $Params))
	}

	function setParams(X) {
		Params.set(X);
	}

	function updateParams(X) {
		Params.update(X)
		let [H_global_setters, H_local_setters] = [
			R.mapObjIndexed(R.view(lensB), $Params),
			R.mapObjIndexed(R.view(lensA), $Params)
		]
		H_local.set(W.inverse(u32a.from(R.props($Keys, H_local_setters)), $Bits))
		H_global.set(W.inverse(u32a.from(R.props($Keys, H_global_setters)), $Bits))
	}
	return [
		{ subscribe: H_global.subscribe, set: setH_global, update: updateH_global },
		{ subscribe: H_local.subscribe, set: setH_local, update: updateH_local },
		{ subscribe: Params.subscribe, set: setParams, update: updateParams },
		{ subscribe: Keys.subscribe, set: Keys.set, update: Keys.update },
		{ subscribe: Bits.subscribe, set: Bits.set, update: Bits.update },
	]
}

export function PresetStore(init: Preset[] | []) {
	const Presets: Writable<Preset[] | []> = writable(init);

	function addPreset(v: Preset, i: num = 10) {
		let f = (newVal, id = 10) => (presets: Preset[]) => R.insert(
			id, { ...{ name: U.assignDefaultName(R.pluck('name', presets)) }, ...newVal, }, presets
		);
		Presets.update(f(v, i))
	}
	function deletePreset(id: num) {
		let f = (id: num) => (presets: Preset[]) => R.remove(id, 1, presets)
		Presets.update(f(id))
	}
	function modifyPreset(v: Preset, i: num) {
		let f = (newValue: Preset, id: num) => (presets: Preset[]) => R.adjust(id, R.mergeLeft(newValue), presets)
		Presets.update(f(v, i))
		//call update with a deepMerge
	}

	return { subscribe: Presets.subscribe, set: Presets.set, update: Presets.update, erase: deletePreset, modify: modifyPreset, add: addPreset }

}
