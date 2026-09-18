'use client'

import React, {
  Component,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Center,
  ContactShadows,
  Environment,
  Float,
  OrbitControls,
  useGLTF,
  Text,
} from '@react-three/drei'
import * as THREE from 'three'
import { PRODUCT_COLORS, ProductColor } from '@/lib/products'

// Preload the primary GLTF model so it downloads immediately
if (typeof window !== 'undefined') {
  useGLTF.preload('/model/stanley_tumbler_travel_cup_40_oz.glb')
}

export const colors = {
  black: '#1c2022',
  white: '#f4f4f3',
  red: '#c93b2b',
  blue: '#1e4d6a',
  green: '#2d5a3f',
  gold: '#d4af37',
  silver: '#d8dcde',
  orange: '#ed5a24',
}

export interface ProductViewerProps {
  modelPath?: string
  model?: string
  productName?: string
  color?: keyof typeof colors
  selectedColor?: string | ProductColor
  className?: string
  large?: boolean
  autoRotate?: boolean
  showControlsHint?: boolean
  enableParallax?: boolean
  cameraPosition?: [number, number, number]
  fov?: number
  viewPreset?: 'beauty' | 'lid' | 'handle' | 'base'
  thermalMode?: 'studio' | 'cold' | 'hot'
  customEngraving?: string
  exploded?: boolean
}

// Camera controller smoothly glides to active view angle preset
function CameraController({
  preset = 'beauty',
  isInteracting,
}: {
  preset?: 'beauty' | 'lid' | 'handle' | 'base'
  isInteracting: boolean
}) {
  const { camera } = useThree()
  const targetPos = useMemo(() => {
    switch (preset) {
      case 'lid':
        return new THREE.Vector3(0, 0.72, 0.78)
      case 'handle':
        return new THREE.Vector3(0.68, 0.05, 0.85)
      case 'base':
        return new THREE.Vector3(0, -0.4, 0.95)
      case 'beauty':
      default:
        return new THREE.Vector3(0, 0.08, 1.18)
    }
  }, [preset])

  useFrame((_, delta) => {
    if (isInteracting) return
    camera.position.lerp(targetPos, delta * 3.5)
  })

  return null
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

// Parallax controller hook: energetically tilts model based on pointer position with spring inertia
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
    const targetX = -pointer.y * 0.32
    const targetY = pointer.x * 0.48
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, delta * 4.5)
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, delta * 4.5)
  })

  return <group ref={group}>{children}</group>
}

