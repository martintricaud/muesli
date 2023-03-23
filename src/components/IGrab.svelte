<script>
    import { createEventDispatcher } from 'svelte';
    import * as R from 'ramda';
    import { writable } from 'svelte/store';
    export let ev, name, equipped;


    //dispatcher that will make the instrument "observable"
    const dispatch = createEventDispatcher();

    let deltaY = writable(0);

    let intervalId = null;

    //clock value to be updated by timed counters
    let clock = writable(0);
    //starts a timed counter that updates an external clock value
    function startEdgeScroll(step) {
        intervalId = setInterval(() => {
            clock.update((x) => x + step);
        }, 50);
    }

    //stops and external clock value
    function stopEdgeScroll(ev) {
        clock.set(0);
        clearInterval(intervalId);
    }

    $: [attack, target] = [ev.atk ?? ev, attack?.target];
    $: trackX = R.clamp(attack.x - 200, attack.x + 200, ev.x);
    $: thumbY = R.clamp(attack.y - 400, attack.y + 400, ev.y) - 10;
    $: $deltaY = Math.abs(thumbY - attack.y);
    $: newEv = $clock != 0
            ? R.assoc('movementXModifier', (f)=>(x) => Math.sign($clock) / 10**f(Math.floor($deltaY/50)), ev)
            : R.assoc('movementXModifier', (f)=>(x) => x/10**f(Math.floor($deltaY/50)), ev);
    $: rect = newEv?.atk?.target?.getBoundingClientRect() ?? {
        x: attack.x+1,
        y: attack.y,
        width: 4,
        height: 0,
    };
    $: dispatch('effect', newEv);
</script>


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
