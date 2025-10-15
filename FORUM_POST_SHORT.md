# 📷 Enhanced Camera Controls - Fixes dolly slowdown + smooth zooming

Hey everyone! 👋

I've created a utility that solves the **dolly slowdown issue** and adds smooth, momentum-based camera controls to That Open Components.

## What it fixes:

✅ **Dolly slowdown** - No more sluggish zooming when close to objects
✅ **Jerky wheel zoom** - Replaced with smooth, momentum-based scrolling
✅ **Wrong orbit center** - Raycast-based orbit point selection
✅ **Touch support** - Works on mobile out of the box

## Quick usage:

```typescript
// 1. Disable default wheel
controls.mouseButtons.wheel = CamControls.ACTION.NONE

// 2. Add smooth controls
const smoothWheel = createSmoothWheelControl(world, components, containerRef)
const mouseOrbit = createMouseOrbitControl(world, components, containerRef)

// 3. Fix dolly slowdown
fragments.list.onItemSet.add(() => {
  calibrateDollyStepByScene(world)  // Magic happens here!
})
```

## Repo:
https://github.com/rihokirss/thatopen-enhanced-camera-controls

Includes full tutorial, React + vanilla JS examples, and all TypeScript source code.

Feedback welcome! 🚀
