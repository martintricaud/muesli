<script>
  //import { scale } from './lib/utils2.ts';
  import { onMount, afterUpdate } from 'svelte';
  import { get } from 'svelte/store';
  import {random_adjunction,muesliStore2, liftSolve, solve} from './lib/stores';
  import { shiftdown_, shiftup_, mouseup_, mousedown_, mousemove_, mouseleave_, mousewheel_, asr, counterMinus_ } from './lib/utils-streams.js';
  import { synth2, preset2, preset2bis } from './lib/data.js';
  import { wasm_functions as W } from './main.js';
  import * as U from './lib/utils';
  import * as S from './lib/utils-streams.js';
  import * as R from 'ramda';
  import * as K from 'kefir';
  import HydraViewer from './lib/HydraViewer.svelte';
  import GrabFeedback from './lib/GrabFeedback.svelte';
  import InfoBox from './lib/InfoBox.svelte';
  import SetFeedback from './lib/SetFeedback.svelte';
  import { prng_alea } from 'esm-seedrandom';

  // BINDINGS FOR DOM ELEMENTS AND THEIR SIZES

  let currentPreset = preset2;
  let presets = [];

  let iw, ih, macro_w, track_w, range_w, thumb_w = 5;
  let zf = 0.2; //Zoom Factor

  let instruments = {
    hold: { equipped: false, component: InfoBox, event: { x: 0 }, feedforward: "willHold" },
    pin: { equipped: false, component: InfoBox, event: { x: 0 }, feedforward: "willPin"},
    eraser: { equipped: false, component: InfoBox, event: { x: 0 }, feedforward: "willErase" },
    grab: { equipped: false, component: GrabFeedback, event: { x: null }, feedforward: "willGrab" },
    set: { equipped: false, component: SetFeedback, event: { x: null }, feedforward: "willSet" },
    none: { equipped: true, component: InfoBox, event: { x: 0 }, feedforward: "willNone" },
  };

  $: equipped = R.keys(R.pickBy((x, key) => x.equipped, instruments))[0];
  $: ff = instruments[equipped].feedforward

  let muesli = muesliStore2(preset2bis);
  $: [H_global,H_local,P,Keys, B] = muesli

  // STREAMS AND THEIR OBSERVERS
  let drag_, cursorInfo_, click_, wheel_, move_, pool_, pool2_, counterPlus_, incrementers, decrementers;
  drag_ = cursorInfo_ = click_ = counterPlus_ = wheel_ = move_ = pool_ = pool2_ = incrementers= decrementers = undefined;

  function save_effect(val) {
    console.log('saved ' + U.smallestPresetAvailable(R.pluck(['name'], presets)));
    presets = R.append({name: U.smallestPresetAvailable(R.pluck(['name'], presets)),
        data: {},
        H_global: '',
        H_local: '',
      },
      presets
    );
  }

  function feedback(e) {
    instruments[equipped]['event'] = e;
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
    instruments = R.mapObjIndexed(
      (x, k) => R.modify('equipped', k == name ? R.not : R.F, x), instruments );
  }

  function click_effect(atk){
    if(equipped == "eraser"){  
      muesli?.[atk.target.dataset?.store]?.update(R.omit([atk.target.dataset?.key]))
      //todo: replace with R.dissocPath(['a', 'b', 'c'], {a: {b: {c: 42}}})
    }
    else if(equipped == "lock"){}
    
  }

  function drag_effect({ atk, sus }) {
    const [store, key, field] = [atk.target.dataset?.store, atk.target.dataset?.key, atk.target.dataset?.field]
    let f
    if(store == 0 || store ==1){
      f = U.add(U.scale([0, track_w], ['0', U.fMAX_H(32, 20)])(sus.movementX))
    }
    if(store == 2){
      let f0 = U.add(U.scale([0, track_w], [$P[key].c0,$P[key].c1])(sus.movementX))
      f = liftSolve(solve, $P, U.deepObjOf([key,field],f0))
    }
    muesli?.[store]?.update(f)
  }

  function shiftdown_effect(val) {
    document.body.style.setProperty('overflow', 'hidden');
    document.getElementById('all-sliders').style.setProperty('overflow', 'hidden');
  }

  function shiftup_effect(val) {
    document.getElementById('all-sliders').style.setProperty('overflow', 'scroll');
  }

  function wheel_effect({atk,sus}) {
    let curr = R.clamp(
      0.0000001, 1, zf + U.scale([0, ih * 100], [0.0000001, 1])(sus.wheelDeltaY));
    let f = x=>curr/zf*x
    muesli[2].update(liftSolve(solve, $P, R.map(R.always(R.objOf('z',f)),$P)))
    zf = curr
  }

  let hit_;

  onMount(() => {
    pool_ = K.pool().plug(S.mouseup_);
    R.forEach(el => pool_.plug(S.mouseleave_(el)), document.getElementsByClassName('plus'))
    incrementers = R.map(el=> S.counterPlus_(el, pool_), document.getElementsByClassName('plus'))
    R.forEach(el => pool_.plug(S.mouseleave_(el)), document.getElementsByClassName('minus'))
    decrementers = R.map(el=> S.counterPlus_(el, pool_), document.getElementsByClassName('minus'))

    move_ = mousemove_.thru(S.obs(feedback));

    shiftdown_.thru(S.obs(shiftdown_effect));
    shiftup_.thru(S.obs(shiftup_effect));
    wheel_ = 
      S.asr(S.capture(zf,shiftdown_), mousewheel_, shiftup_)
        .thru(S.obs(wheel_effect));
    drag_ = asr(
      mousedown_,
      K.merge([move_, K.merge(incrementers)]),
      mouseup_
    )
      .thru(S.obs(drag_effect))
      .thru(S.obs(feedback));
    hit_ = mousedown_.map((e) => R.assoc('targets', document.elementsFromPoint(e.x, e.y), e));
  });
