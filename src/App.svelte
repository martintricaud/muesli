<script>
  import { onMount, afterUpdate } from 'svelte';
  import { sync } from './lib/stores.js';
  import * as U from './lib/utils.js';
  import * as S from './lib/utils-streams.js';
  import {preset1, synth1} from './lib/data.js';
  import HydraRenderer from 'hydra-synth';
  import { wasm_functions as W} from './main.js';

  // NOTATIONS
 
  // BINDINGS FOR DOM ELEMENTS AND THEIR SIZES
  let hydra_canvas;
  let h;
  let macro_w, track_w, range_w;
  let zf = 0.8; //Zoom Factor
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
  let data = preset1;

  // DEFINING CONSTANTS
  let [MAX_H, MAX_A] = [W.max_hilbert(32,data.length), Math.pow(2, 32)]

  // $: r_tracks = Object.fromEntries(data.map(a => [a.key,[a.min,a.max]]))
  $: mapData = U.arr2objMapper(data)
  $: r_tracks = mapData(({k,m,M}) => [k,[m,M]])
  $: r_tracks_padded = mapData(({k,m,M}) => [k,[m+zf*(M-m)/2,M-zf*(M-m)/2]])

  
  let axisNames = data.map(a=>a.k)
  
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
  let [hr, hr_axes_u32] = sync(...hilbert_adjunction(axisNames)(32));
  let [hr_axes_f32, r_data] = sync(...remapping_adjunction);
  $hr = W.biguint_prod(0.5,MAX_H,100);
  $: locked_r = mapData(({k,r_lock})=>[k, r_lock])
  $: $hr_axes_f32 = [U.objUpdate_partial(locked_r)($hr_axes_u32), r_tracks_padded]; //convert hilbert axes values to f32]
  $: t_tracks = U.obj2objZipper(U.zoom(r_tracks_padded)(zf))($r_data[0])(U.computeSubrange)

  // THUMB SLIDERS
  let [ht, ht_axes_u32] = sync(...hilbert_adjunction(axisNames)(32));
  let [ht_axes_f32, t_data] = sync(...remapping_adjunction);
  $ht = W.biguint_prod(0.5,MAX_H,100);
  $: locked_t = mapData(x=>[x.k, x.t_lock])
  $: $ht_axes_f32 = [U.objUpdate_partial(locked_t)($ht_axes_u32), t_tracks]; 

  // RENDERING TO THE DOM
  $: r_render = k => U.lerp_AB(r_tracks_padded[k])([0+zf*track_w/2,track_w-zf*track_w/2])($r_data[0][k])
  $: t_render = k => U.lerp_AB(t_tracks[k])([0,range_w])($t_data[0][k])
  $: hr_render = W.rescale_index($hr,32,data.length)
  $: ht_render = W.rescale_index($ht,32,data.length)
  
  // STREAMS AND THEIR OBSERVERS
  let drag_ = undefined;
  let shiftdown_ = undefined;
  let shiftup_ = undefined;
  let click_ = undefined;
  
  function wheel_handler(e){
    console.log(e.sustain.wheelDeltaY)
    }
    // // let apply_wheel_delta = val.sustain.applyDelta(scale).x;
    // let update;
    // zf = U.clamp([0,1])(update(zf));
  
  
  // //if we have a dun
  // let comply = (update)=>(adjunction) =>(val) =>  {
  //   return adjunction[1](update(adjunction[0](val)))
  // }

  // let r_comply = comply()

   //force biguint to comply to locked values
  function r_comply_to_locked_values(biguint){
    let a = hilbert_adjunction(axisNames)(32)[0](biguint)
    let updatewithlockedvalues = U.objUpdate_partial(mapData(x=>[x.k, x.r_lock]));
    let b = updatewithlockedvalues(a)
    return hilbert_adjunction(axisNames)(32)[1](b)
  }

  function t_comply_to_locked_values(biguint){
    let a = hilbert_adjunction(axisNames)(32)[0](biguint)
    let updatewithlockedvalues = Object.fromEntries(data.map(x=>[x.k, x.t_lock]));
    let b = U.objUpdate_partial(updatewithlockedvalues)(a)
    return hilbert_adjunction(axisNames)(32)[1](b)
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
        $hr = r_comply_to_locked_values(upd($hr))
        $hr_axes_f32[0] = $hr_axes_u32
      }
      if(val.attack.target.id == 'h_t'){     
        $ht = t_comply_to_locked_values(upd($ht))
        $ht_axes_f32[0] = $ht_axes_u32
      }
    }
  }

  $: [A,B,C] = [$t_data[0]["ro1a"],$t_data[0]["os1f"],0.58]

  $: ms =  ([a,b,c])=>x=>()=> x.osc(9.634, -0.233, 9.634).color(-1.358, -2.921, -2.967).blend(x.o0)
    .rotate(-0.486, -0.269).modulate(x.shape(()=>a).rotate(b, c).scale(3.054)
    .repeatX(1.896, 2.632).modulate(x.o0, 237)
    .repeatY(2.093, 2.059)).out(x.o0);

    afterUpdate(() => {
      h = new HydraRenderer({
      makeGlobal: false,
      detectAudio: false,
      canvas: hydra_canvas,
      precision: 'lowp',
    }).synth;
      return ms([A,B,C])(h)()
    });

  // $: mysynth = ([a,b,c])=>x=>()=>x.shape(a).rotate(b, c).scale(3.054)
  //   .repeatX(1.896, 2.632).modulate(x.o0, 237)
  //   .repeatY(2.093, 2.059)
    // h.osc(9.634, -0.233, 0.782).color(-1.358, -2.921, -2.967).blend(h.o0)
    // .rotate(-0.486, -0.269).modulate(h.shape(7.614).rotate(0.957, 0.58).scale(3.054)
    // .repeatX(1.896, 2.632).modulate(h.o0, 237)
    // .repeatY(2.093, 2.059)).out(h.o0);
   

  onMount(() => {
    drag_ = S.asr(S.hit(S.mousedown_.thru(S.intoXY), document), S.mousemovedelta_, S.mouseup_);
    drag_.thru((x) => x.onValue((val) => drag_handler(val)));
    shiftdown_ = S.shiftdown_.thru((x) => x.onValue((val) => document.body.style.setProperty("overflow","hidden")))
    shiftup_ = S.shiftup_.thru((x) => x.onValue((val) => document.body.style.setProperty("overflow","scroll")))
    wheel_ = S.asr(S.hold(shiftdown_),S.mousewheel_,shiftup_)
    wheel_.thru((x) => x.onValue((val) => wheel_handler(val)));
    click_ = S.hit(S.mousedown_.thru(S.intoXY), document)
    
 
   
    // h = new HydraRenderer({
    //   makeGlobal: false,
    //   detectAudio: false,
    //   // canvas: hydra_canvas,
    //   precision: 'lowp',
    // }).synth;

    // ms([A,B,C])(h)()

   
    // h.osc(9.634, -0.233, 0.782).color(-1.358, -2.921, -2.967).blend(h.o0)
    // .rotate(-0.486, -0.269).modulate(mysynth([A,B,C])(h)()).out(h.o0);

  });
</script>
<!-- <svelte:window bind:scrollY={zf} /> -->
<main>
  <div class="menu">
    <div class="instrument-palette"> 
      <button class="instrument">lock</button>
      <button class="instrument">delete</button>
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
            <div id="h_r" class="macro-thumb" style="left:{hr_render*macro_w}px" />
          </div>
        </div>
        <div class="slider macro-slider">
          <div class="track">
            <div id="h_t" class="macro-thumb" style="left:{ht_render*macro_w}px"/>
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
            <div
              data-id={k}
              id={k + 'thumb'}
              class="thumb slider"
              style="left:{r_render(k)+t_render(k)-(zf * track_w)/2}px"
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