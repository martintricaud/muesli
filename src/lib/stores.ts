import { MuesliStore, PresetStore, liftedConstraintStore} from "./storesFactories";
import * as U from './utils';
import { wasm_functions as W } from '../main.js';
import { synth2, preset0 } from './data';

export const presets = PresetStore([
    {
      name: 'preset0',
      ranges: preset0,
      h_global: W.bigint_prod(0.1, U.fMAX_H(32, 19), 100),
      h_local: W.bigint_prod(0.5, U.fMAX_H(32, 19), 100),
      z: 1,
    },
  ]);