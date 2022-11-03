export const preset1 = [
    {k:"os1f", m:0, M:1000, r_lock: x=>x, t_lock: x=>x}, //freq, float, no right bound
    {k:"os1o", m:0, M:10, r_lock: x=>x, t_lock: x=>x}, //offset
    {k:"co1r", m:0, M:100, r_lock: x=>x, t_lock: x=>x}, //red, int
    {k:"co1g",m:0, M:100, r_lock: x=>x, t_lock: x=>x}, //green, int
    {k:"co1b",m:0, M:100, r_lock: x=>x, t_lock: x=>x}, //blue, int
    {k:"ro1a",m:0, M:2 * Math.PI, r_lock: x=>x, t_lock: x=>x}, //rotation angle
    {k:"sh10",m:0, M:5, r_lock: x=>x, t_lock: x=>x},
    {k:"ro2a",m:0, M:2 * Math.PI, r_lock: x=>x, t_lock: x=>x}, //rotation angle
    {k:"mo10",m:0, M:1000, r_lock: x=>x, t_lock: x=>x}, //rotation angle
    {k:"sc10",m:-0.5, M:10, r_lock: x=>x, t_lock: x=>x}, //scale
    {k:"re1r",m:0, M:1000, r_lock: x=>x, t_lock: x=>x}, //repeat reps, float
    {k:"re1o",m:-1000, M:1000, r_lock: x=>x, t_lock: x=>x}, //repeat offset, float
    {k:"re2r",m:0, M:1000, r_lock: x=>x, t_lock: x=>x}, //repeat reps, float
    {k:"re2o",m:-1000, M:1000, r_lock: x=>x, t_lock: x=>x}, //repeat offset, float
];

export const synth1 = (a)=>x=> 
x.osc(a.os1f, 1/a.os1f, a.os1o)
.color(a.co1r, a.co1g, a.co1b)
.blend(x.o0).rotate(a.ro1a, 0)
.modulate(
    x.shape(a.sh10)
    .rotate(a.ro2a, 0)
    .scale(a.sc10)
    .repeatX(a.re1r, a.re1o)
    .modulate(x.o0, a.mo10)
    .repeatY(a.re2r, a.re2o))
.out(x.o0);

export const preset2 = [
    {k:"os1f", m:0, M:100, r_lock: x=>x, t_lock: x=>x}, //freq, float, no right bound
    {k:"os1o", m:0, M:10, r_lock: x=>x, t_lock: x=>x}, //offset
    {k:"co1r", m:0, M:10, r_lock: x=>x, t_lock: x=>x}, //red, int
    {k:"co1g",m:0, M:10, r_lock: x=>x, t_lock: x=>x}, //green, int
    {k:"co1b",m:0, M:10, r_lock: x=>x, t_lock: x=>x}, //blue, int
    {k:"sa10",m:0, M:10, r_lock: x=>x, t_lock: x=>x}, //blue, int
];

export const synth2 = a => x => 
x.osc(a.os1f, 0, a.os1o)
.color(a.co1r, a.co1g, a.co1b)
.saturate(a.sa10)
.modulateRepeat(x.osc(2),1, 2, 4, 3)
.modulateKaleid(x.osc(12,0,0),1)
.luma (0.4)
.rotate(4, 0.1,0)
.modulate(x.o0, 0 )
.scale(1).diff(x.o1)
.out(x.o0)
