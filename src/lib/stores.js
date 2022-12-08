import { writable, get } from "svelte/store";
import * as R from 'ramda';
import * as U from './utils.js';
import { wasm_functions as W } from '../main.js';
import {prng_alea} from 'esm-seedrandom';
//The arguments are named "monad" and "comonad" but it is probably an abuse of language
//The following is basically a bidirectional mapping between two stores.
// This looks a whole lot like the state monad and costate comonad induced by the curry/uncurry adjunction
//https://www.cs.ox.ac.uk/ralf.hinze/WG2.8/28/slides/ralf.pdf

export const hilbert_adjunction = (axes,b) =>[
	(n) => R.zipObj(axes, W.forward(n, b, axes.length)),
	(X) => W.inverse(u32a.from(R.map(k=>X[k],axes)), b),
];

let randomForward = axes => n => R.zipObj(
	axes,
	axes.map(
		(val)=>
			U.lerp([0,1],[0,Math.pow(2, 32)-1])(Math.random())
		)
	)

function randomReverse(X){
	let a = R.mapObjectIndexed((val, key, obj) => val + key.toString(),X)
	let b = R.values(a).reduce((x,y)=>x+y,"")
	let dim = R.values(a).length
	let max = W.max_hilbert(32, dim)
	let rand = prng_alea(b)
	let res = U.scale2bigint([0,1])([0, max])(rand)
	return res
}
export const random_adjunction = (axes) => [
    (n) => randomForward(axes)(n),
	(X) => randomReverse(X)
]

export function hilbertStore(params){
	const H = writable()
	const X = writable(params)
	// const parameters
	// X.subscribe(val => parameters = val)
	
	function set_H($h){
		H.set($h)
		X.update(prev=>R.zipWith((a,b)=>R.assoc("v",a,b),W.forward($h.n, $h.b,prev.length),prev))
	}

	function set_X($X){
		X = $X
		H.update(prev=>R.assocPath("n",W.inverse(u32a.from(R.map(k=>k.v,$X)), prev.b),prev))
	}


	function update_H(f){
		H.subscribe(val => {
			set_H(f(val))
		})
	}

	function update_X(f){
		X.subscribe(val => {
			set_X(f(val))
		})
	}

	return { 
		h:{ subscribe: H.subscribe, set: set_H, update: update_H},
		x: { subscribe: X.subscribe, set: set_X, update: update_X},
	};
}




export function sync(left, right) {
	const A = writable()
	const B = writable()

	// called when store_a.set is called or its binding reruns
	function set_A($a) {
		A.update(x=>$a);
		B.update(x=>left($a));
	}

	// called when store_b.set is called or its binding reruns
	function set_B($b) {
		A.update(x=>right($b));
		B.update(x=>$b);
	}

	function update_A($ua) {
		A.update($ua)
		B.update(R.compose($ua,left))
	}

	function update_B($ub) {
		B.update($ub)
		A.update(R.compose($ub,right))
	}

	return [
		{ subscribe: A.subscribe, set: set_A, update: update_A },
		{ subscribe: B.subscribe, set: set_B, update: update_B },
		// { subscribe: ranges .subscribe, set: setRanges },
	];
}


export function nestedStore([R1, L1],store,[R2,L2]) {
	const A = writable();
	const [B0, B1] = store;
	const C = writable();
	
	// called when store_a.set is called or its binding reruns
	function set_A($a) {
		A.set($a);
		B0.set(R1($a))
		B1.subscribe(value => {C.set(R2(value))})
		 //which should be the same as composing R1 and R2
	}

	// called when store_b.set is called or its binding reruns
	function set_B0($b) {
		//comonad is a contextual computation
		B0.set($b);
		A.set(L1($b));
		B1.subscribe(value => {C.set(R2(value))})
	}

	function set_B1($b) {
		//comonad is a contextual computation
		B1.set($b);
		C.set(R2($b))
		B0.subscribe(value => {A.set(L1(value))})
	}

	function set_C($c) {
		//comonad is a contextual computation
		C.set($c);
		B1.set(L2($c))
		B0.subscribe(value => {A.set(L1(value))})
			
	}

	return [
		{ subscribe: A.subscribe, set: set_A},
		[
			{ subscribe: B0.subscribe, set: set_B0, update: B0.update },
			{ subscribe: B1.subscribe, set: set_B1, update: B1.update },
		],
		{ subscribe: C.subscribe, set: set_C },
	];
}

