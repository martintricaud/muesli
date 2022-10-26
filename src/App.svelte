<script>
  import { onMount } from 'svelte';
  import { sync } from './lib/stores.js';
  import * as U from './lib/utils.js';
  import * as S from './lib/utils-streams.js';
  import {preset1, synth1} from './lib/data.js';
  // import HydraRenderer from 'hydra-synth';
  import { wasm_functions as W} from './main.js';
 
  //BINDINGS FOR DOM ELEMENTS AND THEIR SIZES
  let hydra_canvas;
  let macro_width, track_width, range_width;
  let zoom_factor = 0.2;

  //LOADING PARAMETER PRESETS
  let data = preset1;

  //DEFINING CONSTANTS
  let [MAX_H, MAX_A] = [W.max_hilbert(32,data.length), Math.pow(2, 32)]

  $: r_tracks = Object.fromEntries(data.map(a => [a.key,[a.min,a.max]]))
  // $: r_tracks2 = U.objectMapper(r_tracks)(([key,[min,max]]=>[ key,[min+zoom_factor*(max-min/2),a.max-zoom_factor*(max-min/2)]]))

  // $: r_tracks2 = Object.fromEntries(data.map(a => [a.key,[a.min+zoom_factor*(max-min/2),a.max-zoom_factor*(max-min/2)]]))
  let axisNames = data.map(a=>a.key)

  // let axis =  [
  //   ["os1f", {r: false, t: false}], //freq, float, no right bound
  //   ["os1s", {r: false, t: false}], //sync
  //   ["os1o", {r: false, t: false}], //offset
  //   ["co1r", {r: false, t: false}]
  // ]
  
  //TWO WAY BINDINGS
  let hilbert_adjunction = (axes) => (bits) => [
    (h_index) => U.zipAsKeyVal(axes)(Float32Array.from(W.forward(h_index, bits, axes.length))),
    (h_axes) => W.inverse(Uint32Array.from(U.unzipIntoVal(h_axes)(axes)), bits),
  ]

  let remapping_adjunction = [
    ([hilbert_axes, ctx]) => [U.obj2objZipper(ctx)(hilbert_axes)(U.lerp_AB([0,MAX_A])),ctx],
    ([scaled_coordinates,ctx]) => [U.obj2objZipper(ctx)(scaled_coordinates)(U.lerp_BA([0,MAX_A])),ctx]
  ];

  let [hr, hr_axes_u32] = sync(...hilbert_adjunction(axisNames)(32));
  let [hr_axes_f32, r_data] = sync(...remapping_adjunction);
  $hr = W.biguint_prod(0.5,MAX_H,100);
  $: $hr_axes_f32 = [$hr_axes_u32, r_tracks]; //convert hilbert axes values to f32]

  //the freezing of dimensions should take place before prev line
  //$ht_axes_f32 = [filterLocked(ht_axes_u32),t_tracks]
  //For that we need to know which axis to freeze in hilbert ranges
  //so we lookup which parameter is located at axis i

  //let filterLocked = axes => axes.map((val,index)=>r_tracks[axisNames.get(index)].locked ?)
  // $: $HR_axes_f32 = [U.arrZipper($HR_axes_u32)(axisNames),r_tracks];

  $: t_tracks = U.obj2objZipper(U.zoom(r_tracks)(zoom_factor))($r_data[0])(U.computeSubrange)


  let [ht, ht_axes_u32] = sync(...hilbert_adjunction(axisNames)(32));
  let [ht_axes_f32, t_data] = sync(...remapping_adjunction);
  $ht = W.biguint_prod(0.5,MAX_H,100);
  $: $ht_axes_f32 = [$ht_axes_u32, t_tracks]; //convert hilbert axes values to f32
  //the freezing of dimensions should take place before prev line

  //RENDERING TO THE DOM
  $: r_render = key => U.lerp_AB(r_tracks[key])([0,track_width])($r_data[0][key])
  $: t_render = key => U.lerp_AB(t_tracks[key])([0,range_width])($t_data[0][key])
  $: hr_render = W.rescale_index($hr,32,data.length)
  $: ht_render = W.rescale_index($ht,32,data.length)
  
  //STREAMS AND THEIR OBSERVERS
  let drag_ = undefined;
  let click_ = undefined;

  let updateContextfulObject = ([obj,context],upd,key) => [{...obj,[key]:upd(obj[key])},context]
  
  function drag_handler(val) {
    let key = val.attack.target.dataset.id; //get the key of the target
    
    // OBSERVER FOR INDIVIDUAL THUMB DRAG
    if(val.attack.target.classList.contains("slider")){
      let scale = U.scale([0, track_width])(r_tracks[key]); //set a remapping function from the slider to the ranges
      let apply_delta = val.sustain.applyDelta(scale).x; //compute a new update function by currying the functor with g

      if(val.attack.target.classList.contains("range")){    
        let upd = U.compose(apply_delta,U.clamp(r_tracks[key]))
        $r_data = updateContextfulObject($r_data,upd,key)
        $hr_axes_u32 = $hr_axes_f32[0];
      }

      if(val.attack.target.classList.contains("thumb")){
        let upd = U.batchCompose(apply_delta,U.clamp(r_tracks[key]),U.clamp(t_tracks[key]));
        $t_data = updateContextfulObject($t_data,upd,key)
        $ht_axes_u32 = $ht_axes_f32[0];
      }
    }

    // OBSERVER FOR MACRO THUMB DRAG
    if(val.attack.target.classList.contains("macro-thumb")){
      console.log(val.sustain.delta)
      let g = U.scale2bigint([0,macro_width])(["0",MAX_H]);
      let apply_big_delta = a=>W.bigint_sum(a,g(val.sustain.delta.x));//compute a new update function by currying the functor with g
      let apply_bigint_clamp = a => W.bigint_clamp("0",MAX_H,a)
      let upd = U.batchCompose(apply_big_delta,apply_bigint_clamp)
      if(val.attack.target.id == 'h_r'){
        $hr = upd($hr)
        $hr_axes_f32[0] = $hr_axes_u32
      }
      if(val.attack.target.id == 'h_t'){     
        $ht = upd($ht)
        $ht_axes_f32[0] = $ht_axes_u32
      }
    }
  }
  
  onMount(() => {
    drag_ = S.asr(S.hit(S.mousedown_.thru(S.intoXY), document), S.mousemovedelta_, S.mouseup_);
    click_ = S.hit(S.mousedown_.thru(S.intoXY), document)
    drag_.thru((x) => x.onValue((val) => drag_handler(val)));
    // const h = new HydraRenderer({
    //   makeGlobal: false,
    //   detectAudio: false,
    //   canvas: hydra_canvas,
    //   precision: 'lowp',
    // }).synth;
    // // synth1($t_data[0])(h)
    // h.osc(9.634, -0.233, 0.782).color(-1.358, -2.921, -2.967).blend(h.o0)
    // .rotate(-0.486, -0.269).modulate(h.shape(7.614).rotate(0.957, 0.58).scale(3.054)
    // .repeatX(1.896, 2.632).modulate(h.o0, 237)
    // .repeatY(2.093, 2.059)).out(h.o0);
  });
