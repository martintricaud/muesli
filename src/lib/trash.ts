type num = number
type str = string
type E<T> = (x: T) => T //endomorphism type
type P<T> = Record<str, T> //record with fields of type t
type T_Solver = (u: P<E<num>>, p: P<num>) => P<E<num>>
let u32a = Uint32Array;

import * as U from './utils';
import * as R from 'ramda';
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

export function solve3(update: P<E<num>>, v: P<num>, locked = false) {
	let e = 0 // tolerance
	const g0: P<E<num>> = R.mapObjIndexed((x: num, i) => update[i] == undefined ? R.identity : update[i], v) // fields that are not updated are updated with the identity
	let g1 = U.constrainEvolver(v, g0, obj => obj.c1 - obj.c0 >= e, {
		c0: x => g0.c1(x - e / 2) - e / 2,
		c1: x => g0.c0(x + e / 2) + e / 2
	})
	let g2 = U.constrainEvolver(v, g1, obj => obj.z <= obj.c1 - obj.c0 && obj.z >= e, {
		z: R.clamp(e, g1.c0(v.c0) - g1.c1(v.c1))
	})
	let g3 = U.constrainEvolver(v, g2, obj => obj.b >= obj.c0 + obj.z / 2 && obj.b <= obj.c1 - obj.z / 2, {
		b: R.clamp(g2.c0(v.c0) + g2.z(v.z) / 2, g2.c1(v.c1) - g2.z(v.z) / 2)
	})
	let g4 = U.constrainEvolver(v, g3, obj => obj.a >= obj.b - obj.z / 2 && obj.a <= obj.b + obj.z / 2, {
		a: R.clamp(g3.b(v.b) - g3.z(v.z) / 2, g3.b(v.b) + g3.z(v.z) / 2)
	})
	return g4
}


let galois_pullBack = (adj) => (f) => (x) => adj[1](f(adj[0](x)))


export const deepMap = (fn, xs) => R.mapObjIndexed(
	(v, key) => R.or(R.is(Array, v), R.is(Object, v)) ? deepMap(fn, v) : fn(v),
	xs
);

export const deepObjOf = (path: Array<str | num>, val) => R.assocPath(path, val, {})
export const mergePartialWith = R.curry((f: any, A: object, B: object) => R.mergeWith(f, A, R.pick(R.keys(A), B)))

function lerpView(valField: str, range: (obj: R<num>) => num2, targetRange: num2) {
	return function (obj: R<num>) {
		return U.lerp(...range(obj), ...targetRange, obj[valField])
	}
}

function U.lerpSet(valField, range: (obj: R<num>) => num2, sourceRange: num2) {
	return function (val: num, obj: R<num>) {
		return R.assoc(valField, U.lerp(...sourceRange, ...range(obj), val), obj)
	}
}

export function U.lerpLens(valField, range: (obj: R<num>) => num2, otherRange) {
	return R.lens(U.lerpView(valField, range, otherRange), U.lerpSet(valField, range, otherRange));
}

export function stringToPath(s: str | undefined) {
	let res = R.split(' ', s)
	let res2: Array<str | num> = R.map((x: any) => isNaN(x) ? x : Number(x), res)
	return res2
}


export const composeEvolver = (evolver1, evolver2) => R.mergeWith((f, g) => R.compose(f, g), evolver1, evolver2)
export const pipeEvolver = (evolver1, evolver2) => R.mergeWith((f, g) => R.pipe(f, g), evolver1, evolver2)
export const constrainEvolver = (obj, evolver, predicate, g) =>
	R.cond([
		[predicate, R.always(evolver)],
		[R.T, R.always(pipeEvolver(evolver, g))]
	])(obj);
// export function toggleFocus(name) {return R.mapObjIndexed(
//     (x:any, k) => R.modify('equipped', k == name ? R.not : R.F, x));
// }

