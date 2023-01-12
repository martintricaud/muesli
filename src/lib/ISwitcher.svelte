<script>
    import {createEventDispatcher} from 'svelte';
    export let ev, name, equipped;
    let vw, vh;
    const dispatch = createEventDispatcher();
    $: ()=>dispatch('effect', {...ev})
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh}/>
<div class="infobox instrument" class:inactive={!equipped} style="top:{ev.y+20}px; left:{ev.x+20}px">
<slot></slot>
{name}
</div>

<style>
</style>