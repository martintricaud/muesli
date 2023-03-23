<script>
    import {createEventDispatcher} from 'svelte';
    export let ev, name, equipped;
    const dispatch = createEventDispatcher();
    $: dispatchDetails = ev
</script>

<svelte:window 

    on:click={(e) => equipped ? dispatch('effect', dispatchDetails):e}
/>
<div class="infobox instrument" class:inactive={!equipped} style="top:{ev.y+20}px; left:{ev.x+20}px">
{name}
</div>

<style>

</style>