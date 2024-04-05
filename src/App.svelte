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
  import ICursor from './components/ICursor.svelte';
  import ILever from './components/ILever.svelte';
  import IFix from './components/IFix.svelte';
  import IEraser from './components/IEraser.svelte';
  import IZoom from './components/IZoom.svelte';
  import { EventStore, UIOptions } from './lib/UIState';
  import { RandomGenerator } from '@japan-d2/random-bigint';
  import { constraintsPreset } from './lib/constraints';

  const random = new RandomGenerator({
    seed: BigInt(123456789), // accepts any positive integer
    limit: BigInt(10) ** BigInt(64), // for example, 64 digits maximum
  });

  /** Initialize a store containing the example presets*/
  const Templates = writable(examples);
  /** Derived store where examples are grouped by template for convenience*/
  const TemplateGroups = derived(Templates, R.groupBy(R.prop('templateName')));
  let SelectedTemplate = 'Grayscale Noise';
  /** By default, the selected example is the first that matches the selected template's name*/
  let SelectedExample = R.findIndex(R.propEq('templateName', SelectedTemplate), $Templates);

  let ih,
    iw,
    macro_w,
    track_w,
    range_w,
    trackOffsetX,
    hidden,
    SelectedUI,
    thumb_w = 6;

  const palette = writable({ x: 0, y: 0 });

  let instruments = {
    cursor: {
      name: 'none',
      equipped: true,
      component: ICursor,
      ff: 'willNone',
      effect: cursor_effect,
    },
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
    eraser: {
      name: 'erase',
      equipped: false,
      component: IEraser,
      ff: 'willErase',
      effect: erase_effect,
    },
    zoom: {
      name: 'zoom',
      equipped: false,
      component: IZoom,
      ff: '',
      effect: wheel_effect,
    },
  };

  /** reactive value that returns the name of the currently equipped instrument */
  $: equipped = R.keys(R.pickBy((x, key) => x.equipped, instruments))[0];
  /** reactive value that returns the feedforward style for the selected instrument */
  $: ff = instruments[equipped].ff;

  //DeltaZoom is the zoom factor
  const DeltaZoom = writable(1);
  const WheelDeltaY = writable(1);
  $: [H_global, H_local, InputSpace, Bits, Unlocked, Inputs, MaxH] = MuesliStore(
    $Templates[SelectedExample]
  );
  $: data = R.toPairs($InputSpace);

  /** EFFECTFUL FUNCTIONS modify reactive values, can be thought of has handlers */

  function cursor_effect(ev) {
    console.log(ev);
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
    let [P2, offset] = [ev.detail.P2, ev.detail.offset];
    let [key, field] = U.stringToPath(ev.detail.targetPath);
    /** partial evaluation of the curried lerp function, where only the arguments representing the target range remain exposed */
    let lerpTo = U.lerp(trackOffsetX, trackOffsetX + track_w, R.__, R.__, P2.x - offset.offsetX);
    if (ev.detail.targetStore == 0) {
      H_global.set(lerpTo(0n, $MaxH));
    } else if (ev.detail.targetStore == 1) {
      H_local.set(lerpTo(0n, $MaxH));
    } else if (ev.detail.targetStore == 2) {
      InputSpace.evolve(
        U.deepObjOf([key, field], (x) => lerpTo($InputSpace[key].c0, $InputSpace[key].c1))
      );
    }
  }

  function erase_target(target) {
    if ($TemplateGroups[SelectedTemplate].length > 1) {
      if (target < SelectedExample) {
        Templates.update(R.remove(target, 1));
        SelectedExample += -1;
      } else if (target > SelectedExample) {
        Templates.update(R.remove(target, 1));
      } else if (target == SelectedExample) {
        SelectedExample = target - 1;
        erase_target(target);
      }
    }
  }
  function erase_effect(ev) {
    /** get the target of the eraser from the dom*/
    let target = document
      .elementsFromPoint(ev.detail.x, ev.detail.y)
      .filter((x) => x.tagName == 'LABEL')[0]
      .getAttribute('value');
    erase_target(target);
  }

  /** HANDLERS
   * modify reactive values, but in a non instrumental way
   */
  function save_handler() {
    /** creates a new preset whose name is unique for the given template. */
    let presetName = U.assignDefaultName(R.pluck('presetName', $TemplateGroups[SelectedTemplate]));
    let toAdd = {
      templateName: SelectedTemplate,
      presetName: presetName,
      inputSpace: R.toPairs($InputSpace),
      h_local: $H_local,
      h_global: $H_global,
      synth: $Templates[SelectedExample].synth,
    };
    /** Add the new example at the end of the Template array store */
    Templates.update(R.insert(-1, toAdd));
    /** Shift the focus of SelectedExample to the newly saved preset*/
    SelectedExample = R.findLastIndex(R.propEq('templateName', SelectedTemplate), $Templates);
  }

  function equip_effect(name) {
    instruments = R.mapObjIndexed(
      (x, k) => R.modify('equipped', k == name ? R.T : R.F, x),
      instruments
    );
  }

  function wheel_effect(ev) {
    console.log(ev);
    /** Retrieve all elements located "beneath" the pointer */
    let targetList = document
      .elementsFromPoint(ev.x, ev.y)
      .filter((x) => x.hasAttribute("data-path"));
    /** Consider the target of the effect to be the top-most element */
    let target = targetList[0]??""
    const [targetKey, field] = U.stringToPath(target?.dataset?.path ?? '');
    console.log(targetKey)
    let curr = R.clamp(-1, 1, U.lerp(0, ih, 1e-6, 1, -ev.wheelDeltaY));
    // console.log(curr);
    // InputSpace.evolve(R.map(R.always(R.objOf('z', (x) => x + curr * x)), $InputSpace));


 
    // InputSpace.evolve(
    //   R.mapObjIndexed(
    //     (value,key,obj)=>U.deepObjOf([key,"z"], x => x + curr * (obj.c1 - obj.c0)),
    //     $InputSpace
    //   )
    // )
  
    InputSpace.evolve(
      R.map(
        val=>R.objOf("z", x => x + R.tap(U.printX, curr * (val.c1 - val.c0))),
        R.pickBy((val,key)=>key===targetKey,$InputSpace)
      )
    )

    // InputSpace.evolve(
    //   U.deepObjOf([key, "z"], (x) => x => x + curr * ($InputSpace[key].c1 - $InputSpace[key].c0))
    // );
    // console.log(R.mapObjIndexed(
    //     (value,key,obj)=>U.deepObjOf([key,"z"], x => x + curr * (obj.c1 - obj.c0)),
    //     $InputSpace
    //   ))
    WheelDeltaY.set(curr);

  }
  
  function feedback(e) {
    instruments[equipped] = R.assoc('ev', e, instruments[equipped]);
  }

  onMount(() => {
    S.mousemove_.thru(S.obs(feedback));
    //S.mousedown_.thru(S.obs(feedback));
    //S.drag_.thru(S.obs(feedback));
    //S.asr(S.capture($DeltaZoom, S.shiftdown_), S.mousewheel_, S.shiftup_).thru(S.obs(wheel_effect));
    trackOffsetX = document.getElementsByClassName('track')[0].getBoundingClientRect().left;
  });
