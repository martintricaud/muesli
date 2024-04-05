import * as U from './utils'


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
	["os1f", { c0: 0, c1: 100, locked: false }], //freq, float, no right bound but above 100 is a lot
	["os1o", { c0: 0, c1: 10, locked: false }], //offset
	["co1r", { c0: 0, c1: 10, locked: false }], //red, int
	["co1g", { c0: 0, c1: 10, locked: false }], //green, int
	["co1b", { c0: 0, c1: 10, locked: false }], //blue, int
	["sa10", { c0: 0, c1: 10, locked: false }], //saturation, int
	["lu10", { c0: 0, c1: 1, locked: false }],
	["oskf", { c0: 0, c1: 100, locked: false }], //freq, float, no right bound but above 100 is a lot
	["modk", { c0: 0, c1: 1, locked: false }],
	["modRx", { c0: 0, c1: 10, locked: false }],
	["modRy", { c0: 0, c1: 10, locked: false }],
	["modOx", { c0: 0, c1: 10, locked: false }],
	["modOy", { c0: 0, c1: 10, locked: false }],
	["oscModRf", { c0: 0, c1: 100, locked: false }],
	["rot", { c0: 0, c1: 2 * Math.PI, locked: false }],
	["mod", { c0: 0, c1: 1, locked: false }],
	["sca", { c0: 0.01, c1: 10, locked: false }],
	["po1", { c0: 0.01, c1: 10, locked: false }],
	["po2", { c0: 0.01, c1: 10, locked: false }],
];


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
//     .modulate(x.noise(a.noise_scale),a.modulationAmount)
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


// export const preset1: Array<[string, Record<string, number | boolean>]> = [
//     ["noise_scale", { c0: 0, c1: 1, locked:false }], //freq, float, no right bound but above 100 is a lot
//     ["noise_scale2", { c0: 0, c1: 1, locked:false }], //freq, float, no right bound but above 100 is a lot
//     ["noiseOffset2", { c0: 0, c1: 10, locked:false }], //freq, float, no right bound but above 100 is a lot
//     ["modulationAmount2", { c0: 0, c1: 5, locked:false }], //offset
//     ["blendAmount", { c0: 0, c1: 10, locked:false }], //red, int
//     ["oscillator1Frequency", { c0: 0, c1: 50, locked:false }], //red, int
//     ["feedbackScale", { c0: 0.1, c1: 10, locked:false }], //red, int
//     ["hueModulationAmount", { c0: 0, c1: 10, locked:false }], //offset
//     ["noiseThreshold", { c0: 0, c1: 1, locked:false }], //offset
//     ["noiseThresholdTolerance", { c0: 0, c1: 1, locked:false }], //offset
//     ["shapeSize", { c0: 0.1, c1: 2, locked:false }], //offset
//     ["shapeSize2", { c0: 0.1, c1: 2, locked:false }], //offset
//     ["oscillator_2_frequency", { c0: 0, c1: 100, locked:false }], //offset
//     ["oscillator_2_offset", { c0: 0, c1: 5, locked:false }], //offset
//     ["oscillator_1_offset", { c0: 0, c1: 5, locked:false }], //offset
//     ["rotate", { c0: 0, c1: 1, locked:false }], //offset
//     ["shapeScale", { c0: 0.1, c1: 10, locked:false }], //offset
//     ["voronoi", { c0: 1, c1: 20, locked:false }], //offset
//     ["repeatX", { c0: 1, c1: 20, ]]]]]]]]]]]]]]]]]]]]]]]]]locked:false }], //offset
//     ["repeatY", { c0: 1, c1: 20, locked:false }], //offset
//     ["shiftRed", { c0: 0, c1: 1, locked:false }], //offset
//     ["shiftBlue", { c0: 0, c1: 1, locked:false }], //offset
//     ["shiftGreen", { c0: 0, c1: 1, locked:false }], //offset
//     ["saturationAmount", { c0: 0, c1: 1, locked:false }], //offset
//     ["brightnessAmount", { c0: 0, c1: 1, locked:false }], //offset
//     ["shapeSmoothing", { c0: 0, c1: 1, locked:false }], //offset
// ];

export const preset1 = [
	["frequency", { c0: 0.0001, c1: 100, a: 20, locked: false, display: "frequency" }],
	["offset", { c0: 0.0001, c1: 1, a: 0.5, locked: false, display: "offset" }],
	["noise_scale", { c0: 0.1, c1: 10, a: 5, locked: false, display: "noise scale" }],
	// ["noiseOffset", { c0: 0.0001, c1: 1, locked:false }],
	["noise_scale_1", { c0: 0.1, c1: 10, a: 5, locked: false, display: "noise scale 1" }],
	// ["noiseOffset1", { c0: 0.0001, c1: 1, locked:false }],
	["modulation_amount_1", { c0: 0.0001, c1: 1, a: 0.5, locked: false, display: "modulation amount" }],
	["modulation_amount_2", { c0: 0.0001, c1: 1, a: 0.5, locked: false, display: "modulation amount 2" }]]

