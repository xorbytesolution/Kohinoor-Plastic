'use client'

import React, { Component, ReactNode, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, ContactShadows, Environment, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { PRODUCT_COLORS, ProductColor } from '@/lib/products'

// Preload the primary GLTF model so it downloads immediately
if (typeof window !== 'undefined') {
  useGLTF.preload('/model/stanley_tumbler_travel_cup_40_oz.glb')
}

// Procedural fallback bottle rendered during GLTF loading

interface ScrollStoryViewerProps {
  modelPath: string
  scrollProgress: number // 0.0 to 1.0
  selectedColor?: string | ProductColor
  className?: string
}

// In-memory weak cache for neutral luminance textures
const desaturatedTextureCache = new WeakMap<THREE.Texture, THREE.CanvasTexture>()

function getDesaturatedTexture(texture: THREE.Texture): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const image = texture.image as (HTMLImageElement | ImageBitmap | HTMLCanvasElement) | undefined
  if (!image) return null

  if (desaturatedTextureCache.has(texture)) {
    return desaturatedTextureCache.get(texture)!
  }

  try {
    const canvas = document.createElement('canvas')
    const width = (image as any).naturalWidth || (image as any).width || 1024
    const height = (image as any).naturalHeight || (image as any).height || 1024
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    ctx.drawImage(image as any, 0, 0, width, height)
    const imgData = ctx.getImageData(0, 0, width, height)
    const data = imgData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      const isNeutralMetal = Math.abs(r - g) < 25 && Math.abs(g - b) < 25
      const isLogo = r > 215 && g > 185 && b > 145

      if (!isNeutralMetal && !isLogo) {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        const normalized = Math.min(255, Math.max(0, lum * 1.7))
        data[i] = normalized
        data[i + 1] = normalized
        data[i + 2] = normalized
      }
    }

    ctx.putImageData(imgData, 0, 0)
    const desatTex = new THREE.CanvasTexture(canvas)
    desatTex.flipY = texture.flipY
    desatTex.colorSpace = THREE.SRGBColorSpace
    desatTex.needsUpdate = true
    desaturatedTextureCache.set(texture, desatTex)
    return desatTex
  } catch {
    return null
  }
}

// GLTF model with dynamic materials and scroll-driven exploded lid anatomy
function StoryTumblerMesh({
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
  explodedAmount?: number
}) {
  const { scene } = useGLTF(modelPath)
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

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.material) return

      const materials = Array.isArray(child.material) ? child.material : [child.material]

      materials.forEach((mat) => {
        const matName = (mat.name || child.name).toLowerCase()

        if (matName.includes('cup')) {
          // Explicitly clear transmission so the cup body is opaque and fully rendered
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
            if ((mat as any).__originalMap) {
              mat.map = (mat as any).__originalMap
            }
            mat.color.set('#ffffff')
            mat.metalness = 0.2
            mat.roughness = 0.28
          } else {
            if (mat.map && !(mat as any).__originalMap) {
              ;(mat as any).__originalMap = mat.map
            }
            const baseMap = (mat as any).__originalMap || mat.map
            if (baseMap) {
              const desat = getDesaturatedTexture(baseMap)
              if (desat) mat.map = desat
            }
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
            if ((mat as any).__originalMap) {
              mat.map = (mat as any).__originalMap
            }
            mat.color.set('#ffffff')
          } else {
            if (mat.map && !(mat as any).__originalMap) {
              ;(mat as any).__originalMap = mat.map
            }
            const baseMap = (mat as any).__originalMap || mat.map
            if (baseMap) {
              const desat = getDesaturatedTexture(baseMap)
              if (desat) mat.map = desat
            }
            mat.color.set(colorHex)
          }
          mat.needsUpdate = true
        }
      })
    })
  }, [clonedScene, colorHex, tone, metalness, roughness])

  return (
    <Center top={false}>
      {/* 3/4 front beauty orientation: handle on right, straw upright */}
      <group rotation={[0, -0.6, 0]}>
        <primitive object={clonedScene} />
      </group>
    </Center>
  )
}