</script>

<svelte:window bind:innerHeight={ih} bind:innerWidth={iw}/>
<main>
  {#each Object.entries(instruments) as [name, { equipped, component, event }]}
      <svelte:component this={component} {equipped} {event} {name} />
  {/each}
  <div class="menu">
    <div class="instrument-palette">
      {#each Object.entries(instruments) as [name, {equipped}]}
        <button class:equipped on:click={() => equip_effect(name)}>{name}</button>
      {/each}
    </div>
    <div class="presets">
      <button on:click={save_effect}>save</button>
      {#if presets.length > 0}
        {#each presets as { name, data, h0, h1 }}
          <span class="preset {ff}">{name}</span>
        {/each}
      {/if}
    </div>
  </div>
  <div class="app">
    <div class="ui">
      <div class="slider-container" id="macro-sliders">
        <div class="slider">
          <div class="param-name">Macro #2 (Global exploration)</div>
          <div class="track" bind:clientWidth={macro_w}>
            <div
              data-store=0
              data-key='h'
              data-field="b"
              class="thumb"
              style="left:{W.rescale_index($H_global, 32, 20) * macro_w}px; width:{thumb_w}px"
            />
          </div>
        </div>
        <div class="slider">
          <div class="param-name">Macro #2 (Local exploration)</div>
          <div class="track">
            <div
              data-store=1 data-key='h' data-field="a" class="thumb"
              style="left:{W.rescale_index($H_local, 32, 20) * macro_w}px; width:{thumb_w}px"
            />
          </div>
        </div>
      </div>
      <div class="slider-container" id="all-sliders">
        <!-- The list of individual sliders is generated by iterating over the store containing sliders data-->
        {#each Object.entries($P) as [key, p]}
          <div class="slider {ff}" on:click={click_effect} data-key={key} data-store=2>
            <div class="param-name {ff}" data-key={key} data-store=2>{key}</div>
            <div class="track" bind:clientWidth={track_w}>
              <div data-store=2 data-key={key} data-field="b" class="range"
                style="width:{(track_w * p.z) / (p.c1 - p.c0)}px; 
                  left:{(track_w * (p.b-p.z / 2 - p.c0))/(p.c1-p.c0)}px;"
                bind:clientWidth={range_w}
              />
              <div class="middle" 
                style="width:{2}px; left:{(track_w * (p.b - p.c0)) /(p.c1 - p.c0)}px;"
              />
              <div data-store=2 data-key={key} data-field="a"  class="thumb"
                style="left:{(track_w * (p.a - p.c0))/(p.c1 - p.c0)}px; width:{thumb_w}px"
                bind:clientWidth={thumb_w}
              />
            </div>
            <div class="bound c0">{p.c0}</div>
            <div class="bound c1">{p.c1}</div>
          </div>
        {/each}
      </div>
      <div class="viewport">
        <!-- <HydraViewer synth={synth2} data={$t_data[0]} w={1200} h={1000}/> -->
      </div>
    </div>
  </div>
</main>

<style>
  div > p {
    overflow-y: hidden;
    max-width: 100%;
  }
  .container {
    background-color: rgba(0, 0, 0, 0);
  }
  .equipped {
    filter: contrast(50%) saturate(50%) opacity(70%);
  }
  .locked {
    filter: contrast(50%) saturate(50%) opacity(70%);
  }
  .preview {
    filter: brightness(120%) hue-rotate(60deg);
  }

  .inactive {
    display: none;
  }
  
  .willErase{}

  .willErase:hover{
    background-color: rgba(255,0,0,0.2);
    filter:brightness(150%) saturate(70%);
    border: 3px solid red;
    box-sizing: content-box;
  }

  .willSet{
    
  }
  .willSet:hover{
    background-color: rgba(0,0,255,0.2);
    filter:brightness(150%) saturate(70%);
    border: 3px solid blue;
    box-sizing: content-box;
  }
</style>
