import { writable } from "svelte/store";

//The arguments are named "monad" and "comonad" but it is probably an abuse of language
//The following is basically a bidirectional mapping between two stores.
// This looks a whole lot like the state monad and costate comonad induced by the curry/uncurry adjunction
//https://www.cs.ox.ac.uk/ralf.hinze/WG2.8/28/slides/ralf.pdf

export function sync(monad, comonad) {
	const A = writable();
	const B = writable();
	//const ranges = writable()

	// called when store_a.set is called or its binding reruns
	function set_A($a) {
		A.set($a);
		//monad is an effectful computation
		B.set(monad($a));
	}

	// called when store_b.set is called or its binding reruns
	function set_B($b) {
		//comonad is a contextual computation
		A.set(comonad($b));
		B.set($b);
	}

	return [
		{ subscribe: A.subscribe, set: set_A },
		{ subscribe: B.subscribe, set: set_B },
		// { subscribe: ranges .subscribe, set: setRanges },
	];
}

// export function highersync(monad, comonad) {
// 	const A = writable();
// 	const B = writable();
// 	//const ranges = writable()

// 	// called when store_a.set is called or its binding reruns
// 	function set_A($a) {
// 		A.set($a);
// 		//monad is an effectful computation
// 		B.set(monad($a));
// 	}

// 	// called when store_b.set is called or its binding reruns
// 	function set_B($b) {
// 		//comonad is a contextual computation
// 		A.set(comonad($b));
// 		B.set($b);
// 	}

// 	return [
// 		{ subscribe: A.subscribe, set: set_A },
// 		{ subscribe: B.subscribe, set: set_B },
// 		// { subscribe: ranges .subscribe, set: setRanges },
// 	];
// }

