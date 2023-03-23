<script>
    import { createEventDispatcher } from 'svelte';
    import * as R from 'ramda';
    import { AlignmentStore } from '../lib/LeverStore';
    import { EventStore } from '../lib/EventStore';
    import { onMount } from 'svelte';
    export let ev, name, equipped;

    //dispatcher that will make the instrument "observable"
    //function isMovable = R.filter(val=>val.dataset)
    const dispatch = createEventDispatcher();
    const [A, B, C, Target] = AlignmentStore(
        { x: 0, y: 0, },
        { x: 0, y: 0 - 10, },
        { x: 0, y: 0 - 50, }
    );

    $: A.set(R.pick(['x', 'y', 'movementX', 'movementY'], $EventStore));

    $: effectValue = {
        targetPath: $Target?.dataset?.path,
        targetStore: $Target?.dataset?.store,
        cursorValue: $B,
    };

    $: if ($Target != undefined) {
        if (equipped) {
            dispatch('effect', R.mergeRight(ev, effectValue));
        } else {
            dispatch('effect', R.mergeRight(ev, effectValue));
        }
    }
    onMount(() => {});
</script>

<svelte:window
    on:mousedown={(ev) => {
        B.set(true);
    }}
    on:mouseup={(ev) => {
        B.set(false);
    }}
    on:keydown={(ev) => {
        if (ev.shiftKey) {
            C.set(true);
        }
    }}
    on:keyup={(ev) => {
        if (!ev.shiftKey) {
            C.set(false);
        }
    }}
/>

<!-- <svg class:inactive={!equipped} style="position:absolute; top:0; left:0" width="100vw" height="100vh">
    <rect width="100%" height="100%" stroke="red" fill="none" />
    <line x1="{$C.x}px" y1="{$C.y}px" x2="{$A.x}px" y2="{$A.y}px" stroke="black" />
</svg> -->
<div
    class:inactive={!equipped}
    class="round red"
    style="left:{$A.x}px; top:{$A.y}px; position:fixed; "
/>
<div
    class:inactive={!equipped}
    class="round green"
    style="left:{$B.x}px; top:{$B.y}px; position:fixed; "
/>
<div
    class:inactive={!equipped}
    class="round blue"
    style="left:{$C.x}px; top:{$C.y}px; position:fixed;  "
/>


<style>
    .round:after {
        position: absolute;
        top: -3px;
        left: -3px;
        width: 6px;
        height: 6px;
        border-radius: 3px;
        background-color: white;
    }
    .red:after {
        content: 'A';
        border: 1px solid red;
    }
    .green:after {
        content: 'B';
        border: 1px solid green;
    }
    .blue:after {
        content: 'C';
        border: 1px solid blue;
    }
</style>
