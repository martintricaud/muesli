<script>
    import { createEventDispatcher } from 'svelte';
    import { EventStore } from '../lib/UIState';
    export let name, equipped;


    const dispatch = createEventDispatcher();
    $: targetList = document
        .elementsFromPoint($EventStore.x, $EventStore.y)
        .filter((x) => x.classList.contains('thumb') || x.classList.contains('range'));

    /** set target to undefined if targetList is empty */
    $: res = targetList.length > 0 ? targetList[0] : undefined;

    $: () => dispatch('effect', {...$EventStore,target:res});
</script>


<style>
</style>
