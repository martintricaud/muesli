// export const zip = a => b => [a,b]

// //insert a number in a range
// type Insert<T> = (a:[T,T])=>(b:T)=>[T,T,T]
// export const insert: Insert<number> = a=>b=>[a[0],b,a[1]]

// type Lerp<T> = (r1:[T,T]) => (r2:[T,T]) => (v:T) => T
// export const lerp:Lerp<number> = ([m0,M0]) => ([m1,M1]) => (v) => (v - m0) * (M1 - m1) / (M0 - m0) + m1

// export const lerp_and_insert = (r1) => (r2)=> (val) => insert(r2)(lerp(r1)(r2)(val))

// //type function
// type f<A,B> = (arg:A) => B

// //function composition
// function compose<A,B,C>(f1:f<A,B>, f2:f<B,C>): f<A,C>{
//     return v => f2( f1( v ) )
// }
// //returns the composition of an array of functions
// //requires that the return type of a function is equal to the args type of the next
// export function batchCompose(...f_s){
//     return f_s.reduce((prev, curr) => compose(prev,curr), x=>x);
// }

// //returns the composition of a pair of adjunct functions 
// export function composeAdjunctions([L1, R1],[L2,R2]){
//     return [compose(L1,L2), compose(R2, R1)]
// }

// //shift a range [min,max] to be centered on val
// export const computeSubrange = ([min,max]) => val => [val-(min-max)/2,val+(min-max)/2]

// //Takes: Range A, Range B. Returns: A clipped to B
// export const clipRangeAtoRangeB = B => A => { return [Math.max(B[0],A[0]),Math.min(A[1],B[1])]}

// type Map<A> = {
//     name: string;
//     value: A;
// }

// interface Object<A> {
//     [key: string]: A;
// }
// //Takes: Object obj
// //Returns: 
// //  Takes Function f
// //  Returns Updated obj where function f has been applied to each field
// // NOTE: f must be polymorphic on all fields of obj
// export const objectMapper = (obj) => (f) => 
//     Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,f(v)]))

// //focus is an array, obj is an object, obj must have same number of entries as focus size
// export const arr2objZipper = focus => (obj) => (zipper) => 
//     Object.fromEntries(Object.entries(obj).map(([key,val],i)=>[key,zipper(val)(focus[i])]))

// //focus is an obj, obj is an object, obj must have same number of entries as focus size
// type ObjectZipper<A,B,C> = (a:Object<A>) => (b:Object<B>) => (zipper:f<A,f<B,C>>) => Object<C>
// export const obj2objZipper:ObjectZipper<number,number,number> = (objA) => (objB) => (zipper) => 
// Object.fromEntries(Object.entries(objA).map(([key,valA])=>[key,zipper(valA)(objB[key])]))




// type Adjunction<A,B> = [(a:A) => B, (b:B)=>A]

// type HilbertAdjunction = (axis:string[]) => (bits:number) => Adjunction<number,number[]>


// let hilbert_adjunction2 = (axis_names) => (bits) => [
//     (hilbert_index) => left(axis_names)(Float32Array.from(W.forward(hilbert_index, bits, axis_names.length))),
//     (hilbert_axes) => W.inverse(Uint32Array.from(right(hilbert_axes)(axis_names)), bits),
// ]


