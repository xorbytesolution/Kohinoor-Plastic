'use client'

import React, { Component, ReactNode, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, ContactShadows, Environment, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { PRODUCT_COLORS, ProductColor } from '@/lib/products'

// Preload the primary GLTF model and custom branded textures
if (typeof window !== 'undefined') {
  useGLTF.preload('/model/stanley_tumbler_travel_cup_40_oz.glb')
  useTexture.preload('/model/cup_Baked_baseColor_kohinoor.png')
  useTexture.preload('/model/cup_Baked_baseColor_neutral.png')
}

export type PageSection =
  | 'hero'
  | 'story'
  | 'atelier'
  | 'manifesto'
  | 'masterwork'
  | 'exhibition'
  | 'signatures'
  | 'salon'
  | 'footer'

interface ContinuousModelStageProps {
  section: PageSection
  storyProgress: number // 0 to 1
  selectedColor?: string | ProductColor
  heroExploded?: boolean
  masterworkExploded?: boolean
  heroPreset?: 'beauty' | 'lid' | 'handle' | 'base'
  masterworkPreset?: 'beauty' | 'lid' | 'handle' | 'base'
}

// GLTF model mesh with custom branded Kohinoor textures & scroll-driven exploded lid
function MasterTumblerMesh({
  modelPath,
  colorHex,
  tone,
  metalness,
  roughness,
  explodedAmount = 0,
}: {
  modelPath: string
  colorHex: string
  tone: string
  metalness: number
  roughness: number
  explodedAmount: number
}) {
  const { scene } = useGLTF(modelPath)
  const [orangeTexture, neutralTexture] = useTexture([
    '/model/cup_Baked_baseColor_kohinoor.png',
    '/model/cup_Baked_baseColor_neutral.png',
  ])

  // Configure textures for Three.js PBR rendering
  orangeTexture.flipY = false
  orangeTexture.colorSpace = THREE.SRGBColorSpace
  neutralTexture.flipY = false
  neutralTexture.colorSpace = THREE.SRGBColorSpace

  const lidNodeRef = useRef<THREE.Object3D | null>(null)
  const initialLidY = useRef<number | null>(null)

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map((m) => m.clone())
          } else {
            child.material = child.material.clone()
          }
        }
      }
    })
    return clone
  }, [scene])

  useEffect(() => {
    const lid = clonedScene.getObjectByName('lid_Baked')
    if (lid) {
      lidNodeRef.current = lid
      if (initialLidY.current === null) {
        initialLidY.current = lid.position.y
      }
    }
  }, [clonedScene])

  // Smoothly move lid along Y axis when exploded
  useFrame((_, delta) => {
    if (lidNodeRef.current && initialLidY.current !== null) {
      const targetY = initialLidY.current + explodedAmount * 4.6
      lidNodeRef.current.position.y = THREE.MathUtils.lerp(
        lidNodeRef.current.position.y,
        targetY,
        delta * 6.5
      )
    }
  })

  // Material updates: apply branded Kohinoor texture directly to cup body
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.material) return

      const materials = Array.isArray(child.material) ? child.material : [child.material]

      materials.forEach((mat) => {
        const matName = (mat.name || child.name).toLowerCase()

        if (matName.includes('cup')) {
          if ('transmission' in mat) {
            ;(mat as any).transmission = 0
          }
          if ('thickness' in mat) {
            ;(mat as any).thickness = 0
          }
          mat.transparent = false
          mat.opacity = 1
          mat.depthWrite = true

          if (tone === 'orange') {
            mat.map = orangeTexture
            mat.color.set('#ffffff')
            mat.metalness = 0.2
            mat.roughness = 0.28
          } else {
            mat.map = neutralTexture
            mat.color.set(colorHex)
            mat.metalness = metalness
            mat.roughness = roughness
          }
          mat.needsUpdate = true
        } else if (matName.includes('lid')) {
          if ('transmission' in mat) {
            ;(mat as any).transmission = 0.25
          }
          mat.transparent = true
          mat.opacity = 0.94
          mat.depthWrite = true

          if (tone === 'orange') {
            mat.color.set('#ffffff')
          } else {
            mat.color.set(colorHex)
          }
          mat.needsUpdate = true
        }
      })
    })
  }, [clonedScene, orangeTexture, neutralTexture, colorHex, tone, metalness, roughness])

  return (
    <Center top={false}>
      {/* 3/4 front beauty orientation: handle on right, straw upright */}
      <group rotation={[0, -0.6, 0]}>
        <primitive object={clonedScene} />
      </group>
    </Center>
  )
}

