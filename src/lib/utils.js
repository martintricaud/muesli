import {wasm_functions as W} from '../main.js';

export const zip = a => b => [a,b]
export const zipAsPair = A => B => A.map((v,i)=>[v,B[i]])
export const zipAsKeyVal = keys => vals => Object.fromEntries(zipAsPair(keys)(vals))
export const unzipIntoVal = obj => keys => keys.map(key=>obj[key])
export const insert = a => b => [a[0],b,a[1]]
export const scale = ([a,A]) => ([b,B]) => v => (v - a) * (B - b) / (A - a);


export const zoomA = f => ([a,A])=>[a*f, A*f]
export const lerp_AB = A => B => v => scale(A)(B)(v)  + B[0] ;
export const lerp_BA = B => A => v => scale(A)(B)(v)  + B[0] ;
export const scale2bigint = ([a,A]) => ([b,B]) => v =>  W.bigint_prod((v-a)/(A-a), W.bigint_dif(B,b), Math.pow(10,15));
export const lerp2bigint = A => B => v => W.bigint_sum(B[0], scale2bigint(A)(B)(v))

export const lerp_and_insert = (r1) => (r2) => (val) => insert(r2)(lerp_AB(r1)(r2)(val))

//shift a range [min,max] to be centered on val
export const computeSubrange = ([a,A]) => v => [v-(A-a)/2,v+(A-a)/2]

export const zoom = hypercube => factor => objMapper(hypercube)(([k,v])=>[k,zoomA(factor)(v)])

export const clip = B => A => { return [Math.max(B[0],A[0]),Math.min(A[1],B[1])]}
export const clamp = ([a,A]) => v => v < a ? a : v > A ? A : v



export const evaluate = f => v => f(v)

export const comp = (f1) => (f2) => {return (v) => f2(f1)(v)}

export function compose(f1, f2){
    return v => f2(f1(v))
}
export function batchCompose(...f_s){
    return f_s.reduce((prev, curr) => compose(prev,curr), x=>x);
}
export function composeAdjunctions([L1, R1],[L2,R2]){
    return [compose(L1,L2), compose(R2, R1)]
}

export const arr2objMapper = a => f => Object.fromEntries(a.map(f))
export const objectMapper3 = (obj) => (f) => Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,f(v)]))

export const objMapper = (obj) => (f) => Object.fromEntries(Object.entries(obj).map(f))
export const objUpdate = (f_obj) => (obj) => objMapper(f_obj)(([k,v])=>[k,v(obj[k])])
export const objUpdate_partial = upd => obj => {return {...obj,...objUpdate(upd)(obj)}}
export const arr2objZipper = a => B => (zipper) => objMapper(B)(([k,v],i)=>[k,zipper(v)(a[i])])
export const obj2objZipper = A => B => (zipper) => objMapper(A)(([k,a])=>[k,zipper(a)(B[k])])

export const updateObjectAtKey = (obj,upd,key) => {return {...obj,[key]:upd(obj[key])}}

export const updateContextfulObject = ([obj,context],upd,key) => [{...obj,[key]:upd(obj[key])},context]

// export const applyDelta = delta => x =>



