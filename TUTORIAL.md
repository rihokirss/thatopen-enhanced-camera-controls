# Enhanced Camera Controls Tutorial

Optimized camera controls for That Open Components viewers with instant response and smart proximity-based speed adjustment.


## What you'll learn

In this tutorial, you'll learn how to:
- Set up instant, responsive wheel zooming
- Implement intelligent orbit point selection on drag
- Configure touch support for mobile devices
- Customize camera control parameters
- Optimize performance for large models


## Getting started

First, let's understand what these controls do:

**Smooth Wheel Control** provides instant camera movement with no animation lag. Features:
-  Immediate response - no requestAnimationFrame delays
-  Proximity-based speed - slows near objects, speeds far
-  Zoom towards cursor direction
-  Cached objects for zero allocations

**Mouse Orbit Control** automatically sets the orbit point based on where you start dragging. This means rotating around the part of the model you're actually looking at, not some arbitrary center point.


## Installation

These utilities work with That Open Components. Make sure you have the required dependencies:

```bash
npm install @thatopen/components @thatopen/components-front three
```

For React projects, you'll also need React types:

```bash
npm install -D @types/react
```


## Setting up the controls

### Step 1: Import the utilities

```typescript
import * as OBC from '@thatopen/components'
import { createSmoothWheelControl } from './smoothWheelControl'
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

**Why?** We disable the default wheel action because our custom smooth wheel control provides instant response with no lag.

### Step 4: Create smooth wheel control

```typescript
const smoothWheel = createSmoothWheelControl(
  world,
  components,
  containerRef
)
```

### Step 5: Create mouse orbit control

```typescript
const mouseOrbit = createMouseOrbitControl(
  world,
  components,
  containerRef
)
```

### Step 6: Attach event listeners

```typescript
const container = containerRef.current
if (!container) return

// Wheel zoom
container.addEventListener('wheel', smoothWheel.wheelHandler, { passive: false })

// Mouse orbit
container.addEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
container.addEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)

// Touch support
container.addEventListener('touchstart', mouseOrbit.touchStartHandler, true)
```

### Step 7: Cleanup

Don't forget to remove event listeners and cleanup when your component unmounts:

```typescript
smoothWheel.cleanup()

container.removeEventListener('wheel', smoothWheel.wheelHandler)
container.removeEventListener('mousedown', mouseOrbit.mouseDownHandler)
container.removeEventListener('mousemove', mouseOrbit.mouseMoveHandler)
container.removeEventListener('touchstart', mouseOrbit.touchStartHandler)
```


## Customization

### Configuring smooth wheel control

You can customize the behavior by passing a config object:

```typescript
const smoothWheel = createSmoothWheelControl(world, components, containerRef, {
  shiftBoost: 3,                    // Shift key multiplier (3x faster)
  fineModifier: 0.1,                // Ctrl/Alt precision (10x slower)
  fragmentUpdateDelay: 300,         // Fragment update delay (ms)
  proximitySlowdown: true,          // Enable distance-based speed
  proximitySlowDistance: 2.0,       // Distance where speed is minimum
  proximityNormalDistance: 10.0,    // Distance where speed is normal (1x)
  proximityFastDistance: 50.0,      // Distance where speed reaches max
  proximityMinSpeed: 0.1,           // Min speed multiplier (10%)
  proximityMaxSpeed: 5.0            // Max speed multiplier (500%)
})
```

### Adjusting base zoom speed

The base zoom speed can be adjusted globally:

```typescript
import { DOLLY_STEP_REF } from './smoothWheelControl'

DOLLY_STEP_REF.value = 1.0  // Double the default speed
DOLLY_STEP_REF.value = 0.25 // Quarter the default speed
```

### Proximity speed adjustment explained

The proximity-based speed creates zones:

```
Speed Multiplier
  5.0x |                    _________________ (50m+)
       |                   /
  3.0x |                  /
       |                 /
  1.0x |_________(10m)__/
       |        /
  0.5x |       /
       |      /
  0.1x |_____/ (0-2m)
       |_____|_____|_____|_____|_____|
         0    10    20    30    40   50m (distance)
```

- **0-2m**: Slows down 10%-100% (precision near objects)
- **2-10m**: Normal speed 100%
- **10-50m**: Speeds up 100%-500%
- **50m+**: Maximum speed 500%

This uses `THREE.MathUtils.lerp` for smooth transitions between zones.


## User controls

| Action | Effect |
|--------|--------|
| **Mouse wheel** | Instant zoom towards cursor |
| **Shift + Wheel** | 3x faster zoom |
| **Ctrl/Alt + Wheel** | 10x slower (precision) |
| **Click + Drag** | Rotate around clicked point |
| **Touch + Drag** | Rotate around touched point |


## Performance optimizations

### Why this is fast

1. **No animation loop** - Instant camera updates, no requestAnimationFrame overhead
2. **Cached objects** - All THREE.Vector3/Vector2/Raycaster instances are reused
3. **No auto-calibration** - Speed doesn't change when loading new models
4. **Async raycasting** - Proximity detection doesn't block camera movement
5. **Single update** - getBoundingClientRect called once per wheel event

### Comparison with animation-based approach

| Metric | Animation Loop | Instant (This) |
|--------|----------------|----------------|
| Response time | 16-60ms | 0ms |
| FPS during zoom | Variable | Not applicable |
| Object allocations | 180/sec @ 60fps | 0 |
| Garbage collection | Frequent | Minimal |


## Complete React component example

```typescript
import { useEffect, useRef } from 'react'
import * as OBC from '@thatopen/components'
import { createSmoothWheelControl } from './smoothWheelControl'
import { createMouseOrbitControl } from './mouseOrbitControl'