//export const synth1 = a=>x=>x.osc(a.frequency, 1/a.frequency, a.offset).modulate(x.src(x.o0).modulate(x.noise(a.noise_scale, 1/a.noise_scale),a.modulationAmount1),a.modulationAmount2).posterize().out(x.o0)
export const synth1 = a => x => x["noise"](a.noise_scale1, 1 / a.noise_scale1)["modulate"](x.src(x.o0)["modulate"](x.osc(a.frequency, 1 / a.frequency, a.offset), a.modulation_amount_1), a.modulation_amount_2)["posterize"]()["out"](x.o0)

// export const synth1 = a => x => x.src(x.o0)
//     .modulateHue(
//         x.src(x.o0).scale(a.feedbackScale),a.hueModulationAmount
//     )
//     .layer(
//         x.osc(a.oscillator1Frequency,0, a.oscillator_1_offset+0.5)
//             .mult(x.voronoi(Math.log(a.voronoi),0,a.voronoi),a.modulationAmount2)
//                 .mask(
//                     x.shape(4,a.shapeSize, Math.abs(1-a.shapeSmoothing))
//                     .modulateRepeat(x.osc(a.oscillator1Frequency,0,a.oscillator_2_offset+1), 3.0, 3.0, 0.5, 0.5)
//                 )
//     )
//     .modulate(x.noise(a.noise_scale).thresh(a.noiseThreshold,a.noiseThresholdTolerance),a.modulationAmount2)
//     .shift(a.shiftRed,a.shiftGreen,a.shiftBlue)
//     .add(x
//         .src(x.o0)
//         .modulate(
//             x.osc(a.oscillator_2_frequency+10,0,a.oscillator_2_offset)
//             .modulate(
//                 x.noise(a.noise_scale2,a.noiseOffset2).thresh(a.noiseThreshold,a.noiseThresholdTolerance)
//                 .sub(
//                     x.gradient().saturate(a.saturationAmount)
//                 )
//                 ,
//             1)
//             ,
//        a.modulationAmount2)
//         .layer(
//             x.osc(
//                 Math.sqrt(a.oscillator1Frequency),0,a.oscillator_2_offset
//             ).rotate(a.rotate)
//             // .posterize(0.1,0.6 )
//             .mask(
//                 x.shape(3,a.shapeSize+1,a.shapeSmoothing)
//                 .repeat(a.repeatX, a.repeatY)
//                 .scale(a.shapeScale).rotate(a.rotate)
//             )
//         )
//         // .posterize(1,0.6 )
//         ,
//         a.blendAmount)
//         .diff(
//             x.gradient()
//             .brightness(a.brightnessAmount)
//             .saturate(a.saturationAmount)
//             .shift(0,a.shiftGreen/2,a.shiftBlue/10),0)
// .out(x.o0)



