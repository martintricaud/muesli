<script>
    import { afterUpdate, createEventDispatcher } from 'svelte';
    import * as R from 'ramda';
    export let ev, name, equipped;
    let vw, vh, val;
    const dispatch = createEventDispatcher();
    $: dispatchDetails = R.assoc('setterValue',val,ev)
    afterUpdate(() => {
        equipped
            ? document.getElementById('setter').focus()
            : document.getElementById('setter').blur();
    });

</script>

<svelte:window 
    bind:innerWidth={vw} 
    bind:innerHeight={vh} 
    on:click={(e) => equipped ? dispatch('effect', dispatchDetails):e}
/>
<div class="infobox instrument" class:inactive={!equipped} style="top:{ev.y + 10}px; left:{ev.x + 10}px">
    <div>set to</div>
    <span>val =></span><input id="setter" class:focused={equipped} type="number"  bind:value={val}/>
</div>

<style>
</style>
