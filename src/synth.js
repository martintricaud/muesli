

// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// by Nelson Vera
// twitter: @nel_sonologia
osc(9.634, -0.233, 0.782)
	.color(-1.358, -2.921, -2.967)
	.blend(o0)
	.rotate(-0.486, -0.269)
	.modulate(shape(7.614)
		.rotate(0.957, 0.58)
		.scale(3.054)
		.repeatX(1.896, 2.632)
		.modulate(o0, () => mouse.x * 0.001)
		.repeatY(2.093, 2.059))
	.out(o0);

// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// Puertas III
// por Celeste Betancur
// https://github.com/essteban


export const examples = [{
    name: "ojack1",
    presets: [
        ["oscillatorFrequency", { c0: 0.0001, c1: 100, locked: false }],
        ["oscillatorOffset", { c0: 0.0001, c1: 1, locked: false }],
        ["kaleidoscopeShape", { c0: 0, c1: 20, locked: false }],
        ["red", { c0: 0, c1: 1, locked: false }],
        ["green", { c0: 0, c1: 1, locked: false }],
        ["blue", { c0: 0, c1: 1, locked: false }],
        ["rotation1", { c0: 0, c1: 1, locked: false }],
        ["rotation2", { c0: 0, c1: 1, locked: false }],
        ["scaleFactor", { c0: 0.0001, c1: 1, locked: false }],
        ["modulationAmount", { c0: 0.0001, c1: 1, locked: false }]
    ],
    synth: a => x => {
        return x.osc(a.oscillatorFrequency, 1 / a.oscillatorFrequency, a.oscillatorOffset)
            .kaleid(a.kaleidoscopeShape)
            .color(a.red, a.green, a.blue)
            .rotate(a.rotation1, a.rotation2)
            .modulate(x.o0, a.modulationAmount)
            .scale(a.scaleFactor)
            .out(x.o0)
    }
}, {
    name: "puertas3",
    presets: [
        ["oscillator1Frequency", { c0: 0.0001, c1: 100, locked: false }],
        ["oscillator1Offset", { c0: 0.0001, c1: 1, locked: false }],
        ["oscillator2Frequency", { c0: 0.0001, c1: 100, locked: false }],
        ["oscillator2Offset", { c0: 0.0001, c1: 1, locked: false }],
        ["kaleidoscopeShape", { c0: 0, c1: 20, locked: false }],
        ["repeatX", { c0: 0, c1: 20, locked: false }],
        ["repeatY", { c0: 0, c1: 20, locked: false }],
        ["modulationAmount", { c0: 0.0001, c1: 1, locked: false }],
        ["modulatingShapeSides", { c0: 0, c1: 20, locked: false }],
        ["modulatingShapeScale", { c0: 0.0001, c1: 10, locked: false }],
        ["modulatingShapeFade", { c0: 0, c1: 1, locked: false }],
    ],
    synth: a => x => {
        return x.osc(a.oscillator1Frequency, 1 / a.oscillator1Frequency, a.oscillator1Offset)
            .modulateScale(
                x.osc(a.oscillator2Frequency, 1 / a.oscillator2Frequency, a.oscillator2Offset)
                    .kaleid(a.kaleidoscopeShape))
            .repeat(a.repeatX, a.repeatY)
            .modulate(x.o0, a.modulationAmount)
            .modulateKaleid(x.shape(a.modulatingShapeSides, a.modulatingShapeScale, a.modulatingShapeFade))
            .out(x.o0);
    }
}, {
    name: "ojack2",
    presets: [
        ["oscillator1Frequency", { c0: 0.0001, c1: 100, locked: false }],
        ["oscillator1Offset", { c0: 0.0001, c1: 1, locked: false }],
        ["oscillator2Frequency", { c0: 0.0001, c1: 100, locked: false }],
        ["oscillator2Offset", { c0: 0.0001, c1: 1, locked: false }],
        ["oscillator2Threshold", { c0: 0, c1: 1, locked: false }],
        ["oscillator2Rotation", { c0: 0, c1: 1, locked: false }],
        ["oscillator3Frequency", { c0: 0.0001, c1: 100, locked: false }],
        ["oscillator3Offset", { c0: 0.0001, c1: 1, locked: false }],
        ["oscillator3Threshold", { c0: 0, c1: 1, locked: false }],
        ["oscillator3ThresholdTolerance", { c0: 0, c1: 1, locked: false }],
        ["oscillator3ModulationAmount", { c0: 0, c1: 1, locked: false }],
        ["kaleidoscopeShape", { c0: 0, c1: 20, locked: false }],
        ["red", { c0: 0, c1: 1, locked: false }],
        ["green", { c0: 0, c1: 1, locked: false }],
        ["blue", { c0: 0, c1: 1, locked: false }],
        ["rotation", { c0: 0, c1: 1, locked: false }],
        ["scaleFactor", { c0: 0.0001, c1: 1, locked: false }],
        ["feedbackRotation", { c0: 0, c1: 1, locked: false }],
        ["feedbackModulationAmount", { c0: 0, c1: 1, locked: false }]
    ],
    synth: a => x => {
        return x.osc(a.oscillator1Frequency, 1 / a.oscillator1Frequency, a.oscillator1Offset)
            .modulate(x.src(x.o0)
                .rotate(a.feedbackRotation), a.feedbackModulationAmount)
            .color(a.red, a.green, a.blue)
            .rotate(a.rotation, 0)
            .pixelate(0.576, 12.888)
            .mult(x.osc(a.oscillator2Frequency, 1 / a.oscillator2Frequency, a.oscillator2Offset)
                .thresh(a.oscillator2Threshold)
                .rotate(a.oscillator2Rotation, 0))
            .modulateRotate(x.osc(a.oscillator3Frequency, 1 / a.oscillator3Frequency, a.oscillator3Offset)
                .thresh(a.oscillator3Threshold, a.oscillator3ThresholdTolerance), a.oscillator3ModulationAmount)
            .out(x.o0);
    }
}]

// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// by Olivia Jack
// https://ojack.github.io





