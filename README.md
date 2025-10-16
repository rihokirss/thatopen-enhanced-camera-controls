# That Open Enhanced Camera Controls

Optimized camera controls for [That Open Components](https://docs.thatopen.com/) viewers with instant response and intelligent proximity-based speed adjustment.

## Features

- **Instant Response** - Direct camera movement, no animation delays
- **Proximity-Based Speed** - Automatically slows near objects, speeds up far away
- **Smart Orbit Point** - Automatically sets orbit center based on what you click
- **Auto Orbit Update** - Fixes truck movement slowdown when zoomed out
- **Touch Support** - Full mobile device support
- **Keyboard Modifiers** - Shift for 3x speed, Ctrl/Alt for 10x precision
- **Highly Configurable** - Customize all speed zones and behaviors
- **Performance Optimized** - Throttled raycasting, cached values, non-blocking operations

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
const mouseOrbit = createMouseOrbitControl(world, components)

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
  proximityNormalDistance: 8.0,     // Distance where speed is normal (1x) [optimized]
  proximityFastDistance: 50.0,      // Distance where speed reaches maximum
  proximityMinSpeed: 0.2,           // Min speed multiplier when close (20%) [optimized]
  proximityMaxSpeed: 10.0           // Max speed multiplier when far (1000%) [optimized]
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
 10.0x |                    _________________ (50m+)
       |                   /
  6.0x |                  /
       |                 /
  1.0x |________(8m)____/
       |       /
  0.6x |      /
       |     /
  0.2x |____/ (0-2m)
       |_____|_____|_____|_____|_____|
         0    10    20    30    40   50m (distance)
```

- **0-2m**: Slows to 20%-100% for precision near objects (optimized)
- **2-8m**: Normal speed 100% (optimized from 10m)
- **8-50m**: Speeds up 100%-1000% for large scenes (optimized)
- **50m+**: Maximum speed 1000% (optimized from 500%)

Uses `THREE.MathUtils.lerp` for smooth transitions between zones.

## Architecture

### smoothWheelControl.ts
- Instant camera movement on wheel scroll
- **Throttled raycasting** (100ms interval) - only when stationary
- **Cached speed factor** - uses last known value during movement
- **Auto orbit point update** - fixes truck slowdown when zoomed out
- Cached THREE.js objects (Vector3, Vector2, Raycaster) for zero allocations
- Configurable speed modifiers (Shift, Ctrl/Alt)
- Fragment update optimization with delayed final raycast (50ms)

### mouseOrbitControl.ts
- OBC raycast-based orbit point selection (mouse, touch, programmatic)
- **Non-blocking raycasting** - uses promise chain instead of async/await
- Drag threshold to prevent accidental triggers on clicks
- Full touch device support
- Async raycasting for all operations
- Manual orbit point utility function

## Performance Optimizations

### Raycasting Throttling
- Raycasts only execute **every 100ms** and only when stationary
- During fast scrolling, uses **cached speed factor** from last raycast
- Final raycast performed **50ms after movement stops** for accuracy

### Non-Blocking Operations
- `mouseDownHandler` uses promise chain (`.then()/.catch()`) instead of `async/await`
- Prevents blocking the main thread during mouse interactions
- UI remains responsive even with heavy raycasting

### Auto Orbit Point Update
- Automatically updates orbit point when raycasting objects
- Fixes **truck (pan) movement slowdown** when camera is far from orbit point
- camera-controls library scales truck speed based on orbit distance

### Memory Optimization
- All THREE.js objects (Vector3, Vector2, Raycaster) cached and reused
- Zero allocations per frame during movement
- Cleanup function properly clears all timeouts

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
