<script>
  import { deepObjOf } from './lib/utils.ts';
  import { writable, get, derived } from 'svelte/store';
  import { onMount } from 'svelte';
  import { wasm_functions as W } from './main.js';
  import { MuesliStore, PresetStore, InputValues } from './lib/storesFactories';
  import { synth1, preset1, examples } from './lib/data';
  import * as U from './lib/utils';
  import * as S from './lib/utils-streams';
  import * as R from 'ramda';
  import HydraViewer from './components/HydraViewer.svelte';
  import SliderTable from './components/SliderTable.svelte';
  import ICursor from './components/ICursor.svelte';
  import ILever from './components/ILever.svelte';
  import IFix from './components/IFix.svelte';
  import { EventStore, UIOptions } from './lib/UIState';

  const Templates = writable(examples);
  const TemplateGroups = derived(Templates, R.groupBy(R.prop('name')));
  let SelectedTemplate = 'dualNoiseBW';
  let SelectedPreset = 0;
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
  let ih,
    macro_w,
    track_w,
    range_w,
    TRACKOFFSET,
    hidden,
    SelectedUI,
    thumb_w = 5;

  let instruments = {
    fix: {
      name: 'fix',
      equipped: false,
      component: IFix,
      ff: 'willFix',
      effect: fix_effect,
    },
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
        // eraser: {
    //   name: 'erase',
    //   equipped: false,
    //   component: IEraser,
    //   ev: U.InitEvent,
    //   ff: 'willErase',
    //   effect: erase_effect,
    // },
  };

  //reactive value that returns the name of the currently equipped instrument
  $: equipped = R.keys(R.pickBy((x, key) => x.equipped, instruments))[0];
  $: console.log(equipped);
  //reactive value that returns the feedforward style for the selected instrument
  $: ff = instruments[equipped].ff;

  const presets = PresetStore([
    {
      name: 'preset0',
      inputSpace: preset1,
      h_global: W.bigint_prod(0.1, U.fMAX_H(32, 19), 100),
      //h_global: W.bigint_prod(0.1, U.HilbertMax(32, 19), 100),
      h_local: W.bigint_prod(0.5, U.fMAX_H(32, 19), 100),
      //h_local: W.bigint_prod(0.1, U.HilbertMax(32, 19), 100),
      // z: 1,
    },
  ]);

  $: preset_data = R.map((x) => R.pluck('a', get(MuesliStore(x)[2])), $presets);

  //presetFocus defines the preset of parameters currently loaded
  //DeltaZoom is the zoom factor
  const [presetFocus, DeltaZoom] = [writable(0), writable(1)];
  $: [H_global, H_local, InputSpace, Bits, Unlocked, Inputs] = MuesliStore($presets[$presetFocus]);
  $: data = R.toPairs($InputSpace);
  $: console.log($TemplateGroups[SelectedTemplate][SelectedPreset])
  $: console.log($DeltaZoom)

  /** EFFECTFUL FUNCTIONS
   * modify reactive values, can be thought of has handlers
   * 
  */

  function cursor_effect(ev) {
    console.log($EventStore);
  }

  function fix_effect(ev) {
    let e = ev?.detail;
    const [key, field] = U.stringToPath(e?.target?.dataset?.path ?? '');
    const store = e?.target?.dataset?.store;
    if (store == 2) {
      InputSpace.update(R.modifyPath([key, 'locked'], R.not));
    }
  }

  function lever_effect(ev) {
    let [key, field] = U.stringToPath(ev.detail.targetPath);
    if (ev.detail.targetStore == 0) {
      let val = U.scale2bigint(
        TRACKOFFSET,
        TRACKOFFSET + track_w,
        '0',
        U.fMAX_H($Bits, $Unlocked.length),
        ev.detail.cursorValue.x
      );
      H_global.set(val);
    } else if (ev.detail.targetStore == 1) {
      let val = U.scale2bigint(
        TRACKOFFSET,
        TRACKOFFSET + track_w,
        '0',
        U.fMAX_H($Bits, $Unlocked.length),
        ev.detail.cursorValue.x
      );
      H_local.set(val);
    } else if (ev.detail.targetStore == 2) {
      let val = U.lerp(
        TRACKOFFSET,
        TRACKOFFSET + track_w,
        $InputSpace[key].c0,
        $InputSpace[key].c1,
        ev.detail.cursorValue.x
      );

      InputSpace.evolve(U.deepObjOf([key, field], (x) => val));
    }
  }

  // function erase_effect(ev) {
  //   let e = ev.detail;
  //   e.target.classList.contains('erasable')
  //     ? muesli?.[e.target.dataset?.store]?.update(R.omit(U.stringToPath(e.target.dataset?.path)))
  //     : console.log('nothing to erase');
  // }

  /** HANDLERS
  * modify reactive values, but in a non instrumental way
  */
  function save_handler(val) {
    presets.add(val);
    let update = R.assocPath([SelectedTemplate, SelectedPreset],)

  }

  function equip_effect(name) {
    instruments = R.mapObjIndexed(
      (x, k) => R.modify('equipped', k == name ? R.T : R.F, x),
      instruments
    );
  }

  function load_handler(i) {
    presetFocus.set(i);
    H_global.set($presets[i].h_global);
    H_local.set($presets[i].h_local);
    InputSpace.set(R.fromPairs($presets[i].inputSpace));
  }

  function wheel_effect(e) {
    let curr = R.clamp(0.0000001, 1, $DeltaZoom + U.scale(0, ih * 100, 0.0000001, 1, e.wheelDeltaY));
    let f = (x) => (curr / $DeltaZoom) * x;
    InputSpace.evolve(R.map(R.always(R.objOf('z', f)), $InputSpace));
    DeltaZoom.set(curr);
  }

  function feedback(e) {
    EventStore.set(e);
    instruments[equipped] = R.assoc('ev', e, instruments[equipped]);
  }

  onMount(() => {
    S.mousemove_.thru(S.obs(feedback));
    S.mousedown_.thru(S.obs(feedback));
    S.drag_.thru(S.obs(feedback));
    S.asr(S.capture($DeltaZoom, S.shiftdown_), S.mousewheel_, S.shiftup_).thru(S.obs(wheel_effect));
    TRACKOFFSET = document.getElementsByClassName('track2')[0].getBoundingClientRect().left;
  });
