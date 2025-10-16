/**
 * Complete React component example showing how to use the enhanced camera controls
 * with That Open Components
 */

import { useEffect, useRef } from 'react'
import * as OBC from '@thatopen/components'
import * as OBCF from '@thatopen/components-front'
import { createSmoothWheelControl } from './smoothWheelControl'
import { createMouseOrbitControl } from './mouseOrbitControl'

export function Viewer() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const initViewer = async () => {
      // =========================================
      // 1. Create Components instance
      // =========================================
      const components = new OBC.Components()
      const worlds = components.get(OBC.Worlds)
      const world = worlds.create<
        OBC.SimpleScene,
        OBC.OrthoPerspectiveCamera,
        OBC.SimpleRenderer
      >()

      // =========================================
      // 2. Setup Scene, Renderer, and Camera
      // =========================================
      world.scene = new OBC.SimpleScene(components)
      world.scene.setup()
      world.scene.three.background = null

      world.renderer = new OBCF.PostproductionRenderer(
        components,
        containerRef.current!
      )

      world.camera = new OBC.OrthoPerspectiveCamera(components)

      await components.init()

      // =========================================
      // 3. Configure Camera Controls
      // =========================================
      const CamControls = (await import('camera-controls')).default
      const controls = world.camera.controls

      if (controls && 'mouseButtons' in controls) {
        // Disable default wheel behavior - we'll handle it with smoothWheelControl
        controls.mouseButtons = {
          left: CamControls.ACTION.ROTATE,
          middle: CamControls.ACTION.TRUCK,
          right: CamControls.ACTION.TRUCK,
          wheel: CamControls.ACTION.NONE, // Important: disable default wheel
        }

        // Optional: set distance limits
        if ('minDistance' in controls) controls.minDistance = 0.3
        if ('maxDistance' in controls) controls.maxDistance = 500
      }

      // =========================================
      // 4. Setup Enhanced Camera Controls
      // =========================================

      // Smooth wheel zooming with custom configuration
      const smoothWheel = createSmoothWheelControl(
        world,
        components,
        containerRef,
        {
          velocityDecay: 0.9, // 10% velocity reduction per scroll
          velocityDivisor: 200, // Medium acceleration
          maxVelocityMultiplier: 5, // Max 5x speed
          smoothing: 0.15, // Smooth animation
          stepAccumulation: 0.3, // 30% motion carry-over
        }
      )

      // Mouse orbit control for intelligent rotation center
      const mouseOrbit = createMouseOrbitControl(world, components, containerRef)

      // =========================================
      // 5. Add Event Listeners
      // =========================================
      const container = containerRef.current

      container.addEventListener('wheel', smoothWheel.wheelHandler, {
        passive: false, // Required to prevent default scroll
      })

      container.addEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
      container.addEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)
      container.addEventListener('touchstart', mouseOrbit.touchStartHandler, true)

      // =========================================
      // 6. Setup Fragment Manager
      // =========================================
      const fragments = components.get(OBC.FragmentsManager)
      await fragments.init()

      // Auto-calibrate zoom speed when models are loaded
      fragments.list.onItemSet.add(({ value: model }) => {
        model.useCamera(world.camera.three)
        world.scene.three.add(model.object)

        // Update fragments after camera stops
        fragments.core.update(true)
      })

      // Update fragments when camera stops moving
      world.camera.controls.addEventListener('rest', () => {
        fragments.core.update(true)
      })

      // =========================================
      // 7. Optional: Setup Grid
      // =========================================
      const grids = components.get(OBC.Grids)
      const grid = grids.create(world)

      // =========================================
      // 8. Cleanup Function
      // =========================================
      return () => {
        // Remove event listeners
        container.removeEventListener('wheel', smoothWheel.wheelHandler)
        container.removeEventListener('mousedown', mouseOrbit.mouseDownHandler, true)
        container.removeEventListener('mousemove', mouseOrbit.mouseMoveHandler, true)
        container.removeEventListener('touchstart', mouseOrbit.touchStartHandler, true)

        // Cleanup smooth wheel (stops animations)
        smoothWheel.cleanup()

        // Dispose components
        components.dispose()
      }
    }

    // Initialize viewer and store cleanup function
    let cleanup: (() => void) | undefined
    initViewer().then((cleanupFn) => (cleanup = cleanupFn))

    // Return cleanup function for React
    return () => cleanup?.()
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(to bottom, #1a1a1a, #2d2d2d)',
      }}
    />
  )
}

/**
 * Usage Tips:
 *
 * 1. Load IFC models:
 *    const ifcLoader = components.get(OBC.IfcLoader)
 *    const model = await ifcLoader.load(fileData)
 *
 * 2. Customize zoom for large buildings:
 *    createSmoothWheelControl(world, components, containerRef, {
 *      velocityDivisor: 300,     // Slower acceleration
 *      maxVelocityMultiplier: 3  // Lower max speed
 *    })
 *
 * 3. Customize zoom for small parts:
 *    createSmoothWheelControl(world, components, containerRef, {
 *      velocityDivisor: 150,     // Faster acceleration
 *      maxVelocityMultiplier: 8  // Higher max speed
 *    })
 *
 * 4. Manual orbit point control:
 *    import { setOrbitPoint } from './mouseOrbitControl'
 *
 *    // On double-click, focus on clicked point
 *    container.addEventListener('dblclick', (e) => {
 *      setOrbitPoint(world, containerRef, e.clientX, e.clientY)
 *    })
 */
