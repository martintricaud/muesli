import * as R from 'ramda';
import * as U from './utils'
type E<T> = (x: T) => T //endomorphism type
type P<T> = Record<string, T> //record with fields of type t
// export type fP<T> = P<E<T>> //endomorphism on records with fields of type t
type num = number
// export type str = string

// export const willStayUnder = (target, bound, tolerance = 0) => (bound - target) >= tolerance
// export const willStayBetween = (target, [m, M]) => willStayUnder(m, target[0]) && willStayUnder(R.last(target), M)

// export function solve(update: P<E<num>>, param: P<num>) {
// 	let [ZboundedByC0C1, BboundedByC0C1, ZscalesWithC0C1, BscalesWithC0C1] = [true, true, false, false]
// 	let epsilon = 0.01
// 	const fields: str[] = ["a", "z", "b", "c0", "c1"]
// 	const [f["a"], f["z"], f["b"], f["c0"], f["c1"]]: E<num>[] = R.map((x: E<num>) => x ??= R.identity, R.props(fields, update)) //fields that are not updated are updated with the identity
// 	const [v["a"], v["z"], v["b"], v["c0"], v["c1"]]: num[] = R.props(fields, param)
// 	let g["z"], g["b"], g["a"], gc0, gc1
// 	//updates on c1 and c0 are hard constraints. 
// 	//If this leads to overconstraining, we relax constraints by distributing the "burden" of maintaining c0<c1 equally between c0 and c1
// 	[gc0, gc1] = willStayUnder(epsilon, f["c1"](v["c1"]) - f["c0"](v["c0"])) ? [f["c0"], f["c1"]] : [x => f["c1"](x - epsilon / 2) - epsilon / 2, x => f["c0"](x + epsilon / 2) + epsilon / 2]
// 	let growthOfC: num = (gc1(v["c1"]) - gc0(v["c0"])) / (v["c1"] - v["c0"])
// 	let scaleWithC: E<num> = x => (x - v["c0"]) * growthOfC + gc0(v["c0"])

// 	//Update of Z have priority over updates of B, so they are computed first.
// 	if (ZboundedByC0C1) {
// 		g["z"] = f["z"](v["z"]) < gc1(v["c1"]) - gc0(v["c0"]) ? f["z"] : x => R.clamp(0, gc1(v["c1"]) - gc0(v["c0"]), f["z"](x))
// 	}
// 	else if (ZscalesWithC0C1) {
// 		let growthOfZ: num = f["z"](v["z"]) / v["z"]
// 		g["z"] = x => R.clamp(0, gc1(v["c1"]) - gc0(v["c0"]), growthOfZ * growthOfC * x)
// 	}

// 	let boundsOfB: [num, num] = [gc0(v["c0"]) + g["z"](v["z"]) / 2, gc1(v["c1"]) - g["z"](v["z"]) / 2]
// 	if (BboundedByC0C1) { g["b"] = willStayBetween([f["b"](v["b"])], boundsOfB) ? f["b"] : x => R.clamp(boundsOfB[0], boundsOfB[1], f["b"](x)) }
// 	else if (BscalesWithC0C1) { g["b"] = x => R.clamp(...boundsOfB, f["b"](scaleWithC(x))) }

// 	//choice made: A's absolute position will be preserved as much as possible
// 	let boundsOfA: [num, num] = [g["b"](v["b"]) - g["z"](v["z"]) / 2, g["b"](v["b"]) + g["z"](v["z"]) / 2]
// 	g["a"] = willStayBetween([f["a"](v["a"])], boundsOfA) ? f["a"] : x => R.clamp(...boundsOfA, f["a"](x))
// 	let res: P<E<num>> = { a: g["a"], z: g["z"], b: g["b"], c0: gc0, c1: gc1 }
// 	return res
// }


type Variable = { name: string; coeff: number };

type LinearConstraint = { type: "equation" | "inequality"; variables: Variable[]; rhs: number };