export function IFCViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<OBC.World | null>(null)

  useEffect(() => {
    let smoothWheel: ReturnType<typeof createSmoothWheelControl> | null = null
    let mouseOrbit: ReturnType<typeof createMouseOrbitControl> | null = null

    const initViewer = async () => {
      if (!containerRef.current) return

      // Setup That Open Components
      const components = new OBC.Components()
      const worlds = components.get(OBC.Worlds)
      const world = worlds.create()

      world.scene = new OBC.SimpleScene(components)
      world.scene.setup()
      world.renderer = new OBC.SimpleRenderer(components, containerRef.current)
      world.camera = new OBC.OrthoPerspectiveCamera(components)

      await components.init()

      // Disable default wheel
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

      // Create controls
      smoothWheel = createSmoothWheelControl(world, components, containerRef)
      mouseOrbit = createMouseOrbitControl(world, components, containerRef)

      // Attach event listeners
      const container = containerRef.current
      container.addEventListener('wheel', smoothWheel.wheelHandler, { passive: false })
      container.addEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
      container.addEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)
      container.addEventListener('touchstart', mouseOrbit.touchStartHandler, true)

      worldRef.current = world
    }

    initViewer()

    return () => {
      // Cleanup
      if (smoothWheel) smoothWheel.cleanup()

      if (containerRef.current && smoothWheel && mouseOrbit) {
        containerRef.current.removeEventListener('wheel', smoothWheel.wheelHandler)
        containerRef.current.removeEventListener('mousedown', mouseOrbit.mouseDownHandler)
        containerRef.current.removeEventListener('mousemove', mouseOrbit.mouseMoveHandler)
        containerRef.current.removeEventListener('touchstart', mouseOrbit.touchStartHandler)
      }
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
}
```


## Advanced usage

### Programmatically setting orbit point

You can manually set the orbit point from code:

```typescript
import { setOrbitPoint } from './mouseOrbitControl'

// Set orbit point at current mouse position (e.g., on double-click)
async function handleDoubleClick(e: MouseEvent) {
  await setOrbitPoint(world, components)
}
```

### Disabling proximity slowdown

If you want consistent speed regardless of distance:

```typescript
const smoothWheel = createSmoothWheelControl(world, components, containerRef, {
  proximitySlowdown: false
})
```

### Custom speed zones

Adjust the proximity zones for your use case:

```typescript
const smoothWheel = createSmoothWheelControl(world, components, containerRef, {
  proximitySlowDistance: 1.0,     // Very close: 1m
  proximityNormalDistance: 5.0,   // Normal: 5m
  proximityFastDistance: 20.0,    // Far: 20m
  proximityMinSpeed: 0.2,         // Min: 20% speed
  proximityMaxSpeed: 3.0          // Max: 300% speed
})
```


## Troubleshooting

### Zoom feels too slow/fast

Adjust the base step size:

```typescript
import { DOLLY_STEP_REF } from './smoothWheelControl'

DOLLY_STEP_REF.value = 1.0  // Increase for faster zoom
DOLLY_STEP_REF.value = 0.25 // Decrease for slower zoom
```

### Proximity speed not working

Make sure:
1. `proximitySlowdown` is set to `true` in config
2. OBC.Raycasters is properly initialized
3. Your models have collision geometry

### Touch controls not responding

Ensure you're using `{ passive: false }` for wheel events and `true` for capture phase on touch events:

```typescript
container.addEventListener('wheel', smoothWheel.wheelHandler, { passive: false })
container.addEventListener('touchstart', mouseOrbit.touchStartHandler, true)
```


## Best practices

1. **Always cleanup** - Remove event listeners in unmount/cleanup
2. **Cache refs** - Store world/components refs to avoid recreating controls
3. **Test on mobile** - Touch controls behave differently than mouse
4. **Adjust for your models** - Tune proximity zones based on model scale
5. **Monitor performance** - Use browser devtools to verify zero allocations


## API Reference

### `createSmoothWheelControl(world, components, containerRef, config?)`

Creates a smooth wheel zoom control.

**Parameters:**
- `world: OBC.World` - That Open Components world instance
- `components: OBC.Components` - That Open Components instance
- `containerRef: React.RefObject<HTMLDivElement>` - Container element ref
- `config?: SmoothWheelControlConfig` - Optional configuration object

**Returns:**
```typescript
{
  wheelHandler: (e: WheelEvent) => Promise<void>
  cleanup: () => void
}
```

### `createMouseOrbitControl(world, components, containerRef)`

Creates intelligent orbit point controls.

**Parameters:**
- `world: OBC.World` - That Open Components world instance
- `components: OBC.Components` - That Open Components instance
- `containerRef: React.RefObject<HTMLDivElement>` - Container element ref

**Returns:**
```typescript
{
  mouseDownHandler: (e: MouseEvent) => Promise<void>
  mouseMoveHandler: (e: MouseEvent) => void
  touchStartHandler: (e: TouchEvent) => void
}
```

### `setOrbitPoint(world, components)`

Manually sets orbit point at current mouse position.

**Parameters:**
- `world: OBC.World` - That Open Components world instance
- `components: OBC.Components` - That Open Components instance

**Returns:** `Promise<void>`

**Note:** OBC raycaster automatically uses current mouse position.


## Links

- [That Open Components Documentation](https://docs.thatopen.com/)
- [README](./README.md)


Happy coding!
