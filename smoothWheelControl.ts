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
  proximityNormalDistance: 10.0, // Distance where speed is normal (1x)
  proximityFastDistance: 50.0, // Distance where speed reaches maximum
  proximityMinSpeed: 0.1, // Minimum speed when close (0.1 = 10%)
  proximityMaxSpeed: 5.0, // Maximum speed when far (5.0 = 500%)
}

export function createSmoothWheelControl(
  world: OBC.World,
  components: OBC.Components,
  containerRef: React.RefObject<HTMLDivElement | null>,
  config: SmoothWheelControlConfig = {}
) {
  const cfg = { ...defaultConfig, ...config }

  let wheelTimeoutId: number | null = null

  // Cache vectors and objects to avoid creating new ones
  const _pos = new THREE.Vector3()
  const _tgt = new THREE.Vector3()
  const _dir = new THREE.Vector3()
  const _mouse = new THREE.Vector2()
  const _raycaster = new THREE.Raycaster()

  const wheelHandler = async (e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const cc = world.camera.controls
    if (!cc || !containerRef.current) return

    // Calculate mouse position
    const rect = containerRef.current.getBoundingClientRect()
    _mouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )

    // Calculate ray direction from mouse
    _raycaster.setFromCamera(_mouse, world.camera.three)
    _dir.copy(_raycaster.ray.direction).normalize()

    // Calculate proximity speed factor
    let speedFactor = 1.0
    if (cfg.proximitySlowdown) {
      try {
        const caster = components.get(OBC.Raycasters).get(world)
        const result = await caster.castRay()

        if (result && 'distance' in result && typeof result.distance === 'number') {
          const distance = result.distance

          if (distance < cfg.proximitySlowDistance) {
            speedFactor = THREE.MathUtils.lerp(
              cfg.proximityMinSpeed,
              1.0,
              distance / cfg.proximitySlowDistance
            )
          } else if (distance < cfg.proximityNormalDistance) {
            speedFactor = 1.0
          } else if (distance < cfg.proximityFastDistance) {
            speedFactor = THREE.MathUtils.lerp(
              1.0,
              cfg.proximityMaxSpeed,
              (distance - cfg.proximityNormalDistance) / (cfg.proximityFastDistance - cfg.proximityNormalDistance)
            )
          } else {
            speedFactor = cfg.proximityMaxSpeed
          }
        }
      } catch (error) {
        // Ignore raycasting errors, use default speed
      }
    }

    // Calculate step size
    const base = DOLLY_STEP_REF.value
    const boost = e.shiftKey ? cfg.shiftBoost : 1
    const fine = e.altKey || e.ctrlKey || e.metaKey ? cfg.fineModifier : 1
    const sign = e.deltaY < 0 ? 1 : -1
    const step = sign * base * boost * fine * speedFactor

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
    }, cfg.fragmentUpdateDelay)
  }

  const cleanup = () => {
    if (wheelTimeoutId !== null) {
      clearTimeout(wheelTimeoutId)
    }
  }

  return { wheelHandler, cleanup }
}
