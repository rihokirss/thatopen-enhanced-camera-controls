import * as OBC from '@thatopen/components'
import * as THREE from 'three'

// Minimum pixel distance to trigger orbit point setting (prevents accidental triggers on clicks)
const DRAG_DISTANCE_THRESHOLD = 10

interface MouseOrbitControlState {
  mouseDownPos: { x: number; y: number }
  hasSetOrbitPoint: boolean
  raycastResult: { point: THREE.Vector3 } | null
}

/**
 * Creates smart orbit controls that automatically set the rotation center
 * based on what the user clicks on (raycast-based)
 * 
 * Performance optimizations:
 * - mouseDownHandler is non-blocking (uses promise chain instead of async/await)
 * - containerRef parameter removed (not needed)
 */
export function createMouseOrbitControl(
  world: OBC.World,
  components: OBC.Components
) {
  const state: MouseOrbitControlState = {
    mouseDownPos: { x: 0, y: 0 },
    hasSetOrbitPoint: false,
    raycastResult: null,
  }

  // On mouse down: perform raycast to find 3D point under cursor (non-blocking)
  const mouseDownHandler = (e: MouseEvent) => {
    if (e.button !== 0) return // Only left click
    state.mouseDownPos = { x: e.clientX, y: e.clientY }
    state.hasSetOrbitPoint = false
    state.raycastResult = null

    const caster = components.get(OBC.Raycasters).get(world)
    caster.castRay().then((result) => {
      if (result && 'point' in result && result.point) {
        // Store the 3D point for later use
        state.raycastResult = { point: result.point as THREE.Vector3 }
      }
    }).catch((error) => {
      console.error('Error raycasting:', error)
    })
  }

  // On mouse move: check if user is dragging, then set orbit point
  const mouseMoveHandler = (e: MouseEvent) => {
    if (e.buttons !== 1 || state.hasSetOrbitPoint) return // Only while left button pressed

    // Calculate drag distance
    const distance = Math.sqrt(
      Math.pow(e.clientX - state.mouseDownPos.x, 2) +
        Math.pow(e.clientY - state.mouseDownPos.y, 2)
    )

    // If dragged beyond threshold, set orbit point (once per drag operation)
    if (distance > DRAG_DISTANCE_THRESHOLD && state.raycastResult) {
      state.hasSetOrbitPoint = true
      const point = state.raycastResult.point
      world.camera.controls?.setOrbitPoint(point.x, point.y, point.z)
    }
  }

  // Touch support: immediately set orbit point on touch
  const touchStartHandler = async (e: TouchEvent) => {
    if (e.touches.length !== 1) return // Only single touch

    try {
      const caster = components.get(OBC.Raycasters).get(world)
      const result = await caster.castRay()

      if (result && 'point' in result && result.point) {
        const point = result.point as THREE.Vector3
        world.camera.controls?.setOrbitPoint(point.x, point.y, point.z)
      }
    } catch (error) {
      console.error('Error in touchStartHandler:', error)
    }
  }

  return {
    mouseDownHandler,
    mouseMoveHandler,
    touchStartHandler,
  }
}

/**
 * Manually sets the orbit point based on raycast at current mouse position
 * Useful for programmatic orbit point control (e.g., double-click to focus)
 * Note: OBC raycaster uses current mouse position automatically
 *
 * @param world - That Open Components world instance
 * @param components - That Open Components instance
 */
export async function setOrbitPoint(
  world: OBC.World,
  components: OBC.Components
) {
  try {
    const caster = components.get(OBC.Raycasters).get(world)
    const result = await caster.castRay()

    if (result && 'point' in result && result.point) {
      const point = result.point as THREE.Vector3
      world.camera.controls?.setOrbitPoint(point.x, point.y, point.z)
    }
  } catch (error) {
    console.error('Error in setOrbitPoint:', error)
  }
}
