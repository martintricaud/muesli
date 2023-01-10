<script lang ts>
  import { writable, get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { random_adjunction, MuesliStore, liftSolve, PresetStore, solve, constraintsPreset } from './lib/stores';
  import { synth2, preset2bis } from './lib/data';
  import { wasm_functions as W } from './main.js';
  import * as U from './lib/utils';
  import * as S from './lib/utils-streams';
  import * as R from 'ramda';
  import HydraViewer from './lib/HydraViewer.svelte';
  import IGrab from './lib/IGrab.svelte';
  import ICursor from './lib/ICursor.svelte';
  import Info from './lib/Info.svelte';
  import ISet from './lib/ISet.svelte';
  import IFix from './lib/IFix.svelte';
  import { prng_alea } from 'esm-seedrandom';

  /** 
    * naming: ff = feedforward
    * naming: w = width
    * naming: h = height
    * naming: ev = event
    * naming: xPre = previous element
    * naming: xCur = current element
    * naming: xNex = next element
  */
  
  /* naming: BINDINGS FOR DOM ELEMENTS AND THEIR SIZES / STYLE CLASSES */ 

  let iw, ih, macro_w, track_w, range_w, thumb_w = 5;
  let hidden, noscroll;

  let instruments = {
    eraser2: {
      name: 'erase',
      equipped: false,
      component: Info,
      ev: { foo: null },
      ff: 'willErase',
      effect: R.omit,
    },
    fix: {
      name: 'fix',
      equipped: false,
      component: IFix,
      ev: { foo: null },
      ff: 'willFix',
      effect: fix_effect,
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

  $: preset_data = R.map((x) => R.pluck('a', get(MuesliStore(x)[2])), $presets);
  //presetFocus defines the preset of parameters currently loaded
  //zf is the zoom factor
  const [presetFocus, zf] = [writable(0), writable(1)];
  const muesli = [...MuesliStore($presets[$presetFocus])];
  $: [H_global, H_local, P, Keys, B] = muesli;
  $: data = R.toPairs($P);
  $: data_a = R.pluck('a', $P);


  // EFFECTFUL FUNCTIONS - modify reactive values, can be thought of has handlers

  function set_effect(ev) {
    console.log(ev);
  }

  function fix_effect(ev) {
    /** 
     * if the target has a "lock" value this flips it.
     * unlocking the target should reinsert it at the right location in the array.
    */
    console.log(ev);
  }

  function displace_effect(ev) {
    let e = ev.detail;
    if (e.atk?.target?.classList?.contains('displacable')) {
      const store = e.atk.target.dataset?.store;
      const [key, field] = U.stringToPath(e.atk.target.dataset.path);
      let f;
      if (store == 0 || store == 1) {
        f = U.add(U.scale(0, track_w, '0', U.fMAX_H($B, $Keys.length), e.movementX));
      }
      if (store == 2) {
        let f0 = U.add(U.scale(0, track_w, $P[key].c0, $P[key].c1, e.movementX));
        f = $P[key].locked ? R.identity: liftSolve(solve(constraintsPreset), U.deepObjOf([key, field], f0));
      }
      muesli?.[store]?.update(f);
    }
  }

  function save_effect(val) {
    presets.add(val);
  }

  function equip_effect(name) {
    instruments = R.mapObjIndexed(
      (x, k) => R.modify('equipped', k == name ? R.T : R.F, x),
      instruments
    );
  }

  function click_effect(ev) {
    if (equipped == 'eraser') {
      ev.target.classList.contains('erasable')
        ? muesli?.[ev.target.dataset?.store]?.update(R.omit(U.stringToPath(ev.target.dataset?.path)))
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
    muesli[2].update(liftSolve(solve(constraintsPreset), R.map(R.always(R.objOf('z', f)), $P)));
    zf.set(curr);
  }

  onMount(() => {
    //pass device events as inputs to the equipped instrument, which acts as a transfer function
    function feedback(e) {
      instruments[equipped] = R.assoc('ev', e, instruments[equipped]);
    }
    S.mousemove_.thru(S.obs(feedback));
    S.mousedown_.thru(S.obs(feedback));
    S.drag_.thru(S.obs(feedback));
    S.asr(S.capture($zf, S.shiftdown_), S.mousewheel_, S.shiftup_).thru(S.obs(wheel_effect));
  });
</script>

<svelte:window
  bind:innerHeight={ih}
  bind:innerWidth={iw}
  on:keydown={(ev) => (noscroll = ev.shiftKey)}
  on:keyup={(ev) => (noscroll = ev.shiftKey)}
  on:keydown={(ev) => hidden = ev.key == ' '? true : hidden && true }
  on:keyup={(ev) => hidden = ev.key == ' '? false : hidden || false }
/>
<main class="grid">
  <div class:hidden={!hidden} class="instruments" style="left:100px; top:0px; z-index:1000">
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
      on:click={() => save_effect({ ranges: data, h_global: $H_global, h_local: $H_local, z: $zf })}
      >save</button
    >
    {#if $presets.length > 0}
      {#each $presets as { name }, i}
        <div class="preset erasable {ff}" on:click={() => load_effect(i)}>
          <HydraViewer
            synth={synth2}
            data={preset_data[i]}
            w={160}
            h={100}
            autoloop={false}
            size={'thumbnail'}
          />
          <span>{name}</span>
        </div>
      {/each}
    {/if}
  </div>
  <div class="ui">
    <ul class="sliders">
      <li class="macro">
        <div class="param-name">Global macro</div>
        <div class="track" bind:clientWidth={macro_w}>
          <div
            class="thumb displacable"
            data-store="0"
            data-path="h b"
            style="left:{W.rescale_index($H_global, $B, $Keys.length) * macro_w}px"
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
            style="left:{W.rescale_index($H_local, $B, $Keys.length) * macro_w}px"
            bind:clientWidth={thumb_w}
          />
        </div>
      </li>
    </ul>
    <ul class="sliders" style="overflow:{noscroll ? 'hidden' : 'scroll'}">
      <!-- The list of individual sliders is generated by iterating over the store containing sliders data-->
      {#each Object.entries($P) as [key, { a, b, c0, c1, z }]}
        <li class="erasable {ff}" on:click={click_effect} data-path={key} data-store="2">
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
