import init, { 
  hilbert_axes_wasm_from_str, 
  hilbert_index_wasm_to_str, 
  rescale_hilbert_from_str, 
  rescale_hilbert_to_str, 
  biguint_prod_by_f64, 
  bigint_sum_from_str, 
  bigint_prod_by_f64, 
  bigint_dif_from_str,
  biguint_clamp_from_str,
  max_hilbert
} from './pkg/hilbert.js';
import './app.css'
import App from './App.svelte'



//create an objet that stores the declaration of js bindings for exported wasm functions
export let wasm_functions = {
  forward: undefined,
  inverse: undefined,
  rescale_index: undefined,
  scale_to_biguint: undefined,
  biguint_prod: undefined,
  max_hilbert: undefined,
  bigint_sum: undefined,
  bigint_prod: undefined,
  bigint_dif: undefined,
  bigint_clamp: undefined,
}

async function loadApp(){
  await init()
  wasm_functions.forward = hilbert_axes_wasm_from_str
  wasm_functions.inverse = hilbert_index_wasm_to_str
  wasm_functions.rescale_index = rescale_hilbert_from_str
  wasm_functions.scale_to_biguint = rescale_hilbert_to_str
  wasm_functions.biguint_prod = biguint_prod_by_f64
  wasm_functions.bigint_sum = bigint_sum_from_str
  wasm_functions.bigint_prod = bigint_prod_by_f64
  wasm_functions.bigint_dif = bigint_dif_from_str
  wasm_functions.max_hilbert = max_hilbert
  wasm_functions.bigint_clamp = biguint_clamp_from_str
  const app = new App({
    target: document.getElementById('app')
  })
}


loadApp();


