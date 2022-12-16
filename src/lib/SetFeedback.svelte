<script>
    export let ev, name;
    let vw;
    let vh;
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh}/>
<div class="infobox" style="top:{ev.y+10}px; left:{ev.x+10}px">
{name}
</div>

<style>
   .infobox{
        width:auto;
        height:20px;
        position:fixed;
        background-color:blue;
        z-index:100;
    }
</style>