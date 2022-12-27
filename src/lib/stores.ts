import { writable, Writable, get, derived } from "svelte/store";
import * as R from 'ramda';
import * as U from './utils';
import { wasm_functions as W } from '../main.js';
import { prng_alea } from 'esm-seedrandom';
import * as T from './types'
// import type from '@types/ramda'

type num = number
type str = string

type E<T> = (x: T) => T //endomorphism type
type P<T> = Record<str, T> //record with fields of type t
type fP<T> = P<E<T>> //endomorphism on records with fields of type t
type param = {name: str} & P<num>
type f_param = {name: str} & P<E<num>>
type T_PresetV = {h_local: str, h_global:str, data: Record<str, num>, zoom:num}
type T_Preset = str & T_PresetV

let f32a = Float32Array;
let u32a = Uint32Array;


//The arguments are named "monad" and "comonad" but it is probably an abuse of language
//The following is basically a bidirectional mapping between two stores.
// This looks a whole lot like the state monad and costate comonad induced by the curry/uncurry adjunction
//https://www.cs.ox.ac.uk/ralf.hinze/WG2.8/28/slides/ralf.pdf

let randomForward = axes => _n => R.zipObj(
	axes,
	axes.map(
		(_val) =>
			U.lerp([0, 1], [0, Math.pow(2, 32) - 1])(Math.random())
	)
)

function randomReverse(X) {
	let a = R.mapObjIndexed((val, key, _obj) => val + key.toString(), X)
	let b = R.values(a).reduce((x, y) => x + y, "")
	let dim = R.values(a).length
	let max = W.max_hilbert(32, dim)
	let rand = prng_alea(b)
	let res = U.scale2bigint([0, 1])([0, max])(rand)
	return res
}
export const random_adjunction = (axes) => [
	(n) => randomForward(axes)(n),
	(X) => randomReverse(X)
]

export function sync(left, right) {
	const A = writable()
	const B = writable()

	// called when store_a.set is called or its binding reruns
	function set_A($a) {
		A.update(_x => $a);
		B.update(_x => left($a));
	}

	// called when store_b.set is called or its binding reruns
	function set_B($b) {
		A.update(_x => right($b));
		B.update(_x => $b);
	}

	function update_A($ua) {
		A.update($ua)
		B.update(R.compose($ua, left))
	}

	function update_B($ub) {
		B.update($ub)
		A.update(R.compose($ub, right))
	}

	return [
		{ subscribe: A.subscribe, set: set_A, update: update_A },
		{ subscribe: B.subscribe, set: set_B, update: update_B },
	];
}


export function solve(update: P<E<num>>, param: P<num>, epsilon = 0.01, ZboundedByC0C1 = true, ZscalesWithC0C1 = false, BboundedByC0C1 = true, BscalesWithC0C1 = false) {
	const fields: str[] = ["a", "z", "b", "c0", "c1"]
	const [fa, fz, fb, fc0, fc1]: E<num>[] = R.map((x:E<num>)=>x??=R.identity, R.props(fields, update)) //fields that are not updated are updated with the identity
	const [va, vz, vb, vc0, vc1]: num[] = R.props(fields, param)
	let gz, gb, ga, gc0, gc1
	//updates on c1 and c0 are hard constraints. 
	//If this leads to overconstraining, we relax constraints by distributing the "burden" of maintaining c0<c1 equally between c0 and c1
	[gc0, gc1] = U.willStayUnder(epsilon, fc1(vc1) - fc0(vc0)) ? [fc0, fc1] : [x => fc1(x - epsilon / 2) - epsilon / 2, x => fc0(x + epsilon / 2) + epsilon / 2]
	let growthOfC: num = (gc1(vc1) - gc0(vc0)) / (vc1 - vc0)
	let scaleWithC: E<num> = x => (x - vc0) * growthOfC + gc0(vc0)
	
	//Update of Z have priority over updates of B, so they are computed first.
	if (ZboundedByC0C1) {
		gz = fz(vz) < gc1(vc1) - gc0(vc0) ? fz : x => R.clamp(0, gc1(vc1) - gc0(vc0), fz(x))
	}
	else if (ZscalesWithC0C1) {
		let growthOfZ: num = fz(vz) / vz
		gz = x => R.clamp(0, gc1(vc1) - gc0(vc0),growthOfZ * growthOfC * x)
	}

	let boundsOfB: [num, num] = [gc0(vc0) + gz(vz) / 2, gc1(vc1) - gz(vz) / 2]
	if (BboundedByC0C1) { gb = U.willStayBetween([fb(vb)], boundsOfB) ? fb : x => R.clamp(boundsOfB[0], boundsOfB[1], fb(x)) }
	else if (BscalesWithC0C1) { gb = x => R.clamp(...boundsOfB, fb(scaleWithC(x))) }

	//choice made: A's absolute position will be preserved as much as possible
	let boundsOfA: [num, num] = [gb(vb) - gz(vz) / 2, gb(vb) + gz(vz) / 2]
	ga = U.willStayBetween([fa(va)], boundsOfA) ? fa : x => R.clamp(...boundsOfA, fa(x))
	return { a: ga, z: gz, b: gb, c0: gc0, c1: gc1 }
}


