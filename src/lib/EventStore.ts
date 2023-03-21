import { writable, Writable, get, derived } from "svelte/store";
import * as R from 'ramda';
import * as U from './utils';
import { wasm_functions as W } from '../main.js';
import { prng_alea } from 'esm-seedrandom';

export const EventStore = writable({x:0,y:0, movementX:0, movementY:0});

