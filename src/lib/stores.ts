import { writable, Writable, get, derived } from "svelte/store";
import * as R from 'ramda';
import * as U from './utils';
import { wasm_functions as W } from '../main.js';
import { prng_alea } from 'esm-seedrandom';
import type * as T from './types'

type num = number
type str = string
type E<T> = (x: T) => T //endomorphism type
type P<T> = Record<str, T> //record with fields of type t
type T_Solver = (u: P<E<num>>, p: P<num>) => P<E<num>>
let u32a = Uint32Array;

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



const getEvolverWithConstraints = (obj, evolver, constraints) =>
	R.reduce(
		(acc, { predicate, g }) =>
			R.cond([
				[predicate, R.always(acc)],
				[R.T, R.always(R.compose(acc, g))]
			])(obj),
		evolver,
		constraints
	);



// Hard coded simplex solver that maintains constraints between fields a, b, c0, c1, z of an object
export function solve(update: P<E<num>>, param: P<num>, locked = false) {
	const willStayUnder = (target, bound, tolerance = 0) => (bound - target) >= tolerance
	const willStayBetween = (target, [m, M]) => willStayUnder(m, target[0]) && willStayUnder(R.last(target), M)
	let e = 0.01 //tolerance
	const fields: str[] = ["a", "z", "b", "c0", "c1"]
	const [fa, fz, fb, fc0, fc1]: E<num>[] = R.map((x: E<num>) => x ??= R.identity, R.props(fields, update)) //fields that are not updated are updated with the identity
	const [va, vz, vb, vc0, vc1]: num[] = R.props(fields, param)
	let gz, gb, ga, gc0, gc1
	[gc0, gc1] = willStayUnder(e, fc1(vc1) - fc0(vc0)) ? [fc0, fc1] : [x => fc1(x - e / 2) - e / 2, x => fc0(x + e / 2) + e / 2]
	let boundsOfZ: [num, num] = [0, gc1(vc1) - gc0(vc0)]
	gz = willStayBetween([fz(vz)], boundsOfZ) ? fz : R.pipe(fz, R.clamp(...boundsOfZ))
	let boundsOfB: [num, num] = [gc0(vc0) + gz(vz) / 2, gc1(vc1) - gz(vz) / 2]
	gb = willStayBetween([fb(vb)], boundsOfB) ? fb : R.pipe(fb, R.clamp(...boundsOfB))
	let boundsOfA: [num, num] = [gb(vb) - gz(vz) / 2, gb(vb) + gz(vz) / 2]
	ga = willStayBetween([fa(va)], boundsOfA) ? fa : R.pipe(fa, R.clamp(...boundsOfA))
	let res: P<E<num>> = { a: ga, z: gz, b: gb, c0: gc0, c1: gc1 }
	return res
}

const composeEvolver = (evolver1, evolver2) => R.mergeWith((f,g)=>R.compose(f,g),evolver1, evolver2)
const pipeEvolver = (evolver1, evolver2) => R.mergeWith((f,g)=>R.pipe(f,g),evolver1, evolver2)

const getEvolverIfViolatesPredicate = (obj, evolver, predicate, g) =>
	R.cond([
		[predicate, R.always(evolver)],
		[R.T, R.always(pipeEvolver(evolver, g))]
	])(obj);