export function liftSolve(solver:any, X: P<P<num>>, F: P<P<E<num>>>) {
	return R.evolve(U.mergePartialWith(solver,F,X))
}

export function liftedConstraintStore(data: Array<[str, P<num>]>, _epsilon: num = 0.01, defaultArg: P<num> = { a: 5, z: 10, b: 5, c0: 0, c1: 10 }) {
	//initialize object with default args in each field.
	let dataObj: P<P<num>> = R.fromPairs(data)
	let X0: P<P<num>> = R.map(R.always(defaultArg), dataObj)
	let F0 = U.deepMap(R.always, dataObj)
	const Params: Writable<P<P<num>>> = writable(liftSolve(solve, X0, F0)(X0)) //store of records
	const Keys: Writable<str[]> = writable(R.map(x => x[0], data))

	function set_S(X: P<P<num>>) {
		Params.update(liftSolve(solve, get(Params), U.deepMap(R.always, X)))
	}

	function dropKeys(keys) {
		Params.update(liftedStore => R.omit(keys, liftedStore))
		Keys.update(x => R.without(keys, x))
	}

	return [
		{ subscribe: Params.subscribe, set: set_S, update: Params.update, remove: dropKeys},
		{ subscribe: Keys.subscribe, set: Keys.set, update: Keys.update }
	]
}

export function muesliStore2(data: Array<[str, P<num>]>) {
	// B = bits per dimensions, P = parameters, K = Keys, HF = Hilbert Forward, HR = Hilbert Reverse

	const [P, Keys] = liftedConstraintStore(data)
	const Bits = writable(32)
		
	const [HF, HR] = [
		derived([Bits, Keys], ([$Bits, $Keys]) => n => W.forward(n, 32, 20)),
		derived([Bits, Keys], ([$Bits, $Keys]) => X => W.inverse(u32a.from(X), $Bits))
	]

	const [H_local,H_global] = [writable(W.bigint_prod(0.5, U.fMAX_H(32,20), 100)), writable(W.bigint_prod(0.5, U.fMAX_H(32,20), 100))]

	let $P, $Keys, $Bits, $HF, $HR
	
	Bits.subscribe(b => { $Bits = b })
	P.subscribe(p => { $P = p; })
	Keys.subscribe(k => { $Keys = k; })
	HF.subscribe(h => { $HF = h })
	HR.subscribe(h => { $HR = h })

	let lensA = U.lerpLens('a', obj => [obj.b - obj.z / 2, obj.b + obj.z / 2], [0, U.fMAX_A($Bits)])
	let lensB = U.lerpLens('b', obj => [obj.c0, obj.c1], [0, U.fMAX_A($Bits)])
	

	function setH_local(h: str) {
		updateH_local(R.always(U.clamp(['0', U.fMAX_H(32, 20)])(h)))
	}

	function setH_global(h: str) {
		updateH_global(R.always(U.clamp(['0',	U.fMAX_H(32, 20)])(h)))
	}

	function updateH_local(f_h) {
		H_local.update(x => U.clamp(['0', U.fMAX_H(32, 20)])(f_h(x)))
		let hx = R.zipObj($Keys, $HF(get(H_local)))
		P.set(R.mergeWith(R.set(lensA), hx, $P))
	}

	function updateH_global(f_h) {
		H_global.update(x => U.clamp(['0', U.fMAX_H(32, 20)])(f_h(x)))
		let hx: P<num> = R.zipObj($Keys, $HF(get(H_global)))
		P.set(R.mergeWith(R.set(lensB), hx, $P))
	}

	function setP(X) {
		P.set(X);
	}

	function updateP(X) {
		P.update(X)
		let H_global_setters = R.mapObjIndexed(R.view(lensB), $P)
		let H_local_setters = R.mapObjIndexed(R.view(lensA), $P)
		let fooa = R.map(key => H_local_setters[key], $Keys)
		let foob = R.map(key => H_global_setters[key], $Keys)
		H_local.set($HR(fooa))
		H_global.set($HR(foob))
	}
	return [
		{ subscribe: H_global.subscribe, set: setH_global, update: updateH_global },
		{ subscribe: H_local.subscribe, set: setH_local, update: updateH_local },
		{ subscribe: P.subscribe, set: setP, update: updateP },
		{ subscribe: Keys.subscribe, set: Keys.set, update: Keys.update },
		{ subscribe: Bits.subscribe, set: Bits.set, update: Bits.update },
	]
}

export function presetStore(init:T.Preset[]){
	const Presets:Writable<T.Preset[]> = writable(init);
	function addPreset(v:T.Preset, i:num){
		let f = (newVal,id=-1) => (presets: T.Preset[]) => R.insert(
			id,{...newVal,...{name: U.smallestPresetAvailable(R.pluck('name',presets))}},presets
		);
		Presets.update(f(v,i))
	}
	function deletePreset(id:num){
		let f = (id:num) => (presets:T.Preset[]) => R.remove(id,1,presets)
		Presets.update(f(id))
	}
	function modifyPreset(v:T.Preset, i:num){
		let f = (newValue:T.Preset, id:num) => (presets:T.Preset[]) => R.adjust(id,R.mergeLeft(newValue),presets)
		Presets.update(f(v, i))
		//call update with a deepMerge
	}
	return { subscribe: Presets.subscribe, set: Presets.set, update: Presets.update }
}
