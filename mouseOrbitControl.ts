import * as OBC from '@thatopen/components'
import * as THREE from 'three'

const DRAG_DISTANCE_THRESHOLD = 10 // Min pixel distance to trigger orbit point

interface MouseOrbitControlState {
  mouseDownPos: { x: number; y: number }
  hasSetOrbitPoint: boolean
  raycastResult: { point: THREE.Vector3 } | null
}

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

  const mouseDownHandler = async (e: MouseEvent) => {
    if (e.button !== 0) return
    state.mouseDownPos = { x: e.clientX, y: e.clientY }
    state.hasSetOrbitPoint = false
    state.raycastResult = null

    try {
      const caster = components.get(OBC.Raycasters).get(world)
      const result = await caster.castRay()

      if (result && 'point' in result && result.point) {
        state.raycastResult = { point: result.point as THREE.Vector3 }
      }
    } catch (error) {
      console.error('Error raycasting:', error)
    }
  }

  const mouseMoveHandler = (e: MouseEvent) => {
    if (e.buttons !== 1 || state.hasSetOrbitPoint) return

    const distance = Math.sqrt(
      Math.pow(e.clientX - state.mouseDownPos.x, 2) +
        Math.pow(e.clientY - state.mouseDownPos.y, 2)
    )

    if (distance > DRAG_DISTANCE_THRESHOLD && state.raycastResult) {
      state.hasSetOrbitPoint = true
      const point = state.raycastResult.point
      world.camera.controls?.setOrbitPoint(point.x, point.y, point.z)
    }
  }

  const touchStartHandler = (e: TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]

    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = touch.clientX
    const mouseY = touch.clientY

    try {
      const mouse = new THREE.Vector2(
        ((mouseX - rect.left) / rect.width) * 2 - 1,
        -((mouseY - rect.top) / rect.height) * 2 + 1
      )

      const camera = world.camera.three
      camera.updateMatrixWorld(true)

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
 * Sets the orbit point based on raycast from mouse coordinates
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
    const mouse = new THREE.Vector2(
      ((mouseX - rect.left) / rect.width) * 2 - 1,
      -((mouseY - rect.top) / rect.height) * 2 + 1
    )

    const camera = world.camera.three
    camera.updateMatrixWorld(true)

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
