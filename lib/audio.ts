// Pure browser Web Audio synthesizer for tactile UI micro-interactions (zero external assets)
class AudioManager {
  private ctx: AudioContext | null = null
  public enabled: boolean = false

  private initCtx() {
    if (typeof window === 'undefined') return
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public toggleSound(): boolean {
    this.initCtx()
    this.enabled = !this.enabled
    if (this.enabled) {
      this.playChime()
    }
    return this.enabled
  }

  // Soft tactile click for switches and color swatches
  public playClick(freq = 800) {
    if (!this.enabled) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.02)

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.025)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.03)
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Elegant metallic chime for hotspot activation and thermal mode toggles
  public playChime() {
    if (!this.enabled) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const freqs = [880, 1320, 1760]

      freqs.forEach((f, i) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(f, now + i * 0.03)

        gain.gain.setValueAtTime(0.04, now + i * 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35 + i * 0.03)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(now + i * 0.03)
        osc.stop(now + 0.4 + i * 0.03)
      })
    } catch {
      // Silently catch
    }
  }

  // Filtered whoosh for chapter scrolling
  public playWhoosh() {
    if (!this.enabled) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.12)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.28)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.03, now + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.32)
    } catch {
      // Silently catch
    }
  }

  // Pneumatic vacuum release sound when 3D tumbler explodes
  public playExplode() {
    if (!this.enabled) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(160, now)
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.16)

      gain.gain.setValueAtTime(0.035, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.22)
    } catch {
      // Silently catch
    }
  }

  // Metallic magnetic snap sound when 3D tumbler assembles
  public playDock() {
    if (!this.enabled) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(1100, now)
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.07)

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.1)
    } catch {
      // Silently catch
    }
  }
}

export const soundEngine = new AudioManager()
