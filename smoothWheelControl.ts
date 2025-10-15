import * as OBC from '@thatopen/components'
import * as THREE from 'three'

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
  velocityDecay: 0.9, // Summutab wheelVelocity kasvu iga scrolliga (0.9 = -10%)
  velocityTimeout: 150, // Pärast seda pikkust pausi (ms) nullitakse wheelVelocity
  velocityDivisor: 200, // Konverteerib wheelVelocity → velocityMultiplier (väiksem = kiirem kiirendus)
  maxVelocityMultiplier: 5, // Piiritleb maksimaalne kiirendus (5x baaskiirusest)
  smoothing: 0.15, // Iga kaadri liikumise osa targetStep'ist (0.15 = 15% kaadris)
  stepAccumulation: 0.3, // Kui palju eelmist targetStep säilib uue scrolli korral (0.3 = 30%)
  shiftBoost: 3, // Shift-klahv korrutab sammu suurust (3x kiirem)
  fineModifier: 0.1, // Ctrl/Alt/Meta korrutab sammu suurust (0.1 = 10x aeglasem)
  fragmentUpdateDelay: 300, // Viivitus (ms) enne fragmentide uuendamist pärast liikumise lõppu
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

  const animate = () => {
    const cc = world.camera.controls
    if (!cc || !containerRef.current || Math.abs(targetStep) < 0.001) {
      targetStep = 0
      animationFrameId = null
      return
    }

    const currentStep = targetStep * cfg.smoothing
    targetStep -= currentStep

    const pos = cc.getPosition(new THREE.Vector3())
    const tgt = cc.getTarget(new THREE.Vector3())

    const rect = containerRef.current.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((lastMouseX - rect.left) / rect.width) * 2 - 1,
      -((lastMouseY - rect.top) / rect.height) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, world.camera.three)
    const dir = raycaster.ray.direction.clone().normalize()

    pos.addScaledVector(dir, currentStep)
    tgt.addScaledVector(dir, currentStep)

    cc.setLookAt(pos.x, pos.y, pos.z, tgt.x, tgt.y, tgt.z, false)

    animationFrameId = requestAnimationFrame(animate)
  }

  const wheelHandler = (e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const cc = world.camera.controls
    if (!cc) return

    lastMouseX = e.clientX
    lastMouseY = e.clientY

    const now = Date.now()
    const timeSinceLastWheel = now - lastWheelTime

    if (timeSinceLastWheel > cfg.velocityTimeout) {
      wheelVelocity = 0
    } else {
      wheelVelocity = wheelVelocity * cfg.velocityDecay
    }

    const scrollDelta = Math.abs(e.deltaY)
    wheelVelocity += scrollDelta

    const velocityMultiplier = Math.min(
      1 + wheelVelocity / cfg.velocityDivisor,
      cfg.maxVelocityMultiplier
    )

    const base = DOLLY_STEP_REF.value
    const boost = e.shiftKey ? cfg.shiftBoost : 1
    const fine = e.altKey || e.ctrlKey || e.metaKey ? cfg.fineModifier : 1
    const sign = e.deltaY < 0 ? 1 : -1
    const step = sign * base * boost * fine * velocityMultiplier

    targetStep = targetStep * cfg.stepAccumulation + step

    lastWheelTime = now

    if (animationFrameId === null) {
      animationFrameId = requestAnimationFrame(animate)
    }

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

export function calibrateDollyStepByScene(world: OBC.World) {
  const bbox = new THREE.Box3().setFromObject(world.scene.three)
  const diag = bbox.getSize(new THREE.Vector3()).length()
  if (isFinite(diag) && diag > 0) {
    DOLLY_STEP_REF.value = Math.max(diag * 0.02, 0.5)
  }
}