// Parallax controller: responds with spring inertia to cursor movement
function ParallaxWrapper({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame((_, delta) => {
    if (!group.current) return
    const targetX = -mouseRef.current.y * 0.12
    const targetY = mouseRef.current.x * 0.18
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, delta * 3.5)
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, delta * 3.5)
  })

  return <group ref={group}>{children}</group>
}

// Master scene controller: glides the single 3D model with resting docks, lift-off arcs, and smooth landings
function MasterSceneController({
  section,
  storyProgress,
  colorHex,
  tone,
  metalness,
  roughness,
  heroExploded,
  masterworkExploded,
  heroPreset,
  masterworkPreset,
  onTransformUpdate,
}: {
  section: PageSection
  storyProgress: number
  colorHex: string
  tone: string
  metalness: number
  roughness: number
  heroExploded: boolean
  masterworkExploded: boolean
  heroPreset: 'beauty' | 'lid' | 'handle' | 'base'
  masterworkPreset: 'beauty' | 'lid' | 'handle' | 'base'
  onTransformUpdate?: (x: number, y: number, z: number, lift: number) => void
}) {
  const rootGroup = useRef<THREE.Group>(null)
  const { viewport } = useThree()
  const isNarrow = viewport.width < 1.15

  // Compute preset rotation adjustments
  const getPresetRotation = (preset: 'beauty' | 'lid' | 'handle' | 'base'): [number, number, number] => {
    switch (preset) {
      case 'lid':
        return [0.42, 0, 0]
      case 'handle':
        return [0, 1.35, 0]
      case 'base':
        return [-0.35, 0, 0]
      case 'beauty':
      default:
        return [0.02, 0, 0]
    }
  }

  // Calculate target dock position, rotation, scale, explode, and chapter dwell/lift
  const config = useMemo(() => {
    // 1. HERO SECTION (RESTING DOCK ON HERO PEDESTAL - LOWERED & CENTERED)
    if (section === 'hero') {
      const presetRot = getPresetRotation(heroPreset)
      return {
        pos: [isNarrow ? 0 : 0.28, isNarrow ? -0.02 : -0.07, 0] as [number, number, number],
        rot: [presetRot[0], -0.45 + presetRot[1], presetRot[2]] as [number, number, number],
        scale: isNarrow ? 0.74 : 0.88,
        explodedAmount: heroExploded ? 1.0 : 0,
        isDwell: true,
        dwellLift: 0,
      }
    }

    // 2. SCROLL STORY TRACK (400vh PINNED FILM WITH EXPLICIT RESTING DOCKS & LIFT-OFF ARCS)
    if (section === 'story') {
      const p = Math.min(1, Math.max(0, storyProgress))
      const xOff = isNarrow ? 0 : 0.24
      const yOff = isNarrow ? 0.02 : -0.06

      if (p <= 0.04) {
        // Entering Ch1 from Hero
        const t = p / 0.04
        return {
          pos: [xOff, yOff, 0] as [number, number, number],
          rot: [0.02, THREE.MathUtils.lerp(-0.45, 0.05, t), 0] as [number, number, number],
          scale: isNarrow ? 0.84 : 1.04,
          explodedAmount: 0,
          isDwell: false,
          dwellLift: Math.sin(t * Math.PI) * 0.06,
        }
      } else if (p <= 0.20) {
        // CHAPTER 1 DWELL ZONE (RUKNA: ARCHITECTURAL SILHOUETTE DOCK)
        return {
          pos: [xOff, yOff, 0] as [number, number, number],
          rot: [0.02, 0.05, 0] as [number, number, number],
          scale: isNarrow ? 0.86 : 1.05,
          explodedAmount: 0,
          isDwell: true,
          dwellLift: 0,
        }
      } else if (p <= 0.28) {
        // LIFT OFF & TRANSIT TO CHAPTER 2 (UTH KAR JANA: ELEVATING & EXPLODING)
        const t = (p - 0.20) / 0.08
        const smoothT = (1 - Math.cos(t * Math.PI)) * 0.5
        const lift = Math.sin(t * Math.PI) * 0.12
        return {
          pos: [xOff, yOff - 0.02 * smoothT, 0] as [number, number, number],
          rot: [
            THREE.MathUtils.lerp(0.02, 0.12, smoothT),
            THREE.MathUtils.lerp(0.05, 1.25, smoothT),
            Math.sin(t * Math.PI) * -0.06,
          ] as [number, number, number],
          scale: isNarrow ? 0.88 : 1.08,
          explodedAmount: smoothT,
          isDwell: false,
          dwellLift: lift,
        }
      } else if (p <= 0.44) {
        // CHAPTER 2 DWELL ZONE (RUKNA: EXPLODED ANATOMY LOCK)
        return {
          pos: [xOff, yOff - 0.02, 0] as [number, number, number],
          rot: [0.12, 1.25, 0] as [number, number, number],
          scale: isNarrow ? 0.90 : 1.10,
          explodedAmount: 1.0,
          isDwell: true,
          dwellLift: 0,
        }
      } else if (p <= 0.52) {
        // LIFT OFF & TRANSIT TO CHAPTER 3 (UTH KAR JANA: SEALS LID, TURNS FORWARD)
        const t = (p - 0.44) / 0.08
        const smoothT = (1 - Math.cos(t * Math.PI)) * 0.5
        const lift = Math.sin(t * Math.PI) * 0.12
        return {
          pos: [
            xOff - 0.02 * smoothT,
            yOff - THREE.MathUtils.lerp(0.02, 0.01, smoothT),
            0,
          ] as [number, number, number],
          rot: [
            THREE.MathUtils.lerp(0.12, 0.03, smoothT),
            THREE.MathUtils.lerp(1.25, 2.20, smoothT),
            Math.sin(t * Math.PI) * 0.06,
          ] as [number, number, number],
          scale: isNarrow ? 0.90 : 1.10,
          explodedAmount: 1.0 - smoothT,
          isDwell: false,
          dwellLift: lift,
        }
      } else if (p <= 0.70) {
        // CHAPTER 3 DWELL ZONE (RUKNA: MATERIAL STUDY TURNTABLE DOCK)
        return {
          pos: [xOff - 0.02, yOff - 0.01, 0] as [number, number, number],
          rot: [0.03, 2.20, 0] as [number, number, number],
          scale: isNarrow ? 0.90 : 1.10,
          explodedAmount: 0,
          isDwell: true,
          dwellLift: 0,
        }
      } else if (p <= 0.78) {
        // LIFT OFF & ORBITAL TRANSIT TO CHAPTER 4 (UTH KAR JANA: CELESTIAL SWEEP)
        const t = (p - 0.70) / 0.08
        const smoothT = (1 - Math.cos(t * Math.PI)) * 0.5
        const lift = Math.sin(t * Math.PI) * 0.14
        return {
          pos: [xOff, yOff, 0] as [number, number, number],
          rot: [
            0.04,
            THREE.MathUtils.lerp(2.20, 6.28, smoothT),
            Math.sin(t * Math.PI) * -0.08,
          ] as [number, number, number],
          scale: isNarrow ? 0.86 : 1.05,
          explodedAmount: 0,
          isDwell: false,
          dwellLift: lift,
        }
      } else {
        // CHAPTER 4 DWELL ZONE (RUKNA: CELESTIAL PURITY DOCK)
        return {
          pos: [xOff, yOff, 0] as [number, number, number],
          rot: [0.04, 6.28, 0] as [number, number, number],
          scale: isNarrow ? 0.85 : 1.04,
          explodedAmount: 0,
          isDwell: true,
          dwellLift: 0,
        }
      }
    }

    // 3. THE ATELIER (STEADY RESTING DOCK: METALLURGY PEDESTAL)
    if (section === 'atelier') {
      return {
        pos: [isNarrow ? 0 : 0.27, isNarrow ? 0 : -0.07, 0] as [number, number, number],
        rot: [0.03, 0.85, 0] as [number, number, number],
        scale: isNarrow ? 0 : 0.98,
        explodedAmount: 0,
        isDwell: true,
        dwellLift: 0,
      }
    }

    // 4. THE MANIFESTO (STEADY RESTING DOCK: MONOLITH FRAME)
    if (section === 'manifesto') {
      return {
        pos: [isNarrow ? 0 : 0.26, isNarrow ? 0 : -0.06, 0] as [number, number, number],
        rot: [0.04, 1.45, 0] as [number, number, number],
        scale: isNarrow ? 0 : 1.02,
        explodedAmount: 0,
        isDwell: true,
        dwellLift: 0,
      }
    }

    // 5. MASTERWORK INTERACTIVE INSPECTION (STEADY RESTING DOCK: PBR INSPECTION BAY)
    if (section === 'masterwork') {
      const presetRot = getPresetRotation(masterworkPreset)
      return {
        pos: [isNarrow ? 0 : -0.25, isNarrow ? 0 : -0.06, 0] as [number, number, number],
        rot: [presetRot[0], presetRot[1], presetRot[2]] as [number, number, number],
        scale: isNarrow ? 0 : 1.05,
        explodedAmount: masterworkExploded ? 1.0 : 0,
        isDwell: true,
        dwellLift: 0,
      }
    }

    // 6. LOWER SECTIONS (EXHIBITION, SIGNATURES, SALON, FOOTER)
    return {
      pos: [0, -0.85, -0.6] as [number, number, number],
      rot: [0.02, 2.2, 0] as [number, number, number],
      scale: 0,
      explodedAmount: 0,
      isDwell: false,
      dwellLift: 0,
    }
  }, [
    section,
    storyProgress,
    heroExploded,
    masterworkExploded,
    heroPreset,
    masterworkPreset,
    isNarrow,
  ])

  // Smooth lerp transition with dynamic inter-station ballistic flight
  useFrame((_, delta) => {
    if (!rootGroup.current) return

    // In-flight aerodynamic banking based on lateral travel
    const dx = config.pos[0] - rootGroup.current.position.x
    const aerodynamicBankZ = -THREE.MathUtils.clamp(dx * 0.35, -0.18, 0.18)

    // Lift is purely driven by scroll dwell telemetry (NO circular feedback loop)
    const totalLift = config.dwellLift || 0
    const effectiveTargetY = config.pos[1] + totalLift
    const effectiveTargetZ = config.pos[2]
    const effectiveTargetRotZ = config.rot[2] + aerodynamicBankZ

    // Smooth organic spring/lerp (cushioned touchdown when landing)
    const lerpSpeed = delta * 4.8
    rootGroup.current.position.x = THREE.MathUtils.lerp(
      rootGroup.current.position.x,
      config.pos[0],
      lerpSpeed
    )
    rootGroup.current.position.y = THREE.MathUtils.lerp(
      rootGroup.current.position.y,
      effectiveTargetY,
      lerpSpeed
    )
    rootGroup.current.position.z = THREE.MathUtils.lerp(
      rootGroup.current.position.z,
      effectiveTargetZ,
      lerpSpeed
    )

    rootGroup.current.rotation.x = THREE.MathUtils.lerp(
      rootGroup.current.rotation.x,
      config.rot[0],
      lerpSpeed
    )
    rootGroup.current.rotation.y = THREE.MathUtils.lerp(
      rootGroup.current.rotation.y,
      config.rot[1],
      lerpSpeed
    )
    rootGroup.current.rotation.z = THREE.MathUtils.lerp(
      rootGroup.current.rotation.z,
      effectiveTargetRotZ,
      lerpSpeed
    )

    const nextScale = THREE.MathUtils.lerp(rootGroup.current.scale.x, config.scale, delta * 5.0)
    rootGroup.current.scale.setScalar(nextScale)
    rootGroup.current.visible = nextScale > 0.015

    if (onTransformUpdate) {
      onTransformUpdate(
        rootGroup.current.position.x,
        rootGroup.current.position.y,
        rootGroup.current.position.z,
        totalLift
      )
    }
  })

  return (
    <ParallaxWrapper>
      <group ref={rootGroup}>
        <MasterTumblerMesh
          modelPath="/model/stanley_tumbler_travel_cup_40_oz.glb"
          colorHex={colorHex}
          tone={tone}
          metalness={metalness}
          roughness={roughness}
          explodedAmount={config.explodedAmount}
        />
      </group>
    </ParallaxWrapper>
  )
}

