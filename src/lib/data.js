export const preset1 = [
    {k:"os1f", m:0, M:1000, r_lock: x=>x, t_lock: x=>x}, //freq, float, no right bound
    {k:"os1s", m:0, M:10, r_lock: x=>x, t_lock: x=>x}, //sync
    {k:"os1o", m:0, M:10, r_lock: x=>x, t_lock: x=>x}, //offset
    {k:"co1r", m:-10, M:255, r_lock: x=>x, t_lock: x=>x}, //red, int
    {k:"co1g",m:0, M:255, r_lock: x=>120, t_lock: x=>120}, //green, int
    {k:"co1b",m:0, M:255, r_lock: x=>x, t_lock: x=>x}, //blue, int
    {k:"ro1a",m:0, M:2 * Math.PI, r_lock: x=>x, t_lock: x=>x}, //rotation angle
    // {key:"ro1s",min:0, max:1000, r_lock: x=>x, t_lock: x=>x}, //rotation speed
    // {key:"sh10",min:0, max:5, r_lock: x=>x, t_lock: x=>x},
    // {key:"ro2a",min:0, max:2 * Math.PI, r_lock: x=>x, t_lock: x=>x}, //rotation angle
    // {key:"ro2s",min:0, max:1000, r_lock: x=>x, t_lock: x=>x}, //rotation speed
    // {key:"sc10",min:-0.5, max:10, r_lock: x=>x, t_lock: x=>x}, //scale
    // {key:"re1r",min:0, max:1000, r_lock: x=>x, t_lock: x=>x}, //repeat reps, float
    // {key:"re1o",min:-1000, max:1000, r_lock: x=>x, t_lock: x=>x}, //repeat offset, float
    // {key:"re2r",min:0, max:1000, r_lock: x=>x, t_lock: x=>x}, //repeat reps, float
    // {key:"re2o",min:-1000, max:1000, r_lock: x=>x, t_lock: x=>x}, //repeat offset, float
];

export const synth1 = p => h => h.osc(p.os1f, p.os1s, p.os1o).color(p.col1r, p.col1g, p.col1b).blend(h.o0)
.rotate(p.ro1a, p.ro1s).modulate(h.shape(p.sh10).rotate(p.ro2a, p.ro2s).scale(p.sc10)
.repeatX(p.re1r, p.re1o).modulate(h.o0, 237)
.repeatY(p.re2r, p.re2o)).out(h.o0);