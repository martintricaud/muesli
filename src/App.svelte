<script>
  //import { scale } from './lib/utils2.ts';
  import { onMount, afterUpdate } from 'svelte';
  import { get } from 'svelte/store';
  import { sync, random_adjunction, liftedConstraintStore } from './lib/stores';
  import { shiftdown_, shiftup_, mouseup_, mousedown_, mousemove_, mouseleave_, mousewheel_, asr } from './lib/utils-streams.js';
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

  // SHORTHANDS
  let f32a = Float32Array;
  let u32a = Uint32Array;

  // BINDINGS FOR DOM ELEMENTS AND THEIR SIZES

  let currentPreset = preset2;
  let presets = [];

  let [MAX_H, MAX_A] = [W.max_hilbert(32, currentPreset.length), Math.pow(2, 32) - 1];
  let iw,
    ih,
    macro_w,
    track_w,
    range_w,
    thumb_w = 5;
  let zf = 0.2; //Zoom Factor

  let instruments = {
    hold: { active: false, component: InfoBox, ev: { x: 0 } },
    pin: { active: false, component: InfoBox, ev: { x: 0 } },
    eraser: { active: false, component: InfoBox, ev: { x: 0 } },
    grab: { active: false, component: GrabFeedback, ev: { x: null } },
    set: { active: false, component: SetFeedback, ev: { x: null } },
    none: { active: true, component: InfoBox, ev: { x: 0 } },
  };
  $: activeInstrument = R.keys(R.pickBy((x, key) => x.active, instruments))[0];
  //UTILITIES

  let nameAs = (name) => (x) => R.assoc(name, x, { m: 0, M: MAX_A });

  let lerp = (A, B) => (x) => U.scale(A, B)(x) + B[0];

  function plus(a, b) {
    if (typeof a === 'number') {
      return a + b;
    } else return W.bigint_sum(a, b);
  }

  function add(b) {
    return (a) => plus(a, b);
  }

  //LOADING PARAMETER PRESETS
  let ax = currentPreset.map((a) => a[0]);
  let data = R.fromPairs(currentPreset);

  // DEFINING CONSTANTS
  const mM = (x) => R.props(['m', 'M'], x);
  const c0c1 = (x) => R.props(['c0', 'c1'], x);
  const v = (x) => R.props(['v'], x);
  const L = (x) => R.props(['locked'], x);

  const Lr = (x) => R.prop('Lr', x);
  const Lt = (x) => R.prop('Lt', x);
  const view = (lenses, x) => R.lift(R.pipe(...lenses))(x);
  //f is a function that turns b into a function

  function applyUpdate(_sandbox, update, path) {
    //a priori le diagramme des contraintes commute (except if you include the cursor)
    let res1 = R.modifyPath(path, update, _sandbox);
    //ensuite each
  }

  //let axr = R.map(x=>R.pick(["Lr"],x),data)
  //let axt = R.map(x=>R.pick(["Lt"],x),data)

  //  // TWO WAY BINDINGS

  let hilbert_adjunction = (axes, b) => [
    (n) => R.zipObj(axes, W.forward(n, b, axes.length)),
    (X) => W.inverse(u32a.from(R.map((k) => X[k], axes)), b),
  ];

  let s = R.lift((x) => lerp(mM(x), [0, MAX_A])(x.v));

  let remapping_adjunction = [
    ([h_axes, ctx]) => [U.o2o(ctx)(h_axes)(U.lerp_AB([0, MAX_A])), ctx],
    ([scaled_coordinates, ctx]) => [U.o2o(ctx)(scaled_coordinates)(U.lerp_BA([0, MAX_A])), ctx],
  ];


  let [testStore2,index] = liftedConstraintStore(preset2bis);
  let [hr, hrX] = sync(...hilbert_adjunction(ax, 32));
  let [ht, htX] = sync(...hilbert_adjunction(ax, 32));
  //let [ht, htX] = sync(...random_adjunction(ax))

  $hr = W.biguint_prod(0.5, MAX_H, 100);
  $ht = W.biguint_prod(0.5, MAX_H, 100);

  let [hrX_f, r_data] = sync(...remapping_adjunction);
  //let rScaled = sync(...remapping_adjunction);

  $: $hrX_f = [R.mergeDeepWith(R.call, view([Lr], data), $hrX), view([mM, U.zoom(zf)], data)];

  $: t_tracks = R.mergeDeepWith(
    U.offset,
    view([mM, U.thick(zf)], data),
    R.mergeDeepWith(R.call, view([Lr], data), $r_data[0])
  );

  // THUMB SLIDERS

  let [htX_f, t_data] = sync(...remapping_adjunction);

  $: $htX_f = [R.mergeDeepWith(R.call, view([Lt], data), $htX), t_tracks];

  // RENDERING TO THE DOM
  $: r_render = (k) =>
    U.lerp(view([mM], data)[k], [0, track_w])(view([Lr], data)[k]($r_data[0][k]));
  $: t_render = (k) => U.lerp_AB(view([mM], data)[k])([0, track_w])($t_data[0][k]);
  $: hr_render = W.rescale_index($hr, 32, currentPreset.length);
  $: ht_render = W.rescale_index($ht, 32, currentPreset.length);

  // STREAMS AND THEIR OBSERVERS
  let drag_, cursorInfo_, click_, wheel_, move_, pool_, pool2_, counterPlus_;
  drag_ = cursorInfo_ = click_ = counterPlus_ = wheel_ = move_ = pool_ = pool2_ = undefined;



  function savePreset(val) {
    console.log('saved ' + U.smallestPresetAvailable(R.pluck(['name'], presets)));
    presets = R.append(
      {
        name: U.smallestPresetAvailable(R.pluck(['name'], presets)),
        data: {},
        h0: '',
        h1: '',
      },
      presets
    );
  }

  function move_feedback(e) {
    instruments[activeInstrument]['ev'] = e;
  }
  function drag_feedback(e) {
    instruments[activeInstrument]['ev'] = e;
  }

  function handleClick(lock, k) {
    // if (instruments[0].active) {
    //   let val
    //   if (lock == 'Lr') {
    //     val =$r_data[0][k];
    //   } else if (lock == 'Lt') {
    //   val = $t_data[0][k];
    //   }
    //   data = R.assocPath([k, lock], x=>val, data);
    // }
  }

  function dragger_feedforward() {
    //if the target is compatible, change the display of the target, i.e. add
  }

  // EFFECTFUL FUNCTIONS - modify reactive values, can be thought of has handlers

  function equip_effect(name) {
    instruments = R.mapObjIndexed(
      (x, k) =>
        k == name ? R.modify('active', (a) => !a, x) : R.modify('active', (a) => false, x),
      instruments
    );
    activeInstrument = R.keys(R.pickBy((x, key) => x.active, instruments))[0];
  }

  function drag_effect({ atk, sus }) {
    let k = atk.target.dataset.id; //get the key of the target
    let f_update;

    // OBSERVER FOR INDIVIDUAL THUMB DRAG
    if (atk.target.classList.contains('slider')) {
      let [from, to] = [[0, track_w], view([mM], data)[k]];
      if (atk.target.classList.contains('range')) {
        f_update = R.compose(
          add(U.scale(from, to)(sus.movementX)),
          U.clamp(view([mM, U.zoom(zf)], data)[k])
        );
        $r_data = R.modifyPath([0, k], f_update, $r_data);
        $hrX = $hrX_f[0];
      }
      if (atk.target.classList.contains('thumb')) {
        f_update = R.compose(
          add(U.scale(from, to)(sus.movementX)),
          U.clamp(view([mM], data)[k]),
          U.clamp(t_tracks[k])
        );
        $t_data = R.modifyPath([0, k], f_update, $t_data);
        $htX = $htX_f[0];
      }
    }

    // OBSERVER FOR MACRO THUMB DRAG
    if (atk.target.classList.contains('macro-thumb')) {
      let [from, to] = [
        [0, macro_w],
        ['0', MAX_H],
      ];
      // @ts-ignore
      f_update = R.pipe(U.clamp(['0', MAX_H]), add(U.scale(from, to)(sus.movementX * 0.1)));
      if (atk.target.id == 'h_r') {
        $hr = f_update($hr);
        $hrX_f = [$hrX, $hrX_f[1]];
      }
      if (atk.target.id == 'h_t') {
        $ht = f_update($ht);
        $htX_f = R.assoc([0], $htX, $htX_f);
      }
    }
  }

  function zoom_effect(){

  }

  function erase_effect(store,key){
    // let [store, key] = [atk.target.dataset.store, atk.target.dataset.key]
    store.remove([key])
  }

  function drag_effect2({ atk, sus }) {
    let [key, field] = [atk.target.dataset.key, atk.target.dataset.field]
    let f = add(U.scale([0, track_w], [$testStore2[key].c0,$testStore2[key].c1])(sus.movementX))
    testStore2.update(R.assocPath([key,field], f, {}))

    let fh = add(U.scale([0, macro_w], ['0', MAX_H])(sus.movementX))
    //hStore.update(R.assocPath([key],fh))
   
    let f_update;
    // OBSERVER FOR MACRO THUMB DRAG
    if (atk.target.classList.contains('macro-thumb')) {
      let [from, to] = [
        [0, macro_w],
        ['0', MAX_H],
      ];
      // @ts-ignore
      f_update = R.pipe(U.clamp(['0', MAX_H]), add(U.scale(from, to)(sus.movementX * 0.1)));
      if (atk.target.id == 'h_r') {
        $hr = f_update($hr);
        $hrX_f = [$hrX, $hrX_f[1]];
      }
      if (atk.target.id == 'h_t') {
        $ht = f_update($ht);
        $htX_f = R.assoc([0], $htX, $htX_f);
      }
    }
  }

  function shiftdown_effect(val) {
    document.body.style.setProperty('overflow', 'hidden');
    document.getElementById('all-sliders').style.setProperty('overflow', 'hidden');
  }

  function shiftup_effect(val) {
    document.getElementById('all-sliders').style.setProperty('overflow', 'scroll');
  }

  function wheel_effect({atk,sus}) {
    let prev = zf
    let curr = R.clamp(0.0000001, 1, zf + U.scale([0, ih * 100], [0.0000001, 1])(sus.wheelDeltaY));
    let f = x=>curr/prev*x
    testStore2.updateField('z',R.map(R.always(f),$testStore2))
    zf = curr
  }

  let hit_;

  onMount(() => {
    console.log('App');
    pool_ = K.pool();
    pool_.plug(S.mouseup_);
    pool_.plug(S.mouseleave_(document.getElementById('test')));
    counterPlus_ = S.counterPlus_(document.getElementById('test'), pool_);
    move_ = mousemove_.thru(S.obs(move_feedback));
    shiftdown_.thru(S.obs(shiftdown_effect));
    shiftup_.thru(S.obs(shiftup_effect));
    wheel_ = 
      S.asr(S.capture(zf,shiftdown_), mousewheel_, shiftup_)
        .thru(S.obs(wheel_effect));
    drag_ = asr(
      mousedown_,
      K.merge([mousemove_.thru(S.obs(move_feedback)), counterPlus_]),
      mouseup_
    )
      .thru(S.obs(drag_effect2))
      .thru(S.obs(drag_feedback));
    hit_ = mousedown_.map((e) => R.assoc('targets', document.elementsFromPoint(e.x, e.y), e));
   
    //the handler of drag_ is the drag_handler of the equipped instrument
  });
