import { writable, Writable, get, derived } from "svelte/store";
import * as R from 'ramda';
import * as U from './utils';
import * as vec from './vec'
import { wasm_functions as W } from '../main.js';
import { prng_alea } from 'esm-seedrandom';

interface Vec {
    x: number,
    y: number
}

export function AlignmentStore(A: Partial<Vec>, B: Partial<Vec>, C: Partial<Vec>) {
    const [P1, P2, P3] = [writable(A), writable(B), writable(C)]
    const K = writable(B)
    const [Shift, Click] = [writable(false), writable(false)]
    const [P1P2, P1P3, P2P3] = [
        derived([P1, P2], ([a, b]) => vec.sub(a, b)),
        derived([P1, P3], ([a, b]) => vec.sub(a, b)),
        derived([P2, P3], ([a, b]) => vec.sub(a, b))]
    const Target = writable(undefined)

    let $Shift, $Click, $P1, $P2, $P3, $P1P2, $P1P3, $P2P3, $Target, $K

    Shift.subscribe(x => { $Shift = x })
    Click.subscribe(x => { $Click = x })
    P1.subscribe(x => { $P1 = x })
    P2.subscribe(x => { $P2 = x })
    P3.subscribe(x => { $P3 = x })
    P1P2.subscribe(x => { $P1P2 = x })
    P1P3.subscribe(x => { $P1P3 = x })
    P2P3.subscribe(x => { $P2P3 = x })
    Target.subscribe(x => { $Target = x })
    K.subscribe(x => { $K = x })

    function ClickSet(value: boolean) {
        /** retrieve the list of movable elements at P2's position */
        let targetList = document
            .elementsFromPoint($P2.x, $P2.y)
            .filter(x => x.classList.contains('thumb') || x.classList.contains('range'))

        /** set target to undefined if targetList is empty */ 
        let res = targetList.length > 0 ? targetList[0] : undefined;

        /** set TargetStore to res on mouseDown, and to undefined on mouseUp */ 
        value ? Target.set(res) : Target.set(undefined)
        Click.set(value)
        K.set($P2)
        
    }
    function P1Set(v: any) {
        P1Update(R.mergeLeft(v))
    }

    function P1Update(u) {
        if ($Click) {
            if ($Shift) {
                let P1bis = vec.projectXAB(u($P1), $P1, $P3)
                let foo = vec.norm(vec.sub(P1bis, $P3))<=(vec.norm($P2P3)+0.00001) ? vec.add($P2, vec.setNorm(0.0001,vec.sub($P2,$P3))) : P1bis
                P1.set(foo)
            }
            else {
                let deltaY = $P3.y - $K.y
                P1.update(u)
                let P2new = Math.abs($P1P3.y)>Math.abs($P2P3.y) ? {
                    x: $P3.x - $P1P3.x * deltaY*Math.sign(-$P1P3.y) / $P1P3.y,
                    y: $P3.y + deltaY*Math.sign($P1P3.y)
                } : vec.add($P1, vec.scale(0.01,$P1P3))
                P2.update(R.mergeLeft(P2new))
            }
        }
        else {
            if ($Shift) {
                let u3 = $P1P3
                P1.update(u)
                let newP3 = vec.norm($P1P2)>=vec.norm(u3) + 0.01? vec.add($P2,vec.setNorm(0.01,$P1P2)) :
                vec.add($P1,vec.setNorm(vec.norm(u3),$P1P2))
                P3.set(newP3)
            }
            else {
                let [u2, u3] = [$P1P2, $P1P3]
                P1.update(u)
                P2.set(vec.add($P1, u2))
                P3.set(vec.add($P1, u3))
            }
        }
    }

    return [
        {
            subscribe: P1.subscribe,
            set: P1Set,
            update: P1Update,
        },
        {
            set: ClickSet,
            subscribe: P2.subscribe,
        },
        {
            set: Shift.set,
            subscribe: P3.subscribe,
        },
        {
            subscribe: Target.subscribe
        }
    ]
}

