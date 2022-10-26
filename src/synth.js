// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// by Rodrigo Velasco
// https://yecto.github.io/
osc(10.89, 0.134, 0.571)
	.color(2.775, 0.048, 3.987)
	.mult(osc(26.922, 0.015, 0.673))
	.repeat(3.774, 10.552)
	.rotate(0.086)
	.modulate(o1)
	.scale(0.909, () => a.fft[0] * 1.382 + 3.403)
	.diff(o1)
	.out(o0);
osc(20.471, 0.284, 0.603)
	.color(1.491, 0.417, 0.19)
	.mult(osc(71.576))
	.modulateRotate(o0, 0.215)
	.rotate(0.029)
	.out(o1);


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
osc(11.35, 0.346, 0.593)
	.modulateScale(osc(10.6, 0.081, 0)
		.kaleid(1.024))
	.repeat(0.338, 2.775)
	.modulate(o0, 0.026)
	.modulateKaleid(shape(7.443, 0.088, 1.307))
	.out(o0);



    // h.osc(20, 0.1, 0).color(0, 1, 2).rotate(1.57 / 2).out(h.o1);
    // h.osc(30, 0.01, 0).color(2, 0.7, 1).modulate(h.o1, 0).add(h.o1, 1).modulatePixelate(h.o1, 1, 10).out(h.o0);