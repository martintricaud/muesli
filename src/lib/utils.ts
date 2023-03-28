import { wasm_functions as W } from '../main.js';
import * as R from 'ramda'

type num = number
type num2 = [num, num]
type str = string
type R<T> = Record<str, T> //record with fields of type t
interface Vec {
  x: number,
  y: number
}

export let HilbertForward = (p: BigInt, b: number, d: number) => {
  console.log(W.forward(p.toString(), b, d))
  return W.forward(p.toString(), b, d)
}
export let HilbertInverse = (X: Uint32Array, b: number) => BigInt(W.inverse(X, b))
export function ratio(a, b, precision):number{
  return Number(a * BigInt(precision) / b) / precision
}

export function prod(a,b,precision){
  if(typeof a === typeof b){
    return a*b
  }
  else{
    let [numberOperand, bigintOperand] = typeof a === 'bigint' ? [b, a] : [a, b];
    //todo: I need to handle the case where numberOperand*10**precision is larger than MaxNumber
    let res =  BigInt(Math.round(numberOperand*10**precision))*bigintOperand / BigInt(10**precision)
    console.log(res)
    return res
  }
}

export const clamp = R.curry((m, M, x) =>
  typeof m === "string" || typeof M === "string" ?
    W.bigint_clamp(m, M, x) :
    R.clamp(m, M, x))

//export const scale = (a, A, b, B, x, precision = 9) => (x - a) * (B - b) / (A - a);

export const reorder = R.sort((a: any, b) => a - b)
export const zoom = p => ([m, M]) => [m + Math.min(0.5, p / 2) * (M - m), M - Math.min(0.5, p / 2) * (M - m)]
//export const lerp = (a, A, b, B, x, f = R.identity) => (f(x) - a) * (B - b) / (A - a) + b
export const scale = (a, A, b, B, x, precision = 9) => {
  console.log((x - a) / (A - a))
  console.log(B-b)
  return prod((x - a) / (A - a), B - b, precision);
}
export const lerp = (a, A, b, B, x, f = R.identity) => scale(a, A, b, B, f(x)) + b



//! bad code coverage
// export const plus = R.curry((a, b) => typeof a === 'number' ? a + b : W.bigint_sum(a, b))
// export const add = b => a => plus(a, b);

/**
 * Given an array of strings, returns a default name for a new "preset" item.
 * The default name is "preset" followed by the lowest available integer number
 * greater than or equal to 1 that is not already used in a string in the array.
 * For example, if the array contains "preset1" and "preset3", the function will
 * return "preset2".
 *
 * @param arr An array of strings to search for existing preset names.
 * @returns A new string containing a default preset name.
 */
export function assignDefaultName(arr: string[]): string {
  // Extract integer suffixes from preset names in array
  const suffixes = arr
    .filter(str => str.includes("preset"))
    .map(str => parseInt(R.last(str), 10))
    .filter(num => Number.isInteger(num));

  // Find the lowest available integer suffix greater than or equal to 1
  let suffix = 1;
  while (suffixes.includes(suffix)) {
    suffix += 1;
  }

  // Return the default preset name with the chosen suffix
  return "preset" + suffix;
}

let galois_pullBack = (adj) => (f) => (x) => adj[1](f(adj[0](x)))

//F is the function to apply to each terminal node of the object X
export const deepMap = R.curry((F, X) => R.mapObjIndexed(
  (v, key) => R.or(R.is(Array, v), R.is(Object, v)) ? deepMap(F, v) : F(v),
  X
));

/** 
 * Equivalent of Ramda's Map but for a deep object 
*/
export const deepAlways = deepMap(R.always)

/** 
 * Equivalent of Ramda's ObjOf but for a deep object 
*/
export const deepObjOf = (path: Array<str | num>, val) => R.assocPath(path, val, {})

/** 
 * 
*/
export const mergePartialWith = R.curry((f: any, A: object, B: object) => R.mergeWith(f, A, R.pick(R.keys(A), B)))

/**
 * Returns a function that interpolates a value for a given object's field, based on a range of values for that field within the object
 * @param valField The name of the field to interpolate
 * @param range A function that takes an object and returns a tuple of the minimum and maximum values of the field to interpolate
 * @param targetRange A tuple of the minimum and maximum values of the target range
 * @returns A function that takes an object and returns the interpolated value
 */
function lerpView(valField: str, sourceRangeGetter: (obj: R<num>) => num2, targetRange: num2) {
  return function (obj: R<num>) {
    return lerp(...sourceRangeGetter(obj), ...targetRange, obj[valField])
  }
}

/**
 * Returns a function that sets the value of a given object's field to an interpolated value based on a range of values for that field within the object
 * @param valField The name of the field to interpolate
 * @param range A function that takes an object and returns a tuple of the minimum and maximum values of the field to interpolate
 * @param sourceRange A tuple of the minimum and maximum values of the source range
 * @returns A function that takes a value and an object, and returns the object with the field set to the interpolated value
 */
function lerpSet(valField: str, targetRangeGetter: (obj: R<num>) => num2, sourceRange: num2) {
  return function (val: num, obj: R<num>) {
    return R.assoc(valField, lerp(...sourceRange, ...targetRangeGetter(obj), val), obj)
  }
}

/**
 * Returns a Ramda lens that allows getting and setting a linearly interpolated value for a given object's field, based on a range of values for that field within the object and a target range
 * @param valField The name of the field to interpolate
 * @param range A function that takes an object and returns a tuple of the minimum and maximum values of the field to interpolate
 * @param otherRange A tuple of the minimum and maximum values of the target range
 * @returns A Ramda lens that can be used with Ramda's lens functions to get and set the interpolated value
 */
export function lerpLens(valField: str, rangeGetter: (obj: R<num>) => num2, otherRange: num2) {
  return R.lens(lerpView(valField, rangeGetter, otherRange), lerpSet(valField, rangeGetter, otherRange));
}

export function stringToPath(s: string | undefined): Array<string | number> {
  return R.isEmpty(R.split(' ', s)) ? [] : R.map((x: any) => isNaN(x) ? x : Number(x), R.split(' ', s))
}


//evolvers are object where all leaves are functions 
export const composeEvolver = (evolver1, evolver2) => R.mergeWith((f, g) => R.compose(f, g), evolver1, evolver2)
export const pipeEvolver = (evolver1, evolver2) => R.mergeWith((f, g) => R.pipe(f, g), evolver1, evolver2)



export function evolve(transformations, object) {
  const result = {};

  for (const [key, value] of Object.entries(object)) {
    if (key in transformations) {
      result[key] = transformations[key](value);
    } else {
      result[key] = value;
    }
  }
  return result;
}



export const constrainEvolver = (obj, evolver, predicate, g) =>
  R.cond([
    [predicate, R.always(evolver)],
    [R.T, R.always(pipeEvolver(evolver, g))]
  ])(obj);

export const solve = R.curry(
  (constraints, f, v) => {
    //If a field x of v is undefined in f, we assume that it is equivalent to f having field x equal to the identity
    const g0 = R.mapObjIndexed((x: num, i) => f[i] == undefined ? R.identity : f[i], v)
    //! assumes that "constraints" have been sorted in propagation order
    return constraints.reduce(
      (evolver, { predicate, g }) => constrainEvolver(v, evolver, predicate, g(evolver, v)),
      g0
    )
  }
)

// lifts a solver to array of objects
export const liftSolve = R.curry((solver, F, X) => {
  return R.evolve(mergePartialWith(solver, F, X), X)
})