</script>

<svelte:window bind:innerWidth={iw} bind:innerHeight={ih} />
<main>
  {#each Object.entries(instruments) as [name, { active, component, color, ev }]}
    <div
      id="ctr"
      style="position:fixed; width:0; height:0; z-index:100"
      class="container"
      class:inactive={!active}
    >
      <svelte:component this={instruments[name].component} {ev} {ih} {iw} {name} />
    </div>
  {/each}
  <div class="menu">
    <div class="instrument-palette">
      {#each Object.entries(instruments) as [name, { active, component, color, ev }]}
        <button class:active on:click={() => equip_effect(name)}>{name}</button>
      {/each}
    </div>
    <div id="test" style="background-color:blue">ok</div>
    <div id="" />
    <div class="presets">
      <button on:click={savePreset}>save</button>
      {#if presets.length > 0}
        {#each presets as { name, data, h0, h1 }}
          <span
            class="preset"
            role="textbox"
            bind:textContent={name}
            aria-multiline="false"
            contenteditable>{name}</span
          >
          <!-- <input class="renamable" type="text" bind:value={name} disabled/> -->
        {/each}
      {/if}
    </div>
  </div>
  <div class="app">
    <div class="ui">
      <div class="slider-container" id="macro-sliders">
        <div class="slider macro-slider">
          <div class="param-name">Macro #2 (Global exploration)</div>
          <div class="track" bind:clientWidth={macro_w}>
            <div
              id="h_r"
              class="macro-thumb"
              style="left:{hr_render * macro_w}px; width:{thumb_w}px"
            />
          </div>
        </div>

        <div class="slider macro-slider">
          <div class="param-name">Macro #2 (Local exploration)</div>
          <div class="track">
            <div
              id="h_t"
              class="macro-thumb"
              style="left:{ht_render * macro_w}px; width:{thumb_w}px"
            />
          </div>
        </div>
      </div>
      <div class="slider-container" id="all-sliders">
        <!-- The list of individual sliders is generated by iterating over the store containing sliders data-->
        {#each currentPreset as [k, { m, M, fullname, Lr, Lt }]}
          <div class="slider">
            <div class="param-name">{fullname}</div>
            <input type="number" class="bound" bind:value={m} />
            <div data-id={k} class="track" bind:clientWidth={track_w}>
              <div
                data-id={k}
                id={k + 'range'}
                class:preview={k.includes('os')}
                class:locked={k.length != 0}
                class="range slider"
                style="width:{zf * track_w}px;
                  left:{r_render(k) - (zf * track_w) / 2}px;"
                bind:clientWidth={range_w}
                on:click={() => handleClick('Lr', k)}
              />
              <div
                class="middle"
                data-id={k}
                style="width:{2}px;
                left:{r_render(k) - 1}px;"
              />
              <div
                data-id={k}
                id={k + 'thumb'}
                class:preview={k.includes('os')}
                class:locked={k.length != 0}
                class="thumb slider"
                style="left:{t_render(k) - thumb_w / 2}px; width:{thumb_w}px"
                bind:clientWidth={thumb_w}
                on:click={() => handleClick('Lt', k)}
              />
            </div>
            <input type="number" class="bound" bind:value={M} />
          </div>
        {/each}
      </div>
      <div class="slider-container" id="macro-sliders">
        <div class="slider macro-slider">
          <div class="param-name">Macro #2 (Global exploration)</div>
          <div class="track" bind:clientWidth={macro_w}>
            <div
              id="h_r"
              class="macro-thumb"
              style="left:{hr_render * macro_w}px; width:{thumb_w}px"
            />
          </div>
        </div>

        <div class="slider macro-slider">
          <div class="param-name">Macro #2 (Local exploration)</div>
          <div class="track">
            <div
              id="h_t"
              class="macro-thumb"
              style="left:{ht_render * macro_w}px; width:{thumb_w}px"
            />
          </div>
        </div>
      </div>
      <div class="slider-container" id="all-sliders">
        <!-- The list of individual sliders is generated by iterating over the store containing sliders data-->
        {#each Object.entries($testStore2) as [key, val]}
          <div class="slider">
            <div class="param-name" data-key={key}>{key}</div>
            <div style="width:10px">{val.c0}</div>
            <div class="track" bind:clientWidth={track_w}>
              <div data-key={key} data-field={"b"} class="range"
                style="width:{(track_w * val.z) / (val.c1 - val.c0)}px; 
                  left:{(track_w * (val.b-val.z / 2 - val.c0))/(val.c1-val.c0)}px;"
                bind:clientWidth={range_w}
              />
              <div class="middle" 
                style="width:{2}px; left:{(track_w * (val.b - val.c0)) /(val.c1 - val.c0)}px;"
              />
              <div data-key={key} data-field={"a"} class="thumb"
                style="left:{(track_w * (val.a - val.c0))/(val.c1 - val.c0)}px; width:{thumb_w}px"
                bind:clientWidth={thumb_w}
              />
            </div>
            <div style="width:10px">{val.c1}</div>
            <!-- <span>{key}</span><span>---</span> <span>{Object.values(val)}</span> -->
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
  .active {
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
</style>
