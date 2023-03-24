import { writable, Writable, get, derived } from "svelte/store";

export const EventStore = writable({x:0,y:0, movementX:0, movementY:0});
export const UIOptions =  writable({noscroll:false})

