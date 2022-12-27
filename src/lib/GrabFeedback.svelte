<script>
    import { onMount, afterUpdate, beforeUpdate } from 'svelte';
    import * as R from 'ramda';
    let vw, vh
    export let event, name, equipped
    let [trackW, thumbH] = [20,20]
    $: [trackX, trackY, trackH] = R.has('atk')(event) ? 
        [R.clamp(0,500,event.sus.x), R.clamp(0,vh,event.atk.y - 200 -10), 400] : 
        [R.clamp(0,500,event.x), event.y -10,20];
    $: [thumbX, thumbY] = R.has('atk')(event) ? 
        [trackX, R.clamp(trackY,trackY+trackH,event.sus.y)-10] : 
        [trackX, R.clamp(trackY,trackY+trackH,event.y)-10]
    onMount(() => {
        console.log("GrabFeedback")
    });
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh}/>
<div class="orthozoom" class:inactive={!equipped} style="top:{trackY}px; left:{trackX-10}px;  height:{trackH}px;">
    <!-- <div class="gauge" style="top:{thumbY}px; left:{thumbX}px;"> 
    </div> -->
   
</div>
<div class="plus machine" class:inactive={!equipped} id="plus" style="top:{thumbY}px; left:{thumbX + 10}px;">+</div>
<div class="minus machine" class:inactive={!equipped} style="top:{thumbY}px; left:{thumbX - 30}px;">-</div>
<slot></slot>

<style>
    .orthozoom{
        width:20px;
        position:fixed;
        /* background-color:rgba(1,1,1,0.2);  */
        z-index:100;
        pointer-events: none;
        border: 2px solid white;
    }

    .machine{
        display:table-cell;
        position: fixed;
        z-index: 100;
        width:20px;
        height:20px; 
        background-color:white;
        text-align: center;
    }

    .machine:hover{
        background-color:lightgray;
    }

    .minus{
        left:-10px;
        top:-10px; 
    }

    .minus::after{
        content:"";
        position:absolute;
        top: 0;
        left: 0px;
        height:20px;
        width:60px;
        border: 2px solid white;
        box-sizing: border-box;
        background-color:none;
        box-shadow: 5px 5px 0px 1px rgba(0, 0, 140, .4);
        pointer-events: none;
    }

    

    .inactive{
        display:none
    }
</style>
