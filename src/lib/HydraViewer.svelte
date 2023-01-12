<script>
    import { onMount, afterUpdate, beforeUpdate } from 'svelte';
    import HydraRenderer from 'hydra-synth';
    let hydracanvas
    export let synth;
    export let data;
    export let w;
    export let h;
    export let autoloop;
    export let size;

    let hydrasynth;
    let h0

    onMount(() => {
        h0 = new HydraRenderer({
            makeGlobal: false,
            autoLoop: {autoloop},
            detectAudio: false,
            precision: 'highp',
            canvas: hydracanvas,
        })
        hydrasynth = h0.synth;
    });

    afterUpdate(() => {
        return synth(data)(hydrasynth);
    });
</script>

<canvas 
    bind:this={hydracanvas}
    class={size}
    width={w}
    height={h}
/>

<style>
	/* .big {
        min-width:100%;
		max-width: 100vw;
        
	} */
</style>