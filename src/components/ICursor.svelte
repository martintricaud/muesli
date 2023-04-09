<script>
    import { createEventDispatcher } from 'svelte';
    import { EventStore } from '../lib/UIState';
    export let ev, name, equipped;


    const dispatch = createEventDispatcher();
    $: targetList = document
        .elementsFromPoint($EventStore.x, $EventStore.y)
        .filter((x) => x.classList.contains('thumb') || x.classList.contains('range'));

    /** set target to undefined if targetList is empty */
    $: res = targetList.length > 0 ? targetList[0] : undefined;

    $: () => dispatch('effect', {...$EventStore,target:res});
</script>

<!-- <svelte:window bind:innerWidth={vw} bind:innerHeight={vh}/> -->

<!-- <div class="infobox instrument" class:inactive={!equipped} style="top:{$EventStore.y+20}px; left:{$EventStore.x+20}px">
{name}
</div> -->
<style>
</style>
