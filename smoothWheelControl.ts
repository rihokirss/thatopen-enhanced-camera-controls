import * as OBC from '@thatopen/components'
import * as THREE from 'three'

// Base dolly step size - auto-calibrated by calibrateDollyStepByScene()
export const DOLLY_STEP_REF = { value: 0.2 }

export interface SmoothWheelControlConfig {
  velocityDecay?: number
  velocityTimeout?: number
  velocityDivisor?: number
  maxVelocityMultiplier?: number
  smoothing?: number
  stepAccumulation?: number
  shiftBoost?: number
  fineModifier?: number
  fragmentUpdateDelay?: number
}

const defaultConfig: Required<SmoothWheelControlConfig> = {
  velocityDecay: 0.9, // Dampens wheelVelocity growth per scroll (0.9 = -10%)
  velocityTimeout: 150, // After this pause (ms), wheelVelocity resets to zero
  velocityDivisor: 200, // Converts wheelVelocity → velocityMultiplier (lower = faster acceleration)
  maxVelocityMultiplier: 5, // Limits maximum acceleration (5x base speed)
  smoothing: 0.15, // Fraction of targetStep to move per frame (0.15 = 15% per frame)
  stepAccumulation: 0.3, // How much previous targetStep carries over on new scroll (0.3 = 30%)
  shiftBoost: 3, // Shift key multiplies step size (3x faster)
  fineModifier: 0.1, // Ctrl/Alt/Meta multiplies step size (0.1 = 10x slower)
  fragmentUpdateDelay: 300, // Delay (ms) before updating fragments after movement stops
}

export function createSmoothWheelControl(
  world: OBC.World,
  components: OBC.Components,
  containerRef: React.RefObject<HTMLDivElement | null>,
  config: SmoothWheelControlConfig = {}
) {
  const cfg = { ...defaultConfig, ...config }
  
  let lastWheelTime = 0
  let wheelVelocity = 0
  let wheelTimeoutId: number | null = null
  let targetStep = 0
  let animationFrameId: number | null = null
  let lastMouseX = 0
  let lastMouseY = 0

  // Animation loop: smoothly moves camera along raycast direction
  const animate = () => {
    const cc = world.camera.controls
    if (!cc || !containerRef.current || Math.abs(targetStep) < 0.001) {
      targetStep = 0
      animationFrameId = null
      return
    }

    // Calculate smooth step (fraction of remaining distance)
    const currentStep = targetStep * cfg.smoothing
    targetStep -= currentStep

    // Get current camera position and target
    const pos = cc.getPosition(new THREE.Vector3())
    const tgt = cc.getTarget(new THREE.Vector3())

    // Calculate direction vector from mouse position via raycast
    const rect = containerRef.current.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((lastMouseX - rect.left) / rect.width) * 2 - 1,
      -((lastMouseY - rect.top) / rect.height) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, world.camera.three)
    const dir = raycaster.ray.direction.clone().normalize()

    // Move both camera position and target along the ray direction
    pos.addScaledVector(dir, currentStep)
    tgt.addScaledVector(dir, currentStep)

    cc.setLookAt(pos.x, pos.y, pos.z, tgt.x, tgt.y, tgt.z, false)

    animationFrameId = requestAnimationFrame(animate)
  }

  // Wheel event handler: calculates velocity and starts animation
  const wheelHandler = (e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const cc = world.camera.controls
    if (!cc) return

    // Store mouse position for raycast direction
    lastMouseX = e.clientX
    lastMouseY = e.clientY

    const now = Date.now()
    const timeSinceLastWheel = now - lastWheelTime

    // Reset or decay velocity based on time since last scroll
    if (timeSinceLastWheel > cfg.velocityTimeout) {
      wheelVelocity = 0 // Long pause - reset velocity
    } else {
      wheelVelocity = wheelVelocity * cfg.velocityDecay // Decay previous velocity
    }

    // Accumulate scroll velocity
    const scrollDelta = Math.abs(e.deltaY)
    wheelVelocity += scrollDelta

    // Convert velocity to speed multiplier (capped at max)
    const velocityMultiplier = Math.min(
      1 + wheelVelocity / cfg.velocityDivisor,
      cfg.maxVelocityMultiplier
    )

    // Calculate final step with modifiers
    const base = DOLLY_STEP_REF.value
    const boost = e.shiftKey ? cfg.shiftBoost : 1 // Shift = faster
    const fine = e.altKey || e.ctrlKey || e.metaKey ? cfg.fineModifier : 1 // Ctrl/Alt = slower
    const sign = e.deltaY < 0 ? 1 : -1 // Scroll direction
    const step = sign * base * boost * fine * velocityMultiplier

    // Accumulate step (blends with previous motion)
    targetStep = targetStep * cfg.stepAccumulation + step

    lastWheelTime = now

    // Start animation loop if not already running
    if (animationFrameId === null) {
      animationFrameId = requestAnimationFrame(animate)
    }

    // Schedule fragment update after movement stops
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
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }
    if (wheelTimeoutId !== null) {
      clearTimeout(wheelTimeoutId)
    }
  }

  return { wheelHandler, cleanup }
}

/**
 * Auto-calibrates dolly step based on scene bounding box
 * Fixes the dolly slowdown issue by adjusting zoom speed to scene size
 * Call this after loading models
 */
export function calibrateDollyStepByScene(world: OBC.World) {
  const bbox = new THREE.Box3().setFromObject(world.scene.three)
  const diag = bbox.getSize(new THREE.Vector3()).length()
  if (isFinite(diag) && diag > 0) {
    // Set step to 2% of scene diagonal (minimum 0.5)
    DOLLY_STEP_REF.value = Math.max(diag * 0.02, 0.5)
  }
}
