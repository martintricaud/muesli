<script>
    import { afterUpdate } from 'svelte';
    export let event, name, equipped;
    let vw;
    let vh;
    afterUpdate(() => {
        equipped
            ? document.getElementById('setter').focus()
            : document.getElementById('setter').blur();
    });
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh} />
<div class="infobox instrument" class:inactive={!equipped} style="top:{event.y + 10}px; left:{event.x + 10}px">
    <div>set to</div>
    <input id="setter" class:focused={equipped} type="number" />
</div>

<style>
    .infobox {
        width: auto; 
        /* 
        height: 20px;
        position: fixed;
        background-color: white;
        z-index: 100; */
    }
    #setter {
        width: auto;
        box-sizing: border-box;
        padding: 0 1ex;
    }

    .inactive{
        display:none
    }
</style>
