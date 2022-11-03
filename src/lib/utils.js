// notations
// everything after the underscore indicates the type
// o = object
// oA = object where all fields are of type A
// v = vector 
// vA = vector where all elements are of type A
// 2 = tuple, 3 = triple etc
// 2A = pair  3A = triple, etc
// fAB = functions of type A into type B
// eA = endomorphism in A
// xA = value of type A
import {wasm_functions as W} from '../main.js';

export const zip = a => b => [a,b]
export const zipAsPair = A => B => A.map((x,i)=>[x,B[i]])
export const zipAsKeyVal = keys => vals => Object.fromEntries(zipAsPair(keys)(vals))
export const unzipIntoVal = o => keys => keys.map(key=>o[key])
export const insert = a => b => [a[0],b,a[1]]
export const scale = ([a,A]) => ([b,B]) => x => (x - a) * (B - b) / (A - a);


export const zoomA = f => ([a,A])=>[a*f, A*f]
export const lerp_AB = A_2A => B_2A => x_A => scale(A_2A)(B_2A)(x_A)  + B_2A[0] ; //T<A> => T<A> => A => return A
export const lerp_BA = B => A => x => scale(A)(B)(x)  + B[0] ;
export const scale2bigint = ([a,A]) => ([b,B]) => x =>  W.bigint_prod((x-a)/(A-a), W.bigint_dif(B,b), Math.pow(10,15));
export const lerp2bigint = A => B => x => W.bigint_sum(B[0], scale2bigint(A)(B)(x))

export const lerp_and_insert = (r1) => (r2) => (x) => insert(r2)(lerp_AB(r1)(r2)(x))

//shift a range [min,max] to be centered on val
export const computeSubrange = ([a,A]) => x => [x-(A-a)/2,x+(A-a)/2]

export const zoom = hypercube => factor => objMapper(([k,x])=>[k,zoomA(factor)(x)])(hypercube)

export const clip = B => A => { return [Math.max(B[0],A[0]),Math.min(A[1],B[1])]}
export const clamp = ([a,A]) => x => x < a ? a : x > A ? A : x



export const evaluate = f => x => f(x)

export const comp = (f1) => (f2) => {return (x) => f2(f1)(x)}

export function compose(f1, f2){
    return x => f2(f1(x))
}
export function batchCompose(...f_s){
    return f_s.reduce((prev, curr) => compose(prev,curr), x=>x);
}
export function composeAdjunctions([L1, R1],[L2,R2]){
    return [compose(L1,L2), compose(R2, R1)]
}

export const arr2objMapper = a => f => Object.fromEntries(a.map(f))
export const objMapper = (fAX) => (oA) => Object.fromEntries(Object.entries(oA).map(fAX))
export const kvMapper = (f) => objMapper(([k,x])=>[k,f(x)])
export const objUpdate = (f_o) => (o) => objMapper(([k,x])=>[k,x(o[k])])(f_o)
export const objUpdate_partial = upd => o => {return {...o,...objMapper(([k,x])=>[k,x(o[k])])(upd)}}
export const arr2objZipper = a => B => (zipper) => objMapper(([k,x],i)=>[k,zipper(x)(a[i])])(B)
export const obj2objZipper = A => B => (zipper) => objMapper(([k,a])=>[k,zipper(a)(B[k])])(A)

export const updateObjectAtKey = o => f => k => {return {...o,[k]:f(o[k])}}
export const updateArrAtPos = ar => f => i => {let res = ar; res[i] = f(ar[i]); return res}

export const updateContextfulObject = ([o,context],f,k) => [updateObjectAtKey(o)(f)(k),context]

// export const applyDelta = delta => x =>

let galois_pullBack = (adj)=>(f)=>(x)=>adj[1](f(adj[0](x)))  

