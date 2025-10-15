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
 */
export function createMouseOrbitControl(
  world: OBC.World,
  components: OBC.Components,
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const state: MouseOrbitControlState = {
    mouseDownPos: { x: 0, y: 0 },
    hasSetOrbitPoint: false,
    raycastResult: null,
  }

  // On mouse down: perform raycast to find 3D point under cursor
  const mouseDownHandler = async (e: MouseEvent) => {
    if (e.button !== 0) return // Only left click
    state.mouseDownPos = { x: e.clientX, y: e.clientY }
    state.hasSetOrbitPoint = false
    state.raycastResult = null

    try {
      const caster = components.get(OBC.Raycasters).get(world)
      const result = await caster.castRay()

      if (result && 'point' in result && result.point) {
        // Store the 3D point for later use
        state.raycastResult = { point: result.point as THREE.Vector3 }
      }
    } catch (error) {
      console.error('Error raycasting:', error)
    }
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
  const touchStartHandler = (e: TouchEvent) => {
    if (e.touches.length !== 1) return // Only single touch
    const touch = e.touches[0]

    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = touch.clientX
    const mouseY = touch.clientY

    try {
      // Convert touch coordinates to normalized device coordinates (-1 to +1)
      const mouse = new THREE.Vector2(
        ((mouseX - rect.left) / rect.width) * 2 - 1,
        -((mouseY - rect.top) / rect.height) * 2 + 1
      )

      const camera = world.camera.three
      camera.updateMatrixWorld(true)

      // Perform raycast to find 3D point under touch
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)

      const intersections = raycaster.intersectObjects(
        world.scene.three.children,
        true
      )
      if (intersections.length) {
        const point = intersections[0].point
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
 * Manually sets the orbit point based on raycast from screen coordinates
 * Useful for programmatic orbit point control (e.g., double-click to focus)
 *
 * @param world - That Open Components world instance
 * @param containerRef - Reference to the viewer container element
 * @param mouseX - Screen X coordinate (pixels)
 * @param mouseY - Screen Y coordinate (pixels)
 */
export function setOrbitPoint(
  world: OBC.World,
  containerRef: React.RefObject<HTMLDivElement | null>,
  mouseX: number,
  mouseY: number
) {
  if (!containerRef.current) return

  try {
    const rect = containerRef.current.getBoundingClientRect()

    // Convert screen coordinates to normalized device coordinates (-1 to +1)
    const mouse = new THREE.Vector2(
      ((mouseX - rect.left) / rect.width) * 2 - 1,
      -((mouseY - rect.top) / rect.height) * 2 + 1
    )

    const camera = world.camera.three
    camera.updateMatrixWorld(true)

    // Raycast to find 3D point under cursor
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)

    const intersections = raycaster.intersectObjects(
      world.scene.three.children,
      true
    )

    if (intersections.length) {
      const point = intersections[0].point
      world.camera.controls?.setOrbitPoint(point.x, point.y, point.z)
    }
  } catch (error) {
    console.error('Error in setOrbitPoint:', error)
  }
}
