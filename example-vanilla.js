/**
 * Vanilla JavaScript example (no React)
 * Shows how to use enhanced camera controls with pure JS
 */

import * as OBC from '@thatopen/components'
import * as OBCF from '@thatopen/components-front'
import { createSmoothWheelControl, calibrateDollyStepByScene } from './smoothWheelControl.js'
import { createMouseOrbitControl, setOrbitPoint } from './mouseOrbitControl.js'

async function initViewer() {
  // Get container element
  const container = document.getElementById('viewer-container')
  if (!container) {
    throw new Error('Container element not found')
  }

  // =========================================
  // 1. Create Components and World
  // =========================================
  const components = new OBC.Components()
  const worlds = components.get(OBC.Worlds)
  const world = worlds.create()

  // =========================================
  // 2. Setup Scene, Renderer, Camera
  // =========================================
  world.scene = new OBC.SimpleScene(components)
  world.scene.setup()
  world.scene.three.background = null

  world.renderer = new OBCF.PostproductionRenderer(components, container)
  world.camera = new OBC.OrthoPerspectiveCamera(components)

  await components.init()

  // =========================================
  // 3. Configure Camera Controls
  // =========================================
  const CameraControls = (await import('camera-controls')).default
  const controls = world.camera.controls

  if (controls && 'mouseButtons' in controls) {
    controls.mouseButtons = {
      left: CameraControls.ACTION.ROTATE,
      middle: CameraControls.ACTION.TRUCK,
      right: CameraControls.ACTION.TRUCK,
      wheel: CameraControls.ACTION.NONE, // Disable default wheel
    }

    if ('minDistance' in controls) controls.minDistance = 0.3
    if ('maxDistance' in controls) controls.maxDistance = 500
  }

  // =========================================
  // 4. Create Enhanced Camera Controls
  // =========================================

  // Create a ref-like object for vanilla JS
  const containerRef = { current: container }

  // Smooth wheel control
  const smoothWheel = createSmoothWheelControl(
    world,
    components,
    containerRef,
    {
      velocityDecay: 0.9,
      velocityDivisor: 200,
      maxVelocityMultiplier: 5,
      smoothing: 0.15,
      stepAccumulation: 0.3,
    }
  )

  // Mouse orbit control
  const mouseOrbit = createMouseOrbitControl(world, components, containerRef)

  // =========================================
  // 5. Add Event Listeners
  // =========================================

  container.addEventListener('wheel', smoothWheel.wheelHandler, {
    passive: false,
  })

  container.addEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
  container.addEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)
  container.addEventListener('touchstart', mouseOrbit.touchStartHandler, true)

  // Optional: Double-click to focus on point
  container.addEventListener('dblclick', (e) => {
    setOrbitPoint(world, containerRef, e.clientX, e.clientY)
    console.log('Orbit point set at clicked location')
  })

  // =========================================
  // 6. Setup Fragment Manager
  // =========================================
  const fragments = components.get(OBC.FragmentsManager)
  await fragments.init()

  fragments.list.onItemSet.add(({ value: model }) => {
    model.useCamera(world.camera.three)
    world.scene.three.add(model.object)

    // Auto-calibrate zoom based on model size
    calibrateDollyStepByScene(world)
    fragments.core.update(true)

    console.log('Model loaded, zoom calibrated')
  })

  world.camera.controls.addEventListener('rest', () => {
    fragments.core.update(true)
  })

  // =========================================
  // 7. Optional: Setup Grid
  // =========================================
  const grids = components.get(OBC.Grids)
  grids.create(world)

  // =========================================
  // 8. Load IFC Model (example)
  // =========================================

  // Setup IFC loader
  const ifcLoader = components.get(OBC.IfcLoader)
  await ifcLoader.setup({
    autoSetWasm: true,
  })

  // Example: Load from file input
  const fileInput = document.getElementById('file-input')
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0]
      if (!file) return

      console.log('Loading IFC file:', file.name)

      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)

      try {
        const model = await ifcLoader.load(data, false, file.name)
        console.log('Model loaded successfully:', model)
      } catch (error) {
        console.error('Error loading IFC:', error)
      }
    })
  }

  // =========================================
  // 9. Handle Window Resize
  // =========================================
  const handleResize = () => {
    world.renderer?.resize()
    world.camera?.updateAspect()
  }

  window.addEventListener('resize', handleResize)

  // =========================================
  // 10. Cleanup Function
  // =========================================
  return () => {
    container.removeEventListener('wheel', smoothWheel.wheelHandler)
    container.removeEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
    container.removeEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)
    container.removeEventListener('touchstart', mouseOrbit.touchStartHandler, true)
    window.removeEventListener('resize', handleResize)

    smoothWheel.cleanup()
    components.dispose()

    console.log('Viewer cleaned up')
  }
}

// =========================================
// Initialize on page load
// =========================================
let cleanup

window.addEventListener('DOMContentLoaded', async () => {
  try {
    cleanup = await initViewer()
    console.log('Viewer initialized successfully')
  } catch (error) {
    console.error('Failed to initialize viewer:', error)
  }
})

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (cleanup) {
    cleanup()
  }
})

/**
 * HTML structure needed:
 *
 * <!DOCTYPE html>
 * <html>
 * <head>
 *   <title>That Open Enhanced Controls</title>
 *   <style>
 *     body { margin: 0; padding: 0; overflow: hidden; }
 *     #viewer-container { width: 100vw; height: 100vh; }
 *     #file-input { position: absolute; top: 10px; left: 10px; z-index: 100; }
 *   </style>
 * </head>
 * <body>
 *   <div id="viewer-container"></div>
 *   <input type="file" id="file-input" accept=".ifc" />
 *   <script type="module" src="example-vanilla.js"></script>
 * </body>
 * </html>
 */
