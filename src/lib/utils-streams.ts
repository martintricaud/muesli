import Kefir from "kefir";
import * as R from 'ramda';

export const keydown_ = key => Kefir.fromEvents(window,'keydown').filter(e=>e.key == key)
export const keyup_ = key => Kefir.fromEvents(window,'keyup').filter(e=>e.key == key)
export const mouseenter_ = el => Kefir.fromEvents(el, 'mouseenter');
export const mouseleave_ = el => Kefir.fromEvents(el, 'mouseleave');
export const mousedown_ = Kefir.fromEvents(window, 'mousedown');
export const mouseup_ = Kefir.fromEvents(window, 'mouseup');
export const shiftdown_ = Kefir.fromEvents(window,'keydown').filter(e=>e.shiftKey);
export const shiftup_ = Kefir.fromEvents(window, 'keyup')
export const mousemove_ = Kefir.fromEvents(window, 'mousemove');
export const mousewheel_= Kefir.fromEvents(window,'wheel');


export const hit= (mouse_, viewport) =>
  mouse_.flatMap((e) => {
    let a = {...e,
      target: viewport.elementFromPoints(e.clientX, e.clientY)[1],
    }
    return Kefir.constant(a)
});

export const hold = (e_) =>
e_.flatMap((e) =>
  Kefir.constant(e)
);

export const capture = (value,e_) =>
e_.map(e=>R.assoc('capture',value,e)).flatMap((e) =>
  Kefir.constant(e)
);

export const asr = (a_, s_, r_) =>
a_.flatMap((a) =>
  Kefir.constant(a)
    .sampledBy(s_, (atk, sus) => R.assoc('atk',atk,sus))
    .takeUntilBy(r_)
);

// return {atk:atk, sus:sus}}

export const counterPlus_ = (el,end) => mouseenter_(el).flatMap(
  (e)=>Kefir.interval(10,{movementX:10}).takeUntilBy(end))

 export const plus_ = asr(mousedown_,Kefir.interval(10,{movementX:"test"}),mouseup_)

export const counterMinus_ = (el,end) => mouseenter_(el).flatMap(
    (e)=>Kefir.interval(10,{movementX:0}).takeUntilBy(end))

export const machine = (el,end) => mouseenter_(el).flatMap(
      (e)=>Kefir.interval(10,{movementX:0}).takeUntilBy(end))
  

export const whileOn = (el,ticker) => asr(
  mouseenter_(el),
  e=>Kefir.interval(ticker,Kefir.constant(e)),
  mouseleave_(el)
)






// export const applyDelta = (xy)=>{
//   let b = g=>{return {x:val=>val+g(xy.movementX),  y:val=>val+g(xy.movementY)}}
//   let a = {...xy, applyDelta:b}
//   return a
// }

export const obs = f => x => x.onValue(val=>f(val))

export const drag_ = asr(mousedown_, mousemove_, mouseup_) 