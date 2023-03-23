<script>
  import { writable, get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { constraintsPreset } from './lib/constraints';
  import { wasm_functions as W } from './main.js';
  import { MuesliStore, PresetStore } from './lib/storesFactories';
  import { synth1, preset1 } from './lib/data';
  import * as U from './lib/utils';
  import * as S from './lib/utils-streams';
  import * as R from 'ramda';
  import HydraViewer from './components/HydraViewer.svelte';
  import IGrab from './components/IGrab.svelte';
  import ICursor from './components/ICursor.svelte';
  import ILever from './components/ILever.svelte';
  import ISet from './components/ISet.svelte';
  import IFix from './components/IFix.svelte';
  import IEraser from './components/IEraser.svelte';
  import { EventStore } from './lib/EventStore';
  // import { presets } from './lib/stores.ts';

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

  const palette = writable({ x: 0, y: 0 });
  let iw,
    ih,
    macro_w,
    track_w,
    range_w,
    TRACKOFFSET,
    hidden,
    noscroll,
    mode = true,
    thumb_w = 5;
  let instruments = {
    // fix: {
    //   name: 'fix',
    //   equipped: false,
    //   component: IFix,
    //   ev: U.InitEvent,
    //   ff: 'willFix',
    //   effect: fix_effect,
    // },
    // eraser: {
    //   name: 'erase',
    //   equipped: false,
    //   component: IEraser,
    //   ev: U.InitEvent,
    //   ff: 'willErase',
    //   effect: erase_effect,
    // },
    lever: {
      name: 'lever',
      equipped: false,
      component: ILever,
      ff: 'willNone',
      effect: lever_effect,
    },
    cursor: {
      name: 'none',
      equipped: true,
      component: ICursor,
      ff: 'willNone',
      effect: cursor_effect,
    },
  };

  //reactive value that returns the name of the currently equipped instrument
  $: equipped = R.keys(R.pickBy((x, key) => x.equipped, instruments))[0];
  $: console.log(equipped);
  //reactive value that returns the feedforward style for the selected instrument
  $: ff = instruments[equipped].ff;

  const presets = PresetStore([
    {
      name: 'preset0',
      ranges: preset1,
      h_global: W.bigint_prod(0.1, U.fMAX_H(32, 19), 100),
      //h_global: W.bigint_prod(0.1, U.HilbertMax(32, 19), 100),
      h_local: W.bigint_prod(0.5, U.fMAX_H(32, 19), 100),
      //h_local: W.bigint_prod(0.1, U.HilbertMax(32, 19), 100),
      z: 1,
    },
  ]);

  $: preset_data = R.map((x) => R.pluck('a', get(MuesliStore(x)[2])), $presets);
  //presetFocus defines the preset of parameters currently loaded
  //zf is the zoom factor
  const [presetFocus, zf] = [writable(0), writable(1)];
  const muesli = [...MuesliStore($presets[$presetFocus])];
  $: [H_global, H_local, Params, Bits, Unlocked] = muesli;
  $: data = R.toPairs($Params);
  $: data_a = R.pluck('a', $Params);

  // EFFECTFUL FUNCTIONS - modify reactive values, can be thought of has handlers

  function log_effect(ev) {
    // console.log(ev.detail);
  }

  function cursor_effect(ev) {
    console.log($EventStore);
  }

  function fix_effect(ev) {
    let e = ev?.detail;
    const path = U.stringToPath(e?.target?.dataset?.path ?? '');
    const store = e?.target?.dataset?.store;

    if (store == 2) {
      muesli?.[store]?.update(R.modifyPath([path[0], 'locked'], R.not));
    }
  }

  function lever_effect(ev) {
    let [key, field] = U.stringToPath(ev.detail.targetPath);
    if (ev.detail.targetStore == 0 || ev.detail.targetStore == 1) {
      let val = U.scale2bigint(
        TRACKOFFSET,
        TRACKOFFSET + track_w,
        '0',
        U.fMAX_H($Bits, $Unlocked.length),
        ev.detail.cursorValue.x
      );
      //console.log(val)
      muesli?.[ev.detail.targetStore]?.set(val);
    }
    if (ev.detail.targetStore == 2) {
      console.log(TRACKOFFSET)
      let val = U.scale(
        TRACKOFFSET,
        TRACKOFFSET + track_w,
        $Params[key].c0,
        $Params[key].c1,
        ev.detail.cursorValue.x
      );

      let obj =  $Params[key]
      let itemModifier = R.assoc(key, R.evolve(U.solve(constraintsPreset,R.objOf(field,x=>val),obj),obj))
      $Params[key].locked ? Params.update(R.identity) : 
      Params.update(itemModifier);
    }
  }

  function erase_effect(ev) {
    let e = ev.detail;
    e.target.classList.contains('erasable')
      ? muesli?.[e.target.dataset?.store]?.update(R.omit(U.stringToPath(e.target.dataset?.path)))
      : console.log('nothing to erase');
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

  function load_effect(i) {
    presetFocus.set(i);
    muesli[0].set($presets[i].h_global);
    muesli[1].set($presets[i].h_local);
    muesli[2].set(R.fromPairs($presets[i].ranges));
  }

  function wheel_effect(e) {
    let curr = R.clamp(0.0000001, 1, $zf + U.scale(0, ih * 100, 0.0000001, 1, e.wheelDeltaY));
    let f = (x) => (curr / $zf) * x;
    muesli[2].update(
      U.liftSolve(U.solve(constraintsPreset), R.map(R.always(R.objOf('z', f)), $Params))
    );
    zf.set(curr);
  }

  function feedback(e) {
    EventStore.set(e);
    instruments[equipped] = R.assoc('ev', e, instruments[equipped]);
  }

  onMount(() => {
    S.mousemove_.thru(S.obs(feedback));
    S.mousedown_.thru(S.obs(feedback));
    S.drag_.thru(S.obs(feedback));
    S.asr(S.capture($zf, S.shiftdown_), S.mousewheel_, S.shiftup_).thru(S.obs(wheel_effect));
    TRACKOFFSET = document.getElementsByClassName('track2')[0].getBoundingClientRect().left;
  });
</script>

<svelte:window
  bind:innerHeight={ih}
  bind:innerWidth={iw}
  on:keydown={(ev) => (noscroll = ev.shiftKey)}
  on:keyup={(ev) => (noscroll = ev.shiftKey)}
  on:keydown={(ev) => (hidden = ev.key == ' ' ? true : hidden && true)}
  on:keyup={(ev) => (hidden = ev.key == ' ' ? false : hidden || false)}
  on:mousemove={(ev) => {
    hidden ? palette.update((x) => x) : ($palette = { x: ev.x, y: ev.y });
    feedback(ev);
    EventStore.update(R.mergeLeft(R.pick(['movementX', 'movementY'], ev)));
  }}
  on:resize={(ev) => {
    //this is ugly but Svelte don't have a convenient way to bind to an element's absolute Offset width
    let val = document.getElementsByClassName('track2')[0].getBoundingClientRect().left;
    TRACKOFFSET = val;
  }}
/>
<main class="grid layout">
  <div class="presets">
    <button
      data-path=""
      on:click={() => save_effect({ ranges: data, h_global: $H_global, h_local: $H_local, z: $zf })}
      >save</button
    >
    {#if $presets.length > 0}
      {#each $presets as { name }, i}
        <div class="erasable canvas {ff}" on:click={() => load_effect(i)}>
          <HydraViewer synth={synth1} data={preset_data[i]} w={150} h={150} autoloop={false} />
          <span>{name}</span>
        </div>
      {/each}
    {/if}
  </div>
  <div class="ui">
    <ul class="sliders">
      <li class="macro">
        <div class="param-name">Global macro</div>
        <div />
        <div class="track" bind:clientWidth={macro_w}>
          <div
            class="thumb unlocked"
            data-store="0"
            data-path="h b"
            style="left:{W.rescale_index($H_global, $Bits, $Unlocked.length) * macro_w}px"
            bind:clientWidth={thumb_w}
          />
        </div>
        <div />
      </li>
      <li class="macro">
        <div class="param-name">Local macro</div>
        <div />
        <div class="track">
          <div
            data-store="1"
            data-path="h a"
            class="thumb unlocked"
            style="left:{W.rescale_index($H_local, $Bits, $Unlocked.length) * macro_w}px"
            bind:clientWidth={thumb_w}
          />
        </div>
        <div />
      </li>
    </ul>

    <table class="sliders" style="overflow:{noscroll ? 'hidden' : 'scroll'}">
      <colgroup>
        <col class="param-name" />
        <col class="bound c0" />
        <col style="min-width:200px" />
        <col class="bound c1" />
      </colgroup>
      <tr>
        <th>Name</th>
        <th>Min</th>
        <th />
        <th>Max</th>
      </tr>
      <!-- The list of individual sliders is generated by iterating over the store containing sliders data-->
      {#each Object.entries($Params) as [key, { a, b, c0, c1, z, locked, display }]}
        <tr class:foo={locked} class="erasable {ff}" data-path={key} data-store="2">
          <td class:unlocked={!locked} class="param-name {ff}" data-store="2">{display}</td>
          <td data-store="2" data-path="{key} c0" class:unlocked={!locked} class="bound c0">
            {c0}
          </td>
          <td>
            <div class="track track2" bind:clientWidth={track_w}>
              <div
                data-store="2"
                data-path="{key} b"
                class:unlocked={!locked}
                class:foo={locked}
                class="range"
                style="width:{(track_w * z) / (c1 - c0)}px; 
                left:{(track_w * (b - z / 2 - c0)) / (c1 - c0)}px;"
                bind:clientWidth={range_w}
              />
            
              <div class="middle" style="width:{2}px; left:{U.scale(c0, c1, 0, track_w, b)}px;" />
              <div
                data-store="2"
                data-path="{key} a"
                class:unlocked={!locked}
                class="thumb"
                style="left:{U.scale(c0, c1, 0, track_w, a)}px"
                bind:clientWidth={thumb_w}
              />
              <div
                data-store="2"
                data-path="{key} a"
                class:unlocked={!locked}
                style="left:{U.scale(c0, c1, 0, track_w, a)}px;
                top: -30px;
                position:relative
                "
                bind:clientWidth={thumb_w}
              >{a}</div>
            </div>
          </td>
          <td data-store="2" data-path="{key} c1" class:unlocked={!locked} class="bound c1">
            {c1}
          </td>
        </tr>
      {/each}
    </table>
  </div>
  <div class="viewport">
    <HydraViewer synth={synth1} data={data_a} w={1000} h={1000} autoloop={true} />
  </div>
  <div style="width: 100vw; background: none; position: absolute; z-index: 1000; top:0; left:0">
    <div class:hidden={!hidden} class="palette" style="left:{$palette.x}px; top:{$palette.y}px;">
      {#each Object.entries(instruments) as [name, { equipped }]}
        <div class:equipped on:mouseenter={() => equip_effect(name)}>{name}</div>
      {/each}
    </div>
    {#each Object.entries(instruments) as [name, { equipped, component, ev, effect }]}
      <svelte:component this={component} {equipped} {ev} {name} on:effect={effect} />
    {/each}
  </div>
  <div style="position:absolute; bottom:5px; right:5px">
    <button on:click={() => (mode = !mode)}>Switch</button>
    <button>Export</button>
  </div>
</main>
