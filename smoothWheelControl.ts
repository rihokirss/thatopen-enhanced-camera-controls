import * as OBC from '@thatopen/components'
import * as THREE from 'three'

export const DOLLY_STEP_REF = { value: 0.5 }

export interface SmoothWheelControlConfig {
  shiftBoost?: number
  fineModifier?: number
  fragmentUpdateDelay?: number
  proximitySlowdown?: boolean
  proximitySlowDistance?: number
  proximityNormalDistance?: number
  proximityFastDistance?: number
  proximityMinSpeed?: number
  proximityMaxSpeed?: number
}

const defaultConfig: Required<SmoothWheelControlConfig> = {
  shiftBoost: 3, // Shift key multiplies step size (3x faster)
  fineModifier: 0.1, // Ctrl/Alt/Meta multiplies step size (0.1 = 10x slower)
  fragmentUpdateDelay: 300, // Delay (ms) before updating fragments after movement stops
  proximitySlowdown: true, // Automatic speed adjustment based on object distance
  proximitySlowDistance: 2.0, // Distance where speed is at minimum
  proximityNormalDistance: 8.0, // Distance where speed is normal (1x) - optimized from 10.0
  proximityFastDistance: 50.0, // Distance where speed reaches maximum
  proximityMinSpeed: 0.2, // Minimum speed when close (0.2 = 20%) - optimized from 0.1
  proximityMaxSpeed: 10.0, // Maximum speed when far (10.0 = 1000%) - optimized from 5.0
}

export function createSmoothWheelControl(
  world: OBC.World,
  components: OBC.Components,
  container: HTMLDivElement | { current: HTMLDivElement | null },
  config: SmoothWheelControlConfig = {}
) {
  const cfg = { ...defaultConfig, ...config }

  let wheelTimeoutId: number | null = null
  let raycastTimeoutId: number | null = null
  let lastRaycastTime = 0
  let cachedSpeedFactor = 1.0
  let isMoving = false
  let cachedRect: DOMRect | null = null
  let lastRectUpdate = 0

  const RAYCAST_THROTTLE = 100 // ms between raycasts
  const RECT_CACHE_DURATION = 100 // ms between rect updates

  const _pos = new THREE.Vector3()
  const _tgt = new THREE.Vector3()
  const _dir = new THREE.Vector3()
  const _mouse = new THREE.Vector2()
  const _raycaster = new THREE.Raycaster()

  /**
   * Performs raycast and updates cached speed factor
   * Also automatically updates orbit point to prevent truck slowdown issues
   */
  const performRaycast = async () => {
    try {
      const caster = components.get(OBC.Raycasters).get(world)
      const result = await caster.castRay()

      // Set orbit point only before zooming starts, not during movement (prevents "bounce back" when passing through walls)
      if (result && 'point' in result && result.point && !isMoving) {
        const point = result.point as THREE.Vector3
        world.camera.controls?.setOrbitPoint(point.x, point.y, point.z)
      }

      if (!cfg.proximitySlowdown) return

      if (result && 'distance' in result && typeof result.distance === 'number') {
        const distance = result.distance

        if (distance < cfg.proximitySlowDistance) {
          cachedSpeedFactor = THREE.MathUtils.lerp(
            cfg.proximityMinSpeed,
            1.0,
            distance / cfg.proximitySlowDistance
          )
        } else if (distance < cfg.proximityNormalDistance) {
          cachedSpeedFactor = 1.0
        } else if (distance < cfg.proximityFastDistance) {
          cachedSpeedFactor = THREE.MathUtils.lerp(
            1.0,
            cfg.proximityMaxSpeed,
            (distance - cfg.proximityNormalDistance) / (cfg.proximityFastDistance - cfg.proximityNormalDistance)
          )
        } else {
          cachedSpeedFactor = cfg.proximityMaxSpeed
        }
      } else {
        // No hit - assume max speed (empty space)
        cachedSpeedFactor = cfg.proximityMaxSpeed
      }
    } catch {
      cachedSpeedFactor = cfg.proximityMaxSpeed
    }
  }

  const wheelHandler = (e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const cc = world.camera.controls
    
    const element = 'current' in container ? container.current : container
    if (!cc || !element) return

    const now = performance.now()
    
    if (!cachedRect || now - lastRectUpdate > RECT_CACHE_DURATION) {
      cachedRect = element.getBoundingClientRect()
      lastRectUpdate = now
    }

    _mouse.set(
      ((e.clientX - cachedRect.left) / cachedRect.width) * 2 - 1,
      -((e.clientY - cachedRect.top) / cachedRect.height) * 2 + 1
    )

    _raycaster.setFromCamera(_mouse, world.camera.three)
    _dir.copy(_raycaster.ray.direction).normalize()

    if (!isMoving && now - lastRaycastTime > RAYCAST_THROTTLE) {
      lastRaycastTime = now
      performRaycast()
    }

    isMoving = true

    // Calculate step size using cached speed factor (no blocking raycast)
    const base = DOLLY_STEP_REF.value
    const boost = e.shiftKey ? cfg.shiftBoost : 1
    const fine = e.altKey || e.ctrlKey || e.metaKey ? cfg.fineModifier : 1
    const sign = e.deltaY < 0 ? 1 : -1
    const step = sign * base * boost * fine * cachedSpeedFactor

    // Move camera
    cc.getPosition(_pos)
    cc.getTarget(_tgt)

    _pos.addScaledVector(_dir, step)
    _tgt.addScaledVector(_dir, step)

    cc.setLookAt(_pos.x, _pos.y, _pos.z, _tgt.x, _tgt.y, _tgt.z, true)

    // Update fragments after delay
    if (wheelTimeoutId !== null) {
      clearTimeout(wheelTimeoutId)
    }

    wheelTimeoutId = window.setTimeout(() => {
      const fragments = components.get(OBC.FragmentsManager)
      fragments.core.update(true)
      wheelTimeoutId = null
      isMoving = false
      
      // Perform final raycast after movement stops (with small delay)
      if (raycastTimeoutId !== null) {
        clearTimeout(raycastTimeoutId)
      }
      raycastTimeoutId = window.setTimeout(() => {
        performRaycast()
        raycastTimeoutId = null
      }, 50)
    }, cfg.fragmentUpdateDelay)
  }

  const cleanup = () => {
    if (wheelTimeoutId !== null) {
      clearTimeout(wheelTimeoutId)
    }
    if (raycastTimeoutId !== null) {
      clearTimeout(raycastTimeoutId)
    }
  }

  return { wheelHandler, cleanup }
}
