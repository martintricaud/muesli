import { wasm_functions as W } from '../main.js';
import * as R from 'ramda'

type num = number
type num2 = [num,num]
type str = string
type R<T> = Record<str, T> //record with fields of type t

export const [fMAX_H, fMAX_A] = [(b,dim) =>W.bigint_dif(W.max_hilbert(b, dim),"1"), b=>Math.pow(2, b) - 1];

export const clamp = (m, M,x) =>
  typeof m === "string" || typeof M === "string" ?
    W.bigint_clamp(m, M, x) :
    R.clamp(m, M, x)

export const scale = (a, A, b, B,x) =>
  typeof A === "string" || typeof B === "string" ?
    scale2bigint(a,A,b,B,x) :
    (x - a) * (B - b) / (A - a);

export const reorder = R.sort((a:any, b) => a - b)
export const zoom = p => ([m, M]) => [m + Math.min(0.5, p / 2) * (M - m), M - Math.min(0.5, p / 2) * (M - m)]
export const lerp = (a, A, b, B,x, f=R.identity) => (f(x) - a) * (B - b) / (A - a) + b
export const scale2bigint = (a, A, b, B,x) => W.bigint_prod((x - a) / (A - a), W.bigint_dif(B, b), Math.pow(10, 15));
export const lerp2bigint = (A: num2, B: num2, x) => W.bigint_sum(B[0], scale2bigint(...A,...B,x))
//! bad code coverage
export const plus = (a,b)=> typeof a === 'number'? a+b : W.bigint_sum(a, b)
export const add = b => a => plus(a, b);

export function assignDefaultName(arr:str[]) {
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


let galois_pullBack = (adj) => (f) => (x) => adj[1](f(adj[0](x)))


export const deepMap = (fn, xs) => R.mapObjIndexed(
  (v, key) =>  R.or(R.is(Array, v), R.is(Object, v)) ? deepMap(fn, v): fn(v),
    xs
  );

export const deepObjOf = (path:Array<str | num>,val) => R.assocPath(path, val, {})
export const mergePartialWith = R.curry((f:any,A:object,B:object) => R.mergeWith(f,A,R.pick(R.keys(A),B)))

function lerpView(valField:str, range:(obj: R<num>)=>num2,targetRange:num2){
  return function (obj: R<num>) {
    return lerp(...range(obj), ...targetRange, obj[valField])
  }
}

function lerpSet(valField, range:(obj: R<num>)=>num2, sourceRange:num2){
  return function (val:num, obj: R<num>) {
    return R.assoc(valField, lerp(...sourceRange, ...range(obj), val), obj)
  }
}

export function lerpLens(valField, range:(obj: R<num>)=>num2, otherRange){
  return R.lens(lerpView(valField,range,otherRange), lerpSet(valField,range,otherRange));
}

export function stringToPath(s:str | undefined){
  let res = R.split(' ',s)
  let res2:Array<str|num> = R.isEmpty(res)? [] : R.map((x:any)=>isNaN(x)?x:Number(x), res)
  return res2
}


export const composeEvolver = (evolver1, evolver2) => R.mergeWith((f,g)=>R.compose(f,g),evolver1, evolver2)
export const pipeEvolver = (evolver1, evolver2) => R.mergeWith((f,g)=>R.pipe(f,g),evolver1, evolver2)
export const constrainEvolver = (obj, evolver, predicate, g) =>
R.cond([
  [predicate, R.always(evolver)],
  [R.T, R.always(pipeEvolver(evolver, g))]
])(obj);
// export function toggleFocus(name) {return R.mapObjIndexed(
//     (x:any, k) => R.modify('equipped', k == name ? R.not : R.F, x));
// }