export const examples = [{
	// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
	// by Olivia Jack
	// https://ojack.github.io
	templateName: "Ojack 1",
	presetName: "preset0",
	inputSpace: [
		["oscillator_frequency", { c0: 0.0001, c1: 100, a: 1, locked: false }],
		["oscillator_offset", { c0: 0.0001, c1: 1, a: 1, locked: false }],
		["kaleidoscope_shape", { c0: 1, c1: 20, a: 2, locked: false }],
		["red", { c0: 0, c1: 1, a: 1, locked: false }],
		["green", { c0: 0, c1: 1, a: 1, locked: false }],
		["blue", { c0: 0, c1: 1, a: 1, locked: false }],
		["rotation_1", { c0: 0, c1: 1, a: 1, locked: false }],
		["rotation_2", { c0: 0, c1: 1, a: 1, locked: false }],
		["scale_factor", { c0: 0.0001, c1: 1, a: 1, locked: false }],
		["modulation_amount", { c0: 0.0001, c1: 1, a: 1, locked: false }]
	],
	synth: a => x => {
		return x.osc(a.oscillator_frequency, 1 / a.oscillator_frequency, a.oscillator_offset)
			.kaleid(a.kaleidoscope_shape)
			.color(a.red, a.green, a.blue)
			.rotate(a.rotation_1, a.rotation_2)
			.modulate(x.o0, a.modulation_amount)
			.scale(a.scale_factor)
			.out(x.o0)
	},
	h_global: U.prod(BigInt(2 ** (32 * 10)), 0.1, 6),
	h_local: U.prod(BigInt(2 ** (32 * 10)), 0.5, 6),
}, {
	// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
	// Puertas III
	// por Celeste Betancur
	// https://github.com/essteban
	templateName: "Puertas III",
	presetName: "preset0",
	inputSpace: [
		["oscillator_1_frequency", { c0: 0.0001, c1: 100, a: 1, locked: false }],
		["oscillator_1_offset", { c0: 0.0001, c1: 1, a: 1, locked: false }],
		["oscillator_2_frequency", { c0: 0.0001, c1: 100, a: 1, locked: false }],
		["oscillator_2_offset", { c0: 0.0001, c1: 1, a: 1, locked: false }],
		["kaleidoscope_shape", { c0: 1, c1: 20, a: 1, locked: false }],
		["repeatX", { c0: 0, c1: 5, a: 1, locked: false }],
		["repeatY", { c0: 0, c1: 5, a: 1, locked: false }],
		["modulation_amount", { c0: 0.0001, c1: 1, a: 1, locked: false }],
		["shape_modulation_sides", { c0: 0, c1: 20, a: 1, locked: false }],
		["shape_modulation_scale", { c0: 0.0001, c1: 10, a: 1, locked: false }],
		["shape_modulation_fade", { c0: 0, c1: 1, a: 1, locked: false }],
	],
	synth: a => x => {
		return x.osc(a.oscillator_1_frequency, 1 / a.oscillator_1_frequency, a.oscillator_1_offset)
			.modulateScale(
				x.osc(a.oscillator_2_frequency, 1 / a.oscillator_2_frequency, a.oscillator_2_offset)
					.kaleid(a.kaleidoscope_shape))
			.repeat(a.repeatX, a.repeatY)
			.modulate(x.o0, a.modulation_amount)
			.modulateKaleid(x.shape(a.shape_modulation_sides, a.shape_modulation_scale, a.shape_modulation_fade))
			.out(x.o0);
	},
	h_global: U.prod(BigInt(2 ** (32 * 10)), 0.1, 6),
	h_local: U.prod(BigInt(2 ** (32 * 10)), 0.5, 6),
}, {
	// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
	// by Olivia Jack
	// https://ojack.github.io
	templateName: "Ojack 2",
	presetName: "preset0",
	inputSpace: [
		["oscillator_1_frequency", { c0: 0.0001, c1: 100, a: 1, locked: false }],
		["oscillator_1_offset", { c0: 0.0001, c1: 1, a: 1, locked: false }],
		["oscillator_2_frequency", { c0: 0.0001, c1: 100, a: 1, locked: false }],
		["oscillator_2_offset", { c0: 0.0001, c1: 1, a: 1, locked: false }],
		["oscillator_2_threshold", { c0: 0, c1: 1, a: 1, locked: false }],
		["oscillator_2_rotation", { c0: 0, c1: 1, a: 1, locked: false }],
		["oscillator_3_frequency", { c0: 0.0001, c1: 100, a: 1, locked: false }],
		["oscillator_3_offset", { c0: 0.0001, c1: 1, a: 1, locked: false }],
		["oscillator_3_threshold", { c0: 0, c1: 1, a: 1, locked: false }],
		["oscillator_3_threshold_tolerance", { c0: 0, c1: 1, a: 1, locked: false }],
		["oscillator_3_modulation_amount", { c0: 0, c1: 1, a: 1, locked: false }],
		["red", { c0: 0, c1: 1, a: 1, locked: false }],
		["green", { c0: 0, c1: 1, a: 1, locked: false }],
		["blue", { c0: 0, c1: 1, a: 1, locked: false }],
		["rotation", { c0: 0, c1: 1, a: 1, locked: false }],
		["scale_factor", { c0: 0.0001, c1: 1, a: 1, locked: false }],
		["feedback_rotation", { c0: 0, c1: 1, a: 1, locked: false }],
		["feedback_modulation_amount", { c0: 0, c1: 1, a: 1, locked: false }]
	],
	synth: a => x => {
		return x.osc(a.oscillator_1_frequency, 1 / a.oscillator_1_frequency, a.oscillator_1_offset)
			.modulate(
				x.src(x.o0)
				.rotate(a.feedback_rotation), a.feedback_modulation_amount)
			.color(a.red, a.green, a.blue)
			.rotate(a.rotation, 0)
			.pixelate(0.576, 12.888)
			.mult(
				x.osc(a.oscillator_2_frequency, 1 / a.oscillator_2_frequency, a.oscillator_2_offset)
				.thresh(a.oscillator_2_threshold)
				.rotate(a.oscillator_2_rotation, 0))
			.modulateRotate(x.osc(a.oscillator_3_frequency, 1 / a.oscillator_3_frequency, a.oscillator_3_offset)
				.thresh(a.oscillator_3_threshold, a.oscillator_3_threshold_tolerance), a.oscillator_3_modulation_amount)
			.out(x.o0);
	},
	h_global: U.prod(BigInt(2 ** (32 * 10)), 0.1, 6),
	h_local: U.prod(BigInt(2 ** (32 * 10)), 0.5, 6),
},{
	templateName: "Grayscale Noise",
	presetName: "preset0",
	inputSpace:
		[
			["frequency", { c0: 0.0001, c1: 1000, a: 1, locked: false }],
			["offset", { c0: 0.0001, c1: 1, a: 1, locked: false  }],
			["noise_scale", { c0: 0.1, c1: 10, a: 1, locked: false }],
			["noise_scale_1", { c0: 0.1, c1: 10, a: 1, locked: false }],
			["modulation_amount_1", { c0: 0.0001, c1: 1, a: 1, locked: false }],
			["modulation_amount_2", { c0: 0, c1: 1, a: 1, locked: false }]
		],
	synth: a => x => {
		return x.noise(a.noise_scale_1, 1 / a.noise_scale_1)
			.modulate(
				x.src(x.o0)
				.modulate(
					x.osc(a.frequency, 1 / a.frequency, a.offset), a.modulation_amount_1), a.modulation_amount_2)
			.posterize()
			.out(x.o0)
	},
	h_global: U.prod(BigInt(2 ** (32 * 10)), 0.1, 6),
	h_local: U.prod(BigInt(2 ** (32 * 10)), 0.5, 6),
},{
	author: "Asdrúbal Gomez",
	templateName:"Asdrubal",
	presetName:"preset0",
	inputSpace:[
		["frequency", { c0: 0.0001, c1: 100, a: 1, locked: false }],
		["offset", { c0: 0.0001, c1: 1, a: 1, locked: false  }],
		["noise_scale", { c0: 1, c1: 10, a: 1, locked: false }],
		["noise_scale_1", { c0: -10, c1: 10, a: 0, locked: false }],
		["modulation_amount_1", { c0: 0.0001, c1: 1, a: 1, locked: false }],
		["modulation_amount_2", { c0: 0.0001, c1: 1, a: 1, locked: false }]
	],
	synth:a => x => {
		return x.noise(3, 0.1, 6.157)
		.rotate(1, -1.941, -2)
		.mask(x.shape(20))
		.colorama(0.959)
		.modulateScale(x.o0)
		.modulateScale(x.o0, 0.291)
		.blend(x.o0)
		.blend(x.o0)
		.blend(x.o0)
		.blend(x.o0)
		.out(x.o0);
	}
}]

