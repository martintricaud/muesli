import * as R from 'ramda'
export const preset1 = [
    {k:"os1f", m:0, M:1000, Lr: x=>x, Lt: x=>x}, //freq, float, no right bound
    {k:"os1o", m:0, M:10, Lr: x=>x, Lt: x=>x}, //offset
    {k:"co1r", m:0, M:100, Lr: x=>x, Lt: x=>x}, //red, int
    {k:"co1g",m:0, M:100, Lr: x=>x, Lt: x=>x}, //green, int
    {k:"co1b",m:0, M:100, Lr: x=>x, Lt: x=>x}, //blue, int
    {k:"ro1a",m:0, M:2 * Math.PI, Lr: x=>x, Lt: x=>x}, //rotation angle
    {k:"sh10",m:0, M:5, Lr: x=>x, Lt: x=>x},
    {k:"ro2a",m:0, M:2 * Math.PI, Lr: x=>x, Lt: x=>x}, //rotation angle
    {k:"mo10",m:0, M:1000, Lr: x=>x, Lt: x=>x}, //rotation angle
    {k:"sc10",m:-0.5, M:10, Lr: x=>x, Lt: x=>x}, //scale
    {k:"re1r",m:0, M:1000, Lr: x=>x, Lt: x=>x}, //repeat reps, float
    {k:"re1o",m:-1000, M:1000, Lr: x=>x, Lt: x=>x}, //repeat offset, float
    {k:"re2r",m:0, M:1000, Lr: x=>x, Lt: x=>x}, //repeat reps, float
    {k:"re2o",m:-1000, M:1000, Lr: x=>x, Lt: x=>x}, //repeat offset, float
];

export const preset1bis = [
    ["os1f", { m:0, M:1000, Lr: x=>x, Lt: x=>x}], //freq, float, no right bound
    ["os1o", { m:0, M:10, Lr: x=>x, Lt: x=>x}], //offset
    ["co1r", { m:0, M:100, Lr: x=>x, Lt: x=>x}], //red, int
    ["co1g", {m:0, M:100, Lr: x=>x, Lt: x=>x}], //green, int
    ["co1b", {m:0, M:100, Lr: x=>x, Lt: x=>x}], //blue, int
    ["ro1a", {m:0, M:2 * Math.PI, Lr: x=>x, Lt: x=>x}], //rotation angle
    ["sh10", {m:0, M:5, Lr: x=>x, Lt: x=>x}],
    ["ro2a", {m:0, M:2 * Math.PI, Lr: x=>x, Lt: x=>x}], //rotation angle
    ["mo10", {m:0, M:1000, Lr: x=>x, Lt: x=>x}], //rotation angle
    ["sc10", {m:-0.5, M:10, Lr: x=>x, Lt: x=>x}], //scale
    ["re1r", {m:0, M:1000, Lr: x=>x, Lt: x=>x}], //repeat reps, float
    ["re1o", {m:-1000, M:1000, Lr: x=>x, Lt: x=>x}], //repeat offset, float
    ["re2r", {m:0, M:1000, Lr: x=>x, Lt: x=>x}], //repeat reps, float
    ["re2o", {m:-1000, M:1000, Lr: x=>x, Lt: x=>x}] //repeat offset, float
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
    ["os1f",{ m:0, M:100, Lr: x=>x, Lt: x=>x, fullname:"oscillator 1 frequency"}], //freq, float, no right bound but above 100 is a lot
    ["os1o",{ m:0, M:10, Lr: x=>x, Lt: x=>x, fullname:"oscillator 1 offset"}], //offset
    ["co1r",{ m:0, M:10, Lr: x=>x, Lt: x=>x, fullname:"color 1 red"}], //red, int
    ["co1g",{m:0, M:10, Lr: x=>x, Lt: x=>x, fullname:"color 1 green"}], //green, int
    ["co1b",{m:0, M:10, Lr: x=>x, Lt: x=>x, fullname:"color 1 blue"}], //blue, int
    ["sa10",{m:0, M:10, Lr: x=>x, Lt: x=>x, fullname:"saturation"}], //saturation, int
    ["lu10",{m:0, M:1, Lr: x=>x, Lt: x=>x, fullname:"luma"}], 
    ["oskf",{m:0, M:100, Lr: x=>x, Lt: x=>x, fullname:"oscillator 2 frequency"}], //freq, float, no right bound but above 100 is a lot
    ["modk",{m:0, M:1, Lr: x=>x, Lt: x=>x, fullname:"kaleidoscopic modulation"}], 
    ["modRx",{m:0, M:10, Lr: x=>x, Lt: x=>x, fullname:"repeater modulation Xcount"}], 
    ["modRy",{m:0, M:10, Lr: x=>x, Lt: x=>x, fullname:"repeater modulation Ycount"}], 
    ["modOx",{m:0, M:10, Lr: x=>x, Lt: x=>x, fullname:"repeater modulation Xoffset"}], 
    ["modOy",{m:0, M:10, Lr: x=>x, Lt: x=>x, fullname:"repeater modulation Yoffset"}], 
    ["oscModRf",{m:0, M:100, Lr: x=>x, Lt: x=>x, fullname:"oscillator 3 frequency"}], 
    ["rot",{m:0, M:2 * Math.PI, Lr: x=>x, Lt: x=>x, fullname:"rotation"}], 
    ["mod",{m:0, M:1, Lr: x=>x, Lt: x=>x, fullname:"modulation"}], 
    ["sca",{m:0.01, M:10, Lr: x=>x, Lt: x=>x, fullname:"scale"}], 
    ["po1",{m:0.01, M:10, Lr: x=>x, Lt: x=>x, fullname:"posterize 1"}], 
    ["po2",{m:0.01, M:10, Lr: x=>x, Lt: x=>x, fullname:"posterize 2"}], 
];

