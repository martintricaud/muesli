<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import * as R from 'ramda';
    import * as K from 'kefir';
    import * as S from './utils-streams';
    import * as U from './utils';
    let vw, vh;
    export let ev, name, equipped;
    let trackH, thumbH, trackW;
    let isPlus_ = undefined;
    let holdclick_ = undefined
    const dispatch = createEventDispatcher();

    $: attack = ev.atk ?? ev;
    $: target = attack?.target;
    $: oz = {
        x: target?.getBoundingClientRect().left ?? attack.x, // + (target?.offsetWidth??0)/2,
        y: target?.getBoundingClientRect().top ?? attack.y + (target?.getBoundingClientRect()?.height??0)/2,
        w: target?.clientWidth??4,
        h: target?.clientHeight??0
    }
    // $: trackX = R.clamp(0, 500, ev.x);
    $: trackX = ev.x
    $: thumbY = R.clamp(attack.y - 400, attack.y + 400, ev.y) - 10;
    $: delta = U.lerp(0, 400, 1, 100, Math.abs(thumbY - attack.y));
    
    $: dispatch(
        'effect',
        R.modify('movementX', (x) => x / delta, ev)
    );

    onMount(() => {
        isPlus_ = S.mousemove_.map(x=>x?.target.classList.contains('plus'));
        holdclick_ = S.asr(S.mousedown_,K.interval(10,{movementX:delta}),S.mouseup_).filterBy(isPlus_);
    });
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh} />
<div class="instrument">
    <div
    class="orthozoom"
    class:inactive={!equipped || ev.buttons == 0}
    class:off={!R.has('atk', ev)}
    style="top:{Math.min(oz.y, thumbY)}px; left:{oz.x-2}px; height:{Math.abs(thumbY - oz.y) + oz.h/2}px; width:{oz.w}px"
    bind:clientWidth={trackW}
/>

<div
    id="plus"
    class="plus machine"
    class:inactive={!equipped}
    style="top:{thumbY}px; left:{trackX + 10}px;"
>
    +
</div>
<div class="minus machine" class:inactive={!equipped} style="top:{thumbY}px; left:{trackX - 30}px;">
    -
</div>

</div>

<slot />

<style>
    .orthozoom {
        width: 4px;
        /* height:400px; */
        position: fixed;
        z-index: 100;
        pointer-events: none;
        border-left:2px solid red;
        border-right:2px solid red;
        box-sizing: content-box;
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

    .off {
        /* height:20px; */
    }
</style>
