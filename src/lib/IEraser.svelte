<script>
    import {createEventDispatcher} from 'svelte';
    export let ev, name, equipped;
    let vw, vh;
    const dispatch = createEventDispatcher();
    $: dispatchDetails = ev
</script>

<svelte:window 
    bind:innerWidth={vw} 
    bind:innerHeight={vh} 
    on:click={(e) => equipped ? dispatch('effect', dispatchDetails):e}
/>
<div class="infobox instrument" class:inactive={!equipped} style="top:{ev.y+20}px; left:{ev.x+20}px">
{name}
</div>

<style>

</style>