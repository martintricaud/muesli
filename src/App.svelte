<script lang ts>
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import { random_adjunction, MuesliStore, liftSolve, solve, PresetStore } from './lib/stores';
  import {
    shiftdown_,
    shiftup_,
    mouseup_,
    mousedown_,
    mousemove_,
    mousewheel_,
    asr,
  } from './lib/utils-streams.js';
  import { synth2, preset2, preset2bis } from './lib/data';
  import { wasm_functions as W } from './main.js';
  import * as U from './lib/utils';
  import * as S from './lib/utils-streams.js';
  import * as R from 'ramda';
  import * as K from 'kefir';
  import HydraViewer from './lib/HydraViewer.svelte';
  import Grab from './lib/Grab.svelte';
  import Info from './lib/Info.svelte';
  import SetFeedback from './lib/SetFeedback.svelte';
  import { prng_alea } from 'esm-seedrandom';

  // BINDINGS FOR DOM ELEMENTS AND THEIR SIZES

  let iw, ih, macro_w, track_w, range_w, thumb_w = 5;
  let fooWidth;
  let hidden;

  let instruments = {
    hold: {name: "hold", equipped: false, component: Info, event: {foo:null}, feedforward: 'willHold' },
    pin: {name: "pin", equipped: false, component: Info, event: {foo:null}, feedforward: 'willPin' },
    eraser: {name: "erase", equipped: false, component: Info, event: {foo:null}, feedforward: 'willErase', effect: R.omit,},
    grab: {name: "grab", equipped: false, component: Grab, event: {foo:null}, feedforward: 'willGrab', effect: drag_effect,},
    cursor: {name:"none", equipped: true, component: Info, event: {foo:null}, feedforward: 'willNone' },
    set: {name:"set", equipped: false, component: SetFeedback, event: {foo:null}, feedforward: 'willSet' },
  };

  //reactive value that returns the name of the currently equipped instrument
  $: equipped = R.keys(R.pickBy((x, key) => x.equipped, instruments))[0];
  $: console.log(instruments[equipped])
  $: cursor = [instruments[equipped]?.event?.x,instruments[equipped].event?.y]
  //$: console.log(cursor)
  $: feedforward = instruments[equipped].feedforward;

  const presets = PresetStore([
    {
      name: 'preset0',
      ranges: preset2bis,
      h_global: W.bigint_prod(0.1, U.fMAX_H(32, 19), 100),
      h_local: W.bigint_prod(0.5, U.fMAX_H(32, 19), 100),
      z: 1,
    },
  ]);
  //presetFocus defines the preset of parameters currently loaded
  //zf is the zoom factor
  const [presetFocus, zf] = [writable(0), writable(1)];
  const muesli = [...MuesliStore($presets[$presetFocus])];
  $: [H_global, H_local, P, Keys, B] = muesli;
  $: data_c0c1z = R.toPairs(R.map(R.pick(['c0', 'c1', 'z']), $P));
  $: data_a = R.pluck('a', $P);

  // STREAMS AND THEIR OBSERVERS
  let drag_,
    cursorInfo_,
    click_,
    wheel_,
    move_,
    pool_,
    pool2_,
    counterPlus_,
    incrementers,
    decrementers,
    effect;
  drag_ =
    cursorInfo_ =
    click_ =
    counterPlus_ =
    wheel_ =
    move_ =
    pool_ =
    pool2_ =
    incrementers =
    decrementers =
    effect =
      undefined;

  function log_effect(val) {
    console.log(val.detail(1));
  }

  function drag_effect(event) {
    let e = event.detail;
    if (e.atk) {
      const store = e.atk.target.dataset?.store;
      const [key, field] = U.stringToPath(e.atk.target.dataset.path);
      let f;
      if (store == 0 || store == 1) {
        f = U.add(U.scale(0, track_w, '0', U.fMAX_H($B, 19), e.movementX));
      }
      if (store == 2) {
        let f0 = U.add(U.scale(0, track_w, $P[key].c0, $P[key].c1, e.movementX));
        f = liftSolve(solve, U.deepObjOf([key, field], f0));
      }
      muesli?.[store]?.update(f);
    }
  }

  function save_effect(val) {
    presets.add(val);
  }

  function feedback(e) {
    //console.log(e)
    instruments[equipped] = R.assoc('event', e, instruments[equipped]);
  }

  function handleClick(lock, k) {
    // if (instruments[0].equipped) {
    //   let val
    //   if (lock == 'Lr') {
    //     val =$r_data[0][k];
    //   } else if (lock == 'Lt') {
    //   val = $t_data[0][k];
    //   }
    //   data = R.assocPath([k, lock], x=>val, data);
    // }
  }

  // EFFECTFUL FUNCTIONS - modify reactive values, can be thought of has handlers

  function equip_effect(name) {
    console.log("before "+ instruments[equipped].name + " | " + instruments[equipped].event )
    instruments = R.mapObjIndexed(
      (x, k) => R.modify('equipped', k == name ? R.not : R.F, x),
      instruments
    );
    console.log("after "+ instruments[equipped].name + " | " + instruments[equipped].event )
  }

  function equip_effect2(name) {
    console.log("before "+ instruments[equipped].name + " | " + instruments[equipped].event )
    instruments = R.mapObjIndexed(
      (x, k) => R.modify('equipped', k == name ? R.T : R.F, x),
      instruments
    );
    console.log("after "+ instruments[equipped].name + " | " + instruments[equipped].event )
  }

  function click_effect(e) {
    let target = e.target;
    if (equipped == 'eraser') {
      target.classList.contains('erasable')
        ? muesli?.[target.dataset?.store]?.update(R.omit(U.stringToPath(target.dataset?.path)))
        : console.log('nothing to erase');
    } else if (equipped == 'lock') {
    }
  }
  // function click_effect(atk:Event){
  //   let target = atk.target as HTMLElement
  //   if(equipped == "eraser"){
  //     target.classList.contains('erasable') ?
  //     muesli?.[target.dataset?.store]?.update(R.omit(U.stringToPath(target.dataset?.path))) :
  //     console.log("nothing to erase")
  //   }
  //   else if(equipped == "lock"){}
  // }

  function load_effect(i) {
    presetFocus.set(i);
    muesli[0].set($presets[i].h_global);
    muesli[1].set($presets[i].h_local);
    muesli[2].set(R.fromPairs($presets[i].ranges));
  }

  // function drag_effect(e) {
  //   const store = e.atk.target.dataset?.store;
  //   const [key, field] = U.stringToPath(e.atk.target.dataset.path);
  //   let f;
  //   if (store == 0 || store == 1) {
  //     f = U.add(U.scale(0, track_w, '0', U.fMAX_H($B, 19), e.movementX));
  //   }
  //   if (store == 2) {
  //     let f0 = U.add(U.scale(0, track_w, $P[key].c0, $P[key].c1, e.movementX));
  //     f = liftSolve(solve, U.deepObjOf([key, field], f0));
  //   }
  //   muesli?.[store]?.update(f);
  // }

  function shiftdown_effect(val) {
    document.body.style.setProperty('overflow', 'hidden');
    document.getElementById('all-sliders').style.setProperty('overflow', 'hidden');
  }

  function shiftup_effect(val) {
    document.getElementById('all-sliders').style.setProperty('overflow', 'scroll');
  }

  function wheel_effect(e) {
    let curr = R.clamp(0.0000001, 1, $zf + U.scale(0, ih * 100, 0.0000001, 1, e.wheelDeltaY));
    let f = (x) => (curr / $zf) * x;
    muesli[2].update(liftSolve(solve, R.map(R.always(R.objOf('z', f)), $P)));
    zf.set(curr);
  }

  let hit_;

  onMount(() => {
    S.keydown_(' ').thru(S.obs(x=>hidden=true))
    pool_ = K.pool().plug(S.mouseup_);
    R.forEach((el) => pool_.plug(S.mouseleave_(el)), document.getElementsByClassName('plus'));
    incrementers = R.map(
      (el) => S.counterPlus_(el, pool_),
      document.getElementsByClassName('plus')
    );
    R.forEach((el) => pool_.plug(S.mouseleave_(el)), document.getElementsByClassName('minus'));
    decrementers = R.map(
      (el) => S.counterPlus_(el, pool_),
      document.getElementsByClassName('minus')
    );

    move_ = mousemove_.thru(S.obs(feedback))

    shiftdown_.thru(S.obs(shiftdown_effect));
    shiftup_.thru(S.obs(shiftup_effect));
    wheel_ = S.asr(S.capture($zf, shiftdown_), mousewheel_, shiftup_).thru(S.obs(wheel_effect));
    drag_ = asr(mousedown_, move_, mouseup_).thru(S.obs(feedback)); //.thru(S.obs(drag_effect))
    // drag_ = asr(
    //   mousedown_,
    //   K.merge([move_, K.merge(incrementers)]),
    //   mouseup_
    // )
    // .thru(S.obs(feedback))
    // .thru(S.obs(drag_effect))

    hit_ = mousedown_.map((e) => R.assoc('targets', document.elementsFromPoint(e.x, e.y), e));
  });