</script>
<!-- <svelte:window bind:scrollY={zoom_factor} /> -->
<main>
  <div class="menu">
    <div class="instrument-palette"> 
      <button class="instrument">lock</button>
      <button class="instrument">delete</button>
    </div>
  </div>
  <div class="menu">
    {$hr}
  </div>
  <div class="app">
    <div class="ui">
      <div class="sliders" id="macro-sliders">
        <div class="slider macro-slider">
          <div class="track" bind:clientWidth={macro_width}>
            <div id="h_r" class="macro-thumb" style="left:{hr_render*macro_width}px; position:absolute" />
          </div>
        </div>
        <div class="slider macro-slider">
          <div class="track">
            <div id="h_t" class="macro-thumb" style="left:{ht_render*macro_width}px; position:absolute"/>
          </div>
        </div>
      </div>
      <div class="sliders" id="all-sliders">
        <!-- The list of individual sliders is generated by iterating over the store containing sliders data-->
        {#each data as {key,min,max}}
          <div class="slider">
            <input type="number" class="bound" bind:value={min} />
            <!-- <input class="bound" placeholder={r_tracks[key][0]} bind:value={r_tracks[key][0]} /> -->
            <div id={key + 'track'} class="track" bind:clientWidth={track_width}>
              <div
                data-id={key}
                id={key + 'range'}
                class="range slider"
                style=
                  "width:{zoom_factor * track_width}px;
                  left:{r_render(key)-(zoom_factor * track_width)/2}px;"
                bind:clientWidth={range_width}
              />
              <!-- The slider's thumb position is computed by remapping its data to the dimensions of its parent widget -->
            <div
              data-id={key}
              id={key + 'thumb'}
              class="thumb slider"
              style="left:{r_render(key)+t_render(key)-(zoom_factor * track_width)/2}px"
            />
            </div>
            <input type="number" class="bound" bind:value={max} />
          </div>
        {/each}
      </div>
    </div>
    <div class="viewport">
      <!-- {#each Object.entries($r_data[0]) as [key,value]}
        <div>
          {key}: {value}
        </div>
      {/each} -->
      <canvas bind:this={hydra_canvas} class="hydra-canvas" />
    </div>
  </div>
</main>
