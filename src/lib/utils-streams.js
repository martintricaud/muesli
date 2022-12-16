import Kefir from "kefir";
import * as R from 'ramda';

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

(e) => R.assoc('targets', document.elementsFromPoint(e.x, e.y), e)

export const asr = (a_, s_, r_) =>
a_.flatMap((a) =>
  Kefir.constant(a)
    .sampledBy(s_, (atk, sus) => {return {atk:atk, sus:sus}})
    .takeUntilBy(r_)
);



export const counterPlus_ = (el,end) => Kefir.fromEvents(el, 'mouseenter').flatMap(
  (e)=>Kefir.interval(10,{movementX:10}).takeUntilBy(end))

export const counterMinus_ = (el,end) => Kefir.fromEvents(el, 'mouseenter').flatMap(
    (e)=>Kefir.interval(10,{movementX:10}).takeUntilBy(end))

export const counter2_ = (start,end) => start.flatMap(
  (e)=>{
    let m = e.target.dataset.machine;
    //machine should be an incrementer or a decrementer
    //something like: (stepsize)=>{movementX:-stepsize}
    return Kefir.interval(10,{movementX:10}).takeUntilBy(end)

})
  

export const mouseleave_ = el => Kefir.fromEvents(el, 'mouseleave')
export const mousedown_ = Kefir.fromEvents(window, 'mousedown');
export const mouseup_ = Kefir.fromEvents(window, 'mouseup');
export const shiftdown_ = Kefir.fromEvents(window,'keydown');
export const shiftup_ = Kefir.fromEvents(window, 'keyup')
export const mousemove_ = Kefir.fromEvents(window, 'mousemove');
export const mousewheel_= Kefir.fromEvents(window,'wheel');



export const applyDelta = (xy)=>{
  let b = g=>{return {x:val=>val+g(xy.movementX),  y:val=>val+g(xy.movementY)}}
  let a = {...xy, applyDelta:b}
  return a
}

export const obs = f => x => x.onValue(val=>f(val))