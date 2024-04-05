<script>
    import { afterUpdate, createEventDispatcher } from 'svelte';
    import { EventStore } from '../lib/UIState';
    import * as R from 'ramda';
    export let name, equipped;
    let val;
    const dispatch = createEventDispatcher();
    $: dispatchDetails = R.assoc('setterValue',val,$EventStore)
    afterUpdate(() => {
        equipped
            ? document.getElementById('setter').focus()
            : document.getElementById('setter').blur();
    });

</script>

<svelte:window 

    on:click={(e) => equipped ? dispatch('effect', dispatchDetails):e}
/>
<div class="infobox instrument" class:inactive={!equipped} style="top:{$EventStore.y + 10}px; left:{$EventStore.x + 10}px">
    <div>set to</div>
    <span>val &#9654 </span><input id="setter" class:focused={equipped} type="number"  bind:value={val}/>
</div>

<style>
</style>