</script>

<svelte:window
  bind:innerHeight={ih}
  on:keydown={(ev) => UIOptions.update(R.assoc('noscroll', ev.shiftKey))}
  on:keyup={(ev) => UIOptions.update(R.assoc('noscroll', ev.shiftKey))}
  on:keydown={(ev) => (hidden = ev.key == ' ' ? true : hidden && true)}
  on:keyup={(ev) => (hidden = ev.key == ' ' ? false : hidden || false)}
  on:mousemove={(ev) => {
    hidden ? palette.update((x) => x) : ($palette = { x: ev.x, y: ev.y });
    feedback(ev);
    EventStore.update(R.mergeLeft(R.pick(['movementX', 'movementY'], ev)));
  }}
  on:resize={(ev) => {
    //this is ugly but Svelte doesn't have a convenient way to bind to an element's absolute Offset width
    let val = document.getElementsByClassName('track2')[0].getBoundingClientRect().left;
    TRACKOFFSET = val;
  }}
/>
<main class="grid">
  <div class="snapshots">
    <button
      data-path=""
      on:click={() =>
        save_handler({ inputSpace: data, h_global: $H_global, h_local: $H_local})}
      ><u>save</u></button
    >
    {#if $presets.length > 0}
      {#each $presets as { name }, i}
        <div class="erasable canvas {ff}" on:click={() => load_handler(i)}>
          <HydraViewer synth={synth1} data={preset_data[i]} w={150} h={150} autoloop={false} />
          <span>{name}</span>
        </div>
      {/each}
    {/if}

    <!-- {#each $TemplateGroups[SelectedTemplate] as { name, synth, inputSpace, H_global, H_local }, i}
      <label class="erasable canvas {ff}">
        <input type="radio" bind:group={SelectedPreset} {name} value={i} />
        <HydraViewer
          {synth}
          data={R.pluck('a', R.fromPairs(inputSpace))}
          w={150}
          h={150}
          autoloop={false}
        />
      </label>
    {/each} -->
  </div>
  <div class="ui">
    {#if SelectedUI != 'default'}
      <ul class="sliders ">
        <li class="macro slider-grid">
          <div class="param-name">Global macro</div>
          <div>min</div>
          <div class="track" bind:clientWidth={macro_w}>
            <div
              class="thumb unlocked"
              data-store="0"
              data-path="h b"
              style="left:{W.rescale_index($H_global, $Bits, $Unlocked.length) * thumb_w}px"
              bind:clientWidth={thumb_w}
            />
          </div>
          <div>max</div>
        </li>
        <li class="macro slider-grid">
          <div class="param-name">Local macro</div>
          <div>min</div>
          <div class="track">
            <div
              data-store="1"
              data-path="h a"
              class="thumb unlocked"
              style="left:{W.rescale_index($H_local, $Bits, $Unlocked.length) * thumb_w}px"
              bind:clientWidth={thumb_w}
            />
          </div>
          <div>max</div>
        </li>
      </ul>
    {/if}
    <ul class="sliders">
      {#each Object.entries($InputSpace) as [key, { a, b, c0, c1, z, locked, display }]}
        <li class:fixed={locked} class="erasable slider-grid {ff}" data-path={key} data-store="2">
          <div class:unlocked={!locked} class="param-name " data-store="2" data-path={key}
            >{display}</div
          >
          <div data-store="2" data-path="{key} c0" class:unlocked={!locked} class="bound c0">
            {c0}
          </div>
          <div data-path={key} class="track track2" bind:clientWidth={track_w}>
            <div
              data-store="2"
              data-path="{key} b"
              class:unlocked={!locked}
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
          </div>
          <div data-store="2" data-path="{key} c1" class:unlocked={!locked} class="bound c1">
            {c1}
          </div>
        </li>
      {/each}
    </ul>
    
  </div>
  <div class="viewport">
    <!-- <HydraViewer synth={synth1} data={$Inputs} w={1000} h={1000} autoloop={true} /> -->
    <HydraViewer synth={$TemplateGroups[SelectedTemplate][SelectedPreset].synth} data={$Inputs} w={1000} h={1000} autoloop={true} />
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
  <div class="config">
    <select bind:value={SelectedUI} name="UI Mode">
      <option value="hilbert">Hilbert</option>
      <option value="random">Random Walk</option>
      <option value="default">Default</option>
    </select>
    <select bind:value={SelectedTemplate} name="Presets">
      {#each examples as { name }, i}
        <option value={name}>{name}</option>
      {/each}
    </select>
    <button>Export</button>
  </div>
</main>
