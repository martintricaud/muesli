<script>
    import { onMount, afterUpdate, beforeUpdate } from 'svelte';
    import HydraRenderer from 'hydra-synth';
    let hydracanvas
    export let w;
    export let h;

    let hydrasynth;
    let h0

    export let synth;
    export let data;
    beforeUpdate(()=>{
        
    })
    onMount(() => {
        h0 = new HydraRenderer({
            makeGlobal: false,
            autoLoop: true,
            detectAudio: false,
            precision: 'highp',
            canvas: hydracanvas,
        })
    
        hydrasynth = h0.synth;
        //hydrasynth.resize(w,h)
        console.log(h0.canvas)
    });

    afterUpdate(() => {
        return synth(data)(hydrasynth);
    });
</script>

<canvas 
    bind:this={hydracanvas}
    width={w}
    height={h}
    style="width:{w/2}px; height:100vh; position:relative; top:0; left:0" />

<style>
	canvas {
        min-width:100%;
		max-width: 100vw;
		height: 100%;
	}
</style>