export function A_below_B(a,b,t){
	// a resp b initial value of left resp right handside of the store, t = constraint tolerance
	const [A,B] = a < b?  [writable(a), writable(b)] : a==b ? [writable(a), writable(a+t)] : [writable(b), writable(a)]

	function set_A($a){update_A(x=>$a)}
	function set_B($b){update_B(x=>$b)}

	function update_A(f){ updateAll( [ willStayUnder(f(get(A)),get(B),t) ? f : x=>get(B)-t, R.identity] )}
	function update_B(f){ updateAll( [ willStayUnder(get(A),f(get(B)),t) ? R.identity : f, f] )}

	function updateAll([fA,fB]){ A.update(fA); B.update(fB)}

	return [
		{ subscribe: A.subscribe, set: set_A, update: update_A },
		{ subscribe: B.subscribe, set: set_B, update: update_B },
	]
}

function willStayUnder(target,bound,tolerance=0){
	return bound-target>=tolerance
}

function willStayBetween(target,[m,M]){
	return willStayUnder(m,target[0]) && willStayUnder(R.last(target),M)
}

export function paramStore(A,Z,B,C0,C1,epsilon){
	const obj = writable({a:A, z:Z, b:B, c0:C0, c1:C1});

	let ZboundedByC0C1 = true//if true, this means that Z will try to preserve its value upon updates of C0 and C1, and will only shrink when it has no more room
	let ZscalesWithC0C1 //if true, this means that Z ill preserve its relative size compared to C0 and C1
	let BboundedByC0C1 = true//if true this means that B will try to preserve its value upon updates of C0 and C1, and will only move if it's the only way to preserve a padding of Z/2 from each bound
	let BscalesWithC0C1 //if true, B will try to preserve its relative value compared to C0 and C1

	// on attempts to update the store with an array of functions, the solve function will compute amended versions of the functions in the array in order to respect the constraints
	function solve(u){
		//u is an object of the same shape as obj containing functions. if some fields of u are unspecified it means the 
		let [fa,fz,fb,fc0,fc1] = R.map(x=> x==undefined ? R.identity : x, R.props(["a","z","b","c0","c1"],u))
		let [va,vz,vb,vc0,vc1] = R.props(["a","z","b","c0","c1"],get(obj))
		//updates on c1 and c0 have priority over everything else
		//if updates on c1 and c0 lead to a distance smaller than epsilon, the burden of clamping is equally shared.
		//that means c1 is updated to half the available distance and c0 same
		let [Fc0,Fc1] = willStayUnder(epsilon,fc1(vc1)-fc0(vc0)) ? [fc0,fc1] : [x=>fc1(x-epsilon/2)-epsilon/2, x=>fc0(x+epsilon/2)+epsilon/2]
		let growthOfC = (Fc1(vc1) - Fc0(vc0))/(vc1-vc0)
		let scaleWithC = x => (x-vc0)*growthOfC+Fc0(vc0)
		
		let Fz, Fb, Fa
		//Update of Z have priority over updates of B, so they are computed first.

		if(ZboundedByC0C1){ Fz = fz(vz) < Fc1(vc1) - Fc0(vc0) ? fz : x => Fc1(vc1) - Fc0(vc0) }
		else if(ZscalesWithC0C1){
			let growthOfZ = fz(vz)/vz
			let clampToC0C1 = x => R.clamp(0, Fc1(vc1) - Fc0(vc0),x)
			Fz = x => clampToC0C1(growthOfZ*growthOfC*x)
		}

		let boundsOfB = [Fc0(vc0)+Fz(vz)/2,Fc1(vc1)-Fz(vz)/2]
		if(BboundedByC0C1){ Fb = willStayBetween(fb(vb),boundsOfB) ? fb : x=>R.clamp(...boundsOfB,fb(x)) }
		else if(BscalesWithC0C1){ Fb = x => R.clamp(...boundsOfB,fb(scaleWithC(x))) }
		
		//choice made: A's absolute position will be preserved as much as possible
		let boundsOfA = [Fb(vb)-Fz(vz)/2,Fb(vb)+Fz(vz)/2]
		Fa = willStayBetween(fa(va),boundsOfA) ? fa : x => R.clamp(...boundsOfA,fa(x))
		
		return {a: Fa, z: Fz, b: Fb, c0: Fc0, c1:Fc1}
	}

	function setWith(valueObj){
		let u = R.map(val=>function(x){return val},valueObj)
		updateWith(u)
	}

	function updateWith(updateObj){
		obj.update(prev=>R.mergeWith((v,f)=>f(v),prev,solve(updateObj)))
	}

	return { subscribe: obj.subscribe, set: setWith, update: updateWith}

}

