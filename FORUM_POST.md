# 📷 Enhanced Camera Controls for That Open Components

I've created a utility package that solves some common camera control issues in That Open Components viewers!

## 🔧 Problems it solves:

1. **Dolly slowdown issue** - The default camera controls slow down significantly when zooming close to objects. This package fixes that with proper scene calibration
2. **Awkward wheel zooming** - Replaces fixed zoom steps with smooth, momentum-based scrolling
3. **Wrong orbit center** - Automatically sets orbit point based on what you're actually looking at (raycast-based)
4. **Touch device support** - Works out of the box on mobile/tablets

## ✨ Features:

- 🎯 **Smooth Wheel Zooming** - Momentum-based scrolling with velocity accumulation (feels like Google Maps)
- 🔄 **Smart Orbit Point** - Raycast-based orbit center selection on drag
- 📱 **Touch Support** - Full mobile device support
- ⌨️ **Keyboard Modifiers** - Shift for 3x speed, Ctrl/Alt for precision mode (10x slower)
- ⚙️ **Auto Scene Calibration** - Fixes dolly slowdown by adjusting zoom speed based on model size
- 🎨 **Highly Configurable** - Tune all parameters (velocity decay, smoothing, acceleration, etc.)

## 🚀 Quick Example:

```typescript
import { createSmoothWheelControl, calibrateDollyStepByScene } from './smoothWheelControl'
import { createMouseOrbitControl } from './mouseOrbitControl'

// Setup your world as usual
const world = /* your OBC.World */
const components = /* your OBC.Components */

// IMPORTANT: Disable default wheel action
const controls = world.camera.controls
if (controls && 'mouseButtons' in controls) {
  const CamControls = (await import('camera-controls')).default
  controls.mouseButtons = {
    left: CamControls.ACTION.ROTATE,
    middle: CamControls.ACTION.TRUCK,
    right: CamControls.ACTION.TRUCK,
    wheel: CamControls.ACTION.NONE  // Disable default wheel!
  }
}

// Create controls
const smoothWheel = createSmoothWheelControl(world, components, containerRef)
const mouseOrbit = createMouseOrbitControl(world, components, containerRef)

// Add listeners
containerRef.current.addEventListener('wheel', smoothWheel.wheelHandler, { passive: false })
containerRef.current.addEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
containerRef.current.addEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)
containerRef.current.addEventListener('touchstart', mouseOrbit.touchStartHandler, true)

// Fix dolly slowdown after loading models
fragments.list.onItemSet.add(() => {
  calibrateDollyStepByScene(world)  // This fixes the slowdown!
})
```

## 📖 Documentation:

The repo includes:
- Complete TypeScript utilities
- Detailed tutorial (That Open Components style)
- React component example
- Vanilla JavaScript example
- Performance optimization tips

## 🔗 GitHub Repository:

**https://github.com/rihokirss/thatopen-enhanced-camera-controls**

## 🎮 User Experience:

Your users get:
- ✅ Natural, momentum-based zooming
- ✅ Rotate around what they're looking at (not some random center)
- ✅ No more dolly slowdown when zooming close
- ✅ Touch support on mobile
- ✅ Keyboard shortcuts for precision/speed

## 🤝 Feedback welcome!

I've been using this in my IFC viewer project and it's a huge improvement over the default controls. Would love to hear if it works well for your use cases too!

Feel free to fork, customize, and submit PRs with improvements.

---

**Topics:** #ThatOpen #CameraControls #IFC #BIM #ThreeJS #TypeScript
