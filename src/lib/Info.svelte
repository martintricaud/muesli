<script>
    import {createEventDispatcher} from 'svelte';
    export let ev, name, equipped;
    const dispatch = createEventDispatcher();
    $: ()=>dispatch('effect', {})
</script>

<div class="infobox instrument" class:inactive={!equipped} style="top:{ev.y+20}px; left:{ev.x+20}px">
{name}
</div>

<style>

</style>