// osc(60,-0.015,0.3).diff(osc(60,0.08).rotate(Math.PI/2))
// 	.modulateScale(noise(3.5,0.25).modulateScale(osc(15).rotate(()=>Math.sin(time/2))),0.6)
// 	.color(1,0.5,0.4).contrast(1.4)
// 	.add(src(o0).modulate(o0,.04),.6)
// 	.invert().brightness(0.1).contrast(1.2)
// 	.modulateScale(osc(2),-0.2)
//   .out()

// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// Asdrúbal Gomez


// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// by Olivia Jack
// https://ojack.github.io
// osc(6.438, 0.142, 0.025)
// 	.color(0.681, 0.198, -0.073)
// 	.rotate(0.591, 0.136)
// 	.pixelate(1.765, 39.107)
// 	.modulate(noise(3.111), () => 1.422 * Math.sin(0.076 * time))
// 	.out(o0);



// // licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// // by Nelson Vera
// // twitter: @nel_sonologia
// osc(9.634, -0.233, 0.782)
// 	.color(-1.358, -2.921, -2.967)
// 	.blend(o0)
// 	.rotate(-0.486, -0.269)
// 	.modulate(shape(7.614)
// 		.rotate(0.957, 0.58)
// 		.scale(3.054)
// 		.repeatX(1.896, 2.632)
// 		.modulate(o0, () => mouse.x * 0.001)
// 		.repeatY(2.093, 2.059))
// 	.out(o0);





// // licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// // 3.3
// // by ΔNDR0M3DΔ
// // https://www.instagram.com/androm3_da/
// osc()
// 	.modulateRotate(o0, 0.098)
// 	.out();
// osc(2.234, 0.102, 0.366)
// 	.diff(o3, 4.28)
// 	.out(o1);
// osc(2.802, 0.352, 38.429)
// 	.modulateKaleid(o3, 3.426)
// 	.diff(o0)
// 	.out(o2);
// src(o0, 3.316)
// 	.mult(o1, 1.042)
// 	.kaleid(2.325)
// 	.out(o3);
// render(o2);


