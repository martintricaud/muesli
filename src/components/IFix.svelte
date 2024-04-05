<script>
    import {createEventDispatcher} from 'svelte';
    export let ev, name, equipped;
    const dispatch = createEventDispatcher();
    import { EventStore } from '../lib/UIState';
    // $: dispatchDetails = ev
</script>

<svelte:window 
    on:click={(e) => equipped ? dispatch('effect', ev):e}
/>
<div class="infobox instrument" class:inactive={!equipped} style="top:{$EventStore.y+20}px; left:{$EventStore.x+20}px">
{name}
</div>

<style>

</style>