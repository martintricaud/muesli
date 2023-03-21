import * as R from 'ramda'
import { wasm_functions as W } from '../main.js';
import * as U from './utils'
// export const preset1 = [
//     { k: "os1f", m: 0, M: 1000, Lr: x => x, Lt: x => x }, //freq, float, no right bound
//     { k: "os1o", m: 0, M: 10, Lr: x => x, Lt: x => x }, //offset
//     { k: "co1r", m: 0, M: 100, Lr: x => x, Lt: x => x }, //red, int
//     { k: "co1g", m: 0, M: 100, Lr: x => x, Lt: x => x }, //green, int
//     { k: "co1b", m: 0, M: 100, Lr: x => x, Lt: x => x }, //blue, int
//     { k: "ro1a", m: 0, M: 2 * Math.PI, Lr: x => x, Lt: x => x }, //rotation angle
//     { k: "sh10", m: 0, M: 5, Lr: x => x, Lt: x => x },
//     { k: "ro2a", m: 0, M: 2 * Math.PI, Lr: x => x, Lt: x => x }, //rotation angle
//     { k: "mo10", m: 0, M: 1000, Lr: x => x, Lt: x => x }, //rotation angle
//     { k: "sc10", m: -0.5, M: 10, Lr: x => x, Lt: x => x }, //scale
//     { k: "re1r", m: 0, M: 1000, Lr: x => x, Lt: x => x }, //repeat reps, float
//     { k: "re1o", m: -1000, M: 1000, Lr: x => x, Lt: x => x }, //repeat offset, float
//     { k: "re2r", m: 0, M: 1000, Lr: x => x, Lt: x => x }, //repeat reps, float
//     { k: "re2o", m: -1000, M: 1000, Lr: x => x, Lt: x => x }, //repeat offset, float
// ];

// export const preset1bis = [
//     ["os1f", { m: 0, M: 1000, Lr: x => x, Lt: x => x }], //freq, float, no right bound
//     ["os1o", { m: 0, M: 10, Lr: x => x, Lt: x => x }], //offset
//     ["co1r", { m: 0, M: 100, Lr: x => x, Lt: x => x }], //red, int
//     ["co1g", { m: 0, M: 100, Lr: x => x, Lt: x => x }], //green, int
//     ["co1b", { m: 0, M: 100, Lr: x => x, Lt: x => x }], //blue, int
//     ["ro1a", { m: 0, M: 2 * Math.PI, Lr: x => x, Lt: x => x }], //rotation angle
//     ["sh10", { m: 0, M: 5, Lr: x => x, Lt: x => x }],
//     ["ro2a", { m: 0, M: 2 * Math.PI, Lr: x => x, Lt: x => x }], //rotation angle
//     ["mo10", { m: 0, M: 1000, Lr: x => x, Lt: x => x }], //rotation angle
//     ["sc10", { m: -0.5, M: 10, Lr: x => x, Lt: x => x }], //scale
//     ["re1r", { m: 0, M: 1000, Lr: x => x, Lt: x => x }], //repeat reps, float
//     ["re1o", { m: -1000, M: 1000, Lr: x => x, Lt: x => x }], //repeat offset, float
//     ["re2r", { m: 0, M: 1000, Lr: x => x, Lt: x => x }], //repeat reps, float
//     ["re2o", { m: -1000, M: 1000, Lr: x => x, Lt: x => x }] //repeat offset, float
// ];



// export const synth1 = (a) => x =>
//     x.osc(a.os1f, 1 / a.os1f, a.os1o)
//         .color(a.co1r, a.co1g, a.co1b)
//         .blend(x.o0).rotate(a.ro1a, 0)
//         .modulate(
//             x.shape(a.sh10)
//                 .rotate(a.ro2a, 0)
//                 .scale(a.sc10)
//                 .repeatX(a.re1r, a.re1o)
//                 .modulate(x.o0, a.mo10)
//                 .repeatY(a.re2r, a.re2o))
//         .out(x.o0);



