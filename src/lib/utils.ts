import { wasm_functions as W } from '../main.js';
import * as R from 'ramda'

type num = number
type num2 = [num,num]
type str = string
type R<T> = Record<str, T> //record with fields of type t
interface Vec {
  x: number,
  y: number
}

export const [fMAX_H, fMAX_A] = [(b,dim) =>W.bigint_dif(W.max_hilbert(b, dim),"1"), b=>Math.pow(2, b) - 1];

export const clamp = R.curry((m, M,x) =>
  typeof m === "string" || typeof M === "string" ?
    W.bigint_clamp(m, M, x) :
    R.clamp(m, M, x))

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
export const plus = R.curry((a,b)=> typeof a === 'number'? a+b : W.bigint_sum(a, b))
export const add = b => a => plus(a, b);

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
  (v, key) =>  R.or(R.is(Array, v), R.is(Object, v)) ? deepMap(F, v): F(v),
    X
  ));

export const deepAlways = deepMap(R.always)
//Equivalent of Ramda's ObjOf but for a deep object
export const deepObjOf = (path:Array<str | num>,val) => R.assocPath(path, val, {})
export const mergePartialWith = R.curry((f:any,A:object,B:object) => R.mergeWith(f,A,R.pick(R.keys(A),B)))


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
  return R.lens(lerpView(valField,rangeGetter,otherRange), lerpSet(valField,rangeGetter,otherRange));
}

export function stringToPath(s:str | undefined){
  let res = R.split(' ',s)
  let res2:Array<str|num> = R.isEmpty(res)? [] : R.map((x:any)=>isNaN(x)?x:Number(x), res)
  return res2
}


//evolvers are object where all leaves are functions 
export const composeEvolver = (evolver1, evolver2) => R.mergeWith((f,g)=>R.compose(f,g),evolver1, evolver2)
export const pipeEvolver = (evolver1, evolver2) => R.mergeWith((f,g)=>R.pipe(f,g),evolver1, evolver2)
export const constrainEvolver = (obj, evolver, predicate, g) =>
R.cond([
  [predicate, R.always(evolver)],
  [R.T, R.always(pipeEvolver(evolver, g))]
])(obj);


function evolveBetter(transformations, object) {
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

//export const vecScale = R.curry((K, V:Partial<Vec>)=>R.evolve({x:x=>x*K, y:y=>y*K},V))
export const vecScale = R.curry((K, V:Partial<Vec>)=>evolveBetter({x:x=>x*K, y:y=>y*K},V))
//export const vecScaleFrom = R.curry((K, V:Partial<Vec>, U:Partial<Vec>)=>R.evolve({x:x=>x*K+U.x, y:y=>y*K+U.y},V))
export const vecScaleFrom = R.curry((K, V:Partial<Vec>, U:Partial<Vec>)=>evolveBetter({x:x=>x*K+U.x, y:y=>y*K+U.y},V))
export const vecNorm = (V:Partial<Vec>) => Math.sqrt(V.x*V.x+V.y*V.y)
export const vecSetNorm = (K:num,V:Partial<Vec>) => vecScale(K,vecUnit(V))
//export const vecAdd = (V:Partial<Vec>,U:Partial<Vec>)=>R.evolve({x:x=>x+V.x, y:y=>y+V.y},U)
export const vecAdd = (V:Partial<Vec>,U:Partial<Vec>)=>evolveBetter({x:x=>x+V.x, y:y=>y+V.y},U)
//export const vecSub =(V:Partial<Vec>,U:Partial<Vec>)=>R.evolve({x:x=>x-V.x, y:y=>y-V.y},U)
export const vecSub =(V:Partial<Vec>,U:Partial<Vec>)=>evolveBetter({x:x=>x-V.x, y:y=>y-V.y},U)
export const vecUnit = (V:Partial<Vec>)=>vecScale(1/vecNorm(V),V)
export const vecProject =  R.curry((V,U)=>vecScale((U.x*V.x+U.y*V.y)/(V.x*V.x+V.y*V.y),V))
export const vecDot = (U,V) => U.x*V.x  + U.y*V.y
export const vecDirectedNorm = (V:Partial<Vec>) => {
  Math.sqrt(V.x*V.x+V.y*V.y)
}
export const vecProjectXAB =  (X,A,B) => {
  let ab = vecSub(A,B);
  let ax = vecSub(A,X)
  return vecAdd(
    A,
    vecScale(
      vecDot(ax,ab)/(vecNorm(ab)),
    vecUnit(ab))
  )
}
//flip V around U
export const vecFlip =  R.curry((U,V)=> {return {
  x:2*U.x-V.x, 
  y:2*U.y-V.y
}})

export const scaleAroundU =  R.curry((U,k,V)=> {return {
  x:(U.x*(1+k)-V.x)/k, 
  y:(U.y*(1+k)-V.y)/k
}})




//project U on V



export const InitEvent = {
  x:1, 
  y:1, 
  movementX: 0,
  movementY: 0,
}

export const solve = constraints => (f, v) => {
	//If a field x of v is undefined in f, we assume that it is equivalent to f having field x equal to the identity
	const g0 = R.mapObjIndexed((x: num,i) => f[i]== undefined ? R.identity: f[i], v)
	//! assumes that "constraints" have been sorted in propagation order
	return constraints.reduce(
		(evolver, {predicate, g}) => constrainEvolver(v, evolver, predicate, g(evolver, v)), 
		g0
	)
}

// lifts a solver to array of objects
export const liftSolve = R.curry((solver, F, X) => R.evolve(mergePartialWith(solver, F, X), X))