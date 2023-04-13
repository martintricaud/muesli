<script>
    import { createEventDispatcher } from 'svelte';
    import * as R from 'ramda';
    import { AlignmentStore } from '../lib/storesFactories';
    import { EventStore } from '../lib/UIState';
    import { onMount } from 'svelte';
    export let ev, name, equipped;
    import * as vec from '../lib/vec'

    //dispatcher that will make the instrument "observable"
    //function isMovable = R.filter(val=>val.dataset)
    const dispatch = createEventDispatcher();

    /** Initialize a lever made of three points with alignment constraints */
    const [P1, P2, P3, Target] = AlignmentStore(
        { x: 0, y: 0, movementX: 0, movementY: 0 },
        { x: 0, y: 0 - 10, movementX: 0, movementY: 0, mXPrev: 0 },
        { x: 0, y: 0 - 50, movementX: 0, movementY: 0 }
    );

    /** P1 is constrained by the main EventStore, i.e. it is updated at every movement of the mouse*/
    $: P1.set(R.pick(['x', 'y', 'movementX', 'movementY'], $EventStore));

    $: effectValue = {
        targetPath: $Target?.elem?.dataset?.path,
        targetStore: $Target?.elem?.dataset?.store,
        offset: $Target?.offset,
        P2: $P2,
    };


    $: if ($Target != undefined) {
        if (equipped) {
            dispatch('effect', R.mergeRight($EventStore, effectValue));
        } else {
            dispatch('effect', R.mergeRight($EventStore, effectValue));
        }
    }
    onMount(() => {});
</script>

<svelte:window
    on:mousedown={(ev) => {
        P2.set(true);
    }}
    on:mouseup={(ev) => {
        P2.set(false);
    }}
    on:keydown={(ev) => {
        if (ev.shiftKey) {
            P3.set(true);
        }
    }}
    on:keyup={(ev) => {
        if (!ev.shiftKey) {
            P3.set(false);
        }
    }}
/>

<!-- <svg
    class:inactive={!equipped}
    style="position:absolute; top:0; left:0"
    width="100vw"
    height="100vh"
>
    <rect width="100%" height="100%" stroke="red" fill="none" />
    <line x1="{$P3.x}px" y1="{$P3.y}px" x2="{$P1.x}px" y2="{$P1.y}px" stroke="black" />
</svg> -->
<div
    class:inactive={!equipped}
    class="round red"
    style="left:{$P1.x}px; top:{$P1.y}px; position:fixed; "
/>
<div
    class:inactive={!equipped}
    class="round green"
    style="left:{$P2.x}px; top:{$P2.y}px; position:fixed; "
/>
<div
    class:inactive={!equipped}
    class="round blue"
    style="left:{$P3.x}px; top:{$P3.y}px; position:fixed;  "
/>

<style>
    .round:after {
        position: absolute;
        top: -4px;
        left: -4px;
        width: 8px;
        height: 8px;
        border-radius: 6px;
        background-color: white;
    }
    .red:after {
        content: 'P1';
        border: 1px solid black;
    }
    .green:after {
        content: 'P2';
        border: 1px solid black;
    }
    .blue:after {
        content: 'P3';
        border: 1px solid black;
    }
</style>
