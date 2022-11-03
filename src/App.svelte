<script>
  import { onMount, afterUpdate } from 'svelte';
  import { sync } from './lib/stores.js';
  import * as U from './lib/utils.js';
  import * as S from './lib/utils-streams.js';
  import {preset1, synth1} from './lib/data.js';
  import {preset2, synth2} from './lib/data.js';
  import HydraRenderer from 'hydra-synth';
  import { wasm_functions as W} from './main.js';

  // NOTATIONS
 
  // BINDINGS FOR DOM ELEMENTS AND THEIR SIZES
  let hydra_canvas;
  let h;
  let iw, ih, macro_w, track_w, range_w, thumb_w = 5;
  let zf = 0.6; //Zoom Factor
  let instruments = [
    // {"name": lock, "effect": target => }
    // the effect of an instrument is a mapping from the instrument's stream to a stream of update to be applied to the object's 

  ]; 

  //instrument = source: sourceType => target:targetType => {
    // let e = effect(sourceType,targetType)
    // 
  //}

  //substrates have a response function ("how much" of the instrument's instructions are actually applied to the substrate)
  //substrates have a behaviour (a function to update their state based on their previous state)

  //LOADING PARAMETER PRESETS
  // let data = preset1;
  let data = preset2;



  // DEFINING CONSTANTS
  let [MAX_H, MAX_A] = [W.max_hilbert(32,data.length), Math.pow(2, 32)]

  // $: r_tracks = Object.fromEntries(data.map(a => [a.key,[a.min,a.max]]))
  $: mapData = U.arr2objMapper(data)
  $: r_tracks = mapData(({k,m,M}) => [k,[m,M]])
  $: r_tracks_padded = mapData(({k,m,M}) => [k,[m+zf*(M-m)/2,M-zf*(M-m)/2]])
  
  let ax = data.map(a=>a.k)
  
  let foo_adjunction = [
    // array => object
    // object => array
  ]

  // TWO WAY BINDINGS
  let hilbert_adjunction = (axes) => (bits) => [
    (h_index) => U.zipAsKeyVal(axes)(Float32Array.from(W.forward(h_index, bits, axes.length))),
    (h_axes) => W.inverse(Uint32Array.from(U.unzipIntoVal(h_axes)(axes)), bits),
  ]

  let remapping_adjunction = [
    ([h_axes, ctx]) => [U.obj2objZipper(ctx)(h_axes)(U.lerp_AB([0,MAX_A])),ctx],
    ([scaled_coordinates,ctx]) => [U.obj2objZipper(ctx)(scaled_coordinates)(U.lerp_BA([0,MAX_A])),ctx]
  ];

  // RANGE SLIDERS
  let [hr, hr_axes_u32] = sync(...hilbert_adjunction(ax)(32));
  let [hr_axes_f32, r_data] = sync(...remapping_adjunction);
  $hr = W.biguint_prod(0.5,MAX_H,100);
  $: locked_r = mapData(({k,r_lock})=>[k, r_lock])
  $: $hr_axes_f32 = [U.objUpdate_partial(locked_r)($hr_axes_u32), r_tracks_padded]; //convert hilbert axes values to f32]
  $: t_tracks = U.obj2objZipper(U.zoom(r_tracks)(zf))($r_data[0])(U.computeSubrange)

  // THUMB SLIDERS
  let [ht, ht_axes_u32] = sync(...hilbert_adjunction(ax)(32));
  let [ht_axes_f32, t_data] = sync(...remapping_adjunction);
  $ht = W.biguint_prod(0.5,MAX_H,100);
  $: locked_t = mapData(x=>[x.k, x.t_lock])
  $: $ht_axes_f32 = [U.objUpdate_partial(locked_t)($ht_axes_u32), t_tracks]; 

  // RENDERING TO THE DOM
  $: r_render = k => U.lerp_AB(r_tracks[k])([0,track_w])($r_data[0][k])
  $: t_render = k => U.lerp_AB(r_tracks[k])([0,track_w])($t_data[0][k])
  $: hr_render = W.rescale_index($hr,32,data.length)
  $: ht_render = W.rescale_index($ht,32,data.length)
  
  // STREAMS AND THEIR OBSERVERS
  let drag_ = undefined;
  let shiftdown_ = undefined;
  let shiftup_ = undefined;
  let click_ = undefined;
  let wheel_ = undefined;

  let galois_pullBack = (adj)=>(f)=>(val)=>adj[1](f(adj[0](val)))  
  
  let comply = (slave) => (master) => {
    let a = hilbert_adjunction(ax)(32)[0](slave)
    let f = U.objUpdate_partial(mapData(a=>[a.k, a[master]]));
    return hilbert_adjunction(ax)(32)[1](f(a))
  }

  function wheel_handler(val){
    zf = U.clamp([0,1])(zf + U.scale([0, ih])([0,1])(val.sustain.wheelDeltaY)) 
  }

  function click_handler(val){
    let target = val.target.dataset.id
      console.log(target)
    // if(val.instrument == 'lock'){
      
    //   // let lockTarget =  target => targetItem => val => {let res = cible; cible[lock] = x=>val }
    //   // target = update(target)
    // }
  }
  function instrument_lock(val, instrument){
    let effect = instrument.effect //which is a function that maps a transformation of the instrument to a transformation of the substrate
    
  }
  function drag_handler(val) {
    let k = val.attack.target.dataset.id; //get the key of the target
    
    // OBSERVER FOR INDIVIDUAL THUMB DRAG
    if(val.attack.target.classList.contains("slider")){
      let scale = U.scale([0, track_w])(r_tracks[k]); //set a remapping function from the slider to the ranges
      let apply_delta = val.sustain.applyDelta(scale).x; //compute a new update function by currying the functor with g

      if(val.attack.target.classList.contains("range")){    
        let upd = U.compose(apply_delta,U.clamp(r_tracks_padded[k]))
        $r_data = U.updateContextfulObject($r_data,upd,k)
        $hr_axes_u32 = $hr_axes_f32[0];
      }

      if(val.attack.target.classList.contains("thumb")){
        let upd = U.batchCompose(apply_delta,U.clamp(r_tracks[k]),U.clamp(t_tracks[k]));
        $t_data = U.updateContextfulObject($t_data,upd,k)
        $ht_axes_u32 = $ht_axes_f32[0];
      }
    }

    // OBSERVER FOR MACRO THUMB DRAG
    if(val.attack.target.classList.contains("macro-thumb")){
      let scale = U.scale2bigint([0,macro_w])(["0",MAX_H]);
      let apply_big_delta = a=>W.bigint_sum(a,scale(val.sustain.delta.x));//compute a new update function by currying the functor with g
      let apply_bigint_clamp = a => W.bigint_clamp("0",MAX_H,a)
      let upd = U.batchCompose(apply_big_delta,apply_bigint_clamp)
      if(val.attack.target.id == 'h_r'){
        // $hr = r_comply_to_locked_values(upd($hr))
        $hr = comply(upd($hr))("r_lock")
        $hr_axes_f32[0] = $hr_axes_u32
      }
      if(val.attack.target.id == 'h_t'){     
        $ht = comply(upd($ht))("t_lock")
        $ht_axes_f32[0] = $ht_axes_u32
      }
    }
  }

  onMount(() => {
    drag_ = S.asr(S.hit(S.mousedown_.thru(S.intoXY), document), S.mousemovedelta_, S.mouseup_);
    drag_.thru((x) => x.onValue((val) => drag_handler(val)));
    shiftdown_ = S.shiftdown_.thru((x) => x.onValue((val) => document.body.style.setProperty("overflow","hidden")))
    shiftup_ = S.shiftup_.thru((x) => x.onValue((val) => document.body.style.setProperty("overflow","scroll")))
    wheel_ = S.asr(S.hold(shiftdown_),S.mousewheel_,shiftup_)
    wheel_.thru((x) => x.onValue((val) => wheel_handler(val)));
    // click_ = S.hit(S.mousedown_.thru(S.intoXY), document)
    // click_ = S.mousedown_.thru((x) => x.onValue((val) => console.log(val)))
    click_ = S.hit2(S.mousedown_, document).thru((x) => x.onValue((val) => click_handler(val)))

    h = new HydraRenderer({
      makeGlobal: false,
      autoLoop: true,
      detectAudio: false,
      canvas: hydra_canvas,
      precision: 'highp',
    }).synth;
  });

  afterUpdate(() => {
    return synth2($t_data[0])(h)
  });
