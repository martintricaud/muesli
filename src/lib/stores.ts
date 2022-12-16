import { writable, Writable, get } from "svelte/store";
import * as R from 'ramda';
import * as U from './utils';
import { wasm_functions as W } from '../main.js';
import { prng_alea } from 'esm-seedrandom';
// import type from '@types/ramda'


type E<T> = (x: T) => T //endomorphism type
type P<T> = Record<string, T> //record with fields of type t
type fP<T> = P<E<T>> //endomorphism on records with fields of type t
type num = number

let f32a = Float32Array;
let u32a = Uint32Array;

//The arguments are named "monad" and "comonad" but it is probably an abuse of language
//The following is basically a bidirectional mapping between two stores.
// This looks a whole lot like the state monad and costate comonad induced by the curry/uncurry adjunction
//https://www.cs.ox.ac.uk/ralf.hinze/WG2.8/28/slides/ralf.pdf

export const hilbert_adjunction = (axes, b) => [
	(n) => R.zipObj(axes, W.forward(n, b, axes.length)),
	(X) => W.inverse(u32a.from(R.map(k => X[k], axes)), b),
];

let randomForward = axes => _n => R.zipObj(
	axes,
	axes.map(
		(_val) =>
			U.lerp([0, 1], [0, Math.pow(2, 32) - 1])(Math.random())
	)
)

function randomReverse(X) {
	let a = R.mapObjIndexed((val, key, _obj) => val + key.toString(), X)
	let b = R.values(a).reduce((x, y) => x + y, "")
	let dim = R.values(a).length
	let max = W.max_hilbert(32, dim)
	let rand = prng_alea(b)
	let res = U.scale2bigint([0, 1])([0, max])(rand)
	return res
}
export const random_adjunction = (axes) => [
	(n) => randomForward(axes)(n),
	(X) => randomReverse(X)
]

export function sync(left, right) {
	const A = writable()
	const B = writable()

	// called when store_a.set is called or its binding reruns
	function set_A($a) {
		A.update(_x => $a);
		B.update(_x => left($a));
	}

	// called when store_b.set is called or its binding reruns
	function set_B($b) {
		A.update(_x => right($b));
		B.update(_x => $b);
	}

	function update_A($ua) {
		A.update($ua)
		B.update(R.compose($ua, left))
	}

	function update_B($ub) {
		B.update($ub)
		A.update(R.compose($ub, right))
	}

	return [
		{ subscribe: A.subscribe, set: set_A, update: update_A },
		{ subscribe: B.subscribe, set: set_B, update: update_B },
		// { subscribe: ranges .subscribe, set: setRanges },
	];
}


function solve(u: P<E<num>>, o: P<num>, epsilon = 0.01, ZboundedByC0C1 = true, ZscalesWithC0C1 = false, BboundedByC0C1 = true, BscalesWithC0C1 = false ) {
	let fields: string[] = ["a", "z", "b", "c0", "c1"]
	let undefinedToIdentity: (x: E<num> | undefined) => E<num> = x => { return x == undefined ? R.identity : x }
	let [fa, fz, fb, fc0, fc1]: E<num>[] = R.map(undefinedToIdentity, R.props(fields, u))
	let [va, vz, vb, vc0, vc1]: num[] = R.props(fields, o)

	//updates on c1 and c0 are hard constraints. 
	//If this leads to overconstraining, we relax constraints by distributing the "burden" of maintaining c0<c1 equally between c0 and c1
	let [Fc0, Fc1]: [E<num>, E<num>] = U.willStayUnder(epsilon, fc1(vc1) - fc0(vc0)) ? [fc0, fc1] : [x => fc1(x - epsilon / 2) - epsilon / 2, x => fc0(x + epsilon / 2) + epsilon / 2]
	let growthOfC: number = (Fc1(vc1) - Fc0(vc0)) / (vc1 - vc0)
	let scaleWithC: E<num> = x => (x - vc0) * growthOfC + Fc0(vc0)

	let Fz: E<num>, Fb: E<num>, Fa: E<num>
	//Update of Z have priority over updates of B, so they are computed first.

	if (ZboundedByC0C1) {
		Fz = fz(vz) < Fc1(vc1) - Fc0(vc0) ? fz : x => R.clamp(0, Fc1(vc1) - Fc0(vc0), fz(x))
	}
	else if (ZscalesWithC0C1) {
		let growthOfZ: number = fz(vz) / vz
		let clampToC0C1: E<num> = x => R.clamp(0, Fc1(vc1) - Fc0(vc0), x)
		Fz = x => clampToC0C1(growthOfZ * growthOfC * x)
	}

	let boundsOfB: [num, num] = [Fc0(vc0) + Fz(vz) / 2, Fc1(vc1) - Fz(vz) / 2]
	if (BboundedByC0C1) { Fb = U.willStayBetween([fb(vb)], boundsOfB) ? fb : x => R.clamp(boundsOfB[0], boundsOfB[1], fb(x)) }
	else if (BscalesWithC0C1) { Fb = x => R.clamp(...boundsOfB, fb(scaleWithC(x))) }

	//choice made: A's absolute position will be preserved as much as possible
	let boundsOfA: [num, num] = [Fb(vb) - Fz(vz) / 2, Fb(vb) + Fz(vz) / 2]
	Fa = U.willStayBetween([fa(va)], boundsOfA) ? fa : x => R.clamp(...boundsOfA, fa(x))

	let res: P<E<number>> = { a: Fa, z: Fz, b: Fb, c0: Fc0, c1: Fc1 }
	return res
}

