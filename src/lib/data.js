export const preset1 = [
    {key:"os1f", min:0, max:1000}, //freq, float, no right bound
    {key:"os1s", min:0, max:10}, //sync
    {key:"os1o", min:0, max:10}, //offset
    {key:"co1r", min:-10, max:255}, //red, int
    {key:"co1g",min:0, max:255}, //green, int
    {key:"co1b",min:0, max:255}, //blue, int
    {key:"ro1a",min:0, max:2 * Math.PI}, //rotation angle
    {key:"ro1s",min:0, max:1000}, //rotation speed
    {key:"sh10",min:0, max:5},
    {key:"ro2a",min:0, max:2 * Math.PI}, //rotation angle
    {key:"ro2s",min:0, max:1000}, //rotation speed
    {key:"sc10",min:-0.5, max:10}, //scale
    {key:"re1r",min:0, max:1000}, //repeat reps, float
    {key:"re1o",min:-1000, max:1000}, //repeat offset, float
    {key:"re2r",min:0, max:1000}, //repeat reps, float
    {key:"re2o",min:-1000, max:1000}, //repeat offset, float
];

export const synth1 = p => h => h.osc(p.os1f, p.os1s, p.os1o).color(p.col1r, p.col1g, p.col1b).blend(h.o0)
.rotate(p.ro1a, p.ro1s).modulate(h.shape(p.sh10).rotate(p.ro2a, p.ro2s).scale(p.sc10)
.repeatX(p.re1r, p.re1o).modulate(h.o0, 237)
.repeatY(p.re2r, p.re2o)).out(h.o0);