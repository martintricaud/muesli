<script>
    import {createEventDispatcher} from 'svelte';
    import { EventStore } from '../lib/UIState';
    export let name, equipped;
    const dispatch = createEventDispatcher();
    $: dispatchDetails = $EventStore
</script>

<svelte:window 
    on:mousedown={(e) => {
        if(equipped){console.log("test")}
        equipped ? dispatch('effect', dispatchDetails):e
    }
    }
/>
<div class="infobox instrument" class:inactive={!equipped} style="top:{$EventStore.y+20}px; left:{$EventStore.x+20}px">
{name}
</div>

<style>

</style>