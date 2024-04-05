import { writable } from "svelte/store";

export const EventStore = writable({ 
    x: 0, 
    y: 0, 
    movementX: 0, 
    movementY: 0, 
    mouseDown: true, 
    mouseDiff: true,
    wheelDeltaX: 0,
    wheelDeltaY:0
});
export const UIOptions = writable({ noscroll: false })