</script>

<svelte:window
  bind:innerHeight={ih}
  bind:innerWidth={iw}
  on:keydown={(ev) => UIOptions.update(R.assoc('noscroll', ev.altKey))}
  on:keyup={(ev) => UIOptions.update(R.assoc('noscroll', ev.altKey))}
  on:keydown={(ev) => {
    hidden = ev.key == ' ' ? true : hidden && true;
    /** No choice but to blur some DOM elements to avoid triggering default DOM handlers. */
    document.getElementById('select-ui').blur();
    document.getElementById('select-template').blur();
  }}
  on:keyup={(ev) => {
    hidden = ev.key == ' ' ? false : hidden || false;
    document.getElementById('save').blur();
  }}
  on:mousemove={(ev) => {
    /** Make the instrument palette follows the cursor when hidden */
    hidden ? palette.update((x) => x) : ($palette = { x: ev.x, y: ev.y });
    // feedback(ev);
    EventStore.update(R.mergeLeft(R.pick(['x', 'y', 'movementX', 'movementY'], ev)));
  }}
  on:resize={(ev) => {
    /** this is ugly but Svelte doesn't have a convenient way to bind to an element's absolute Offset width */
    let val = document.getElementsByClassName('track')[0].getBoundingClientRect().left;
    trackOffsetX = val;
  }}
  on:wheel={(ev) => wheel_effect(ev)}
/>
<main class="grid" id="main">
  <div class="snapshots">
    <button id="save" data-path="" on:click={() => save_handler()}><u>save</u></button>
    {#each $Templates as { templateName, presetName, synth, inputSpace, h_global, h_local }, i}
      <label class:hidden={templateName != SelectedTemplate} class="erasable canvas {ff}" value={i}>
        <input type="radio" bind:group={SelectedExample} value={i} />
        <span>{presetName}</span>
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
      <ul class="sliders macro">
        <li class="macro slider-grid">
          <div class="param-name">Global macro</div>
          <div>min</div>
          <div class="track" bind:clientWidth={track_w}>
            <div
              class="unlocked thumb"
              data-store="0"
              data-path="h b"
              data-test
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
          <div class="track" bind:clientWidth={track_w}>
            <div
              data-store="1"
              data-path="h a"
              class="unlocked thumb"
              style="left:{W.rescale_index($H_local.toString(), $Bits, $Unlocked.length) * track_w -
                3}px"
              bind:clientWidth={thumb_w}
            />
          </div>
          <div>max</div>
        </li>
      </ul>
    {/if}
    <ul class="sliders single">
      {#each Object.entries($InputSpace) as [key, { a, b, c0, c1, z, locked }]}
        <li class:fixed={locked} class="erasable slider-grid {ff}" data-path={key} data-store="2">
          <div class:unlocked={!locked} class="param-name" data-store="2" data-path={key}>
            {key.replaceAll('_', ' ')}
          </div>
          <div data-store="2" data-path="{key} c0" class:unlocked={!locked} class="bound c0">
            {c0}
          </div>
          <div data-path={key} class="track" bind:clientWidth={track_w}>
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
              style="left: calc({(100 * (a - c0)) / (c1 - c0)}% - 5px)"
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
      synth={$Templates[SelectedExample].synth}
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
    <select
      bind:value={SelectedTemplate}
      on:change={() =>
        (SelectedExample = R.findIndex(R.propEq('templateName', SelectedTemplate), $Templates))}
      name="Presets"
      id="select-template"
    >
      {#each R.uniq(R.pluck('templateName', $Templates)) as templateName}
        <option value={templateName}>{templateName}</option>
      {/each}
    </select>
    <button>Export</button>
  </div>
</main>
