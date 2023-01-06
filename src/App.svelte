<script lang ts>
  import { writable, get} from 'svelte/store';
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
  } from './lib/utils-streams';
  import { synth2, preset2, preset2bis } from './lib/data';
  import { wasm_functions as W } from './main.js';
  import * as U from './lib/utils';
  import * as S from './lib/utils-streams';
  import * as R from 'ramda';
  import * as K from 'kefir';
  import HydraViewer from './lib/HydraViewer.svelte';
  import IGrab from './lib/IGrab.svelte';
  import ICursor from './lib/ICursor.svelte';
  import Info from './lib/Info.svelte';
  import ISet from './lib/ISet.svelte';
  import { prng_alea } from 'esm-seedrandom';

  /*
    NAMING & ABBREVIATIONS
    ff = feedforward
    w = width
    h = height
    ev = event
    xPre = previous element
    xCur = current element
    xNex = next element
  */
  // BINDINGS FOR DOM ELEMENTS AND THEIR SIZES

  let iw,
    ih,
    macro_w,
    track_w,
    range_w,
    thumb_w = 5;
  let fooWidth;
  let hidden;
  let noscroll;

  let instruments = {
    fix: {
      name: 'fix',
      equipped: false,
      component: Info,
      ev: { foo: null },
      ff: 'willFix',
    },
    eraser: {
      name: 'erase',
      equipped: false,
      component: Info,
      ev: { foo: null },
      ff: 'willErase',
      effect: R.omit,
    },
    grab: {
      name: 'grab',
      equipped: false,
      component: IGrab,
      ev: { foo: null },
      ff: 'willDisplace',
      effect: displace_effect,
    },
    set: {
      name: 'set',
      equipped: false,
      component: ISet,
      ev: { foo: null },
      ff: 'willSet',
      effect: set_effect,
    },
    cursor: {
      name: 'none',
      equipped: true,
      component: ICursor,
      ev: { foo: null },
      ff: 'willNone',
      effect: displace_effect,
    },
  };

  //reactive value that returns the name of the currently equipped instrument
  $: equipped = R.keys(R.pickBy((x, key) => x.equipped, instruments))[0];
  $: cursor = [instruments[equipped]?.ev?.x, instruments[equipped].ev?.y];
  $: ff = instruments[equipped].ff;

  const presets = PresetStore([
    {
      name: 'preset0',
      ranges: preset2bis,
      h_global: W.bigint_prod(0.1, U.fMAX_H(32, 19), 100),
      h_local: W.bigint_prod(0.5, U.fMAX_H(32, 19), 100),
      z: 1,
    },
  ]);
  $: preset_stores = R.map(x=>MuesliStore(x)[2],$presets)
  $: preset_data = R.map(x=>R.pluck('a',get(x)),preset_stores)
  //presetFocus defines the preset of parameters currently loaded
  //zf is the zoom factor
  const [presetFocus, zf] = [writable(0), writable(1)];
  const muesli = [...MuesliStore($presets[$presetFocus])];
  $: [H_global, H_local, P, Keys, B] = muesli;
  $: data = R.toPairs($P);
  $: data_a = R.pluck('a', $P);

  // STREAMS AND THEIR OBSERVERS
  let  wheel_, move_, effect;
  wheel_ = move_ = effect = undefined;

  function set_effect(ev){
    console.log(ev)
  }

  function displace_effect(ev) {
    let e = ev.detail;
  
    if (e.atk?.target?.classList?.contains('displacable')) {
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

  // EFFECTFUL FUNCTIONS - modify reactive values, can be thought of has handlers

  function equip_effect(name) {
    instruments = R.mapObjIndexed(
      (x, k) => R.modify('equipped', k == name ? R.T : R.F, x),
      instruments
    );
  }

 
  function click_effect(ev) {
    let target = ev.target;
    if (equipped == 'eraser') {
      target.classList.contains('erasable')
        ? muesli?.[target.dataset?.store]?.update(R.omit(U.stringToPath(target.dataset?.path)))
        : console.log('nothing to erase');
    } else if (equipped == 'lock') {
    }
  }

  function load_effect(i) {
    presetFocus.set(i);
    muesli[0].set($presets[i].h_global);
    muesli[1].set($presets[i].h_local);
    muesli[2].set(R.fromPairs($presets[i].ranges));
  }

  function wheel_effect(e) {
    let curr = R.clamp(0.0000001, 1, $zf + U.scale(0, ih * 100, 0.0000001, 1, e.wheelDeltaY));
    let f = (x) => (curr / $zf) * x;
    muesli[2].update(liftSolve(solve, R.map(R.always(R.objOf('z', f)), $P)));
    zf.set(curr);
  }

  onMount(() => {
    //pass device events as inputs to the equipped instrument, which acts as a transfer function
    function feedback(e){ instruments[equipped] = R.assoc('ev', e, instruments[equipped])}
    S.keydown_(' ').thru(S.obs((x) => (hidden = true)));
    S.keyup_(' ').thru(S.obs((x) => (hidden = false)));
    S.mousemove_.thru(S.obs(feedback));
    S.mousedown_.thru(S.obs(feedback));
    S.drag_.thru(S.obs(feedback));
    wheel_ = S.asr(S.capture($zf, shiftdown_), mousewheel_, shiftup_).thru(S.obs(wheel_effect));
  });
</script>

<svelte:window 
  bind:innerHeight={ih} 
  bind:innerWidth={iw} 
  on:keydown={ev=>noscroll = ev.shiftKey} 
  on:keyup={ev=>noscroll = ev.shiftKey}
/>
<main class="grid">
  <div
    class:hidden={!hidden}
    class="instruments"
    style="left:100px; top:0px; z-index:1000"
    bind:clientWidth={fooWidth}
  >
    {#each Object.entries(instruments) as [name, { equipped }]}
      <div class:equipped on:mouseenter={() => equip_effect(name)}>{name}</div>
    {/each}
  </div>
  {#each Object.entries(instruments) as [name, { equipped, component, ev, effect }]}
    <svelte:component this={component} {equipped} {ev} {name} on:effect={effect} />
  {/each}
  <div class="menu">
    <button
        data-path=""
        on:click={() =>
          save_effect({ ranges: data, h_global: $H_global, h_local: $H_local, z: $zf })}
        >save</button
      >
      {#if $presets.length > 0}
        {#each $presets as { name }, i}
          <div class="preset erasable {ff}" on:click={() => load_effect(i)}>
            <HydraViewer synth={synth2} data={preset_data[i]} w={160} h={100} autoloop={false} size={"thumbnail"}></HydraViewer>
            <span>{name}</span>
          </div>
        {/each}
      {/if}
  </div>
  <div class="ui">
    <ul class="slider-container">
      <li class="macro">
        <div class="param-name">Global macro</div>
        <div class="track" bind:clientWidth={macro_w}>
          <div
            class="thumb displacable"
            data-store="0"
            data-path="h b"
            style="left:{W.rescale_index($H_global, $B, 19) * macro_w}px"
            bind:clientWidth={thumb_w}
          />
        </div>
      </li>
      <li class="macro">
        <div class="param-name">Local macro</div>
        <div class="track">
          <div
            data-store="1"
            data-path="h a"
            class="thumb displacable"
            style="left:{W.rescale_index($H_local, $B, 19) * macro_w}px"
            bind:clientWidth={thumb_w}
          />
        </div>
      </li>
    </ul>
    <ul class="slider-container" id="all-sliders" style="overflow:{noscroll?'hidden':'scroll'}">
      <!-- The list of individual sliders is generated by iterating over the store containing sliders data-->
      {#each Object.entries($P) as [key, { a, b, c0, c1, z }]}
        <li
          class="erasable {ff}"
          on:click={click_effect}
          data-path={key}
          data-store="2"
        >
          <div class="param-name {ff}" data-store="2">{key}</div>
          <div class="bound c0">{c0}</div>
          <div class="track" bind:clientWidth={track_w}>
            <div
              data-store="2"
              data-path="{key} b"
              class="range displacable {ff}"
              style="width:{(track_w * z) / (c1 - c0)}px; 
                left:{(track_w * (b - z / 2 - c0)) / (c1 - c0)}px;"
              bind:clientWidth={range_w}
            />
            <div class="middle" style="width:{2}px; left:{U.scale(c0, c1, 0, track_w, b)}px;" />
            <div
              data-store="2"
              data-path="{key} a"
              class="thumb displacable {ff}"
              style="left:{U.scale(c0, c1, 0, track_w, a)}px"
              bind:clientWidth={thumb_w}
            />
          </div>
          <div class="bound c1">{c1}</div>
        </li>
      {/each}
      </ul>
  
  </div>
  <div class="viewport">
    <!-- <HydraViewer synth={synth2} data={data_a} w={1600} h={1000} autoloop={true} size={"big"}/> -->
  </div>
</main>