// Parallax controller: responds with spring inertia to cursor movement during scroll story
function ParallaxWrapper({
  children,
  enabled = true,
}: {
  children: ReactNode
  enabled?: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const { pointer } = useThree()

  useFrame((_, delta) => {
    if (!group.current || !enabled) return
    const targetX = -pointer.y * 0.18
    const targetY = pointer.x * 0.24
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, delta * 3.5)
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, delta * 3.5)
  })

  return <group ref={group}>{children}</group>
}

// Cinematic scroll keyframe interpolator with exploded anatomy and smooth 3D choreography
function ScrollSceneController({
  scrollProgress,
  modelPath,
  colorHex,
  tone,
  metalness,
  roughness,
}: {
  scrollProgress: number
  modelPath: string
  colorHex: string
  tone: string
  metalness: number
  roughness: number
}) {
  const rootGroup = useRef<THREE.Group>(null)
  const { viewport } = useThree()

  // On desktop, place tumbler clearly on the right (+0.22). On mobile, center it (+0.14).
  const isNarrow = viewport.width < 1.15
  const xOffset = isNarrow ? 0 : 0.22
  const yOffset = isNarrow ? 0.14 : 0

  // Compute keyframes & exploded amount based on scrollProgress (0 to 1)
  const { pos, rot, scale, explodedAmount } = useMemo(() => {
    const p = Math.min(1, Math.max(0, scrollProgress))

    if (p <= 0.24) {
      // Phase 1 (0 to 0.24): ARCHITECTURE — Upright beauty orientation, gentle rotation showing handle
      const t = p / 0.24
      return {
        pos: [xOffset, yOffset, 0] as [number, number, number],
        rot: [
          THREE.MathUtils.lerp(0.04, 0.02, t),
          THREE.MathUtils.lerp(0, 0.65, t),
          0,
        ] as [number, number, number],
        scale: isNarrow ? 0.9 : 1.08,
        explodedAmount: 0,
      }
    } else if (p <= 0.50) {
      // Phase 2 (0.24 to 0.50): EXPLODED ANATOMY — Lid & straw levitate upwards in 3D! Forward tilt reveals inner vacuum
      const t = (p - 0.24) / 0.26
      // Bell curve for exploded amount: rises smoothly, peaks around 0.38, locks back down around 0.48
      let explode = 0
      if (t < 0.35) {
        explode = t / 0.35
      } else if (t < 0.7) {
        explode = 1.0
      } else {
        explode = Math.max(0, 1.0 - (t - 0.7) / 0.3)
      }

      return {
        pos: [xOffset, yOffset - 0.02, 0] as [number, number, number],
        rot: [
          THREE.MathUtils.lerp(0.02, 0.16, Math.sin(t * Math.PI)), // Forward tilt showing top rim
          THREE.MathUtils.lerp(0.65, 1.7, t),
          0,
        ] as [number, number, number],
        scale: isNarrow ? 0.94 : 1.16,
        explodedAmount: explode,
      }
    } else if (p <= 0.76) {
      // Phase 3 (0.50 to 0.76): SPATIAL MATERIAL STUDY — Macro close-up, surface reflections, 8 finishes
      const t = (p - 0.50) / 0.26
      return {
        pos: [xOffset - 0.03, yOffset - 0.01, 0] as [number, number, number],
        rot: [
          THREE.MathUtils.lerp(0.02, 0.04, t),
          THREE.MathUtils.lerp(1.7, 2.8, t),
          0,
        ] as [number, number, number],
        scale: isNarrow ? 0.96 : 1.18,
        explodedAmount: 0,
      }
    } else {
      // Phase 4 (0.76 to 1.00): IN PURE FLIGHT — Completes full orbital turn, floating celestial glide
      const t = (p - 0.76) / 0.24
      return {
        pos: [xOffset, yOffset, 0] as [number, number, number],
        rot: [
          THREE.MathUtils.lerp(0.04, 0.04, t),
          THREE.MathUtils.lerp(2.8, 6.28, t), // Completes full circle (360°)
          0,
        ] as [number, number, number],
        scale: isNarrow ? 0.9 : 1.06,
        explodedAmount: 0,
      }
    }
  }, [scrollProgress, xOffset, yOffset, isNarrow])

  useFrame((state, delta) => {
    if (!rootGroup.current) return

    // Smooth lerp easing for cinematic damping
    rootGroup.current.position.x = THREE.MathUtils.lerp(rootGroup.current.position.x, pos[0], delta * 5)
    rootGroup.current.position.y = THREE.MathUtils.lerp(rootGroup.current.position.y, pos[1], delta * 5)
    rootGroup.current.position.z = THREE.MathUtils.lerp(rootGroup.current.position.z, pos[2], delta * 5)

    rootGroup.current.rotation.x = THREE.MathUtils.lerp(rootGroup.current.rotation.x, rot[0], delta * 5)
    rootGroup.current.rotation.y = THREE.MathUtils.lerp(rootGroup.current.rotation.y, rot[1], delta * 5)
    rootGroup.current.rotation.z = THREE.MathUtils.lerp(rootGroup.current.rotation.z, rot[2], delta * 5)

    const nextScale = THREE.MathUtils.lerp(rootGroup.current.scale.x, scale, delta * 5)
    rootGroup.current.scale.setScalar(nextScale)

    // Gentle floating wave in Phase 4
    if (scrollProgress >= 0.76) {
      rootGroup.current.position.y += Math.sin(state.clock.elapsedTime * 1.6) * 0.003
    }
  })

  return (
    <ParallaxWrapper>
      <group ref={rootGroup}>
        <StoryTumblerMesh
          modelPath={modelPath}
          colorHex={colorHex}
          tone={tone}
          metalness={metalness}
          roughness={roughness}
          explodedAmount={explodedAmount}
        />
      </group>
    </ParallaxWrapper>
  )
}

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class StoryErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div className="viewer-fallback" />
    }
    return this.props.children
  }
}