function solveConstraints<T>(
    V: Record<string, T>,
    F: Record<string, (x: T) => T>,
    C: Record<string, (v: Record<string, T>) => boolean>,
    order: Record<string, number>
): Record<string, (x: T) => T> {
    // Create a list of constraints sorted by their priority
    const sortedConstraints = R.sortBy(R.prop("key"), R.map((key: string) => ({ key, value: C[key] }), R.keys(C)));

    // Iterate through the constraints in order and update the functions in F accordingly
    let updatedF = { ...F };
    for (const { value: constraint } of sortedConstraints) {
        // For linear equation constraints, solve for the variable and update the corresponding function in F
        if (isLinearEquationConstraint(constraint)) {
            const varName = R.find(R.propEq("coeff", 1), constraint.variables)!.name;
            const coeffs = R.reject(R.propEq("name", varName), constraint.variables);
            const rhs = constraint.rhs;
            updatedF[varName] = x => (rhs - R.sum(R.map(c => c.coeff * V[c.name], coeffs))) / R.find(R.propEq("name", varName), coeffs)!.coeff;
        }
        // For linear inequality constraints, solve for the variable and update the corresponding function in F
        else if (isLinearInequalityConstraint(constraint)) {
            const varName = R.find(R.propEq("coeff", 1), constraint.variables)!.name;
            const coeffs = R.reject(R.propEq("name", varName), constraint.variables);
            const rhs = constraint.rhs;
            const inequalityType = getInequalityType(constraint);
            let comparisonFn: (x: T, y: T) => T;
            if (inequalityType === ">") {
                comparisonFn = R.max;
            } else if (inequalityType === ">=") {
                comparisonFn = R.max;
            } else if (inequalityType === "<") {
                comparisonFn = R.min;
            } else if (inequalityType === "<=") {
                comparisonFn = R.min;
            }
            updatedF[varName] = x => comparisonFn(x, (rhs - R.sum(R.map(c => c.coeff * V[c.name], coeffs))) / R.find(R.propEq("name", varName), coeffs)!.coeff);
        }
    }
    return updatedF
}

let mult = factor => x => x*factor

export function solve2(update: P<E<num>>, param: P<num>) {
	let [ZboundedByC0C1, BboundedByC0C1, ZscalesWithC0C1, BscalesWithC0C1] = [true, true, false, false]
	let epsilon = 0.01
	const fields: str[] = ["a", "z", "b", "c0", "c1"]
	const f: P<E<num>> = R.map((x: E<num>) => x ??= R.identity, R.props(fields, update)) //fields that are not updated are updated with the identity
	const v: P<num> = param
	let g
	//updates on c1 and c0 are hard constraints. 
	//If this leads to overconstraining, we relax constraints by distributing the "burden" of maintaining c0<c1 equally between c0 and c1
	[g["c0"], g["c1"]] = f["c1"](v["c1"]) - f["c0"](v["c0"]) >= epsilon ? [f["c0"], f["c1"]]  : [x => f["c1"](x - epsilon / 2) - epsilon / 2, x => f["c0"](x + epsilon / 2) + epsilon / 2]
	let growthOfC: num = (g["c1"](v["c1"]) - g["c0"](v["c0"])) / (v["c1"] - v["c0"])
	//let scaleWithC: E<num> = x => (x - v["c0"]) * growthOfC + g["c0"](v["c0"])

	//Update of Z have priority over updates of B, so they are computed first.
	if (ZboundedByC0C1) {
		g["z"] = f["z"](v["z"]) < g["c1"](v["c1"]) - g["c0"](v["c0"]) ? f["z"] : R.pipe(f["z"], R.clamp(0, g["c1"](v["c1"]) - g["c0"](v["c0"])))
	}
	else if (ZscalesWithC0C1) {
		let growthOfZ: num = f["z"](v["z"]) / v["z"]
		g["z"] = x => R.clamp(0, g["c1"](v["c1"]) - g["c0"](v["c0"]), growthOfZ * growthOfC * x)
	}

	let boundsOfB: [num, num] = [g["c0"](v["c0"]) + g["z"](v["z"]) / 2, g["c1"](v["c1"]) - g["z"](v["z"]) / 2]
	if (BboundedByC0C1) { g["b"] = U.willStayBetween([f["b"](v["b"])], boundsOfB) ? f["b"] : R.pipe(f["b"],R.clamp(boundsOfB[0], boundsOfB[1])) }
	//else if (BscalesWithC0C1) { g["b"] = x => R.clamp(...boundsOfB, f["b"](scaleWithC(x))) }

	//choice made: A's absolute position will be preserved as much as possible
	let boundsOfA: [num, num] = [g["b"](v["b"]) - g["z"](v["z"]) / 2, g["b"](v["b"]) + g["z"](v["z"]) / 2]
	g["a"] = U.willStayBetween([f["a"](v["a"])], boundsOfA) ? f["a"] : R.pipe(f["b"],R.clamp(...boundsOfA))
	let res: P<E<num>> = { a: g["a"], z: g["z"], b: g["b"], c0: g["c0"], c1: g["c1"] }
	return res
}