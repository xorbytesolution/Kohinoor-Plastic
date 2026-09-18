'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  ArrowUpRight,
  Check,
  Compass,
  Layers,
  MessageCircle,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { soundEngine } from '@/lib/audio'

// Master 3D WebGL stage: only ONE single 3D model on the entire website that travels continuously
const ContinuousModelStage = dynamic(
  () =>
    import('@/components/continuous-model-stage').then((mod) => mod.ContinuousModelStage),
  {
    ssr: false,
    loading: () => null,
  }
)
import type { PageSection } from '@/components/continuous-model-stage'

import {
  CATALOGUE_PRODUCTS,
  PRODUCT_COLORS,
  PRODUCT_FAMILIES,
  ProductColor,
  ProductFamily,
  CatalogueProduct,
  TUMBLER_COLORS,
} from '@/lib/products'

// Helper to compute smooth fade-in and fade-out based on scroll keyframes
function computeStepStyle(progress: number, start: number, pStart: number, pEnd: number, end: number) {
  if (progress < start || progress > end) {
    return {
      opacity: 0,
      pointerEvents: 'none' as const,
      transform: 'translateY(24px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }
  }

  let opacity = 1
  if (progress < pStart) {
    opacity = (progress - start) / (pStart - start)
  } else if (progress > pEnd) {
    opacity = 1 - (progress - pEnd) / (end - pEnd)
  }

  const translateY = (1 - opacity) * 20

  return {
    opacity: Math.max(0, Math.min(1, opacity)),
    pointerEvents: (opacity > 0.4 ? 'auto' : 'none') as 'auto' | 'none',
    transform: `translateY(${translateY}px)`,
    transition: 'opacity 0.2s ease, transform 0.2s ease',
  }
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Color selection states
  const [activeHeroColor, setActiveHeroColor] = useState<ProductColor>(PRODUCT_COLORS.orange)
  const [activeStoryColor, setActiveStoryColor] = useState<ProductColor>(PRODUCT_COLORS.orange)
  const [hoveredColor, setHoveredColor] = useState<ProductColor | null>(null)

  // Catalogue and modal states
  const [catalogueFilter, setCatalogueFilter] = useState('All')
  const [detailProduct, setDetailProduct] = useState<CatalogueProduct | null>(null)
  const [detailColor, setDetailColor] = useState<ProductColor>(PRODUCT_COLORS.orange)

  // Hero 3D interactive controls
  const [heroExploded, setHeroExploded] = useState(false)
  const [heroViewPreset, setHeroViewPreset] = useState<'beauty' | 'lid' | 'handle' | 'base'>('beauty')

  // Real-Time 3D Masterwork Inspector state
  const [masterworkTab, setMasterworkTab] = useState<'tumbler' | 'vacuum' | 'sports'>('tumbler')
  const [masterworkEngraving, setMasterworkEngraving] = useState('KOHINOOR')
  const [masterworkExploded, setMasterworkExploded] = useState(false)
  const [masterworkPreset, setMasterworkPreset] = useState<'beauty' | 'lid' | 'handle' | 'base'>('beauty')

  // Audio state
  const [soundActive, setSoundActive] = useState(false)

  // Form enquiry states
  const [enquirySuccess, setEnquirySuccess] = useState(false)
  const [enquiryMessage, setEnquiryMessage] = useState('')

  // Live World Clocks (Aurelle Style)
  const [worldTimes, setWorldTimes] = useState({
    mumbai: '--:--:--',
    dubai: '--:--:--',
    london: '--:--:--',
    newYork: '--:--:--',
  })

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date()
      const fmt = (timeZone: string) =>
        new Intl.DateTimeFormat('en-GB', {
          timeZone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now)

      setWorldTimes({
        mumbai: fmt('Asia/Kolkata'),
        dubai: fmt('Asia/Dubai'),
        london: fmt('Europe/London'),
        newYork: fmt('America/New_York'),
      })
    }

    updateTimes()
    const interval = setInterval(updateTimes, 1000)
    return () => clearInterval(interval)
  }, [])

  // Section tracking refs for single continuous 3D model movement
  const heroRef = useRef<HTMLElement>(null)
  const storyTrackRef = useRef<HTMLDivElement>(null)
  const atelierRef = useRef<HTMLElement>(null)
  const manifestoRef = useRef<HTMLElement>(null)
  const masterworkRef = useRef<HTMLElement>(null)
  const exhibitionRef = useRef<HTMLElement>(null)
  const signaturesRef = useRef<HTMLElement>(null)
  const salonRef = useRef<HTMLElement>(null)
  const footerRef = useRef<HTMLElement>(null)

  const [activeSection, setActiveSection] = useState<PageSection>('hero')
  const [storyProgress, setStoryProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)

      // 1. Calculate story progress when inside story track (400vh)
      if (storyTrackRef.current) {
        const rect = storyTrackRef.current.getBoundingClientRect()
        const totalDist = rect.height - window.innerHeight
        if (totalDist > 0) {
          const current = -rect.top
          const progress = Math.min(1, Math.max(0, current / totalDist))
          setStoryProgress(progress)
        }
      }

      // 2. Determine which section currently houses the 3D model
      const vh = window.innerHeight
      if (heroRef.current && heroRef.current.getBoundingClientRect().bottom > vh * 0.4) {
        setActiveSection('hero')
      } else if (
        storyTrackRef.current &&
        storyTrackRef.current.getBoundingClientRect().top <= vh * 0.55 &&
        storyTrackRef.current.getBoundingClientRect().bottom >= vh * 0.25
      ) {
        setActiveSection('story')
      } else if (
        atelierRef.current &&
        atelierRef.current.getBoundingClientRect().top <= vh * 0.6 &&
        atelierRef.current.getBoundingClientRect().bottom >= vh * 0.25
      ) {
        setActiveSection('atelier')
      } else if (
        manifestoRef.current &&
        manifestoRef.current.getBoundingClientRect().top <= vh * 0.6 &&
        manifestoRef.current.getBoundingClientRect().bottom >= vh * 0.25
      ) {
        setActiveSection('manifesto')
      } else if (
        masterworkRef.current &&
        masterworkRef.current.getBoundingClientRect().top <= vh * 0.6 &&
        masterworkRef.current.getBoundingClientRect().bottom >= vh * 0.25
      ) {
        setActiveSection('masterwork')
      } else if (
        footerRef.current &&
        footerRef.current.getBoundingClientRect().top <= vh * 0.75
      ) {
        setActiveSection('footer')
      } else if (
        salonRef.current &&
        salonRef.current.getBoundingClientRect().top <= vh * 0.6
      ) {
        setActiveSection('salon')
      } else if (
        signaturesRef.current &&
        signaturesRef.current.getBoundingClientRect().top <= vh * 0.6 &&
        signaturesRef.current.getBoundingClientRect().bottom >= vh * 0.25
      ) {
        setActiveSection('signatures')
      } else if (
        exhibitionRef.current &&
        exhibitionRef.current.getBoundingClientRect().top <= vh * 0.6 &&
        exhibitionRef.current.getBoundingClientRect().bottom >= vh * 0.25
      ) {
        setActiveSection('exhibition')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Keyboard escape listener for Product Detail Modal and Menu Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detailProduct) setDetailProduct(null)
        if (menuOpen) setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [detailProduct, menuOpen])

  // Filtered catalogue items
  const filteredCatalogue = useMemo(() => {
    if (catalogueFilter === 'All') return CATALOGUE_PRODUCTS
    return CATALOGUE_PRODUCTS.filter((p) => p.category === catalogueFilter)
  }, [catalogueFilter])

  // Computed styles for each step of the pinned product film
  const step1Style = useMemo(() => computeStepStyle(storyProgress, 0.0, 0.04, 0.2, 0.26), [storyProgress])
  const step2Style = useMemo(() => computeStepStyle(storyProgress, 0.24, 0.3, 0.46, 0.52), [storyProgress])
  const step3Style = useMemo(() => computeStepStyle(storyProgress, 0.5, 0.56, 0.72, 0.78), [storyProgress])
  const step4Style = useMemo(() => computeStepStyle(storyProgress, 0.76, 0.82, 0.98, 1.0), [storyProgress])

  const toggleHeroExploded = () => {
    const next = !heroExploded
    setHeroExploded(next)
    if (next) soundEngine.playExplode()
    else soundEngine.playDock()
  }

  const handleToggleSound = () => {
    const isNowActive = soundEngine.toggleSound()
    setSoundActive(isNowActive)
  }

  const jumpToChapter = (chapterIndex: number) => {
    if (!storyTrackRef.current) return
    const rect = storyTrackRef.current.getBoundingClientRect()
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const trackStart = rect.top + scrollTop
    const trackHeight = rect.height - window.innerHeight
    const targets = [0.04, 0.33, 0.62, 0.88]
    const targetScroll = trackStart + trackHeight * targets[chapterIndex]
    window.scrollTo({ top: targetScroll, behavior: 'smooth' })
    soundEngine.playWhoosh()
  }

  const openProductDetail = (product: CatalogueProduct) => {
    setDetailProduct(product)
    const initialColor =
      PRODUCT_COLORS[product.colors[0]?.toLowerCase()] ||
      PRODUCT_COLORS.orange
    setDetailColor(initialColor)
    soundEngine.playClick(750)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEnquirySuccess(true)
    soundEngine.playChime()
    setTimeout(() => setEnquirySuccess(false), 5000)
  }

  const activeContinuousColor = useMemo(() => {
    if (activeSection === 'masterwork') {
      if (masterworkTab === 'vacuum') return PRODUCT_COLORS.black
      if (masterworkTab === 'sports') return PRODUCT_COLORS.blue
    }
    return activeHeroColor
  }, [activeSection, masterworkTab, activeHeroColor])

  return (
    <main className="cinematic-root">
      {/* MASTER CONTINUOUS 3D MODEL: The single 3D model that travels seamlessly across all sections */}
      <ContinuousModelStage
        section={activeSection}
        storyProgress={storyProgress}
        selectedColor={activeContinuousColor}
        heroExploded={heroExploded}
        masterworkExploded={masterworkExploded}
        heroPreset={heroViewPreset}
        masterworkPreset={masterworkPreset}
      />

      {/* 1. ARCHITECTURAL LUXURY NAVBAR (AURELLE STYLE) */}
      <header className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
        <a href="#top" className="brand">
          <span className="brand-mark-char">K</span>
          <span className="brand-text">
            KOHINOOR <br />
            <span className="brand-sub">PLASTIC</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#story-track">SIGNATURE</a>
          <a href="#story-track" onClick={() => jumpToChapter(2)}>MATERIAL STUDY</a>
          <a href="#atelier">ATELIER</a>
          <a href="#manifesto">OUR STORY</a>
          <a href="#signatures">COLLECTIONS</a>
          <a href="#salon">PRIVATE SALON</a>
        </nav>

        <div className="header-actions">
          {/* Audio Feedback Switch */}
          <button
            type="button"
            className={`sound-toggle-btn ${soundActive ? 'active' : ''}`}
            onClick={handleToggleSound}
            aria-label="Toggle Sound Effects"
            title={soundActive ? 'Mute Sound FX' : 'Enable Interactive Sound FX'}
          >
            {soundActive ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span className="audio-waveform-bars">
              <span className="waveform-bar" />
              <span className="waveform-bar" />
              <span className="waveform-bar" />
            </span>
            <span>{soundActive ? 'SOUND ON' : 'SOUND'}</span>
          </button>

          <a href="#salon" className="header-cta">
            ENQUIRE NOW <ArrowUpRight size={13} />
          </a>

          <button
            type="button"
            className="header-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open Navigation Menu"
          >
            <span className="menu-lines">
              <span className="menu-line" />
              <span className="menu-line" />
            </span>
            <span>MENU</span>
          </button>
        </div>
      </header>

      {/* FULL-SCREEN LUXURY MENU DRAWER (AURELLE STYLE) */}
      {menuOpen && (
        <div className="luxury-menu-overlay" role="dialog" aria-modal="true">
          <div className="menu-drawer-top">
            <div className="brand">
              <span className="brand-mark-char">K</span>
              <span className="brand-text">KOHINOOR <em>PLASTIC</em></span>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setMenuOpen(false)}
              aria-label="Close Menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="menu-drawer-watermark">KOHINOOR</div>

          <nav className="menu-drawer-links">
            {[
              { idx: '01', title: 'Signature', href: '#story-track' },
              { idx: '02', title: 'Material Study', href: '#story-track' },
              { idx: '03', title: 'Atelier', href: '#atelier' },
              { idx: '04', title: 'Our Story', href: '#manifesto' },
              { idx: '05', title: 'Masterwork 3D', href: '#masterwork' },
              { idx: '06', title: 'Signatures', href: '#signatures' },
              { idx: '07', title: 'Private Salon', href: '#salon' },
            ].map((item) => (
              <a
                key={item.idx}
                href={item.href}
                className="menu-drawer-link-item"
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-index">{item.idx}</span>
                <span>{item.title}</span>
              </a>
            ))}
          </nav>

          <div className="menu-drawer-bottom">
            <span>PARIS VENDÔME · MUMBAI · LONDON BOND ST · NEW YORK</span>
            <span>© 2026 KOHINOOR PLASTIC INDUSTRIES</span>
          </div>
        </div>
      )}

      {/* 2. HERO — AURELLE LUXURY STYLE */}
      <section className="hero-cinematic" id="top" ref={heroRef}>
        <div className="hero-editorial-copy">
          <div className="technical-eyebrow">
            <span className="eyebrow-dot" />
            KOHINOOR PLASTIC / MUMBAI · EST. 1987
          </div>

          <h1 className="hero-monumental-title">
            The 40oz
            <br />
            <em>Tumbler</em>
          </h1>

          <p className="hero-editorial-lede">
            Sculpted in 18/8 Austenitic Stainless Steel · Double-Wall Copper Vacuum Retention. Designed for the rhythm of everyday life.
          </p>

          <div className="hero-editorial-actions">
            <a href="#story-track" className="btn-cinematic-dark">
              ENTER FILM <ArrowUpRight size={15} />
            </a>
            <a href="#signatures" className="btn-cinematic-link">
              EXPLORE COLLECTION
            </a>
          </div>

          <div className="hero-technical-strip">
            <div className="tech-spec-item">
              <span className="tech-spec-label">ALLOY</span>
              <span className="tech-spec-val">18/8 AUSTENITIC</span>
            </div>
            <div className="tech-spec-divider" />
            <div className="tech-spec-item">
              <span className="tech-spec-label">THERMAL CORE</span>
              <span className="tech-spec-val">24H ICE LOCK · 12H STEAM</span>
            </div>
            <div className="tech-spec-divider" />
            <div className="tech-spec-item">
              <span className="tech-spec-label">CAPACITY</span>
              <span className="tech-spec-val">40 OZ / 1180 ML</span>
            </div>
          </div>
        </div>

        {/* BORDERLESS FLOATING 3D HERO TUMBLER STAGE */}
        <div className="hero-3d-stage">
          <div className="spylt-giant-backdrop" aria-hidden="true">
            <span className="backdrop-monumental-text">KOHINOOR</span>
          </div>

          <div className="ambient-radial-glow" />

          {/* Aurelle-style Technical Callout Pills */}
          <div className="hero-corner-spec corner-top-left">
            <span className="spec-code">01 // 3-WAY COVER</span>
            <span className="spec-detail">Rotating Splash Seal & Straw</span>
          </div>

          <div className="hero-corner-spec corner-bottom-left">
            <span className="spec-code">02 // 24H ICE LOCK</span>
            <span className="spec-detail">Electrostatic Powder Finish</span>
          </div>

          <div className="hero-corner-spec corner-top-right">
            <span className="spec-code">03 // 18/8 STEEL</span>
            <span className="spec-detail">Double-Wall Vacuum Core</span>
          </div>

          <div className="hero-corner-spec corner-bottom-right">
            <span className="spec-code">04 // 75MM BASE</span>
            <span className="spec-detail">Vehicle Cup-Holder Fit</span>
          </div>

          {/* 3D hit viewport area */}
          <div className="hero-viewer-canvas" />

          {/* Floating Color Dock & Explode Controls */}
          <div className="hero-floating-dock">
            <div className="hero-dock-actions-row">
              <button
                type="button"
                className={`btn-hero-explode-toggle ${heroExploded ? 'active' : ''}`}
                onClick={toggleHeroExploded}
                title={heroExploded ? 'Assemble 3D Tumbler' : 'Explode 3D Anatomy'}
              >
                <Layers size={13} />
                <span>{heroExploded ? 'ASSEMBLE' : 'EXPLODE ANATOMY'}</span>
              </button>

              <div className="hero-angle-pills" role="group" aria-label="Camera Presets">
                {(['beauty', 'lid', 'handle', 'base'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`hero-angle-pill ${heroViewPreset === preset ? 'active' : ''}`}
                    onClick={() => {
                      setHeroViewPreset(preset)
                      soundEngine.playClick(650)
                    }}
                  >
                    {preset.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="swatch-rail" role="radiogroup" aria-label="Tumbler color preview">
              {TUMBLER_COLORS.map((c) => {
                const isSelected = activeHeroColor.id === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`swatch-item-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setActiveHeroColor(c)
                      soundEngine.playClick(650)
                    }}
                    onMouseEnter={() => setHoveredColor(c)}
                    onMouseLeave={() => setHoveredColor(null)}
                    title={c.name}
                    aria-label={`Select ${c.name}`}
                  >
                    <span className="swatch-dot" style={{ backgroundColor: c.swatchHex }} />
                  </button>
                )
              })}
            </div>
            <div className="dock-caption">
              <span>FINISH:</span>
              <strong className="dock-value">{(hoveredColor || activeHeroColor).name}</strong>
            </div>
          </div>

          <div className="hero-viewer-tag">
            <span>00 // SCROLL TO ENTER FILM</span>
          </div>
        </div>
      </section>

      {/* 2.5 INFINITE MARQUEE TICKER */}
      <div className="kinetic-ticker-track" aria-hidden="true">
        <div className="ticker-ribbon ribbon-dark">
          <div className="ticker-content">
            <span>★ 18/8 AUSTENITIC PRO-GRADE STEEL</span>
            <span>★ 24H COLD THERMAL RETENTION</span>
            <span>★ 12H STEAMING HOT LOCK</span>
            <span>★ 40 OZ MAXIMUM HYDRATION</span>
            <span>★ VEHICLE CUP-HOLDER FIT</span>
            <span>★ 100% BPA FREE FOOD-SAFE POLYMER</span>
            <span>★ 18/8 AUSTENITIC PRO-GRADE STEEL</span>
            <span>★ 24H COLD THERMAL RETENTION</span>
          </div>
        </div>
      </div>

      {/* 3. PINNED FULL SCROLL-DRIVEN 3D STORY FILM (400VH TRACK - AWARD-WINNING CINEMATIC EXPERIENCE) */}
      <section className="scroll-story-track" id="story-track" ref={storyTrackRef}>
        <div className="sticky-story-stage">
          {/* Dedicated Observation Dock Platform for the 3D model */}
          <div className="story-pedestal-ground-dock" aria-hidden="true">
            <div className="story-dock-ring-outer" />
            <div className="story-dock-ring-inner" />
            <div className="story-dock-cross-h" />
            <div className="story-dock-cross-v" />
            <span className="story-dock-indicator">
              <span className="dot-pulse" />
              {storyProgress < 0.22 && 'DOCK 01 // ARCHITECTURAL SILHOUETTE DOCK'}
              {storyProgress >= 0.22 && storyProgress < 0.50 && 'DOCK 02 // EXPLODED CORE LEVITATION DOCK'}
              {storyProgress >= 0.50 && storyProgress < 0.76 && 'DOCK 03 // MATERIAL TURNTABLE DOCK'}
              {storyProgress >= 0.76 && 'DOCK 04 // CELESTIAL ORBITAL DOCK'}
            </span>
          </div>
          {/* DYNAMIC 3D SPATIAL HOTSPOTS (Visible during Chapter 2 Exploded Anatomy) */}
          <div
            className={`story-spatial-hotspots ${
              storyProgress >= 0.22 && storyProgress <= 0.52 ? 'active' : ''
            }`}
            aria-hidden="true"
          >
            <div className="spatial-pin pin-lid">
              <span className="pin-radar" />
              <div className="pin-tag">
                <span className="pin-code">01 // TRI-MODE LID</span>
                <span className="pin-label">+4.6MM LEVITATION · 3-WAY ROTATION</span>
              </div>
            </div>

            <div className="spatial-pin pin-core">
              <span className="pin-radar" />
              <div className="pin-tag">
                <span className="pin-code">02 // COPPER CORE</span>
                <span className="pin-label">10⁻⁵ TORR VACUUM · 24H ICE LOCK</span>
              </div>
            </div>

            <div className="spatial-pin pin-handle">
              <span className="pin-radar" />
              <div className="pin-tag">
                <span className="pin-code">03 // ERGONOMIC GRIP</span>
                <span className="pin-label">DUAL-INJECTED POLYMER ANCHOR</span>
              </div>
            </div>

            <div className="spatial-pin pin-base">
              <span className="pin-radar" />
              <div className="pin-tag">
                <span className="pin-code">04 // 75MM TAPER</span>
                <span className="pin-label">AUTOMOTIVE CONSOLE FIT</span>
              </div>
            </div>
          </div>

          {/* EDITORIAL SPATIAL TELEMETRY HUD */}
          <div className="story-telemetry-hud" aria-hidden="true">
            <div className="telemetry-cell">
              <span className="telemetry-lbl">AZIMUTH ORBIT</span>
              <span className="telemetry-val">{(storyProgress * 360).toFixed(0)}°</span>
            </div>
            <div className="telemetry-divider" />
            <div className="telemetry-cell">
              <span className="telemetry-lbl">STATE</span>
              <span className="telemetry-val highlight">
                {storyProgress >= 0.24 && storyProgress <= 0.50
                  ? 'EXPLODED (+4.6MM)'
                  : 'VACUUM ASSEMBLED'}
              </span>
            </div>
            <div className="telemetry-divider" />
            <div className="telemetry-cell">
              <span className="telemetry-lbl">THERMAL CORE</span>
              <span className="telemetry-val">
                {storyProgress < 0.5 ? '-2°C ICE LOCK' : '85°C STEAM SHIELD'}
              </span>
            </div>
          </div>

          {/* Progress Indicator Bar */}
          <div className="story-progress-indicator">
            <div className="progress-bar-fill" style={{ width: `${storyProgress * 100}%` }} />
            <div className="progress-label-wrap">
              <span>
                CHAPTER 0{storyProgress < 0.25 ? 1 : storyProgress < 0.5 ? 2 : storyProgress < 0.75 ? 3 : 4} // 04
              </span>
              <span>{Math.round(storyProgress * 100)}% FILM SCROLLED</span>
            </div>
          </div>

          {/* Floating Chapter Jump Rail */}
          <div className="chapter-jump-rail" role="tablist" aria-label="Story chapter navigation">
            {[
              { num: '01', title: 'ARCHITECTURE' },
              { num: '02', title: 'EXPLODED ANATOMY' },
              { num: '03', title: 'MATERIAL STUDY' },
              { num: '04', title: 'IN PURE FLIGHT' },
            ].map((ch, idx) => {
              const isActive =
                (idx === 0 && storyProgress < 0.25) ||
                (idx === 1 && storyProgress >= 0.25 && storyProgress < 0.5) ||
                (idx === 2 && storyProgress >= 0.5 && storyProgress < 0.75) ||
                (idx === 3 && storyProgress >= 0.75)
              return (
                <button
                  key={ch.num}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`chapter-jump-btn ${isActive ? 'active' : ''}`}
                  onClick={() => jumpToChapter(idx)}
                >
                  <span className="jump-num">{ch.num}</span> {ch.title}
                </button>
              )
            })}
          </div>

          {/* CHAPTER 1: SACRED GEOMETRY (0% to 25% Scroll) */}
          <div className="scroll-step-overlay step-1-overlay" style={step1Style}>
            <div className="chapter-meta">
              <span className="chapter-num">01</span>
              <span>/ ARCHITECTURE & SILHOUETTE</span>
            </div>
            <h2 className="statement-giant">
              Sacred
              <br />
              <i>Geometry</i>
            </h2>
            <p className="statement-subtext">
              Engineered for effortless everyday hydration. Sculpted with a low center of gravity and a tapered 75mm base that docks into vehicle consoles.
            </p>

            <div className="design-annotations-list">
              <div className="design-annotation-item">
                <span className="annotation-tag">#1 FORM</span>
                <div className="annotation-body">
                  <h4>Universal 75mm Tapered Base</h4>
                  <p>Slides seamlessly into all automotive cup holders without tipping.</p>
                </div>
              </div>

              <div className="design-annotation-item">
                <span className="annotation-tag">#2 GRIP</span>
                <div className="annotation-body">
                  <h4>Dual-Injected Ergonomic Handle</h4>
                  <p>Comfort thumb-rest dampening weight fatigue across long commutes.</p>
                </div>
              </div>

              <div className="design-annotation-item">
                <span className="annotation-tag">#3 BALANCE</span>
                <div className="annotation-body">
                  <h4>Low Center of Gravity</h4>
                  <p>Weighted 18/8 austenitic base preventing desk spills.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CHAPTER 2: EXPLODED ANATOMY (25% to 50% Scroll) */}
          <div className="scroll-step-overlay step-2-overlay" style={step2Style}>
            <div className="chapter-meta">
              <span className="chapter-num">02</span>
              <span>/ EXPLODED ANATOMY</span>
            </div>
            <h2 className="statement-giant-med">
              Anatomy of
              <br />
              <i>Utility</i>
            </h2>
            <p className="shape-desc">
              Precision engineered into modular layers. Notice the 3-way lid levitate upward in 3D to reveal the double-wall copper vacuum core.
            </p>

            <div className="design-annotations-list">
              <div className="design-annotation-item">
                <span className="annotation-tag">+4.6MM</span>
                <div className="annotation-body">
                  <h4>Tri-Mode Rotating Lid Levitation</h4>
                  <p>Splash-proof silicone gasket with removable reusable straw dock.</p>
                </div>
              </div>

              <div className="design-annotation-item">
                <span className="annotation-tag">10⁻⁵ TORR</span>
                <div className="annotation-body">
                  <h4>Double-Wall Copper Vacuum Shield</h4>
                  <p>Traps interior temperature for 24 hours cold and 12 hours steaming hot.</p>
                </div>
              </div>

              <div className="design-annotation-item">
                <span className="annotation-tag">18/8 STEEL</span>
                <div className="annotation-body">
                  <h4>Austenitic Stainless Body</h4>
                  <p>Immune to rust, oxidation, drop damage, and flavour absorption.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CHAPTER 3: SPATIAL MATERIAL STUDY (50% to 75% Scroll) */}
          <div className="scroll-step-overlay step-3-overlay" style={step3Style}>
            <div className="chapter-meta">
              <span className="chapter-num">03</span>
              <span>/ SPATIAL MATERIAL STUDY</span>
            </div>
            <h2 className="statement-giant-med">
              One Silhouette.
              <br />
              <i>Eight Realities.</i>
            </h2>
            <p className="shape-desc">
              Eight curated powder-coat and genuine metallic finishes. Click any finish to transform the 3D tumbler in real time with specular reflections.
            </p>

            {/* Circular Swatches (Aurelle Style) */}
            <div className="circular-swatches-grid" role="radiogroup" aria-label="Finishes">
              {TUMBLER_COLORS.map((c) => {
                const isActive = activeStoryColor.id === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={`circular-swatch-control ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveStoryColor(c)
                      soundEngine.playClick(650)
                    }}
                    title={c.name}
                  >
                    <span className="circle-dot" style={{ backgroundColor: c.swatchHex }} />
                    <span className="circle-name">{c.name.split(' ')[0]}</span>
                    {isActive && <Check size={12} className="circle-check" />}
                  </button>
                )
              })}
            </div>

            <div className="telemetry-strip-bar">
              <span>ALLOY: <strong>18/8 STEEL</strong></span>
              <span>CORE: <strong>COPPER VACUUM</strong></span>
              <span>ICE RETENTION: <strong>24H</strong></span>
              <span>DENSITY: <strong>8.0 g/cm³</strong></span>
            </div>
          </div>

          {/* CHAPTER 4: IN PURE FLIGHT (75% to 100% Scroll) */}
          <div className="scroll-step-overlay step-4-overlay" style={step4Style}>
            <div className="chapter-meta">
              <span className="chapter-num">04</span>
              <span>/ CELESTIAL UTILITY</span>
            </div>
            <h2 className="statement-giant-med">
              In Pure
              <br />
              <i>Flight</i>
            </h2>
            <p className="shape-desc">
              Wherever everyday life takes you. Completing a full 360° orbital rotation, crafted for decades of daily movement.
            </p>

            <div className="material-descriptors-grid">
              <div className="material-descriptor-card">
                <span className="descriptor-keyword">100% BPA FREE</span>
                <p>Food-contact certified polymer and austenitic steel.</p>
              </div>
              <div className="material-descriptor-card">
                <span className="descriptor-keyword">DISHWASHER SAFE</span>
                <p>210°C cured electrostatic powder coat for lifetime durability.</p>
              </div>
            </div>

            <div className="scroll-hint-pill">
              <span>Scroll down to explore the Atelier</span>
              <span className="hint-arrow">↓</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE ATELIER / CRAFTSMANSHIP (AURELLE STYLE) */}
      <section className="atelier-section" id="atelier" ref={atelierRef}>
        <div className="atelier-head">
          <div>
            <div className="technical-eyebrow">03 // THE ATELIER</div>
            <h2 className="atelier-title">
              Crafted in
              <br />
              <em>Mumbai</em>
            </h2>
          </div>
          <span className="atelier-coord">19.0760° N, 72.8777° E · 18/8 STEEL</span>
        </div>

        <div className="atelier-content-layout">
          <div className="atelier-stages-col">
            <div className="atelier-stage-card">
              <div>
                <span className="stage-phase-label">PHASE 01 — METALLURGY</span>
                <h3 className="stage-headline">Crafted.</h3>
                <p className="stage-copy">
                  Austenitic 18/8 stainless steel deep-drawn and sculpted with high-precision automated tooling for uniform wall integrity.
                </p>
              </div>
              <span className="tech-spec-label">COLD-DRAW TOLERANCE: ±0.02MM</span>
            </div>

            <div className="atelier-stage-card">
              <div>
                <span className="stage-phase-label">PHASE 02 — THERMAL CORE</span>
                <h3 className="stage-headline">Insulated.</h3>
                <p className="stage-copy">
                  Double-wall copper vacuum barrier evacuated at 10⁻⁵ torr. Traps interior temperature while remaining cool and condensation-free to touch.
                </p>
              </div>
              <span className="tech-spec-label">VACUUM RETENTION: 24 HOURS ICE</span>
            </div>

            <div className="atelier-stage-card">
              <div>
                <span className="stage-phase-label">PHASE 03 — SURFACE</span>
                <h3 className="stage-headline">Perfected.</h3>
                <p className="stage-copy">
                  Electro-statically cured powder finishes baked for lifetime adhesion. Dishwasher-safe and scratch-resistant through daily use.
                </p>
              </div>
              <span className="tech-spec-label">CURING TEMPERATURE: 210°C</span>
            </div>
          </div>

          {/* Dedicated Architectural Observation Stage on the right */}
          <div className="atelier-pedestal-stage" aria-hidden="true">
            <div className="atelier-pedestal-frame">
              <div className="pedestal-radar-ring" />
              <div className="pedestal-crosshair-h" />
              <div className="pedestal-crosshair-v" />
              <span className="pedestal-badge">
                <span className="dot-pulse" />
                METALLURGY OBSERVATION // STAGE 03
              </span>
              <div className="pedestal-spec-tag">COLD-DRAWN TOLERANCE: ±0.02MM</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MANIFESTO QUOTE (AURELLE STYLE) */}
      <section className="manifesto-section" id="manifesto" ref={manifestoRef}>
        <div className="manifesto-watermark">KOHINOOR</div>

        <div className="manifesto-editorial-grid">
          <div className="manifesto-copy-pane">
            <span className="manifesto-quote-mark">“</span>
            <blockquote className="manifesto-serif-text">
              An object carried every day should feel <em>exceptional</em> in the hand. It is not merely a vessel; it is utility made personal.
            </blockquote>
            <div className="manifesto-signature">
              KOHINOOR PLASTIC INDUSTRIES · EST. 1987 · MUMBAI, INDIA
            </div>
            <div className="manifesto-philosophy-pill">
              <span>PHILOSOPHY // FUNCTION AS SCULPTURE</span>
            </div>
          </div>

          {/* Dedicated Manifesto 3D Monolith Stage on the right */}
          <div className="manifesto-monolith-frame" aria-hidden="true">
            <div className="monolith-target-aura" />
            <div className="monolith-orbit-ring" />
            <span className="monolith-caption">SCULPTURAL PURITY // 18/8 AUSTENITIC</span>
          </div>
        </div>
      </section>

      {/* 6. REAL-TIME 3D MASTERWORK INSPECTOR (AURELLE STYLE) */}
      <section className="masterwork-section" id="masterwork" ref={masterworkRef}>
        <div className="masterwork-head">
          <div className="technical-eyebrow">REAL-TIME 3D MASTERWORK</div>
          <h2 className="atelier-title">
            Interactive
            <br />
            <em>Inspection</em>
          </h2>
        </div>

        <div className="masterwork-interactive-stage">
          <div className="masterwork-3d-pane">
            <span className="masterwork-badge-360">
              <span className="dot-pulse" />
              360° LIVE SPATIAL INSPECTION
            </span>
            <div className="masterwork-viewport-target">
              <div className="reticle-ring" />
              <div className="reticle-crosshair-h" />
              <div className="reticle-crosshair-v" />
              <span className="reticle-tag">STATION 05 // PBR INSPECTION BAY</span>
            </div>
          </div>

          <div className="masterwork-info-pane">
            <span className="masterwork-chapter-meta">
              {masterworkTab === 'tumbler' && 'CHAPTER I // THE 40OZ FLAGSHIP'}
              {masterworkTab === 'vacuum' && 'CHAPTER II // 1000ML MASTER VACUUM'}
              {masterworkTab === 'sports' && 'CHAPTER III // APEX SPORTS SIPPER'}
            </span>

            <h3 className="masterwork-title">
              {masterworkTab === 'tumbler' && 'The Handled Tumbler'}
              {masterworkTab === 'vacuum' && 'Master Vacuum Flask'}
              {masterworkTab === 'sports' && 'Apex Athletic Sipper'}
            </h3>

            <p className="masterwork-desc">
              {masterworkTab === 'tumbler' &&
                'Featuring a 3-way rotating cover, reusable straw, and tapered base engineered for automotive cup holders.'}
              {masterworkTab === 'vacuum' &&
                'Double-wall copper vacuum insulation engineered to maintain temperature for 24 hours cold and 12 hours steaming hot.'}
              {masterworkTab === 'sports' &&
                'High-flow active sports hydration with one-touch flip spout, textured finger grip, and bicycle cage ready profile.'}
            </p>

            <div className="masterwork-specs-table">
              <div className="masterwork-spec-cell">
                <span>ALLOY SPECIFICATION</span>
                <strong>18/8 AUSTENITIC STEEL</strong>
              </div>
              <div className="masterwork-spec-cell">
                <span>THERMAL RETENTION</span>
                <strong>24H ICE · 12H HOT</strong>
              </div>
              <div className="masterwork-spec-cell">
                <span>CUP-HOLDER PROFILE</span>
                <strong>75MM UNIVERSAL BASE</strong>
              </div>
              <div className="masterwork-spec-cell">
                <span>FOOD CONTACT</span>
                <strong>100% BPA FREE</strong>
              </div>
            </div>

            <div className="hero-dock-actions-row" style={{ justifyContent: 'flex-start' }}>
              <button
                type="button"
                className={`btn-hero-explode-toggle ${masterworkExploded ? 'active' : ''}`}
                onClick={() => {
                  const next = !masterworkExploded
                  setMasterworkExploded(next)
                  if (next) soundEngine.playExplode()
                  else soundEngine.playDock()
                }}
              >
                <Layers size={13} />
                <span>{masterworkExploded ? 'ASSEMBLE' : 'EXPLODE 3D'}</span>
              </button>

              <div className="hero-angle-pills">
                {(['beauty', 'lid', 'handle', 'base'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`hero-angle-pill ${masterworkPreset === p ? 'active' : ''}`}
                    onClick={() => {
                      setMasterworkPreset(p)
                      soundEngine.playClick(700)
                    }}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="masterwork-tab-buttons">
              <button
                type="button"
                className={`masterwork-tab-btn ${masterworkTab === 'tumbler' ? 'active' : ''}`}
                onClick={() => {
                  setMasterworkTab('tumbler')
                  soundEngine.playClick(600)
                }}
              >
                01 TUMBLER 40OZ
              </button>
              <button
                type="button"
                className={`masterwork-tab-btn ${masterworkTab === 'vacuum' ? 'active' : ''}`}
                onClick={() => {
                  setMasterworkTab('vacuum')
                  soundEngine.playClick(700)
                }}
              >
                02 VACUUM 1000ML
              </button>
              <button
                type="button"
                className={`masterwork-tab-btn ${masterworkTab === 'sports' ? 'active' : ''}`}
                onClick={() => {
                  setMasterworkTab('sports')
                  soundEngine.playClick(800)
                }}
              >
                03 SPORTS SIPPER
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. EXHIBITION / EDITORIAL GALLERY (AURELLE STYLE) */}
      <section className="exhibition-section" id="exhibition" ref={exhibitionRef}>
        <div className="exhibition-head">
          <div>
            <div className="technical-eyebrow">05 // EXHIBITION</div>
            <h2 className="atelier-title">
              Details worth
              <br />
              <em>keeping.</em>
            </h2>
          </div>
          <span className="tech-spec-label">HIGH PRECISION STUDIO ARCHIVE</span>
        </div>

        <div className="exhibition-grid">
          <div
            className="exhibition-card"
            onClick={() => openProductDetail(CATALOGUE_PRODUCTS[0])}
          >
            <div className="exhibition-img-wrap">
              <img src="/images/products/vacuum-1000.jpg" alt="1000ml Vacuum Bottle" />
            </div>
            <div className="exhibition-overlay-info">
              <div>
                <span className="exhibition-tag">CONCEPT 01 // VACUUM CORE</span>
                <h4 className="exhibition-title">1000ML Vacuum Bottle</h4>
              </div>
              <span className="exhibition-inspect-btn">INSPECT ↗</span>
            </div>
          </div>

          <div
            className="exhibition-card"
            onClick={() => openProductDetail(CATALOGUE_PRODUCTS[2])}
          >
            <div className="exhibition-img-wrap">
              <img src="/images/products/sports-sipper.jpg" alt="Sports Sipper" />
            </div>
            <div className="exhibition-overlay-info">
              <div>
                <span className="exhibition-tag">CONCEPT 02 // RAPID FLOW</span>
                <h4 className="exhibition-title">Apex Sports Sipper</h4>
              </div>
              <span className="exhibition-inspect-btn">INSPECT ↗</span>
            </div>
          </div>

          <div
            className="exhibition-card"
            onClick={() => openProductDetail(CATALOGUE_PRODUCTS[3])}
          >
            <div className="exhibition-img-wrap">
              <img src="/images/products/steel-bottle.jpg" alt="Stainless Steel Bottle" />
            </div>
            <div className="exhibition-overlay-info">
              <div>
                <span className="exhibition-tag">CONCEPT 03 // RAW SATIN</span>
                <h4 className="exhibition-title">Satin Stainless Steel</h4>
              </div>
              <span className="exhibition-inspect-btn">INSPECT ↗</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SIGNATURES / CATALOGUE (AURELLE STYLE) */}
      <section className="signatures-section" id="signatures" ref={signaturesRef}>
        <div className="signatures-head">
          <div>
            <div className="technical-eyebrow">07 // SIGNATURES</div>
            <h2 className="atelier-title">
              Designed for
              <br />
              <em>the now.</em>
            </h2>
          </div>

          <div className="signatures-filter-bar">
            {['All', 'Tumblers', 'Vacuum Bottles', 'Sports Bottles', 'Stainless Steel', 'Kids Collection', 'Plastic Bottles'].map(
              (category) => (
                <button
                  key={category}
                  type="button"
                  className={`filter-pill ${catalogueFilter === category ? 'active' : ''}`}
                  onClick={() => {
                    setCatalogueFilter(category)
                    soundEngine.playClick(600)
                  }}
                >
                  {category.toUpperCase()}
                </button>
              )
            )}
          </div>
        </div>

        <div className="signatures-layout-grid">
          <div className="signatures-list-container">
            {filteredCatalogue.map((item, idx) => (
              <div className="signature-row-item" key={item.id}>
                <span className="sig-index">0{idx + 1}</span>

                <div className="sig-main-name">
                  <h3 className="sig-title">{item.name}</h3>
                  <span className="sig-material-sub">{item.material}</span>
                </div>

                <span className="sig-capacity-tag">{item.capacity}</span>

                <div className="sig-thumb-preview">
                  <img src={item.image} alt={item.name} />
                </div>

                <button
                  type="button"
                  className="btn-sig-view"
                  onClick={() => openProductDetail(item)}
                >
                  {item.modelPath ? 'INSPECT 3D' : 'VIEW SPECS'} <ArrowUpRight size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Dedicated Signatures 3D Anchor Stage on the right */}
          <div className="signatures-preview-stage" aria-hidden="true">
            <div className="sig-preview-card">
              <span className="sig-card-badge">LIVE 3D FLAGSHIP ANCHOR</span>
              <h4 className="sig-card-title">The 40oz Tumbler</h4>
              <p className="sig-card-desc">
                High-capacity daily hydration engineered with low center of gravity and vehicle cup-holder fit.
              </p>
              <div className="sig-card-specs-row">
                <div className="sig-spec-box">
                  <span className="spec-lbl">CAPACITY</span>
                  <span className="spec-val">40 OZ / 1180 ML</span>
                </div>
                <div className="sig-spec-box">
                  <span className="spec-lbl">ALLOY</span>
                  <span className="spec-val">18/8 STEEL</span>
                </div>
              </div>
              <div className="sig-card-reticle" />
            </div>
          </div>
        </div>
      </section>

      {/* 9. PRIVATE SALON & LIVE WORLD CLOCKS (AURELLE STYLE) */}
      <section className="salon-section" id="salon" ref={salonRef}>
        <div className="salon-head">
          <div className="technical-eyebrow">08 // PRIVATE SALON</div>
          <h2 className="statement-giant">
            By Private
            <br />
            <em>Appointment</em>
          </h2>
          <p className="statement-subtext">
            Experience the Kohinoor portfolio in the intimacy of our private salon. Tell us what you are looking for—from bespoke laser-etched corporate orders to high-volume distribution fleets.
          </p>
        </div>

        {/* Live World Clocks (Aurelle Style) */}
        <div className="salon-world-clocks-bar">
          <div className="world-clock-box">
            <span className="clock-city">MUMBAI HEADQUARTERS</span>
            <span className="clock-time">{worldTimes.mumbai}</span>
            <span className="clock-status">● OPEN FOR SALON</span>
          </div>
          <div className="world-clock-box">
            <span className="clock-city">DUBAI SUITE</span>
            <span className="clock-time">{worldTimes.dubai}</span>
            <span className="clock-status">● OPEN FOR SALON</span>
          </div>
          <div className="world-clock-box">
            <span className="clock-city">LONDON BOND ST</span>
            <span className="clock-time">{worldTimes.london}</span>
            <span className="clock-status">● BY APPOINTMENT</span>
          </div>
          <div className="world-clock-box">
            <span className="clock-city">NEW YORK MADISON</span>
            <span className="clock-time">{worldTimes.newYork}</span>
            <span className="clock-status">● BESPOKE INQUIRIES</span>
          </div>
        </div>

        <div className="salon-main-grid">
          <div className="salon-form-container">
            <h3 className="salon-form-title">Reserve Your Consultation</h3>
            <p className="salon-form-sub">Direct response from our lead industrial concierge within 4 hours.</p>

            <form className="salon-form-grid" onSubmit={handleFormSubmit} suppressHydrationWarning>
              <div className="form-double-row">
                <input type="text" placeholder="Full Name" required suppressHydrationWarning />
                <input type="email" placeholder="Business Email" required suppressHydrationWarning />
              </div>
              <div className="form-double-row">
                <input type="text" placeholder="Organization / Company" suppressHydrationWarning />
                <input type="text" placeholder="Estimated Volume (Units)" suppressHydrationWarning />
              </div>
              <textarea
                rows={3}
                placeholder="Describe your drinkware requirements, custom finishes, or custom branding..."
                value={enquiryMessage}
                onChange={(e) => setEnquiryMessage(e.target.value)}
                required
                suppressHydrationWarning
              />
              <div className="salon-actions-row">
                <button type="submit" className="btn-salon-submit" suppressHydrationWarning>
                  SUBMIT SALON ENQUIRY <ArrowUpRight size={15} />
                </button>
                <a
                  href="https://wa.me/919820000000?text=Hello%20Kohinoor%20Plastic,%20I%20would%20like%20to%20reserve%20a%20private%20drinkware%20consultation."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-salon-whatsapp"
                >
                  <MessageCircle size={15} /> DIRECT WHATSAPP CONCIERGE
                </a>
              </div>

              {enquirySuccess && (
                <div className="form-success-banner">
                  <Check size={16} />
                  <span>Thank you. Your consultation request has been lodged. Our director will reach out promptly.</span>
                </div>
              )}
            </form>
          </div>

          {/* Dedicated Salon VIP Stage on the right */}
          <div className="salon-vip-stage" aria-hidden="true">
            <div className="vip-stage-card">
              <span className="vip-badge">BESPOKE CONCIERGE</span>
              <h4 className="vip-title">Private Concierge</h4>
              <p className="vip-desc">
                Dedicated project managers for bespoke corporate customization, custom Pantone color blending, and luxury gift suites.
              </p>
              <div className="vip-features-list">
                <div className="vip-feat-item">
                  <span className="feat-check">✓</span>
                  <span>Direct Foundry Allocation</span>
                </div>
                <div className="vip-feat-item">
                  <span className="feat-check">✓</span>
                  <span>Laser Serialization & Crest Etching</span>
                </div>
                <div className="vip-feat-item">
                  <span className="feat-check">✓</span>
                  <span>Air Courier Delivery to 40+ Nations</span>
                </div>
              </div>
              <div className="vip-target-reticle" />
            </div>
          </div>
        </div>
      </section>

      {/* 10. PRODUCT DETAIL LAUNCH MODAL */}
      {detailProduct && (
        <div className="product-launch-modal-backdrop" onClick={() => setDetailProduct(null)}>
          <div
            className="product-launch-modal-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={detailProduct.name}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setDetailProduct(null)}
              aria-label="Close Product View"
            >
              <X size={20} />
            </button>

            <div className="modal-content-grid">
              {/* Left Column: Studio Specification Showcase */}
              <div className="modal-3d-showcase">
                <div className="modal-image-showcase">
                  <img
                    src={detailProduct.image}
                    alt={detailProduct.name}
                    className="modal-product-image"
                  />
                  <div className="modal-viewer-caption">
                    <Sparkles size={13} />
                    <span>STUDIO SPECIFICATION · 100% FOOD-GRADE COMPLIANT</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Launch Details */}
              <div className="modal-info-panel">
                <div className="modal-category-badge">{detailProduct.category}</div>
                <h2 className="modal-product-title">{detailProduct.name}</h2>
                <div className="modal-meta-row">
                  <span><strong>CAPACITY:</strong> {detailProduct.capacity}</span>
                  <span><strong>MATERIAL:</strong> {detailProduct.material}</span>
                </div>

                <p className="modal-description">{detailProduct.description}</p>

                {/* Available Colors */}
                <div className="modal-colors-section">
                  <span className="modal-section-label">CURATED FINISHES:</span>
                  <div className="modal-swatches-row">
                    {detailProduct.colors.map((hex) => {
                      const colorObj =
                        Object.values(PRODUCT_COLORS).find(
                          (c) => c.hex.toLowerCase() === hex.toLowerCase()
                        ) || {
                          id: hex,
                          name: hex,
                          hex,
                          swatchHex: hex,
                          tone: 'orange' as const,
                        }
                      const isSelected = detailColor.hex.toLowerCase() === hex.toLowerCase()
                      return (
                        <button
                          key={hex}
                          type="button"
                          className={`modal-swatch-circle ${isSelected ? 'active' : ''}`}
                          style={{ backgroundColor: hex }}
                          onClick={() => {
                            setDetailColor(colorObj)
                            soundEngine.playClick(650)
                          }}
                          title={colorObj.name}
                          aria-label={`Select ${colorObj.name}`}
                        />
                      )
                    })}
                  </div>
                  <span className="modal-color-name">{detailColor.name}</span>
                </div>

                {/* Features List */}
                <div className="modal-features-section">
                  <span className="modal-section-label">ENGINEERING SPECIFICATIONS:</span>
                  <ul className="modal-features-list">
                    {detailProduct.features.map((feat, idx) => (
                      <li key={idx}>
                        <Check size={14} className="feature-check" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="modal-actions-row">
                  <a
                    href="#salon"
                    className="modal-cta-primary"
                    onClick={() => {
                      setDetailProduct(null)
                      setEnquiryMessage(`Salon Inquiry for: ${detailProduct.name} (${detailProduct.capacity})`)
                    }}
                  >
                    REQUEST SALON QUOTE <ArrowUpRight size={15} />
                  </a>
                  <a
                    href={`https://wa.me/919820000000?text=${encodeURIComponent(
                      `Hello Kohinoor Plastic, I am inquiring about ${detailProduct.name} (${detailProduct.capacity}) in ${detailColor.name}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-cta-whatsapp"
                  >
                    <MessageCircle size={15} /> WHATSAPP
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. MONUMENTAL WATERMARK FOOTER (AURELLE STYLE) */}
      <footer ref={footerRef} className="monumental-footer">
        <div className="footer-giant-watermark">
          KOHINOOR PLASTIC
        </div>

        <div className="footer-columns-grid">
          <div className="footer-brand-statement">
            <h4>KOHINOOR PLASTIC</h4>
            <p>Everyday drinkware. Thoughtfully made. Engineering discipline and timeless utility since 1987.</p>
          </div>

          <div className="footer-col-links">
            <h5>COLLECTIONS</h5>
            <ul>
              <li><a href="#signatures">40oz Tumblers</a></li>
              <li><a href="#signatures">Vacuum Flasks</a></li>
              <li><a href="#signatures">Sports Sippers</a></li>
              <li><a href="#signatures">Stainless Steel</a></li>
            </ul>
          </div>

          <div className="footer-col-links">
            <h5>THE ATELIER</h5>
            <ul>
              <li><a href="#atelier">Metallurgy & Form</a></li>
              <li><a href="#story-track">Material Study</a></li>
              <li><a href="#masterwork">Real-Time 3D</a></li>
              <li><a href="#manifesto">Manifesto</a></li>
            </ul>
          </div>

          <div className="footer-col-links">
            <h5>SALON CONCIERGE</h5>
            <ul>
              <li><a href="#salon">Private Salon</a></li>
              <li><a href="#salon">Corporate Orders</a></li>
              <li><a href="#salon">WhatsApp Direct</a></li>
              <li><a href="#salon">Mumbai Headquarters</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>© 2026 KOHINOOR PLASTIC INDUSTRIES · ALL RIGHTS RESERVED</span>
          <span>MADE FOR THE MOMENTS BETWEEN LIFETIMES</span>
        </div>
      </footer>
    </main>
  )
}
