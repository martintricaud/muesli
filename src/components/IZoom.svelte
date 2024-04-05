<script>
    import { createEventDispatcher } from 'svelte';
    import { EventStore, UIOptions } from '../lib/UIState';
    import { writable, get, derived } from 'svelte/store';
    export let name, equipped;
    import * as R from 'ramda';
    import { onMount } from 'svelte';
    import * as vec from '../lib/vec';

    const dispatch = createEventDispatcher();
    // let shiftDown = writable(false);

    $: altDown = $UIOptions.noscroll;
    $: console.log(altDown);
    $: if (altDown) {
        console.log($EventStore)
        dispatch('effect', $EventStore);
    }


    /** Initialize a lever made of three points with alignment constraints */

    $: if (equipped) {
        // dispatch('effect', $EventStore);
    }
    $: onMount(() => {});
</script>

<svelte:window
/>
<div
    class="infobox instrument"
    class:inactive={!equipped}
    style="top:{$EventStore.y + 20}px; left:{$EventStore.x + 20}px"
>
    {name}
</div>

<style>
</style>