export const preset2bis = [
    ["os1f",{ c0:0, c1:100}], //freq, float, no right bound but above 100 is a lot
    ["os1o",{ c0:0, c1:10}], //offset
    ["co1r",{ c0:0, c1:10}], //red, int
    ["co1g",{c0:0, c1:10}], //green, int
    ["co1b",{c0:0, c1:10}], //blue, int
    ["sa10",{c0:0, c1:10}], //saturation, int
    ["lu10",{c0:0, c1:1}],     
    ["oskf",{c0:0, c1:100}], //freq, float, no right bound but above 100 is a lot
    ["modk",{c0:0, c1:1}], 
    ["modRx",{c0:0, c1:10}], 
    ["modRy",{c0:0, c1:10}], 
    ["modOx",{c0:0, c1:10}], 
    ["modOy",{c0:0, c1:10}], 
    ["oscModRf",{c0:0, c1:100}], 
    ["rot",{c0:0, c1:2 * Math.PI}], 
    ["mod",{c0:0, c1:1}], 
    ["sca",{c0:0.01, c1:10}], 
    ["po1",{c0:0.01, c1:10}], 
    ["po2",{c0:0.01, c1:10}], 
];

export const synth2 = a => x => 
x.osc(Math.log(a.os1f), 1/Math.max(a.os1f,a.oscModRf,a.oskf), a.os1o)
.color(Math.log(a.co1r), Math.log(a.co1g), Math.log(a.co1b))
.saturate(a.sa10)
.modulateRepeat(x.osc(Math.log(a.oscModRf), 1/Math.max(a.os1f,a.oscModRf,a.oskf)).posterize(a.po1,a.po2),a.modRx, a.modOx, a.modRy, a.modOy)
.modulateKaleid(x.osc(Math.log(a.oskf),1/Math.max(a.os1f,a.oscModRf,a.oskf)),a.modk)
.rotate(a.rot, 0, 0).scale(Math.log(a.sca)).diff(x.o1)
.modulate(x.o0, a.mod )
.luma (a.lu10)
.out(x.o0)



