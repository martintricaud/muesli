import Kefir from "kefir";

export const hit = (xy_, viewport) =>
xy_.flatMap((xy) =>
  Kefir.constant({
    start: xy,
    target: viewport.elementFromPoint(...xy),
  })
);


export const asr = (a_, s_, r_) =>
a_.flatMap((a) =>
  Kefir.constant(a)
    .sampledBy(s_, (atk, sus) => {return {attack:atk, sustain:sus}})
    .takeUntilBy(r_)
);

//helper to convert a pointer object into a (x,y) pair
export const intoXY= cursorProps => cursorProps.map(val => [val.clientX, val.clientY])

//shorthands for common mouse events
export const mousedown_ = Kefir.fromEvents(window, 'mousedown');
export const mouseup_ = Kefir.fromEvents(window, 'mouseup');
export const mousemove_ = Kefir.fromEvents(window, 'mousemove');
export const mousemovedelta_ = mousemove_.map((xy)=>{
  return  {
    delta: {x: xy.movementX,y:xy.movementY},
    applyDelta: g=>{return {x:val=>val+g(xy.movementX),  y:val=>val+g(xy.movementY)}}
  }
})