function liftSolve(solver,X:P<P<num>>, F:P<P<E<num>>>){
	let recordFXsolved = R.mapObjIndexed((f:P<E<num>>,key)=>solver(f,X[key]),F)
	return R.evolve(recordFXsolved)
}

export function liftedConstraintStore(data: Array<[string, P<num>]>, _epsilon: number = 0.01, defaultArg:P<num> = { a: 5, z: 10, b: 5, c0: 0, c1: 10 }) {
	//initialize object with default args in each field.
	let dataObj:P<P<num>>= R.fromPairs(data)
	let X0:P<P<num>> = R.map(R.always(defaultArg), dataObj)
	let F0 = U.deepMap(R.always,dataObj)
	const SR: Writable<P<P<num>>> = writable(liftSolve(solve,X0, F0)(X0)) //store of records
	const Index: Writable<string[]> = writable(R.map(x=>x[0], data))

	function set_S(X: P<P<num>>) {
		update_S(U.deepMap(R.always,X))
	}

	function update_S(F: P<P<E<num>>>) {
		SR.update(liftSolve(solve,get(SR), F))
	}

	function dropKeys(keys) {
		SR.update(liftedStore => R.omit(keys, liftedStore))
		Index.update(x => R.without(keys, x))
	}

	function update_field(field:string, F) {
		SR.update(liftSolve(solve,get(SR), R.mapObjIndexed((val:E<number>)=>R.objOf(field,val),F)))
	}	

	function setWithLens(field:string, rec:P<number>) {
		let setters = R.mapObjIndexed((recEntry,key) => R.set(U.scaleLens(field),recEntry,get(SR)[key]),rec)
		set_S(setters)
	}	
	
	function updateWithLens(field:string, rec:P<E<number>>) {
		let setters = R.mapObjIndexed((recEntry,key) => R.over(U.scaleLens(field),recEntry,get(SR)[key]),rec)
		set_S(setters)
	}	

	return [
		{ subscribe: SR.subscribe, set: set_S, update: update_S, remove: dropKeys, setWithLens:setWithLens, updateField:update_field},
		{subscribe: Index.subscribe, set: Index.set, update: Index.update}
	]
}

export function museliStore(data: Array<[string, P<num>]>, initA:string, initB:string){
	const bits:number = 32
	let forward: (n:string,L:number, b:number) => number[] = (n,L,b) => W.forward(n, b, L)
	let inverse: (X:number[],b:number) => string = (X,b) => W.inverse(u32a.from(X), b)

	let h_forward, h_inverse;
	let [MAX_H, MAX_A] = [W.max_hilbert(32, data.length), Math.pow(2, 32) - 1];
	
	let H: Record<string,Writable<string>> = {a:writable(initA), b:writable(initB)}
	let B:Writable<number> = writable(32)
	let valI:string[]
	const [P, I] = liftedConstraintStore(data)
	I.subscribe(i=>{
		valI = i
		h_forward = n => W.forward(n, get(B), i.length)
		h_inverse = X => W.inverse(u32a.from(X), get(B))
	})

	B.subscribe(b=>{
		h_forward = n => W.forward(n, b, valI.length)
		h_inverse = X => W.inverse(u32a.from(X), b)
	})

	function setH(field:string){
		return function(h:string){
			H[field].set(U.clamp(['0', MAX_H])(h))
			let hx:P<number> = R.zipObj(valI,forward(h,length,bits))
			P.setWithLens(field,hx)
		}
	}

	function updateH(field:string){
		return function(f_h){
			H[field].update(x=>U.clamp(['0', MAX_H])(f_h(x)))
			let hx:P<number> = R.zipObj(valI,forward(get(H[field]),length,bits))
			P.setWithLens(field,hx)
		}
	}

	function setP(X){
		P.set(X);
		//TODO: get a and b for each key, scale them and assign them to h1, h2
	}	


	function updateP(){}	
	return [
		{subscribe: H['b'].subscribe, set: setH('b'), update: updateH('b')},
		{subscribe: H['a'].subscribe, set: setH('a'), update: updateH('a')},
		{subscribe: P.subscribe, set: setP, update: updateP},
	]
}