// Dynamic ground shadow that tracks the tumbler and responds to lift-off height
function DynamicGroundShadow({
  shadowPosRef,
  isSectionVisible,
}: {
  shadowPosRef: React.MutableRefObject<{ x: number; y: number; z: number; lift: number }>
  isSectionVisible: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Track tumbler horizontal position
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      shadowPosRef.current.x,
      delta * 8.0
    )
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      shadowPosRef.current.z,
      delta * 8.0
    )

    // Respond to flight lift: shadow softens and expands when lifted, sharpens when docked
    const liftFactor = THREE.MathUtils.clamp(shadowPosRef.current.lift / 0.16, 0, 1)
    const targetScale = THREE.MathUtils.lerp(1.0, 1.45, liftFactor)
    groupRef.current.scale.set(targetScale, 1, targetScale)

    const targetOpacity = isSectionVisible
      ? THREE.MathUtils.lerp(0.44, 0.14, liftFactor)
      : 0

    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material.opacity = THREE.MathUtils.lerp(
          child.material.opacity,
          targetOpacity,
          delta * 6.0
        )
      }
    })
  })

  return (
    <group ref={groupRef} position={[0.28, -0.22, 0]}>
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.44}
        scale={1.4}
        blur={2.4}
        far={1.4}
        color="#1b1d22"
      />
    </group>
  )
}

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class MasterErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export function ContinuousModelStage({
  section,
  storyProgress,
  selectedColor,
  heroExploded = false,
  masterworkExploded = false,
  heroPreset = 'beauty',
  masterworkPreset = 'beauty',
}: ContinuousModelStageProps) {
  const resolvedColor: ProductColor = useMemo(() => {
    if (typeof selectedColor === 'object' && selectedColor !== null) {
      return selectedColor
    }
    if (typeof selectedColor === 'string') {
      const found = PRODUCT_COLORS[selectedColor.toLowerCase()]
      if (found) return found
    }
    return PRODUCT_COLORS.orange
  }, [selectedColor])

  // Tumbler flight telemetry ref for reactive shadow grounding
  const shadowPosRef = useRef({ x: 0.28, y: -0.07, z: 0, lift: 0 })

  const handleTransformUpdate = (x: number, y: number, z: number, lift: number) => {
    shadowPosRef.current.x = x
    shadowPosRef.current.y = y
    shadowPosRef.current.z = z
    shadowPosRef.current.lift = lift
  }

  // Only render and display the 3D model during sections designed for it
  const isVisibleSection = ['hero', 'story', 'atelier', 'manifesto', 'masterwork'].includes(section)

  return (
    <div
      className={`continuous-canvas-fixed ${isVisibleSection ? 'stage-visible' : 'stage-hidden'}`}
      aria-hidden="true"
    >
      <MasterErrorBoundary>
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          camera={{ position: [0, 0, 1.35], fov: 30 }}
          dpr={[1, 2]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.18,
          }}
        >
          {/* Dynamic studio lighting */}
          <ambientLight intensity={1.05} />
          <directionalLight
            position={[
              THREE.MathUtils.lerp(3.8, -2.5, Math.min(1, Math.max(0, storyProgress))),
              5,
              3.8,
            ]}
            intensity={3.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />
          {/* Soft Cool Fill */}
          <directionalLight position={[-4, 2.5, 1]} intensity={1.5} color="#f0f6fc" />
          {/* Silhouette Rim Backlight */}
          <directionalLight position={[0, 4.5, -4]} intensity={2.8} color="#ffffff" />
          {/* Ground Warm Bounce */}
          <directionalLight position={[0, -2, 1]} intensity={0.5} color="#fef3c7" />

          <Suspense fallback={null}>
            <MasterSceneController
              section={section}
              storyProgress={storyProgress}
              colorHex={resolvedColor.hex}
              tone={resolvedColor.tone}
              metalness={resolvedColor.metalness ?? 0.2}
              roughness={resolvedColor.roughness ?? 0.28}
              heroExploded={heroExploded}
              masterworkExploded={masterworkExploded}
              heroPreset={heroPreset}
              masterworkPreset={masterworkPreset}
              onTransformUpdate={handleTransformUpdate}
            />

            {/* Studio Environment Reflections */}
            <Environment preset="studio" environmentIntensity={0.85} />

            {/* Reactive Dynamic Ground Contact Shadow */}
            <DynamicGroundShadow
              shadowPosRef={shadowPosRef}
              isSectionVisible={isVisibleSection}
            />
          </Suspense>
        </Canvas>
      </MasterErrorBoundary>
    </div>
  )
}
