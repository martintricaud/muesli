<script>
    import {createEventDispatcher} from 'svelte';
    import { EventStore } from '../lib/EventStore';
    export let ev, name, equipped;
    const dispatch = createEventDispatcher();
    $: ()=>dispatch('effect', $EventStore)
</script>

<!-- <svelte:window bind:innerWidth={vw} bind:innerHeight={vh}/> -->
<div class="infobox instrument" class:inactive={!equipped} style="top:{$EventStore.y+20}px; left:{$EventStore.x+20}px">
{name}
</div>

<style>

</style>