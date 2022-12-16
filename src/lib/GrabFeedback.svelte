<script>
    import { onMount, afterUpdate, beforeUpdate } from 'svelte';
    import * as R from 'ramda';
    let vw, vh
    export let ev, name
    let [trackW, thumbH] = [20,20]
    $: [trackX, trackY, trackH] = R.has('atk')(ev) ? 
        [R.clamp(0,500,ev.sus.x)+1, R.clamp(0,vh,ev.atk.y - 200)+1, 400] : 
        [R.clamp(0,500,ev.x)+1, ev.y+1,20];
    $: [thumbX, thumbY] = R.has('atk')(ev) ? 
        [trackX+1, R.clamp(trackY,trackY+trackH,ev.sus.y)+1] : 
        [trackX+1, R.clamp(trackY,trackY+trackH,ev.y)+1]
    onMount(() => {
        console.log("GrabFeedback")
    });
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh}/>
<div class="orthozoom" style="top:{trackY}px; left:{trackX}px;  height:{trackH}px;">
    <div class="gauge" style="top:{thumbY}px; left:{thumbX}px;">
       
        
    </div>
    <div class="gaugeAfter plus" id="plus" style="top:{thumbY}px; left:{thumbX + 20}px;">+</div>
    <div class="gaugeBefore minus" style="top:{thumbY}px; left:{thumbX - 20}px;">-</div>
</div>
<slot></slot>

<style>
    .orthozoom{
        width:20px;
        position:fixed;
        background-color:rgba(1,1,1,0.4); 
        z-index:100;
    }

    .gauge{
        position:fixed;
        height:20px;
        width:20px;
        background-color:blue;
    }
  
    .gaugeAfter{
        display:block;
        position: fixed;
        width:20px;
        height:20px;
        /* left:20px; */
        background-color:red;
    }

    .gaugeBefore{
        display:block;
        position: fixed;
        width:20px;
        height:20px; 
        /* left:-20px;
        top:-20px; */
        background-color:red;
    }
</style>
