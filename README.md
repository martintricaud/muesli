# A Hilbert-curve based reactive UI to control Hydra visual synthesizers

## Disclaimer

This is an experimental research project that aims to explores exotic design ideas for interacting with parametric models.
For the sake of demonstration, the interface is wired to visual synthesizers built and rendered using the hydra-synth library.
Not that this is still very much an ongoing work, even this README is not complete.
Stability, reusability and browser / workstation compatibility are not guaranteed.

## General idea

The driving question behind this project was: how does having too many parameters to adjust affect the user experience of engaging with creativity support software?
This experiment explores this question from the following angle: 
If we think of parameter exploration as a walk in a high-dimensional space, what's the right way to move in this space ?
I was intrigued to investigate whether the space filling properties of the Hilbert Curve make it a suitable tool to define an trajectory in a large parameter space.

## UI Overview 

### Hilbert Sliders
The idea of the Hilbert Curve as a way to move around the parameters space is implemented in the form of two macro-sliders.
The "Global" macro-slider controls the center coordinates of a sub-region of the parameter space, and the "Local" macro-slider control the coordinates of the visual synthesizer's input vector inside this sub-region.

### Instrumental Interaction
The conceptual model is built around the principles of "instrumental interaction", i.e. user actions are mediated by the "instrument" that is currently equipped.
To bring up the instrument Palette, hold space bar and select the desired option.
An instrument is essentially a transfer function that maps UIEvents to Store updates.
The update triggered by an "instrumented" action might be ignored or amended if an object's state is constrained in a way that conflicts with the attempted update.  

Currently implemented instruments are
* Fix (fixing an element makes it hermetic to updates until it has been unfixed)
* Erase (remove an element from the store)
* Lever (an instrument to enable multi-scale displacements inspired by Archimede's lever)
* Cursor (a plain cursor)


### Salient features 

The UI enables the following actions:

* Load a synth template from a dropdown menu
* Adjust the parameters of the synth using the sliders
* Adjust the range of interest for a given parameters by scaling and displacing the area slider
* Save (resp. recall) input presets by clicking the save button (resp. the correspponding snapshot)
* Adjust the size of the local exploration region with SHIFT + scroll 
* Move in the parameter space following the Hilbert curve using the macro sliders.

## Customization

If you fork the project, synthesizer templates with their input presets are described in "data.ts".
Edit the file to add more templates and presets.


## Dependencies