// Real GLTF 3D Tumbler Renderer with 3D Exploded Anatomy
function TumblerModel({
  modelPath,
  colorHex,
  tone,
  metalness,
  roughness,
  exploded = false,
}: {
  modelPath: string
  colorHex: string
  tone: string
  metalness: number
  roughness: number
  exploded?: boolean
}) {
  const { scene } = useGLTF(modelPath)
  const lidNodeRef = useRef<THREE.Object3D | null>(null)

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

  const initialLidY = useRef<number | null>(null)

  useEffect(() => {
    const lid = clonedScene.getObjectByName('lid_Baked')
    if (lid) {
      lidNodeRef.current = lid
      if (initialLidY.current === null) {
        initialLidY.current = lid.position.y
      }
    }
  }, [clonedScene])

  useFrame((_, delta) => {
    if (lidNodeRef.current && initialLidY.current !== null) {
      const targetY = initialLidY.current + (exploded ? 4.2 : 0)
      lidNodeRef.current.position.y = THREE.MathUtils.lerp(
        lidNodeRef.current.position.y,
        targetY,
        delta * 6
      )
    }
  })

  // Instant material updates when color changes without re-loading GLB
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.material) return

      const materials = Array.isArray(child.material) ? child.material : [child.material]

      materials.forEach((mat) => {
        const matName = (mat.name || child.name).toLowerCase()

        if (matName.includes('cup')) {
          // CRITICAL: cup_Baked has KHR_materials_transmission in GLB which makes it invisible/glass!
          // We must explicitly set transmission to 0 and opacity to 1.
          if ('transmission' in mat) {
            ;(mat as any).transmission = 0
          }
          if ('thickness' in mat) {
            ;(mat as any).thickness = 0
          }
          mat.transparent = false
          mat.opacity = 1
          mat.depthWrite = true

          // Tumbler body & handle coated finish
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
          // Straw, transparent acrylic lid, and stainless steel top rim
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
      {/* 3/4 aesthetic portrait orientation: tilts handle & straw elegantly */}
      <group rotation={[0, -0.6, 0]}>
        <primitive object={clonedScene} />

        {/* 3D HUD Callout Tags in Exploded Mode */}
        {exploded && (
          <group position={[0, 0, 0]}>
            <Text
              position={[0.18, 0.17, 0.02]}
              fontSize={0.012}
              color="#ed5a24"
              anchorX="left"
              letterSpacing={0.08}
            >
              ▲ 3-WAY ROTATING SPLASH LID
            </Text>
            <Text
              position={[-0.18, 0.08, 0.02]}
              fontSize={0.012}
              color="#1c2022"
              anchorX="right"
              letterSpacing={0.08}
            >
              ◈ 18/8 POLISHED STAINLESS RIM
            </Text>
            <Text
              position={[0.18, -0.04, 0.02]}
              fontSize={0.012}
              color="#1c2022"
              anchorX="left"
              letterSpacing={0.08}
            >
              ◎ VACUUM THERMAL CORE (24H ICE)
            </Text>
            <Text
              position={[-0.18, -0.16, 0.02]}
              fontSize={0.012}
              color="#ed5a24"
              anchorX="right"
              letterSpacing={0.08}
            >
              ◓ 75MM CUP-HOLDER TAPERED BASE
            </Text>
          </group>
        )}
      </group>
    </Center>
  )
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ViewerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function LoadingIndicator() {
  return (
    <div className="viewer-loader">
      <div className="viewer-spinner" />
      <span className="viewer-loader-text">Loading product</span>
    </div>
  )
}

export function ProductViewer({
  modelPath,
  model,
  color = 'orange',
  selectedColor,
  className = '',
  large = false,
  autoRotate = true,
  showControlsHint = false,
  enableParallax = true,
  cameraPosition,
  fov = 30,
  viewPreset = 'beauty',
  thermalMode = 'studio',
  customEngraving = '',
  exploded = false,
}: ProductViewerProps) {
  const activePath = modelPath || model
  const controlsRef = useRef<any>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleInteractionStart = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    setIsInteracting(true)
  }, [])

  const handleInteractionEnd = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      setIsInteracting(false)
    }, 1800)
  }, [])

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  const resolvedColor: ProductColor = useMemo(() => {
    if (typeof selectedColor === 'object' && selectedColor !== null) {
      return selectedColor
    }
    if (typeof selectedColor === 'string') {
      const found = PRODUCT_COLORS[selectedColor.toLowerCase()]
      if (found) return found
      return {
        id: selectedColor,
        name: selectedColor,
        hex: colors[selectedColor as keyof typeof colors] || selectedColor,
        swatchHex: colors[selectedColor as keyof typeof colors] || selectedColor,
        tone: (selectedColor in colors ? selectedColor : 'orange') as any,
        metalness: selectedColor === 'silver' || selectedColor === 'gold' ? 0.9 : 0.2,
        roughness: selectedColor === 'silver' || selectedColor === 'gold' ? 0.18 : 0.28,
      }
    }
    const colorKey = color || 'orange'
    const found = PRODUCT_COLORS[colorKey]
    if (found) return found
    return {
      id: colorKey,
      name: colorKey,
      hex: colors[colorKey] || '#ed5a24',
      swatchHex: colors[colorKey] || '#ed5a24',
      tone: colorKey as any,
      metalness: colorKey === 'silver' || colorKey === 'gold' ? 0.9 : 0.2,
      roughness: colorKey === 'silver' || colorKey === 'gold' ? 0.18 : 0.28,
    }
  }, [color, selectedColor])

  const camPos: [number, number, number] =
    cameraPosition || (large ? [0, 0.08, 1.18] : [0, 0.02, 0.72])

  return (
    <div className={`product-viewer ${large ? 'product-viewer-large' : ''} ${className}`}>
      <ViewerErrorBoundary fallback={<div className="viewer-fallback" />}>
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          camera={{ position: camPos, fov }}
          dpr={[1, 2]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
        >
          {/* Dynamic Studio & Thermal Lighting Setup */}
          <ambientLight
            intensity={thermalMode === 'cold' ? 1.05 : 0.9}
            color={thermalMode === 'cold' ? '#ebf8ff' : thermalMode === 'hot' ? '#fff7ed' : '#ffffff'}
          />
          <directionalLight
            position={[3.5, 5, 4]}
            intensity={thermalMode === 'hot' ? 3.6 : 3.2}
            color={thermalMode === 'hot' ? '#ffedd5' : '#ffffff'}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />
          <directionalLight
            position={[-4, 2.5, 1]}
            intensity={thermalMode === 'cold' ? 1.8 : 1.4}
            color={thermalMode === 'cold' ? '#bae6fd' : '#f6f9fc'}
          />
          <directionalLight position={[0, 4.5, -4]} intensity={2.2} color="#ffffff" />
          <directionalLight
            position={[0, -2, 1]}
            intensity={0.4}
            color={thermalMode === 'hot' ? '#fed7aa' : '#f4f1eb'}
          />

          {/* Smooth Camera Glide to View Presets */}
          <CameraController preset={viewPreset} isInteracting={isInteracting} />

          <Suspense fallback={null}>
            <ParallaxWrapper enabled={enableParallax && !isInteracting && viewPreset === 'beauty'}>
              <Float
                speed={large ? 0.9 : 0.5}
                rotationIntensity={large ? 0.08 : 0.04}
                floatIntensity={large ? 0.1 : 0.05}
                floatingRange={[-0.01, 0.01]}
              >
                {activePath ? (
                  <TumblerModel
                    modelPath={activePath}
                    colorHex={resolvedColor.hex}
                    tone={resolvedColor.tone}
                    metalness={resolvedColor.metalness ?? 0.2}
                    roughness={resolvedColor.roughness ?? 0.28}
                    exploded={exploded}
                  />
                ) : null}

                {/* Laser-Etched Custom Branding Simulation */}
                {customEngraving && (
                  <group position={[0, -0.02, 0.085]} rotation={[0, -0.6, 0]}>
                    <Text
                      fontSize={0.015}
                      color={resolvedColor.tone === 'white' ? '#1c2022' : '#ffffff'}
                      anchorX="center"
                      anchorY="middle"
                      letterSpacing={0.16}
                      fillOpacity={0.9}
                    >
                      {customEngraving.toUpperCase()}
                    </Text>
                  </group>
                )}
              </Float>
            </ParallaxWrapper>



            {/* Neutral studio environment reflections */}
            <Environment preset="studio" environmentIntensity={0.85} />

            {/* Soft grounded ContactShadows */}
            <ContactShadows
              position={[0, -0.24, 0]}
              opacity={0.38}
              scale={1.4}
              blur={2.4}
              far={1.1}
              color="#2a2c30"
            />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={large}
            minDistance={0.65}
            maxDistance={2.6}
            autoRotate={autoRotate && !isInteracting}
            autoRotateSpeed={0.8}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.8}
            onStart={handleInteractionStart}
            onEnd={handleInteractionEnd}
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN,
            }}
          />
        </Canvas>
      </ViewerErrorBoundary>

      {showControlsHint && (
        <div className="viewer-hint-overlay">
          <span className="hint-desktop">Drag to rotate · Scroll to zoom</span>
          <span className="hint-mobile">Swipe to rotate · Pinch to zoom</span>
        </div>
      )}
    </div>
  )
}
