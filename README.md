# That Open Enhanced Camera Controls

Optimized camera controls for [That Open Components](https://docs.thatopen.com/) viewers with instant response and intelligent proximity-based speed adjustment.

## Features

- **Instant Response** - Direct camera movement, no animation delays
- **Proximity-Based Speed** - Automatically slows near objects, speeds up far away
- **Smart Orbit Point** - Automatically sets orbit center based on what you click
- **Touch Support** - Full mobile device support
- **Keyboard Modifiers** - Shift for 3x speed, Ctrl/Alt for 10x precision
- **Highly Configurable** - Customize all speed zones and behaviors
- **Performance Optimized** - Cached objects, zero allocations per frame

## Installation

Copy `smoothWheelControl.ts` and `mouseOrbitControl.ts` into your project.

**Dependencies:**
```bash
npm install @thatopen/components @thatopen/components-front three
```

For React/TypeScript projects:
```bash
npm install -D @types/react
```

## Quick Start

```typescript
import * as OBC from '@thatopen/components'
import { createSmoothWheelControl } from './smoothWheelControl'
import { createMouseOrbitControl } from './mouseOrbitControl'

// Setup your That Open Components world
const world = /* your OBC.World */
const components = /* your OBC.Components */
const containerRef = /* React.RefObject or HTMLDivElement */

// Create controls
const smoothWheel = createSmoothWheelControl(world, components, containerRef)
const mouseOrbit = createMouseOrbitControl(world, components, containerRef)

// Add event listeners
containerRef.current.addEventListener('wheel', smoothWheel.wheelHandler, { passive: false })
containerRef.current.addEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
containerRef.current.addEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)
containerRef.current.addEventListener('touchstart', mouseOrbit.touchStartHandler, true)

// Cleanup on unmount
smoothWheel.cleanup()
```

## Configuration

### Smooth Wheel Control

```typescript
createSmoothWheelControl(world, components, containerRef, {
  shiftBoost: 3,                    // Shift key multiplier (3x faster)
  fineModifier: 0.1,                // Ctrl/Alt precision multiplier (10x slower)
  fragmentUpdateDelay: 300,         // Fragment update delay (ms)
  proximitySlowdown: true,          // Enable distance-based speed adjustment
  proximitySlowDistance: 2.0,       // Distance (units) where speed is minimum
  proximityNormalDistance: 10.0,    // Distance where speed is normal (1x)
  proximityFastDistance: 50.0,      // Distance where speed reaches maximum
  proximityMinSpeed: 0.1,           // Min speed multiplier when close (10%)
  proximityMaxSpeed: 5.0            // Max speed multiplier when far (500%)
})
```

### Adjusting Base Speed

```typescript
import { DOLLY_STEP_REF } from './smoothWheelControl'

DOLLY_STEP_REF.value = 1.0  // Double speed
DOLLY_STEP_REF.value = 0.25 // Quarter speed
```

## User Controls

| Action | Effect |
|--------|--------|
| **Mouse wheel** | Instant zoom towards cursor |
| **Shift + Wheel** | 3x faster zoom |
| **Ctrl/Alt + Wheel** | 10x slower (precision) |
| **Click + Drag** | Rotate around clicked point |
| **Touch + Drag** | Rotate around touched point |

## Proximity Speed Zones

The proximity system creates intuitive speed zones:

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

- **0-2m**: Slows to 10%-100% for precision near objects
- **2-10m**: Normal speed 100%
- **10-50m**: Speeds up 100%-500% for large scenes
- **50m+**: Maximum speed 500%

Uses `THREE.MathUtils.lerp` for smooth transitions between zones.

## Architecture

### smoothWheelControl.ts
- Instant camera movement on wheel scroll
- Proximity-based speed adjustment using OBC raycasting
- Cached THREE.js objects (Vector3, Vector2, Raycaster) for zero allocations
- Configurable speed modifiers (Shift, Ctrl/Alt)
- Fragment update optimization

### mouseOrbitControl.ts
- OBC raycast-based orbit point selection (mouse, touch, programmatic)
- Drag threshold to prevent accidental triggers on clicks
- Full touch device support
- Async raycasting for all operations
- Manual orbit point utility function

## Use Cases

- IFC/BIM model viewers
- Architectural visualization
- 3D product configurators
- CAD model viewers
- Any That Open Components application

## Documentation

See [TUTORIAL.md](./TUTORIAL.md) for:
- Step-by-step setup guide
- Complete React component example
- Parameter customization
- Performance tips
- Troubleshooting

## License

MIT License - use freely in your projects!

## Credits

Built for [That Open Components](https://docs.thatopen.com/) by That Open Company.

## Links

- [That Open Components](https://github.com/ThatOpen/engine_components)
- [That Open Documentation](https://docs.thatopen.com/)
- [Tutorial](./TUTORIAL.md)
