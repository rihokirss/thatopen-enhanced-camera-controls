# 📷 That Open Enhanced Camera Controls

Smooth, momentum-based camera controls for [That Open Components](https://docs.thatopen.com/) viewers.

## ✨ Features

- 🎯 **Smooth Wheel Zooming** - Momentum-based scrolling with velocity accumulation
- 🔄 **Smart Orbit Point** - Automatically sets orbit center based on raycast
- 📱 **Touch Support** - Full mobile device support out of the box
- ⌨️ **Keyboard Modifiers** - Shift for speed boost, Ctrl/Alt for precision
- ⚙️ **Highly Configurable** - Tune all parameters to your needs
- 🎨 **Auto Scene Calibration** - Adjusts zoom speed based on model size

## 📦 Installation

Copy `smoothWheelControl.ts` and `mouseOrbitControl.ts` into your project.

**Dependencies:**
```bash
npm install @thatopen/components @thatopen/components-front three
```

For React/TypeScript projects:
```bash
npm install -D @types/react
```

## 🚀 Quick Start

```typescript
import * as OBC from '@thatopen/components'
import { createSmoothWheelControl, calibrateDollyStepByScene } from './smoothWheelControl'
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

// Calibrate zoom speed after loading model (optional)
calibrateDollyStepByScene(world)

// Cleanup on unmount
smoothWheel.cleanup()
```

## 📖 Documentation

See [TUTORIAL.md](./TUTORIAL.md) for detailed documentation, including:
- Step-by-step setup guide
- Parameter customization
- Complete React component example
- Performance optimization tips
- Advanced usage patterns

## ⚙️ Configuration

### Smooth Wheel Control

```typescript
createSmoothWheelControl(world, components, containerRef, {
  velocityDecay: 0.9,           // Velocity reduction per scroll (0.9 = -10%)
  velocityTimeout: 150,          // Reset velocity after pause (ms)
  velocityDivisor: 200,          // Acceleration sensitivity
  maxVelocityMultiplier: 5,      // Max zoom speed (5x base speed)
  smoothing: 0.15,               // Animation responsiveness (0-1)
  stepAccumulation: 0.3,         // Motion blending between scrolls
  shiftBoost: 3,                 // Shift key multiplier
  fineModifier: 0.1,             // Ctrl/Alt precision multiplier
  fragmentUpdateDelay: 300       // Fragment update delay (ms)
})
```

## 🎮 User Controls

| Action | Effect |
|--------|--------|
| **Mouse wheel** | Smooth momentum zoom |
| **Shift + Wheel** | 3x faster zoom |
| **Ctrl/Alt + Wheel** | 10x slower (precision) |
| **Click + Drag** | Rotate around clicked point |
| **Touch + Drag** | Rotate around touched point |

## 🏗️ Architecture

### `smoothWheelControl.ts`
- Momentum-based wheel zooming with velocity accumulation
- Configurable decay, smoothing, and acceleration
- Fragment update optimization
- Scene-based zoom calibration

### `mouseOrbitControl.ts`
- Raycast-based orbit point selection
- Drag detection with threshold
- Touch device support
- Manual orbit point utility function

## 🎯 Use Cases

- IFC/BIM model viewers
- Architectural visualization
- 3D product configurators
- CAD model viewers
- Any That Open Components application

## 🤝 Contributing

This is a standalone utility package. Feel free to:
- Fork and modify for your needs
- Submit issues and suggestions
- Share improvements

## 📄 License

MIT License - use freely in your projects!

## 🙏 Credits

Built for use with [That Open Components](https://docs.thatopen.com/) by That Open Company.

## 🔗 Links

- [That Open Components](https://github.com/ThatOpen/engine_components)
- [That Open Documentation](https://docs.thatopen.com/)
- [Tutorial](./TUTORIAL.md)

---

Made with ❤️ for the That Open community
