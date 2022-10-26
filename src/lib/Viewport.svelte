<script>
    export let p;
    onMount(() => {
        drag_ = S.asr(S.hit(S.mousedown_.thru(S.intoXY), document), S.mousemovedelta_, S.mouseup_);
        click_ = S.hit(S.mousedown_.thru(S.intoXY), document);
        drag_.thru((x) => x.onValue((val) => drag_handler(val)));
        const h = new HydraRenderer({
            makeGlobal: false,
            detectAudio: false,
            canvas: hydra_canvas,
            precision: 'lowp',
        }).synth;
        // synth1($t_data[0])(h)
        h.osc(p.os1f, p.os1s, p.os1o)
            .color(p.col1r, p.col1g, p.col1b)
            .blend(h.o0)
            .rotate(p.ro1a, p.ro1s)
            .modulate(
                h
                    .shape(p.sh10)
                    .rotate(p.ro2a, p.ro2s)
                    .scale(p.sc10)
                    .repeatX(p.re1r, p.re1o)
                    .modulate(h.o0, 237)
                    .repeatY(p.re2r, p.re2o)
            )
            .out(h.o0);
    });
</script>

<p>The answer is {answer}</p>
