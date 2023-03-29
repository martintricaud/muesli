import init, { 
  hilbert_axes_wasm_from_str, 
  hilbert_index_wasm_to_str, 
  rescale_hilbert_from_str, 
} from './pkg/hilbert.js';
import './app.css'
import App from './App.svelte'

//create an objet that stores the declaration of js bindings for exported wasm functions
export let wasm_functions = {
  forward: undefined,
  inverse: undefined,
  rescale_index: undefined,
}

async function loadApp(){
  await init()
  wasm_functions.forward = hilbert_axes_wasm_from_str
  wasm_functions.inverse = hilbert_index_wasm_to_str
  wasm_functions.rescale_index = rescale_hilbert_from_str
  const app = new App({
    target: document.getElementById('app')
  })
}

loadApp();