</script>

<svelte:window bind:innerWidth={iw} bind:innerHeight={ih}/>
<main>
  <div class="menu">
    <div class="instrument-palette"> 
      <button class="instrument">lock</button>
      <button class="instrument">delete</button>
      <button class="instrument">save</button>
      <button class="instrument">load</button>
    </div>
  </div>
  <!-- <div class="menu">
    {$hr}
  </div> -->
  <div class="app">
    <div class="ui">
      <div class="sliders" id="macro-sliders">
        <div class="slider macro-slider">
          <div class="track" bind:clientWidth={macro_w}>
            <div id="h_r" class="macro-thumb" style="left:{hr_render*macro_w}px; width:{thumb_w}px" />
          </div>
        </div>
        <div class="slider macro-slider">
          <div class="track">
            <div id="h_t" class="macro-thumb" style="left:{ht_render*macro_w}px; width:{thumb_w}px"/>
          </div>
        </div>
      </div>
      <div class="sliders" id="all-sliders">
        <!-- The list of individual sliders is generated by iterating over the store containing sliders data-->
        {#each data as {k,m,M}}
          <div class="slider">
            <div>{k}</div>
            <input type="number" class="bound" bind:value={m} />
            <!-- <input class="bound" placeholder={r_tracks[key][0]} bind:value={r_tracks[key][0]} /> -->
            <div id={k + 'track'} class="track" bind:clientWidth={track_w}>
              <div
                data-id={k}
                id={k + 'range'}
                class="range slider"
                style=
                  "width:{zf * track_w}px;
                  left:{r_render(k)-(zf * track_w)/2}px;"
                bind:clientWidth={range_w}
              />
              <!-- The slider's thumb position is computed by remapping its data to the dimensions of its parent widget -->
              <!-- r_render(k)+t_render(k)-(zf * track_w)/2 -->
              <div
                data-id={k}
                id={k + 'thumb'}
                class="thumb slider"
                style="left:{t_render(k)-thumb_w/2}px; width:{thumb_w}px"
                bind:clientWidth={thumb_w}
              />
            </div>
            <input type="number" class="bound" bind:value={M} />
          </div>
        {/each}
      </div>
    </div>
    <div class="viewport">
      <canvas bind:this={hydra_canvas} class="hydra-canvas" />
    </div>
  </div>
</main>
