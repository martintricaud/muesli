import { writable, get } from "svelte/store";
import * as R from 'ramda';
import * as U from './utils.js';

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

	function update_A(f){ updateAll( [ U.willStayUnder(f(get(A)),get(B),t) ? f : x=>get(B)-t, R.identity] )}
	function update_B(f){ updateAll( [ U.willStayUnder(get(A),f(get(B)),t) ? R.identity : f, f] )}

	function updateAll([fA,fB]){ A.update(fA); B.update(fB)}

	return [
		{ subscribe: A.subscribe, set: set_A, update: update_A },
		{ subscribe: B.subscribe, set: set_B, update: update_B },
	]
}