export function ScrollStoryViewer({
  modelPath,
  scrollProgress,
  selectedColor,
  className = '',
}: ScrollStoryViewerProps) {
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

  return (
    <div className={`scroll-story-viewer ${className}`}>
      <StoryErrorBoundary>
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          camera={{ position: [0, 0.08, 1.2], fov: 32 }}
          dpr={[1, 2]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.18,
          }}
        >
          {/* Dynamic Scroll-Driven Studio Lighting */}
          <ambientLight intensity={0.95} />
          <directionalLight
            position={[
              THREE.MathUtils.lerp(3.8, -2.5, Math.min(1, Math.max(0, scrollProgress))),
              5,
              THREE.MathUtils.lerp(3.5, 4.2, Math.min(1, Math.max(0, scrollProgress))),
            ]}
            intensity={scrollProgress >= 0.24 && scrollProgress <= 0.5 ? 4.2 : 3.0}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />
          {/* Soft Cool Fill */}
          <directionalLight position={[-4, 2.5, 1]} intensity={1.5} color="#f0f6fc" />
          {/* Silhouette Rim Backlight */}
          <directionalLight
            position={[0, 4.5, -4]}
            intensity={scrollProgress > 0.5 ? 3.2 : 2.2}
            color="#ffffff"
          />
          {/* Ground Warm Bounce */}
          <directionalLight position={[0, -2, 1]} intensity={0.5} color="#fef3c7" />

          {/* Suspense is INSIDE Canvas so R3F never unmounts the WebGL context */}
          <Suspense fallback={null}>
            <ScrollSceneController
              scrollProgress={scrollProgress}
              modelPath={modelPath}
              colorHex={resolvedColor.hex}
              tone={resolvedColor.tone}
              metalness={resolvedColor.metalness ?? 0.2}
              roughness={resolvedColor.roughness ?? 0.28}
            />



            {/* Environment Reflections */}
            <Environment preset="studio" environmentIntensity={0.85} />

            {/* Ground Contact Shadow */}
            <ContactShadows
              position={[0, -0.24, 0]}
              opacity={0.38}
              scale={1.4}
              blur={2.4}
              far={1.1}
              color="#2a2c30"
            />
          </Suspense>
        </Canvas>
      </StoryErrorBoundary>
    </div>
  )
}
