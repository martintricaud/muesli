<script>
    import {createEventDispatcher} from 'svelte';
    export let event, name, equipped;
    let vw, vh;
    const dispatch = createEventDispatcher();
    $: ()=>dispatch('effect', {})
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh}/>
<div class="infobox instrument" class:inactive={!equipped} style="top:{event.y+20}px; left:{event.x+20}px">
{name}
</div>

<style>
.inactive{
    display:none
}
</style>