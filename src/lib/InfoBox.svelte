<script>
	import InfoBox from './InfoBox.svelte';
    import { onMount, afterUpdate, beforeUpdate } from 'svelte';

    // export let color;
    export let ev;
    let vw;
    let vh;
    $: x = ev.x
    beforeUpdate(()=>{
        
    })
    onMount(() => {
        console.log("Infobox")
    });

    afterUpdate(() => {
     
    });
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh}/>
<div class="infobox" style="top:{ev.y+1}px; left:{ev.x+1}px">

</div>
<slot>   "test"</slot>

<style>
   .infobox{
        width:20px;
        height:20px;
        position:fixed;
        background-color:blue;
        z-index:100;
    }
</style>