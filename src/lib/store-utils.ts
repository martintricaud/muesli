import { writable } from "svelte/store";
import * as R from 'ramda';

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
	];
}
