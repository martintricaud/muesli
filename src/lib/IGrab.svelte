<script>
    import { createEventDispatcher } from 'svelte';
    import * as R from 'ramda';
    import * as U from './utils';
    import { writable } from 'svelte/store';
    export let ev, name, equipped;

    let fCustom = x=>(x-1)*Math.pow(Math.log(x/15+1),4)+1
    let vw, vh;
    let clock = writable(0);
    let deltaX = writable(0);

    let intervalId = null;
    function startEdgeScroll(step) {
        intervalId = setInterval(() => {
            clock.update((x) => x + step);
        }, 50);
    }

    function stopEdgeScroll(ev) {
        clock.set(0);
        clearInterval(intervalId);
    }

    const dispatch = createEventDispatcher();
    $: [attack, target] = [ev.atk ?? ev, attack?.target];

    $: trackX = R.clamp(attack.x - 200, attack.x + 200, ev.x);
    $: thumbY = R.clamp(attack.y - 400, attack.y + 400, ev.y) - 10;
    //linerarly interpolate the mouse vertical offset from a defined range to 1 100 (this is arbitraty)
    // $: $deltaX = U.lerp(0, 400, 1, 100, Math.abs(thumbY - attack.y));
    $: $deltaX = Math.abs(thumbY - attack.y);
    $: newEv =
        $clock != 0
            ? R.modify('movementX', (x) => (Math.sign($clock) * 10) / fCustom($deltaX), ev)
            : R.modify('movementX', (x) => x / fCustom($deltaX), ev);
    $: rect = newEv?.atk?.target?.getBoundingClientRect() ?? {
        x: attack.x+1,
        y: attack.y,
        width: 4,
        height: 0,
    };
    $: dispatch('effect', newEv);
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh} />
<div class="instrument">
    <div
        class="machine minus"
        class:inactive={!equipped}
        style="top:{thumbY}px; left:{trackX - 30}px;"
        on:mouseenter={() => startEdgeScroll(-1)}
        on:mouseup={stopEdgeScroll}
        on:mouseleave={stopEdgeScroll}
        on:mousemove={(ev) => clock.set(0)}
    >
        -
    </div>
    <div
        class="machine"
        class:inactive={!equipped}
        style="top:{thumbY}px; left:{trackX + 10}px;"
        on:mouseenter={() => startEdgeScroll(1)}
        on:mouseup={stopEdgeScroll}
        on:mouseleave={stopEdgeScroll}
        on:mousemove={(ev) => clock.set(0)}
    >
        +
    </div>
    <div
        class="orthozoom"
        class:inactive={!equipped || ev.buttons == 0}
        class:off={!R.has('atk', ev)}
        style="top:{Math.min(rect.y, thumbY)}px; left:{rect.x}px; height:{
        Math.abs(thumbY - rect.y) + rect.height / 2}px; width:{rect.width}px"
        bind:clientWidth={rect.width}
    />
</div>

<slot />

<style>
    .orthozoom {
        width: 4px;
        /* height:400px; */
        position: fixed;
        z-index: 100;
        pointer-events: none;
        outline: 2px solid red;
        /* outline-right: 2px solid red; */
        box-sizing: content-box;
    }

    .machine {
        display: table-cell;
        position: fixed;
        z-index: 100;
        width: 20px;
        height: 20px;
        background-color: white;
        text-align: center;
    }

    .machine:hover {
        background-color: lightgray;
    }

    /* .minus {
        left: -10px;
        top: -10px;
    } */

    .minus::after {
        content: '';
        position: absolute;
        top: 0;
        left: 20px;
        height: 20px;
        width: 20px;
        border: 2px solid white;
        box-sizing: border-box;
        background-color: none;
        pointer-events: none;
        z-index: -200;
    }

    .inactive {
        display: none;
    }

    .ruler {
        position: fixed;
        background-color: red;
        height: 2px;
        width: 100px;
    }
</style>
