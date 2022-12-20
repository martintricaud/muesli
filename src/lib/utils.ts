import { wasm_functions as W } from '../main.js';
import * as R from 'ramda'

type E<T> = (x: T) => T //endomorphism type
type P<T> = Record<string, T> //record with fields of type t
type fP<T> = P<E<T>> //endomorphism on records with fields of type t
type num = number

export const unzipIntoVal = o => keys => keys.map(key => o[key])

export const clamp = ([m, M]) =>
  typeof m === "string" || typeof M === "string" ?
    x => W.bigint_clamp(...[m, M], x) :
    x => R.clamp(...[m, M], x)

export const scale_around_C_by_Z = (c, z) => L => L.map(x => x + (x - c) * z)
export const scale = ([a, A], [b, B]) =>
  typeof A === "string" || typeof B === "string" ?
    x => scale2bigint([a, A])([b, B])(x) :
    x => (x - a) * (B - b) / (A - a);

export const reorder = L => R.sort((a, b) => a - b, L);
export const clip = B => A => { return [Math.max(B[0], A[0]), Math.min(A[1], B[1])] }
export const offset = ([r, R], p) => [r + p, R + p]
export const zoom = p => ([m, M]) => [m + Math.min(0.5, p / 2) * (M - m), M - Math.min(0.5, p / 2) * (M - m)]
export const thick = p => ([r, R]) => [-p * (R - r) / 2, p * (R - r) / 2]
export const lerp = ([a, A], [b, B]) => (x) => (x - a) * (B - b) / (A - a) + b
export const lerpBis: (A: [number, number], B: [number, number], x: number) => number = ([a, A], [b, B], x) => (x - a) * (B - b) / (A - a) + b
export const lerp_AB = A => B => x => scale(A, B)(x) + B[0]; //T<A> => T<A> => A => return A
export const lerp_BA = B => A => x => scale(A, B)(x) + B[0];
export const scale2bigint = ([a, A]) => ([b, B]) => x => W.bigint_prod((x - a) / (A - a), W.bigint_dif(B, b), Math.pow(10, 15));
export const lerp2bigint = A => B => x => W.bigint_sum(B[0], scale2bigint(A)(B)(x))

//let scaleBack = x => U.lerp_AB(mM(x))([0, MAX_A])(v(x))

export function smallestPresetAvailable(arr) {
  let foo = arr
    .filter(x => x.includes("preset"))
    .map(str => Number(R.last(str)))
    .filter(x => Number.isInteger(x))

  let a = foo.length == 0 ? 0 : Math.min(...foo)
  while (foo.includes(a)) {
    a += 1;
  }
  return "preset" + a
}

// export const objUpdate = A => B => R.mergeDeepWith((a, b) => a(b), A, B)
export const o2o = A => B => f => R.mergeDeepWith(R.uncurryN(2, f), A, B)
export const call_c = f => R.uncurryN(2, f)
export const updateObjectAtKey = o => f => k => R.assoc(k, f(o[k]), o)

export function willStayUnder(target, bound, tolerance = 0) {
  return bound - target >= tolerance
}

export function willStayBetween(target, [m, M]) {
  return willStayUnder(m, target[0]) && willStayUnder(R.last(target), M)
}

// let comply = (slave) => (master) => {
//     let a = hilbert_adjunction(ax,32)[0](slave);
//     let f = U.liftCall(R.map(v=>v[master],data));
//     return hilbert_adjunction(ax,32)[1](f(a));
//   };

// export const applyDelta = delta => x =>

let galois_pullBack = (adj) => (f) => (x) => adj[1](f(adj[0](x)))

export const liftZipObj = (paths, vals) => R.assocPath(paths, vals, {})
export const liftCall = R.curry((F, X) => R.mergeWith(R.call, F, X))
export const liftCallDeep = R.curry((F, X) => R.mergeDeepWith(R.call, F, X))
export const liftAssoc = R.curry((props, values, object) => R.mergeLeft(R.zipObj(props, values), object))
export const liftAssocPath = R.curry((paths, values, object) => R.mergeDeepLeft(liftZipObj(paths, values), object))
export const liftModify = R.curry((props, functions, object) => liftCall(R.zipObj(props, functions), object))
export const liftModifyPath = R.curry((paths, functions, object) => liftCallDeep(liftZipObj(paths, functions), object))

export const deepMap = (fn, xs) =>
  R.mapObjIndexed(
    (val, key) => {
      return R.or(R.is(Array, val), R.is(Object, val))
        ? deepMap(fn, val)
        : fn(val);
    },
    xs
  );

function lerpView(valField:string, range:(obj: Record<string, number>)=>[number,number],targetRange:[number,number]){
  return function (obj: Record<string, number>) {
    return lerpBis(range(obj), targetRange, obj[valField])
  }
}

function lerpSet(valField, range:(obj: Record<string, number>)=>[number,number], sourceRange){
  return function (val:number, obj: Record<string, number>) {
    return R.assoc(valField, lerpBis(sourceRange, range(obj), val), obj)
  }
}


export function lerpLens(valField, range:(obj: Record<string, number>)=>[number,number], otherRange){
  return R.lens(lerpView(valField,range,otherRange), lerpSet(valField,range,otherRange));
}

// //lerpLens('b',R.props(['c0', 'c1']))
// //lerpLens('a',obj => [obj.b-obj.z/2, obj.b+obj.z/2]) 
// function lensView(field: string,) {
//   return function (obj: Record<string, number>) {
//     return lerpBis([obj['c0'], obj['c1']], [0, 2^32-1], obj[field])
//   }
// }
// function lensSet(field: string) {
//   return function (val: number, obj: Record<string, number>) {
//     return R.assoc(field, lerpBis([0, 2^32-1], [obj['c0'], obj['c1']], val), obj)
//   }
// }

// export function scaleLens(field: string) {
//   return R.lens(lensView(field), lensSet(field));
// }