export function solve3(update: P<E<num>>, v: P<num>, locked = false) {
	let e = 0 // tolerance
	const g0: P<E<num>> = R.mapObjIndexed((x: num,i) => update[i]== undefined ? R.identity: update[i], v) // fields that are not updated are updated with the identity
	let g1 = getEvolverIfViolatesPredicate(v, g0, obj => obj.c1 - obj.c0 >=e, {
		c0: x => g0.c1(x - e / 2) - e / 2,
		c1: x => g0.c0(x + e / 2) + e / 2
	})
	let g2 = getEvolverIfViolatesPredicate(v, g1, obj => obj.z <= obj.c1 - obj.c0 && obj.z >= e, {
		z: R.clamp(e, g1.c0(v.c0)-g1.c1(v.c1))
	})
	let g3 = getEvolverIfViolatesPredicate(v, g2, obj => obj.b >= obj.c0+obj.z/2 && obj.b <=  obj.c1-obj.z/2, {
		b: R.clamp(g2.c0(v.c0)+g2.z(v.z)/2, g2.c1(v.c1)-g2.z(v.z)/2)
	})
	let g4 = getEvolverIfViolatesPredicate(v, g3, obj => obj.a >= obj.b - obj.z / 2 && obj.a <= obj.b + obj.z / 2, {
		a: R.clamp(g3.b(v.b) - g3.z(v.z) / 2, g3.b(v.b) + g3.z(v.z) / 2)
	})
	return g4
}

let e = 0.01

export const solve4 = constraints => (update: P<E<num>>, v: P<num>) => {
	const g0: P<E<num>> = R.mapObjIndexed((x: num,i) => update[i]== undefined ? R.identity: update[i], v) // fields that are not updated are updated with the identity
	return constraints.reduce((evolver, {predicate, g}) => getEvolverIfViolatesPredicate(v, evolver, predicate, g(evolver, v)), g0)
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
				z: R.clamp(e, f.c0(v.c0)-f.c1(v.c1))
			}
		}
	},
	{
		predicate: obj => obj.b >= obj.c0+obj.z/2 && obj.b <=  obj.c1-obj.z/2,
		g: (f,v) => {
			return {
				b: R.clamp(f.c0(v.c0)+f.z(v.z)/2, f.c1(v.c1)-f.z(v.z)/2)
			}
		}
	},
	{
		predicate: obj => obj.a >= obj.b - obj.z / 2 && obj.a <= obj.b + obj.z / 2, 
		g: (f,v) => {
			return {
				a: R.clamp(f.b(v.b) - f.z(v.z) / 2, f.b(v.b) + f.z(v.z) / 2)
			}
		}
	}
]
// lifts a solver to array of objects
export const liftSolve = (solver: T_Solver, F: P<P<E<num>>>) => (X: P<P<num>>) => R.evolve(U.mergePartialWith(solver, F, X), X)


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
	let dataObj: P<P<num>> = R.fromPairs(ranges)
	let X0: P<P<num>> = R.map(computeDefault, dataObj)
	let F0 = U.deepMap(R.always, dataObj)
	const Params: Writable<P<P<num>>> = writable(liftSolve(solve4(constraintsPreset), F0)(X0)) //store of records
	const Keys: Writable<str[]> = writable(R.map(x => x[0], ranges))

	function set_S(X: P<P<num>>) {
		Params.update(liftSolve(solve4(constraintsPreset), U.deepMap(R.always, X)))
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
		let hx: P<num> = R.zipObj($Keys, W.forward(get(H_global), $Bits, $Keys.length))
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

export function PresetStore(init: T.Preset[] | []) {
	const Presets: Writable<T.Preset[] | []> = writable(init);

	function addPreset(v: T.Preset, i: num = 10) {
		let f = (newVal, id = 10) => (presets: T.Preset[]) => R.insert(
			id, { ...{ name: U.assignDefaultName(R.pluck('name', presets)) }, ...newVal, }, presets
		);
		Presets.update(f(v, i))
	}
	function deletePreset(id: num) {
		let f = (id: num) => (presets: T.Preset[]) => R.remove(id, 1, presets)
		Presets.update(f(id))
	}
	function modifyPreset(v: T.Preset, i: num) {
		let f = (newValue: T.Preset, id: num) => (presets: T.Preset[]) => R.adjust(id, R.mergeLeft(newValue), presets)
		Presets.update(f(v, i))
		//call update with a deepMerge
	}

	return { subscribe: Presets.subscribe, set: Presets.set, update: Presets.update, erase: deletePreset, modify: modifyPreset, add: addPreset }

}