// export const preset2 = [
//     ["os1f", { c0: 0, c1: 100, Lr: x => x, Lt: x => x, fullname: "oscillator 1 frequency" }], //freq, float, no right bound but above 100 is a lot
//     ["os1o", { c0: 0, c1: 10, Lr: x => x, Lt: x => x, fullname: "oscillator 1 offset" }], //offset
//     ["co1r", { c0: 0, c1: 10, Lr: x => x, Lt: x => x, fullname: "color 1 red" }], //red, int
//     ["co1g", { c0: 0, c1: 10, Lr: x => x, Lt: x => x, fullname: "color 1 green" }], //green, int
//     ["co1b", { c0: 0, c1: 10, Lr: x => x, Lt: x => x, fullname: "color 1 blue" }], //blue, int
//     ["sa10", { c0: 0, c1: 10, Lr: x => x, Lt: x => x, fullname: "saturation" }], //saturation, int
//     ["lu10", { c0: 0, c1: 1, Lr: x => x, Lt: x => x, fullname: "luma" }],
//     ["oskf", { c0: 0, c1: 100, Lr: x => x, Lt: x => x, fullname: "oscillator 2 frequency" }], //freq, float, no right bound but above 100 is a lot
//     ["modk", { c0: 0, c1: 1, Lr: x => x, Lt: x => x, fullname: "kaleidoscopic modulation" }],
//     ["modRx", { c0: 0, c1: 10, Lr: x => x, Lt: x => x, fullname: "repeater modulation Xcount" }],
//     ["modRy", { c0: 0, c1: 10, Lr: x => x, Lt: x => x, fullname: "repeater modulation Ycount" }],
//     ["modOx", { c0: 0, c1: 10, Lr: x => x, Lt: x => x, fullname: "repeater modulation Xoffset" }],
//     ["modOy", { c0: 0, c1: 10, Lr: x => x, Lt: x => x, fullname: "repeater modulation Yoffset" }],
//     ["oscModRf", { c0: 0, c1: 100, Lr: x => x, Lt: x => x, fullname: "oscillator 3 frequency" }],
//     ["rot", { c0: 0, c1: 2 * Math.PI, Lr: x => x, Lt: x => x, fullname: "rotation" }],
//     ["mod", { c0: 0, c1: 1, Lr: x => x, Lt: x => x, fullname: "modulation" }],
//     ["sca", { c0: 0.01, c1: 10, Lr: x => x, Lt: x => x, fullname: "scale" }],
//     ["po1", { c0: 0.01, c1: 10, Lr: x => x, Lt: x => x, fullname: "posterize 1" }],
//     ["po2", { c0: 0.01, c1: 10, Lr: x => x, Lt: x => x, fullname: "posterize 2" }],
// ];

export const preset0: Array<[string, Record<string, number | boolean>]> = [
    ["os1f", { c0: 0, c1: 100, locked:false }], //freq, float, no right bound but above 100 is a lot
    ["os1o", { c0: 0, c1: 10, locked:false }], //offset
    ["co1r", { c0: 0, c1: 10, locked:false }], //red, int
    ["co1g", { c0: 0, c1: 10, locked:false }], //green, int
    ["co1b", { c0: 0, c1: 10, locked:false }], //blue, int
    ["sa10", { c0: 0, c1: 10, locked:false }], //saturation, int
    ["lu10", { c0: 0, c1: 1, locked:false }],
    ["oskf", { c0: 0, c1: 100, locked:false }], //freq, float, no right bound but above 100 is a lot
    ["modk", { c0: 0, c1: 1, locked:false }],
    ["modRx", { c0: 0, c1: 10, locked:false }],
    ["modRy", { c0: 0, c1: 10, locked:false }],
    ["modOx", { c0: 0, c1: 10, locked:false }],
    ["modOy", { c0: 0, c1: 10, locked:false }],
    ["oscModRf", { c0: 0, c1: 100, locked:false }],
    ["rot", { c0: 0, c1: 2 * Math.PI, locked:false }],
    ["mod", { c0: 0, c1: 1, locked:false }],
    ["sca", { c0: 0.01, c1: 10, locked:false }],
    ["po1", { c0: 0.01, c1: 10, locked:false }],
    ["po2", { c0: 0.01, c1: 10, locked:false }],
];


// export const macros = [["h_global", {
//     c0: '0',
//     c1: U.fMAX_H(32, 19)
// }], ['h_local', {
//     c0: '0',
//     c1: U.fMAX_H(32, 19)
// }]]

export const synth2 = a => x =>
    x.osc(Math.log(a.os1f), 1 / Math.max(a.os1f, a.oscModRf, a.oskf), a.os1o)
        .color(Math.log(a.co1r), Math.log(a.co1g), Math.log(a.co1b))
        .saturate(a.sa10)
        .modulateRepeat(x.osc(Math.log(a.oscModRf), 1 / Math.max(a.os1f, a.oscModRf, a.oskf)).posterize(a.po1, a.po2), a.modRx, a.modOx, a.modRy, a.modOy)
        .modulateKaleid(x.osc(Math.log(a.oskf), 1 / Math.max(a.os1f, a.oscModRf, a.oskf)), a.modk)
        .rotate(a.rot, 0, 0).scale(Math.log(a.sca)).diff(x.o1)
        .modulate(x.o0, a.mod)
        .luma(a.lu10)
        .out(x.o0)



        
