<!-- - [ ] line breaks should be forbidden when renaming presets -->
- [x] ~~customize parent-children behaviours~~
- [x] ~~instrument name appears as text box under cursor~~
- [x] ~~presets should have unique names~~
  - [x] ~~function that computes smallest available value~~
- [ ] ~~26.12.2022 presets~~ 29.12.2022
  - [ ] activate preview on hover
  - [ ] update the renderfunctions to accept multiple thumbs
  - [ ] perform a deepMerge that previsualizes new thumbs and tracks, but doesn't display ranges
  - [x] ~~define a specific style for previewed thumbs and tracks~~
  - [x] ~~26.12.2022 pass h_local and h_global as constructor params for the muesli store~~ 29.12.2022
  - [ ] 26.12.2022 perform a deepMerge between the two stores ?
  - [ ] 26.12.2022 if keys exist in both, old is highlighted in red, new in green
- [ ] orthozoom
- [x] ~~stream handlers for edge scrolling~~
- [ ] polymorphic delete
- [x] ~~clicking an inactive instrument makes it active and all others inactive, clicking an active instrument makes it inactive~~
- [ ] hilbert arrays store their locked values (shape is ```{v:foo, locked:bar}``` )
- [x] ~~can hilbert adjunction be reactively parametrized?~~
- [x] ~~define a store for ranges~~
  - [x] ~~scaleAround~~
  - [x] ~~translate~~
  - [x] ~~block~~
- [ ] add feedforward for instruments
  - [x] ~~eraser~~
  - [ ] pin
- [ ] define a stream instrument_down that removes the n first rows of "targets"
<!-- - [ ] compose adjunctions with ```R.tap``` -->
- [ ] how many levels of orthozoom ?
- [x] ~~lift the store~~
  - [x] ~~drop a key~~
  - [x] ~~add a key with specified fields~~
  - [x] ~~add key without specifying fields~~
  - [x] ~~update non existing key~~
  - [x] ~~update existing key~~
  - [x] ~~update zoom factor~~
- [ ] 23.12.2022 create store for instruments
  - [ ] 23.12.2022 setFocus
  - [ ] 23.12.2022 getFocus
  - [ ] 23.12.2022 focus is a derivedStore obtained by filtering the store
- [ ] 25.12.2022 Feedforward
  - [ ] check compare type of equipped instrument's effect and type of element at target path
- [ ] 01.03.2023
  - [ ] if the target is "movable", click sets O to be equal to target's display center, otherwise 0 = its current value. ||OC|| is preserved, and C is made static
  - [ ] if the target is "movable", shift sets O to be equal to target's display center, otherwise 0 = its current value, while preserving the ||OC||/||OA|| ratio












```drag.thru(S.obs(drag_effect))```
```drag_effect({atk, sus}){return $activeInstrument.drag(atk,sus)}```

each orthozoom level must be let's say 10 px high. 
if max indexable value is let's say 2^120, this granularity must be achievable 2^120
2^a = 10^x
ln(2^a) = ln(10^x)
aln(2) = xln(10)
x = a*ln(2)/ln(10) = 0.301

donc 2^32*n = 10^(9,632n)
disons 10^(10ndim)
donc il faut 10*ndim slots

il faut 10 fois le tiers de la resolution totale

the slowest one can go is 1px = 1unit of the range. ie divide movementX by 10*rangesize*0.301
or don't divide movement, change target scale instead.


passer directement du dilletantisme edgy de ma vingtaine à une quarantaine low key et néanmoins rayonnante de mec en paix avec lui même, et skipper l’arc “trentenaire with cringe online interactions”

le Scrabble, les rêves lucides et imiter les doubleurs des émissions debiles sur MTV  

j’ai un rire un peu idiot mais mes éternuements sont super mignons

