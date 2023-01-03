<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import * as R from 'ramda';
    import * as K from 'kefir';
    import * as S from './utils-streams.js';
    import * as U from './utils';
    let vw, vh;
    export let event, name, equipped;
    let E

    let trackH, thumbH, trackW
    let drag_ = undefined
    let counterPlus_ = undefined;
    let pool_ = undefined;
    let incrementers = undefined;
    let decrementers = undefined;
    const dispatch = createEventDispatcher();
    $: attack = event.atk??event
    $: trackX = R.clamp(0,500,event.x)
    $: thumbY = R.clamp(attack.y-400, attack.y + 400, event.y) - 10
    $: delta = U.lerp(0,400,0,25,Math.abs(thumbY-attack.y))

    $: dispatch('effect', R.modify('movementX',x=>x,event));

    onMount(() => {
        pool_ = K.pool().plug(S.mouseup_);
        R.forEach((el) => pool_.plug(S.mouseleave_(el)), document.getElementsByClassName('plus'));
        // incrementers = R.map(
        //     (el) => S.counterPlus_(el, pool_),
        //     document.getElementsByClassName('plus')
        // );
        incrementers = R.map(
            (el) => S.whileOn(el, 10),
            document.getElementsByClassName('plus')
        );
        // R.forEach((ev) => ev.log(),incrementers);
        R.forEach((el) => pool_.plug(S.mouseleave_(el)), document.getElementsByClassName('minus'));
        decrementers = R.map(
            (el) => S.counterPlus_(el, pool_),
            document.getElementsByClassName('minus')
        );
        drag_ = S.asr(S.mousedown_, K.merge([S.mousemove_, K.merge(incrementers)]),S.mouseup_).log()
    });
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh} />
<div
    class="orthozoom"
    class:inactive={!equipped} class:off={!R.has('atk', event)}
    style="top:{Math.min(attack.y, thumbY)}px; left:{trackX - 10}px; height:{Math.abs(thumbY-attack.y)}px" bind:clientWidth={trackW}
/>

<div class="plus machine" class:inactive={!equipped} style="top:{thumbY}px; left:{trackX + 10}px;">+</div>
<div class="minus machine" class:inactive={!equipped} style="top:{thumbY}px; left:{trackX - 30}px;">
    -
</div>

<slot />

<style>
    .orthozoom {
        width: 20px;
        /* height:400px; */
        position: fixed;
        z-index: 100;
        pointer-events: none;
        background-color: red;
     
    }

    .machine {
        display: table-cell;
        position: fixed;
        z-index: 100;
        width: 20px;
        height: 20px;
        background-color: white;
        text-align: center;
    }

    .machine:hover {
        background-color: lightgray;
    }

    .minus {
        left: -10px;
        top: -10px;
    }

    .minus::after {
        content: '';
        position: absolute;
        top: 0;
        left: 20px;
        height: 20px;
        width: 20px;
        border: 2px solid white;
        box-sizing: border-box;
        background-color: none;
        /* box-shadow: 5px 5px 0px 1px rgba(0, 0, 140, 0.4); */
        pointer-events: none;
        background-color: red;
        z-index: -200;
    }

    .inactive {
        display: none;
    }

    .off{
        /* height:20px; */
      
    }
</style>
