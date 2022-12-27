import { wasm_functions as W } from '../main.js';
import * as R from 'ramda'
import * as T from './types'

export const [fMAX_H, fMAX_A] = [(b,dim) =>W.bigint_dif(W.max_hilbert(b, dim),"1"), b=>Math.pow(2, b) - 1];

export const clamp = ([m, M]) =>
  typeof m === "string" || typeof M === "string" ?
    x => W.bigint_clamp(...[m, M], x) :
    x => R.clamp(m, M, x)

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
export const lerp_AB = A => B => x => scale(A, B)(x) + B[0]; 
export const lerp_BA = B => A => x => scale(A, B)(x) + B[0];
export const scale2bigint = ([a, A]) => ([b, B]) => x => W.bigint_prod((x - a) / (A - a), W.bigint_dif(B, b), Math.pow(10, 15));
export const lerp2bigint = A => B => x => W.bigint_sum(B[0], scale2bigint(A)(B)(x))
export const willStayUnder = (target, bound, tolerance = 0) => (bound - target) >= tolerance
export const willStayBetween = (target, [m, M]) => willStayUnder(m, target[0]) && willStayUnder(R.last(target), M)
//! bad code coverage
export const plus = (a,b)=> typeof a === 'number'? a+b : W.bigint_sum(a, b)
export const add = b => a => plus(a, b);
//let scaleBack = x => U.lerp_AB(mM(x))([0, MAX_A])(v(x))

export function smallestPresetAvailable(arr:string[]) {
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



// let comply = (slave) => (master) => {
//     let a = hilbert_adjunction(ax,32)[0](slave);
//     let f = U.liftCall(R.map(v=>v[master],data));
//     return hilbert_adjunction(ax,32)[1](f(a));
//   };

// export const applyDelta = delta => x =>

let galois_pullBack = (adj) => (f) => (x) => adj[1](f(adj[0](x)))


export const deepMap = (fn, xs) => R.mapObjIndexed(
  (v, key) =>  R.or(R.is(Array, v), R.is(Object, v)) ? deepMap(fn, v): fn(v),
    xs
  );

export const deepObjOf = (path,val) => R.assocPath(path, val, {})

export const mergePartialWith = R.curry((f,A,B) => R.mergeWith(f,A,R.pick(R.keys(A),B)))

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