// export const synth1 = a => x => x.src(x.o0)
//     .modulateHue(
//         x.src(x.o0).scale(1.01),1)
//     .layer(x.osc(4,0.5,2).mask(x.shape(4,0.5,0.001)))
//     .modulate(x.noise(a.noiseScale),a.modulationAmount)
//     .blend(x
//         .src(x.o0)
//         .modulate(
//             x.osc(6,0,1.5)
//             .modulate(
//                 x.noise(3)
//                 .sub(x.gradient()),
//             1)
//             .brightness(-0.5),
//         0.003)
//         .layer(
//             x.osc(30,0.1,1.5)
//             .mask(
//                 x.shape(4,0.3,0)
//                 .repeat(3, 3)
//                 .scale(2)
//                 .repeat(5, 5, 2, 3)
//             )
//         ),
//         a.blendAmount)
//         .add(x.gradient(),-1)
// .out(x.o0)


export const preset1: Array<[string, Record<string, number | boolean>]> = [
    ["noiseScale", { c0: 0, c1: 1, locked:false }], //freq, float, no right bound but above 100 is a lot
    ["noiseScale2", { c0: 0, c1: 1, locked:false }], //freq, float, no right bound but above 100 is a lot
    ["noiseOffset2", { c0: 0, c1: 10, locked:false }], //freq, float, no right bound but above 100 is a lot
    ["modulationAmount2", { c0: 0, c1: 5, locked:false }], //offset
    ["blendAmount", { c0: 0, c1: 10, locked:false }], //red, int
    ["oscillator1Frequency", { c0: 0, c1: 50, locked:false }], //red, int
    ["feedbackScale", { c0: 0.1, c1: 10, locked:false }], //red, int
    ["hueModulationAmount", { c0: 0, c1: 10, locked:false }], //offset
    ["noiseThreshold", { c0: 0, c1: 1, locked:false }], //offset
    ["noiseThresholdTolerance", { c0: 0, c1: 1, locked:false }], //offset
    ["shapeSize", { c0: 0.1, c1: 2, locked:false }], //offset
    ["shapeSize2", { c0: 0.1, c1: 2, locked:false }], //offset
    ["oscillator2Frequency", { c0: 0, c1: 100, locked:false }], //offset
    ["oscillator2Offset", { c0: 0, c1: 5, locked:false }], //offset
    ["oscillator1Offset", { c0: 0, c1: 5, locked:false }], //offset
    ["rotate", { c0: 0, c1: 1, locked:false }], //offset
    ["shapeScale", { c0: 0.1, c1: 10, locked:false }], //offset
    ["voronoi", { c0: 1, c1: 20, locked:false }], //offset
    ["repeatX", { c0: 1, c1: 20, locked:false }], //offset
    ["repeatY", { c0: 1, c1: 20, locked:false }], //offset
    ["shiftRed", { c0: 0, c1: 1, locked:false }], //offset
    ["shiftBlue", { c0: 0, c1: 1, locked:false }], //offset
    ["shiftGreen", { c0: 0, c1: 1, locked:false }], //offset
    ["saturationAmount", { c0: 0, c1: 1, locked:false }], //offset
    ["brightnessAmount", { c0: 0, c1: 1, locked:false }], //offset
    ["shapeSmoothing", { c0: 0, c1: 1, locked:false }], //offset
];


export const synth1 = a => x => x.src(x.o0)
    .modulateHue(
        x.src(x.o0).scale(a.feedbackScale),a.hueModulationAmount
    )
    .layer(
        x.osc(a.oscillator1Frequency,0, a.oscillator1Offset+0.5)
            .mult(x.voronoi(Math.log(a.voronoi),0,a.voronoi),a.modulationAmount2)
                .mask(
                    x.shape(4,a.shapeSize, Math.abs(1-a.shapeSmoothing))
                    .modulateRepeat(x.osc(a.oscillator1Frequency,0,a.oscillator2Offset+1), 3.0, 3.0, 0.5, 0.5)
                )
    )
    .modulate(x.noise(a.noiseScale).thresh(a.noiseThreshold,a.noiseThresholdTolerance),a.modulationAmount2)
    .shift(a.shiftRed,a.shiftGreen,a.shiftBlue)
    .add(x
        .src(x.o0)
        .modulate(
            x.osc(a.oscillator2Frequency+10,0,a.oscillator2Offset)
            .modulate(
                x.noise(a.noiseScale2,a.noiseOffset2).thresh(a.noiseThreshold,a.noiseThresholdTolerance)
                .sub(
                    x.gradient().saturate(a.saturationAmount)
                )
                ,
            1)
            ,
       a.modulationAmount2)
        .layer(
            x.osc(
                Math.sqrt(a.oscillator1Frequency),0,a.oscillator2Offset
            ).rotate(a.rotate)
            // .posterize(0.1,0.6 )
            .mask(
                x.shape(3,a.shapeSize+1,a.shapeSmoothing)
                .repeat(a.repeatX, a.repeatY)
                .scale(a.shapeScale).rotate(a.rotate)
            )
        )
        // .posterize(1,0.6 )
        ,
        a.blendAmount)
        .diff(
            x.gradient()
            .brightness(a.brightnessAmount)
            .saturate(a.saturationAmount)
            .shift(0,a.shiftGreen/2,a.shiftBlue/10),0)
.out(x.o0)