import {wasm_functions as W} from '../main.js';


export const zip = a => b => [a,b]
export const zipAsPair = arrA => arrB => arrA.map((val,i)=>[val,arrB[i]])
export const zipAsKeyVal = keys => vals => Object.fromEntries(zipAsPair(keys)(vals))
export const unzipIntoVal = obj => keys => keys.map(key=>obj[key])
export const insert = a => b => [a[0],b,a[1]]
export const scale = ([m0,M0]) => ([m1,M1]) => (v) => (v - m0) * (M1 - m1) / (M0 - m0);
export const lerp_AB = ([m0,M0]) => ([m1,M1]) => (v) => (v - m0) * (M1 - m1) / (M0 - m0)  + m1 ;
export const lerp_BA = ([m1,M1]) => ([m0,M0]) => (v) => (v - m0) * (M1 - m1) / (M0 - m0)  + m1 ;
export const lerp2bigint = ([m0,M0]) => ([m1,M1]) => (v) => W.bigint_sum(m1, W.bigint_prod((v-m0)/(M0-m0), W.bigint_dif(M1,m1), Math.pow(10,15)))
export const scale2bigint = ([m0,M0]) => ([m1,M1]) => (v) =>  W.bigint_prod((v-m0)/(M0-m0), W.bigint_dif(M1,m1), Math.pow(10,15));
export const lerp_and_insert = (r1) => (r2) => (val) => insert(r2)(lerp_AB(r1)(r2)(val))

export const evaluate = f => val=>f(val)

export function compose(f1, f2){
    return v => f2(f1(v))
}
export function batchCompose(...f_s){
    return f_s.reduce((prev, curr) => x=>curr(prev(x)), x=>x);
}
export function composeAdjunctions([L1, R1],[L2,R2]){
    return [compose(L1,L2), compose(R2, R1)]
}

//shift a range [min,max] to be centered on val
export const computeSubrange = ([min,max]) => val => [val-(max-min)/2,val+(max-min)/2]

//zoom on a range by a factor 
export const zoom = hypercube => factor => objectMapper(hypercube)(([min,max])=>[min*factor, max*factor])

//clip a range A to a range B
export const clip = B => A => { return [Math.max(B[0],A[0]),Math.min(A[1],B[1])]}
export const clamp = ([min,max]) => val => val < min ? min : val > max ? max : val

export const objectMapper = (obj) => (f) => 
    Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,f(v)]))

//focus is an array, obj is an object, obj must have same number of entries as focus size
export const arrZipper = a => b => a.map((val,i)=>[val,b[i]])

//focus is an array, obj is an object, obj must have same number of entries as focus size
export const arr2objZipper = focus => (obj) => (zipper) => 
    Object.fromEntries(Object.entries(obj).map(([key,val],i)=>[key,zipper(val)(focus[i])]))

//focus is an obj, obj is an object, obj must have same number of entries as focus size
export const obj2objZipper = (objA) => (objB) => (zipper) => 
Object.fromEntries(Object.entries(objA).map(([key,valA])=>[key,zipper(valA)(objB[key])]))



// const hilbert_locked = (sliders, locked_sliders) => sliders.map((val,i)=>{
//     locked_sliders[i].locked ? locked_sliders[i].stored : val
// })


// let updateContextfulObject = ([obj,context],upd,key) => [{...obj,[key]:upd(obj[key])},context]

// let uco2 = ([obj,context],obj2,key) => [{...obj,...[key]:upd(obj[key])},context]

// //up is an object where keys are keys and values are functions that take an object and return 
// objectMapper(obj)([key,val]=>val(otherobj[key]))

// export const objectMapper2 = (obj) => (f) => 
//     Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,f(v)]))




   // $: update = U.obj2objZipper($hr_axes_u32)(extractProp(Object.fromEntries(axis))("r"))(filter)
  // $: $hr_axes_f32 = [U.obj2objZipper(update)($hr_axes_u32)(U.evaluate), r_tracks]; 
  let filter = value => islocked => islocked? (x=>x) : (x=>value)
  let extractProp = obj => prop => objectMapper(obj)(val=>val[prop])
  let udpateValues = valuesObject => lockedObject => obj2objZipper(valuesObject)(extractProp())(filter)