# 📷 Enhanced Camera Controls Tutorial

Smooth wheel zooming and intelligent orbit point controls for That Open Components viewers. This tutorial will guide you through setting up enhanced camera controls that provide a better user experience when navigating 3D models.

---

## 🎯 What you'll learn

In this tutorial, you'll learn how to:
- Set up smooth, momentum-based wheel zooming
- Implement intelligent orbit point selection on drag
- Configure touch support for mobile devices
- Customize camera control parameters

---

## 🚀 Getting started

First, let's understand what these controls do:

**Smooth Wheel Control** provides momentum-based zooming that feels natural and responsive. Instead of fixed zoom steps, it accumulates scroll velocity and applies smooth deceleration. It also features **proximity-based speed adjustment** - automatically slowing down when near objects and speeding up when navigating open space.

**Mouse Orbit Control** automatically sets the orbit point based on where you start dragging. This means rotating around the part of the model you're actually looking at, not some arbitrary center point.

---

## 📦 Installation

These utilities work with That Open Components. Make sure you have the required dependencies:

```bash
npm install @thatopen/components @thatopen/components-front three
```

For React projects, you'll also need React types:

```bash
npm install -D @types/react
```

---

## 🎬 Setting up the controls

### Step 1: Import the utilities

```typescript
import * as OBC from '@thatopen/components'
import { createSmoothWheelControl, calibrateDollyStepByScene } from './smoothWheelControl'
import { createMouseOrbitControl, setOrbitPoint } from './mouseOrbitControl'
```

### Step 2: Initialize your viewer

Set up a basic That Open Components world. If you already have this, skip to step 3.

```typescript
const components = new OBC.Components()
const worlds = components.get(OBC.Worlds)
const world = worlds.create<
  OBC.SimpleScene,
  OBC.OrthoPerspectiveCamera,
  OBC.SimpleRenderer
>()

world.scene = new OBC.SimpleScene(components)
world.scene.setup()
world.renderer = new OBC.SimpleRenderer(components, containerRef.current)
world.camera = new OBC.OrthoPerspectiveCamera(components)

await components.init()
```

### Step 3: Configure camera controls

Disable the default wheel action and set up mouse buttons:

```typescript
const controls = world.camera.controls
if (controls && 'mouseButtons' in controls) {
  const CamControls = (await import('camera-controls')).default
  controls.mouseButtons = {
    left: CamControls.ACTION.ROTATE,
    middle: CamControls.ACTION.TRUCK,
    right: CamControls.ACTION.TRUCK,
    wheel: CamControls.ACTION.NONE  // Disable default wheel
  }
}
```

**Why?** We disable the default wheel action because our custom smooth wheel control provides a much better experience.

### Step 4: Create smooth wheel control

```typescript
const smoothWheel = createSmoothWheelControl(
  world,
  components,
  containerRef
)

// Add event listener
containerRef.current.addEventListener('wheel', smoothWheel.wheelHandler, {
  passive: false
})
```

**Optional:** Calibrate zoom speed based on scene size:

```typescript
// Call this after loading a model
calibrateDollyStepByScene(world)
```

This automatically adjusts the zoom step based on your model's bounding box, so large buildings zoom at appropriate speeds.

### Step 5: Create mouse orbit control

```typescript
const mouseOrbit = createMouseOrbitControl(
  world,
  components,
  containerRef
)

// Add event listeners
const container = containerRef.current
container.addEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
container.addEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)
container.addEventListener('touchstart', mouseOrbit.touchStartHandler, true)
```

**What's happening?** When you click and start dragging, it raycasts to find what you clicked on and sets that point as the orbit center.

---

## ⚙️ Customizing the controls

### Smooth Wheel Parameters

You can customize the wheel control behavior:

```typescript
const smoothWheel = createSmoothWheelControl(
  world,
  components,
  containerRef,
  {
    velocityDecay: 0.9,              // How quickly scrolling slows down (0-1)
    velocityTimeout: 150,             // Reset velocity after this pause (ms)
    velocityDivisor: 200,             // Controls acceleration sensitivity
    maxVelocityMultiplier: 5,         // Maximum zoom speed multiplier
    smoothing: 0.15,                  // Animation smoothness (0-1)
    stepAccumulation: 0.3,            // How much previous motion carries over
    shiftBoost: 3,                    // Shift key speed multiplier
    fineModifier: 0.1,                // Ctrl/Alt precision modifier
    fragmentUpdateDelay: 300,         // Delay before updating fragments (ms)
    
    // Proximity-based speed adjustment (NEW!)
    proximitySlowdown: true,          // Enable distance-based speed scaling
    proximitySlowDistance: 2.0,       // Distance where speed is minimum
    proximityNormalDistance: 10.0,    // Distance where speed is normal (1x)
    proximityFastDistance: 20.0,      // Distance where speed is maximum
    proximityMinSpeed: 0.1,           // Minimum speed when close (10%)
    proximityMaxSpeed: 4.0            // Maximum speed when far (400%)
  }
)
```

**Parameter guide:**
- **velocityDecay**: Lower = more momentum, higher = more responsive
- **velocityDivisor**: Lower = faster acceleration, higher = slower
- **smoothing**: Higher = more responsive, lower = smoother
- **stepAccumulation**: Controls motion blending between scroll events

**Proximity parameters:**
- **proximitySlowdown**: Enable/disable automatic speed adjustment based on distance to objects
- **proximitySlowDistance**: When closer than this, speed scales down (0.1x - 1.0x)
- **proximityNormalDistance**: Between slow and normal distance, speed is 1.0x
- **proximityFastDistance**: Between normal and fast distance, speed scales up (1.0x - 4.0x)
- **proximityMinSpeed**: Minimum speed multiplier when very close to objects
- **proximityMaxSpeed**: Maximum speed multiplier when far from objects

### Keyboard modifiers

The controls support keyboard modifiers out of the box:
- **Shift + Wheel**: Zoom 3x faster
- **Ctrl/Alt + Wheel**: Zoom 10x slower (precision mode)

---

## 🧹 Cleanup

Don't forget to clean up when unmounting:

```typescript
// Remove event listeners
container.removeEventListener('wheel', smoothWheel.wheelHandler)
container.removeEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
container.removeEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)
container.removeEventListener('touchstart', mouseOrbit.touchStartHandler, true)

// Cleanup smooth wheel (cancels animations)
smoothWheel.cleanup()
```

---

## 🎨 Manual orbit point control

You can also manually set the orbit point programmatically:

```typescript
// Set orbit point at specific screen coordinates
setOrbitPoint(world, containerRef, mouseX, mouseY)

// Example: Center orbit point on click
container.addEventListener('dblclick', (e) => {
  setOrbitPoint(world, containerRef, e.clientX, e.clientY)
})
```

This is useful for "focus on object" features or programmatic camera control.

---

## 📱 Touch support

Touch support works automatically! On mobile devices:
- **Single touch + drag**: Rotates around touched point
- **Pinch zoom**: Uses native camera controls
- The orbit point is automatically set on touch start

---

## 🎯 Complete example

Here's a full React component example:

```typescript
import { useEffect, useRef } from 'react'
import * as OBC from '@thatopen/components'
import { createSmoothWheelControl, calibrateDollyStepByScene } from './smoothWheelControl'
import { createMouseOrbitControl } from './mouseOrbitControl'

export function Viewer() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const initViewer = async () => {
      // Setup world
      const components = new OBC.Components()
      const worlds = components.get(OBC.Worlds)
      const world = worlds.create<
        OBC.SimpleScene,
        OBC.OrthoPerspectiveCamera,
        OBC.SimpleRenderer
      >()

      world.scene = new OBC.SimpleScene(components)
      world.scene.setup()
      world.renderer = new OBC.SimpleRenderer(components, containerRef.current!)
      world.camera = new OBC.OrthoPerspectiveCamera(components)

      await components.init()

      // Setup camera controls
      const controls = world.camera.controls
      if (controls && 'mouseButtons' in controls) {
        const CamControls = (await import('camera-controls')).default
        controls.mouseButtons = {
          left: CamControls.ACTION.ROTATE,
          middle: CamControls.ACTION.TRUCK,
          right: CamControls.ACTION.TRUCK,
          wheel: CamControls.ACTION.NONE
        }
      }

      // Create smooth wheel control
      const smoothWheel = createSmoothWheelControl(world, components, containerRef)

      // Create mouse orbit control
      const mouseOrbit = createMouseOrbitControl(world, components, containerRef)

      // Add event listeners
      const container = containerRef.current
      container.addEventListener('wheel', smoothWheel.wheelHandler, { passive: false })
      container.addEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
      container.addEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)
      container.addEventListener('touchstart', mouseOrbit.touchStartHandler, true)

      // Load a model and calibrate zoom
      const fragments = components.get(OBC.FragmentsManager)
      await fragments.init()

      // After loading your model:
      fragments.list.onItemSet.add(() => {
        calibrateDollyStepByScene(world)
      })

      // Cleanup
      return () => {
        container.removeEventListener('wheel', smoothWheel.wheelHandler)
        container.removeEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
        container.removeEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)
        container.removeEventListener('touchstart', mouseOrbit.touchStartHandler, true)
        smoothWheel.cleanup()
        components.dispose()
      }
    }

    let cleanup: (() => void) | undefined
    initViewer().then(cleanupFn => cleanup = cleanupFn)
    return () => cleanup?.()
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
}
```

---

## 🎓 Understanding the implementation

### How smooth wheel works

1. **Velocity accumulation**: Each scroll event adds to a velocity counter
2. **Decay mechanism**: Velocity decreases by 10% with each scroll (configurable)
3. **Timeout reset**: After 150ms of no scrolling, velocity resets to zero
4. **Multiplier calculation**: Velocity is converted to a speed multiplier (1x to 5x)
5. **Animation loop**: Uses `requestAnimationFrame` for smooth 60fps movement
6. **Fragment optimization**: Delays fragment updates until scrolling stops

### How orbit control works

1. **Mouse down**: Performs raycast to find the 3D point under cursor
2. **Mouse move**: Checks if drag distance exceeds 10 pixels
3. **Set orbit**: If dragging, sets the raycast point as orbit center
4. **One-time action**: Only sets orbit point once per drag operation

This ensures you always rotate around what you're looking at!

---

## 🚀 Advanced tips

### Performance optimization

```typescript
// Adjust fragment update delay for better performance
const smoothWheel = createSmoothWheelControl(world, components, containerRef, {
  fragmentUpdateDelay: 500  // Wait longer before updating (better FPS)
})
```

### Scene-specific tuning

```typescript
// For large architectural models
const smoothWheel = createSmoothWheelControl(world, components, containerRef, {
  velocityDivisor: 300,      // Slower acceleration
  maxVelocityMultiplier: 3,  // Lower max speed
  smoothing: 0.1             // Smoother motion
})

// For small mechanical parts
const smoothWheel = createSmoothWheelControl(world, components, containerRef, {
  velocityDivisor: 150,      // Faster acceleration
  maxVelocityMultiplier: 8,  // Higher max speed
  smoothing: 0.2             // More responsive
})
```

---

## ⚡ That's it!

You now have professional-grade camera controls! Your users will enjoy:
- ✅ Smooth, momentum-based zooming
- ✅ Intelligent orbit point selection
- ✅ Touch device support
- ✅ Keyboard modifiers for precision
- ✅ Automatic scene calibration

Experiment with the parameters to match your application's needs!