</script>

<svelte:window bind:innerHeight={ih} bind:innerWidth={iw} />
<main>
  <!-- <div class="instrument-2" style="left:{cursor[0]-fooWidth/2}px; top:{cursor[1]-40}px" bind:clientWidth={fooWidth}>
    <div style="width:20px; background-color:aqua; height: 20px"></div>
    <div style="width:20px; background-color:aqua; height: 20px"></div>
    <div style="width:20px; background-color:aqua; height: 20px"></div>
  </div> -->
  <div class:hidden={!hidden} class="instrument-2" style="left:{cursor[0]-fooWidth/2}px; top:{cursor[1]}px" bind:clientWidth={fooWidth}>
    {#each Object.entries(instruments) as [name, { equipped }]}
        <div class:equipped on:mouseenter={() => equip_effect2(name)}>{name}</div>
      {/each}
  </div>
  {#each Object.entries(instruments) as [name, { equipped, component, event, effect }]}
    <svelte:component this={component} {equipped} {event} {name} on:effect={effect} />
  {/each}
  <div class="menu">
    <!-- <div>
      {#each Object.entries(instruments) as [name, { equipped }]}
        <button class:equipped on:click={() => equip_effect(name)}>{name}</button>
      {/each}
    </div> -->
    <div class="presets">
      <button
        data-path=""
        on:click={() =>
          save_effect({ ranges: data_c0c1z, h_global: $H_global, h_local: $H_local, z: $zf })}
        >save</button
      >
      {#if $presets.length > 0}
        {#each $presets as { name }, i}
          <span class="preset erasable {feedforward}" on:click={() => load_effect(i)}>{name}</span>
        {/each}
      {/if}
    </div>
  </div>
  <div class="app">
    <div class="ui">
      <div class="slider-container" id="macro-sliders">
        <div class="slider macro">
          <div class="param-name">Macro #2 (Global exploration)</div>
          <div class="track" bind:clientWidth={macro_w}>
            <div
              class="thumb draggable"
              data-store="0"
              data-path="h b"
              style="left:{W.rescale_index($H_global, $B, 19) * macro_w}px; width:{thumb_w}px"
            />
          </div>
        </div>
        <div class="slider macro">
          <div class="param-name">Macro #2 (Local exploration)</div>
          <div class="track">
            <div
              data-store="1"
              data-path="h a"
              class="thumb draggable"
              style="left:{W.rescale_index($H_local, $B, 19) * macro_w}px; width:{thumb_w}px"
            />
          </div>
        </div>
      </div>
      <div class="slider-container" id="all-sliders">
        <!-- The list of individual sliders is generated by iterating over the store containing sliders data-->
        {#each Object.entries($P) as [key, { a, b, c0, c1, z }]}
          <div
            class="slider erasable {feedforward}"
            on:click={click_effect}
            data-path={key}
            data-store="2"
          >
            <div class="param-name {feedforward}" data-store="2">{key}</div>
            <div class="bound c0">{c0}</div>
            <div class="track" bind:clientWidth={track_w}>
              <div
                data-store="2"
                data-path="{key} b"
                class="range draggable"
                style="width:{(track_w * z) / (c1 - c0)}px; 
                  left:{(track_w * (b - z / 2 - c0)) / (c1 - c0)}px;"
                bind:clientWidth={range_w}
              />
              <div class="middle" style="width:{2}px; left:{U.scale(c0, c1, 0, track_w, b)}px;" />
              <div
                data-store="2"
                data-path="{key} a"
                class="thumb draggable"
                style="left:{U.scale(c0, c1, 0, track_w, a)}px; width:{thumb_w}px"
                bind:clientWidth={thumb_w}
              />
            </div>
            <div class="bound c1">{c1}</div>
          </div>
        {/each}
      </div>
      <div class="viewport">
        <HydraViewer synth={synth2} data={data_a} w={1200} h={1000} />
      </div>
    </div>
  </div>
</main>
