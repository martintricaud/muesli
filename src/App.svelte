<script>
  import { writable, get, derived } from 'svelte/store';
  import { onMount } from 'svelte';
  import { wasm_functions as W } from './main.js';
  import { MuesliStore } from './lib/storesFactories';
  import { examples } from './lib/data';
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
  const Active = derived(TemplateGroups, x=>x[SelectedPreset]);

  /**
   * naming: ff = feedforward
   * naming: w = width
   * naming: h = height
   * naming: ev = event
   */

  /* naming: BINDINGS FOR DOM ELEMENTS AND THEIR SIZES / STYLE CLASSES */

  const palette = writable({ x: 0, y: 0 });
  let ih, macro_w, track_w, range_w, TRACKOFFSET, hidden, SelectedUI, thumb_w = 6;

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
  //reactive value that returns the feedforward style for the selected instrument
  $: ff = instruments[equipped].ff;


  //DeltaZoom is the zoom factor
  const DeltaZoom = writable(1)
  $: [H_global, H_local, InputSpace, Bits, Unlocked, Inputs, MaxH] = MuesliStore(
    $TemplateGroups[SelectedTemplate][SelectedPreset]
  );
  $: data = R.toPairs($InputSpace);

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
    let lerpTo = U.lerp(TRACKOFFSET, TRACKOFFSET + track_w, R.__, R.__, ev.detail.cursorValue.x);
    if (ev.detail.targetStore == 0) {
      H_global.set(lerpTo(0n, $MaxH));
    } else if (ev.detail.targetStore == 1) {
      H_local.set(lerpTo(0n, $MaxH));
    } else if (ev.detail.targetStore == 2) {
      InputSpace.evolve(U.deepObjOf([key, field], (x) => lerpTo($InputSpace[key].c0, $InputSpace[key].c1)));
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
  function save_handler() {
    let toAdd = {
      name: SelectedTemplate,
      preset: SelectedPreset,
      inputSpace: R.toPairs($InputSpace),
      h_local: $H_local,
      h_global: $H_global,
      synth: $TemplateGroups[SelectedTemplate][SelectedPreset].synth,
    };
    console.log(R.toPairs($InputSpace))
    Templates.update(R.insert(-1,toAdd))
  }

  function equip_effect(name) {
    instruments = R.mapObjIndexed(
      (x, k) => R.modify('equipped', k == name ? R.T : R.F, x),
      instruments
    );
  }

  function load_handler(i) {
    H_global.set($TemplateGroups[SelectedTemplate][SelectedPreset].h_global);
    H_local.set($TemplateGroups[SelectedTemplate][SelectedPreset].h_local);
    InputSpace.set($TemplateGroups[SelectedTemplate][SelectedPreset].inputSpace)
  }

  function wheel_effect(e) {
    let curr = R.clamp(
      1e-6,1,$DeltaZoom + U.scale(0, ih * 100, 1e-6, 1, e.wheelDeltaY)
    );
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
  on:keydown={(ev) => {
    hidden = ev.key == ' ' ? true : hidden && true;
    document.getElementById("select-ui").blur()
    document.getElementById("select-template").blur()
    }}
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
<main class="grid" id="main">
  <div class="snapshots">
    <button
      data-path=""
      on:click={() => save_handler()}
      ><u>save</u></button
    >

    {#each $TemplateGroups[SelectedTemplate] as { name, preset, synth, inputSpace, h_global, h_local }, i}
      <label class="erasable canvas {ff}">
        <input type="radio" bind:group={SelectedPreset} value={i} />
        <HydraViewer
          {synth}
          data={R.pluck('a', R.fromPairs(inputSpace))}
          w={150}
          h={150}
          autoloop={false}
        />
      </label>
    {/each}
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
              style="left:{W.rescale_index($H_global.toString(), $Bits, $Unlocked.length) *
                track_w -
                3}px"
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
              style="left:{W.rescale_index($H_local.toString(), $Bits, $Unlocked.length) * track_w -
                3}px"
              bind:clientWidth={thumb_w}
            />
          </div>
          <div>max</div>
        </li>
      </ul>
    {/if}
    <ul class="sliders">
      {#each Object.entries($InputSpace) as [key, { a, b, c0, c1, z, locked}]}
        <li class:fixed={locked} class="erasable slider-grid {ff}" data-path={key} data-store="2">
          <div class:unlocked={!locked} class="param-name " data-store="2" data-path={key}>
            {key.replaceAll('_',' ')}
          </div>
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
              style="left:{U.scale(c0, c1, 0, track_w, a) - 3}px"
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
    <HydraViewer
      synth={$TemplateGroups[SelectedTemplate][SelectedPreset].synth}
      data={$Inputs}
      w={1000}
      h={1000}
      autoloop={true}
    />
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
    <select bind:value={SelectedUI} name="UI Mode" id="select-ui">
      <option value="hilbert">Hilbert</option>
      <option value="random">Random Walk</option>
      <option value="default">Default</option>
    </select>
    <select bind:value={SelectedTemplate} name="Presets" id="select-template">
      {#each R.keys($TemplateGroups) as templateName}
        <option value={templateName}>{templateName}</option>
      {/each}
    </select>
    <button>Export</button>
  </div>
</main>
