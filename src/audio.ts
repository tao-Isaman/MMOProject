// Game SFX: authored hit samples play through the same Web Audio buses as procedural effects.

type Wave = OscillatorType;

interface ToneSpec {
  from: number;
  to: number;
  duration: number;
  gain: number;
  wave?: Wave;
  delay?: number;
}

interface NoiseSpec {
  duration: number;
  gain: number;
  frequency: number;
  type?: BiquadFilterType;
  delay?: number;
}

interface SoundSpec {
  tones: ToneSpec[];
  noise?: NoiseSpec;
  extraNoise?: NoiseSpec;
  bus?: "ui" | "sfx";
}

export interface HitSoundCue {
  kind: string;
  theme: string;
  weapon: string;
}

const HIT_BANKS: Record<string, string[]> = {
  enemy: ["enemy/enemy_hit_1.wav", "enemy/enemy_hit_2.wav", "enemy/enemy_hit_3.wav", "enemy/enemy_hit_4.wav"],
  fire: ["fire/fire_hit_1.wav", "fire/fire_hit_2.wav"],
  normal: ["normal/normal_hit_1.wav", "normal/normal_hit_2.wav", "normal/normal_hit_3.wav", "normal/normal_hit_4.wav"],
  lightning: ["lightning/lightning_hit_1.wav", "lightning/lightning_hit_2.wav"],
  arrow: ["arrow/arrow_hit.wav"],
  axe: ["axe/axe_hit.wav"],
  dagger: ["dagger/dagger_hit.wav"],
  hand: ["hand/hand_hit_1.wav", "hand/hand_hit_2.wav", "hand/hand_hit_3.wav", "hand/hand_hit_4.wav"],
  mace: ["mace/mace_hit.wav"],
  rod: ["rod/rod_hit.wav"],
  spear: ["spear/spear_hit.wav"],
  sword: ["sword/sword_hit.wav"],
};

const VOLUME_KEY = "mmoproject.sfx-volume.v1";
const MUSIC_KEY = "mmoproject.music-volume.v1";
const THEME_URL = "assets/audio/music/eden_theme.mp3";
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private uiBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private voices: number[] = [];
  private hitBuffers = new Map<string, AudioBuffer>();
  private hitLoadStarted = false;
  private lastHitIndex = new Map<string, number>();
  private level = this.readVolume(VOLUME_KEY, 0.72);
  // The theme song: a looping <audio> element on its own bus, so its volume is set apart from
  // the effects' (master above is the effects' volume).
  private musicBus: GainNode | null = null;
  private theme: HTMLAudioElement | null = null;
  private musicLevel = this.readVolume(MUSIC_KEY, 0.5);

  constructor() {
    document.addEventListener("pointerdown", () => this.unlock(), { capture: true, passive: true });
    document.addEventListener("keydown", () => this.unlock(), { capture: true });
    // One quiet UI sound covers buttons across all windows without wiring each control by hand.
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("button,[role='button']");
      if (!button || (button instanceof HTMLButtonElement && (button.disabled || button.getAttribute("aria-disabled") === "true"))) return;
      this.play("ui-click", hash(button.id || button.className.toString()));
    }, true);
  }

  get volume(): number {
    return this.level;
  }

  setVolume(value: number): void {
    this.level = clamp(value, 0, 1);
    try { localStorage.setItem(VOLUME_KEY, String(this.level)); } catch { /* private storage */ }
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.level, this.ctx.currentTime, 0.035);
  }

  get musicVolume(): number {
    return this.musicLevel;
  }

  setMusicVolume(value: number): void {
    this.musicLevel = clamp(value, 0, 1);
    try { localStorage.setItem(MUSIC_KEY, String(this.musicLevel)); } catch { /* private storage */ }
    if (this.musicBus && this.ctx) this.musicBus.gain.setTargetAtTime(this.musicLevel, this.ctx.currentTime, 0.035);
  }

  private readVolume(key: string, fallback: number): number {
    try {
      const raw = localStorage.getItem(key);
      const value = raw === null ? NaN : Number(raw);
      return Number.isFinite(value) ? clamp(value, 0, 1) : fallback;
    } catch { return fallback; }
  }

  // Starts the theme (browsers allow sound only after a first tap or key press: unlock calls this).
  private startTheme(): void {
    if (!this.ctx || !this.musicBus || this.theme) return;
    const audio = new Audio(THEME_URL);
    audio.loop = true;
    audio.preload = "auto";
    this.ctx.createMediaElementSource(audio).connect(this.musicBus);
    this.theme = audio;
    void audio.play().catch(() => { this.theme = null; }); // blocked: the next tap tries again
  }

  private unlock(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.uiBus = this.ctx.createGain();
      this.master.gain.value = this.level;
      this.sfxBus.gain.value = 0.82;
      this.uiBus.gain.value = 0.52;
      this.sfxBus.connect(this.master);
      this.uiBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicLevel;
      this.musicBus.connect(this.ctx.destination);
      this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const channel = this.noise.getChannelData(0);
      for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
    }
    void this.preloadHitSounds();
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => undefined);
    this.startTheme();
  }

  private async preloadHitSounds(): Promise<void> {
    if (!this.ctx || this.hitLoadStarted) return;
    this.hitLoadStarted = true;
    const ctx = this.ctx;
    const files = Object.values(HIT_BANKS).flat();
    await Promise.all(files.map(async (file) => {
      try {
        const response = await fetch(`assets/audio/hits/${file}`);
        if (!response.ok) return;
        const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
        this.hitBuffers.set(file, buffer);
      } catch {
        // A missing or unsupported sample uses the procedural fallback for that hit.
      }
    }));
  }

  play(event: string, variation = 0): void {
    if (!this.ctx || !this.sfxBus || !this.uiBus) return;
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => undefined);
    const now = this.ctx.currentTime;
    this.voices = this.voices.filter((until) => until > now);
    if (this.voices.length >= 18) return;
    const spec = this.spec(event, variation);
    const bus = spec.bus === "ui" ? this.uiBus : this.sfxBus;
    const jitter = 0.965 + Math.random() * 0.07;
    let end = now;
    for (const tone of spec.tones) {
      const start = now + (tone.delay ?? 0);
      end = Math.max(end, start + tone.duration);
      this.tone(tone, start, bus, jitter);
    }
    if (spec.noise) {
      const start = now + (spec.noise.delay ?? 0);
      end = Math.max(end, start + spec.noise.duration);
      this.noiseBurst(spec.noise, start, bus);
    }
    if (spec.extraNoise) {
      const start = now + (spec.extraNoise.delay ?? 0);
      end = Math.max(end, start + spec.extraNoise.duration);
      this.noiseBurst(spec.extraNoise, start, bus);
    }
    this.voices.push(end + 0.02);
  }

  playWeapon(id: string): void {
    this.play(`weapon:${id}`, hash(id));
  }

  playHit(cue: HitSoundCue = { kind: "normal", theme: "", weapon: "" }, critical = false): void {
    if (!this.ctx || !this.sfxBus) return;
    const group = this.hitGroup(cue), files = HIT_BANKS[group] ?? HIT_BANKS.normal;
    const available = files.filter((file) => this.hitBuffers.has(file));
    if (!available.length) {
      const fallback = group === "enemy" ? "player-hurt" : critical ? "critical" : "impact";
      this.play(fallback, hash(`${group}:${critical}`));
      return;
    }
    let index = Math.floor(Math.random() * available.length);
    const previous = this.lastHitIndex.get(group);
    if (available.length > 1 && index === previous) index = (index + 1) % available.length;
    this.lastHitIndex.set(group, index);
    const buffer = this.hitBuffers.get(available[index]);
    if (!buffer) return;
    const now = this.ctx.currentTime;
    this.voices = this.voices.filter((until) => until > now);
    if (this.voices.length >= 18) return;
    const source = this.ctx.createBufferSource(), gain = this.ctx.createGain();
    const rate = critical ? 0.94 : 0.98 + Math.random() * 0.04;
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(rate, now);
    gain.gain.setValueAtTime(critical ? 1.12 : 1, now);
    source.connect(gain);
    gain.connect(this.sfxBus);
    source.start(now);
    this.voices.push(now + buffer.duration / rate + 0.02);
  }

  private hitGroup(cue: HitSoundCue): string {
    const theme = cue.theme.toLowerCase(), weapon = cue.weapon.toLowerCase();
    if (cue.kind === "enemy") return "enemy";
    if (theme === "fire") return "fire";
    if (theme === "lightning") return "lightning";
    if (weapon.includes("axe")) return "axe";
    if (weapon.includes("dagger")) return "dagger";
    if (weapon === "mace") return "mace";
    if (weapon.includes("spear")) return "spear";
    if (weapon.includes("sword")) return "sword";
    if (weapon === "staff" || weapon === "rod") return "rod";
    if (["bow", "arrow"].includes(weapon) || cue.kind === "arrow") return "arrow";
    if (["knuckle", "claw", "unarmed", "form", "hand"].includes(weapon)) return "hand";
    return "normal";
  }

  playSkill(theme: string, type: string, id: string): void {
    if (!this.ctx) return;
    const roots: Record<string, number> = {
      fire: 180, plant: 360, ice: 620, water: 420, lightning: 760, wind: 520, earth: 145,
      holy: 680, shadow: 230, poison: 300, metal: 250, arcane: 500, physical: 210,
    };
    const seed = hash(id), root = roots[theme] ?? 440, offset = (seed % 9) * 0.035;
    const support = ["heal", "shield", "buff", "orb", "form"].includes(type);
    const duration = support ? 0.34 : 0.24;
    const wave: Wave = theme === "fire" || theme === "poison" ? "sawtooth" : theme === "lightning" || theme === "metal" ? "square" : "sine";
    const bus = this.sfxBus;
    if (!bus || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.voices = this.voices.filter((until) => until > now);
    if (this.voices.length >= 18) return;
    const signature: ToneSpec[] = support
      ? [{ from: root, to: root * 1.3, duration: duration * 0.72, gain: 0.065, wave },
         { from: root * 1.25, to: root * 1.9, duration: duration * 0.62, gain: 0.045, wave: "sine", delay: duration * 0.24 },
         { from: root * 1.9, to: root * 2.25, duration: duration * 0.7, gain: 0.03, wave: "sine", delay: duration * 0.52 }]
      : [{ from: root * (1 + offset), to: root * (type === "beam" ? 0.62 : 0.48), duration, gain: 0.07, wave },
         { from: root * 1.5, to: root * 0.8, duration: duration * 0.7, gain: 0.032, wave: "sine", delay: 0.018 }];
    const weight: ToneSpec[] = support ? [] : [
      { from: 88 + (seed % 5) * 5, to: 38, duration: 0.19, gain: 0.13, wave: "sine" },
      { from: 172 + (seed % 7) * 9, to: 66, duration: 0.115, gain: 0.075, wave: "triangle", delay: 0.006 },
    ];
    const tones = [...weight, ...signature];
    for (const tone of tones) this.tone(tone, now + (tone.delay ?? 0), bus, 0.98 + (seed % 5) * 0.01);
    if (!support && this.noise) {
      this.noiseBurst({ duration: 0.105, gain: 0.085, frequency: 560, type: "lowpass" }, now, bus);
      this.noiseBurst({ duration: 0.065, gain: theme === "fire" || theme === "earth" ? 0.04 : 0.022,
        frequency: theme === "ice" ? 3200 : theme === "fire" ? 900 : 1800, type: "highpass" }, now, bus);
    }
    this.voices.push(now + duration + 0.04);
  }

  playFootstep(surface: string): void {
    this.play("footstep", hash(surface));
  }

  playProjectile(kind: string, theme = "", weaponSound = ""): void {
    if (weaponSound) return this.play(`weapon:${weaponSound}`, hash(`${weaponSound}:${theme}`));
    const seed = hash(`${kind}:${theme}`);
    this.play(kind === "bullet" ? "gunshot" : kind === "arrow" ? "arrow-shot" : "magic-shot", seed);
  }

  playProjectileImpact(kind: string, theme = "", weaponSound = "", critical = false): void {
    this.playHit({ kind, theme, weapon: weaponSound }, critical);
  }

  private tone(spec: ToneSpec, start: number, bus: GainNode, jitter: number): void {
    if (!this.ctx) return;
    const end = start + spec.duration, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = spec.wave ?? "sine";
    osc.frequency.setValueAtTime(Math.max(24, spec.from * jitter), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(24, spec.to * jitter), end);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(spec.gain, start + Math.min(0.012, spec.duration * 0.18));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(start);
    osc.stop(end + 0.01);
  }

  private noiseBurst(spec: NoiseSpec, start: number, bus: GainNode): void {
    if (!this.ctx || !this.noise) return;
    const source = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(), gain = this.ctx.createGain();
    source.buffer = this.noise;
    filter.type = spec.type ?? "bandpass";
    filter.frequency.setValueAtTime(spec.frequency, start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, spec.frequency * 0.35), start + spec.duration);
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(spec.gain, start + Math.min(0.008, spec.duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    source.start(start);
    source.stop(start + spec.duration + 0.01);
  }

  private spec(event: string, variation: number): SoundSpec {
    const v = (variation % 7) * 0.035;
    if (event.startsWith("weapon:")) return this.weaponSpec(event.slice(7), variation);
    if (event.startsWith("projectile-impact:")) return this.projectileImpactSpec(event, variation);
    switch (event) {
      case "ui-click": return { bus: "ui", tones: [{ from: 740 + variation % 180, to: 480, duration: 0.045, gain: 0.026, wave: "sine" }] };
      case "ui-open": return { bus: "ui", tones: [{ from: 390, to: 620, duration: 0.13, gain: 0.04 }, { from: 585, to: 790, duration: 0.1, gain: 0.022, delay: 0.045 }] };
      case "ui-close": return { bus: "ui", tones: [{ from: 560, to: 340, duration: 0.11, gain: 0.035 }] };
      case "ui-error": return { bus: "ui", tones: [{ from: 250, to: 170, duration: 0.15, gain: 0.045, wave: "triangle" }], noise: { duration: 0.055, gain: 0.012, frequency: 500, type: "lowpass" } };
      case "swing": return { tones: [{ from: 290 + variation % 140, to: 95, duration: 0.12, gain: 0.055, wave: "triangle" }, { from: 126 + variation % 24, to: 52, duration: 0.15, gain: 0.075, wave: "sine" }], noise: { duration: 0.1, gain: 0.05, frequency: 620, type: "lowpass" } };
      case "impact": return { tones: [{ from: 82 + variation % 18, to: 34, duration: 0.2, gain: 0.15, wave: "sine" }, { from: 175 + variation % 42, to: 62, duration: 0.13, gain: 0.095, wave: "triangle", delay: 0.004 }], noise: { duration: 0.095, gain: 0.095, frequency: 520, type: "lowpass" } };
      case "miss": return { tones: [{ from: 380, to: 190, duration: 0.13, gain: 0.035, wave: "triangle" }], noise: { duration: 0.045, gain: 0.012, frequency: 1800, type: "highpass" } };
      case "critical": return { tones: [{ from: 420, to: 155, duration: 0.19, gain: 0.095, wave: "triangle" }, { from: 780, to: 330, duration: 0.13, gain: 0.045, delay: 0.01 }, { from: 72, to: 28, duration: 0.25, gain: 0.22, wave: "sine" }, { from: 205, to: 72, duration: 0.15, gain: 0.12, wave: "triangle", delay: 0.008 }], noise: { duration: 0.115, gain: 0.085, frequency: 510, type: "lowpass" }, extraNoise: { duration: 0.048, gain: 0.13, frequency: 2050, type: "bandpass", delay: 0.012 } };
      case "enemy-death": return { tones: [{ from: 250 + v * 500, to: 58, duration: 0.27, gain: 0.065, wave: "triangle" }], noise: { duration: 0.11, gain: 0.035, frequency: 540, type: "lowpass" } };
      case "player-hurt": return { tones: [{ from: 210, to: 82, duration: 0.22, gain: 0.085, wave: "sawtooth" }], noise: { duration: 0.1, gain: 0.045, frequency: 480, type: "lowpass" } };
      case "player-death": return { tones: [{ from: 390, to: 170, duration: 0.45, gain: 0.07, wave: "triangle" }, { from: 190, to: 58, duration: 0.56, gain: 0.055, wave: "sine", delay: 0.18 }], noise: { duration: 0.24, gain: 0.035, frequency: 520, type: "lowpass" } };
      case "enemy-swipe": return { tones: [{ from: 180, to: 70, duration: 0.16, gain: 0.055, wave: "triangle" }, { from: 84, to: 38, duration: 0.18, gain: 0.11, wave: "sine" }], noise: { duration: 0.1, gain: 0.07, frequency: 580, type: "lowpass" } };
      case "enemy-shot": return { tones: [{ from: 430 + variation % 260, to: 150, duration: 0.2, gain: 0.045, wave: "sawtooth" }, { from: 92, to: 42, duration: 0.17, gain: 0.1, wave: "sine" }], noise: { duration: 0.09, gain: 0.075, frequency: 620, type: "lowpass" } };
      case "arrow-shot": return { tones: [{ from: 620 + v * 300, to: 240, duration: 0.13, gain: 0.04, wave: "triangle" }, { from: 156, to: 58, duration: 0.14, gain: 0.09, wave: "sine" }], noise: { duration: 0.095, gain: 0.065, frequency: 900, type: "bandpass" } };
      case "gunshot": return { tones: [{ from: 130, to: 42, duration: 0.13, gain: 0.11, wave: "square" }], noise: { duration: 0.12, gain: 0.11, frequency: 1500, type: "lowpass" } };
      case "magic-shot": return { tones: [{ from: 850 + variation % 300, to: 310, duration: 0.22, gain: 0.05 }, { from: 1300, to: 680, duration: 0.15, gain: 0.025, delay: 0.018 }, { from: 118, to: 44, duration: 0.18, gain: 0.12, wave: "sine" }], noise: { duration: 0.08, gain: 0.055, frequency: 560, type: "lowpass" } };
      case "loot-pickup": return { tones: [{ from: 760 + variation % 140, to: 1120, duration: 0.12, gain: 0.055 }, { from: 1120, to: 1480, duration: 0.13, gain: 0.038, delay: 0.07 }] };
      case "coin": return { tones: [{ from: 920, to: 1280, duration: 0.075, gain: 0.04 }, { from: 1380, to: 980, duration: 0.12, gain: 0.032, delay: 0.065 }] };
      case "potion-hp": return { tones: [{ from: 360, to: 720, duration: 0.24, gain: 0.05 }, { from: 540, to: 980, duration: 0.29, gain: 0.035, delay: 0.06 }] };
      case "potion-mp": return { tones: [{ from: 530, to: 980, duration: 0.27, gain: 0.05 }, { from: 790, to: 1320, duration: 0.3, gain: 0.032, delay: 0.06 }] };
      case "heal": return { tones: [{ from: 420, to: 680, duration: 0.22, gain: 0.05 }, { from: 640, to: 980, duration: 0.3, gain: 0.04, delay: 0.1 }] };
      case "buff": return { tones: [{ from: 360, to: 560, duration: 0.16, gain: 0.045 }, { from: 560, to: 880, duration: 0.2, gain: 0.04, delay: 0.11 }] };
      case "shield": return { tones: [{ from: 240, to: 440, duration: 0.2, gain: 0.06, wave: "triangle" }, { from: 590, to: 510, duration: 0.24, gain: 0.035, delay: 0.045 }], noise: { duration: 0.16, gain: 0.025, frequency: 1500, type: "bandpass" } };
      case "level-up": return { tones: [{ from: 392, to: 392, duration: 0.15, gain: 0.05 }, { from: 523, to: 523, duration: 0.15, gain: 0.05, delay: 0.12 }, { from: 784, to: 1046, duration: 0.36, gain: 0.065, delay: 0.24 }] };
      case "quest-complete": return { tones: [{ from: 523, to: 523, duration: 0.13, gain: 0.045 }, { from: 659, to: 659, duration: 0.13, gain: 0.05, delay: 0.1 }, { from: 784, to: 1175, duration: 0.29, gain: 0.06, delay: 0.2 }] };
      case "travel": return { tones: [{ from: 260, to: 390, duration: 0.34, gain: 0.045, wave: "triangle" }, { from: 520, to: 790, duration: 0.38, gain: 0.038, delay: 0.2 }], noise: { duration: 0.28, gain: 0.025, frequency: 500, type: "lowpass" } };
      case "talk": return { tones: [{ from: 540 + variation % 150, to: 710 + variation % 130, duration: 0.095, gain: 0.03 }, { from: 720, to: 590, duration: 0.08, gain: 0.022, delay: 0.09 }] };
      case "footstep": return { tones: [{ from: 100 + variation % 25, to: 54, duration: 0.065, gain: 0.046, wave: "triangle" }], noise: { duration: 0.045, gain: 0.018, frequency: 400 + variation % 1100, type: variation % 2 ? "lowpass" : "bandpass" } };
      default: return { tones: [{ from: 400, to: 260, duration: 0.12, gain: 0.035 }] };
    }
  }

  private projectileImpactSpec(event: string, variation: number): SoundSpec {
    const [, kind, theme, weapon] = event.split(":");
    const variationTone = (variation % 7) * 4;
    const tones: ToneSpec[] = [
      { from: 86 + variationTone, to: 29, duration: 0.25, gain: 0.26, wave: "sine" },
      { from: 184 + variationTone * 2, to: 54, duration: 0.17, gain: 0.15, wave: "triangle", delay: 0.004 },
    ];
    let noise: NoiseSpec = { duration: 0.16, gain: 0.16, frequency: 510, type: "lowpass" };
    let extraNoise: NoiseSpec = { duration: 0.055, gain: 0.12, frequency: 1900, type: "bandpass", delay: 0.006 };

    if (kind === "arrow" || weapon === "bow") {
      tones.push({ from: 310 + variationTone * 3, to: 84, duration: 0.12, gain: 0.12, wave: "triangle", delay: 0.008 });
      noise = { duration: 0.19, gain: 0.19, frequency: 440, type: "lowpass" };
      extraNoise = { duration: 0.06, gain: 0.15, frequency: 2250, type: "bandpass", delay: 0.005 };
    } else if (kind === "bullet" || weapon === "pistol" || weapon === "rifle") {
      tones.push({ from: 520 + variationTone * 5, to: 115, duration: 0.075, gain: 0.1, wave: "square", delay: 0.003 });
      noise = { duration: 0.14, gain: 0.2, frequency: 780, type: "lowpass" };
      extraNoise = { duration: 0.045, gain: 0.16, frequency: 3200, type: "highpass", delay: 0.002 };
    } else {
      const accents: Record<string, number> = {
        fire: 920, plant: 1250, ice: 3000, water: 1650, lightning: 3400, wind: 2450,
        earth: 470, holy: 2800, shadow: 750, poison: 1350, metal: 2150, arcane: 2500, physical: 1750,
      };
      tones.push({ from: accents[theme] ?? 1650, to: 240, duration: 0.11, gain: 0.075, wave: theme === "metal" || theme === "lightning" ? "square" : "triangle", delay: 0.01 });
      noise = { duration: 0.17, gain: theme === "earth" || theme === "fire" ? 0.2 : 0.16,
        frequency: theme === "ice" ? 1250 : theme === "water" ? 700 : 520, type: "lowpass" };
      extraNoise = { duration: 0.065, gain: theme === "ice" || theme === "lightning" ? 0.14 : 0.105,
        frequency: accents[theme] ?? 1650, type: "bandpass", delay: 0.008 };
    }

    if (event.endsWith(":critical")) {
      tones.push({ from: 1480 + variationTone * 8, to: 430, duration: 0.09, gain: 0.12, wave: "sawtooth", delay: 0.012 });
      extraNoise = { duration: 0.07, gain: 0.19, frequency: 2450, type: "bandpass", delay: 0.01 };
    }
    return { tones, noise, extraNoise };
  }

  private weaponSpec(id: string, variation: number): SoundSpec {
    const v = variation % 9;
    switch (id) {
      case "sword_1h": return { tones: [{ from: 390 + v * 13, to: 125, duration: 0.14, gain: 0.07, wave: "triangle" }, { from: 145, to: 58, duration: 0.15, gain: 0.065, wave: "sine" }], noise: { duration: 0.11, gain: 0.06, frequency: 1500, type: "bandpass" } };
      case "sword_2h": return { tones: [{ from: 280 + v * 9, to: 72, duration: 0.23, gain: 0.09, wave: "triangle" }, { from: 98, to: 34, duration: 0.23, gain: 0.12, wave: "sine" }], noise: { duration: 0.16, gain: 0.075, frequency: 900, type: "bandpass" } };
      case "axe": return { tones: [{ from: 240 + v * 11, to: 58, duration: 0.18, gain: 0.09, wave: "sawtooth" }, { from: 92, to: 34, duration: 0.2, gain: 0.14, wave: "sine" }], noise: { duration: 0.14, gain: 0.09, frequency: 690, type: "lowpass" }, extraNoise: { duration: 0.045, gain: 0.045, frequency: 2300, type: "highpass", delay: 0.018 } };
      case "axe_2h": return { tones: [{ from: 205 + v * 8, to: 42, duration: 0.28, gain: 0.12, wave: "sawtooth" }, { from: 72, to: 28, duration: 0.29, gain: 0.19, wave: "sine" }], noise: { duration: 0.19, gain: 0.11, frequency: 520, type: "lowpass" }, extraNoise: { duration: 0.055, gain: 0.055, frequency: 1800, type: "highpass", delay: 0.025 } };
      case "mace": return { tones: [{ from: 112 + v * 5, to: 38, duration: 0.2, gain: 0.19, wave: "sine" }, { from: 360, to: 115, duration: 0.11, gain: 0.09, wave: "triangle", delay: 0.006 }], noise: { duration: 0.15, gain: 0.11, frequency: 430, type: "lowpass" }, extraNoise: { duration: 0.04, gain: 0.035, frequency: 1300, type: "bandpass", delay: 0.03 } };
      case "spear_1h": return { tones: [{ from: 330 + v * 12, to: 105, duration: 0.12, gain: 0.075, wave: "triangle" }, { from: 120, to: 48, duration: 0.14, gain: 0.09, wave: "sine" }], noise: { duration: 0.12, gain: 0.075, frequency: 740, type: "bandpass" } };
      case "spear_2h": return { tones: [{ from: 250 + v * 10, to: 68, duration: 0.19, gain: 0.1, wave: "triangle" }, { from: 88, to: 31, duration: 0.23, gain: 0.16, wave: "sine" }], noise: { duration: 0.16, gain: 0.095, frequency: 560, type: "lowpass" } };
      case "dagger": return { tones: [{ from: 640 + v * 18, to: 190, duration: 0.085, gain: 0.065, wave: "triangle" }, { from: 155, to: 58, duration: 0.095, gain: 0.055, wave: "sine" }], noise: { duration: 0.065, gain: 0.055, frequency: 2100, type: "highpass" } };
      case "claw": return { tones: [{ from: 510 + v * 15, to: 125, duration: 0.11, gain: 0.08, wave: "sawtooth" }, { from: 112, to: 45, duration: 0.13, gain: 0.07, wave: "sine" }], noise: { duration: 0.1, gain: 0.085, frequency: 2800, type: "highpass" } };
      case "staff": return { tones: [{ from: 260 + v * 12, to: 90, duration: 0.18, gain: 0.09, wave: "sine" }, { from: 560, to: 210, duration: 0.18, gain: 0.045, wave: "triangle", delay: 0.012 }], noise: { duration: 0.1, gain: 0.055, frequency: 650, type: "lowpass" } };
      case "bow": return { tones: [{ from: 760 + v * 22, to: 260, duration: 0.11, gain: 0.09, wave: "triangle" }, { from: 112, to: 38, duration: 0.2, gain: 0.19, wave: "sine" }, { from: 210, to: 78, duration: 0.12, gain: 0.09, wave: "triangle", delay: 0.008 }], noise: { duration: 0.12, gain: 0.1, frequency: 920, type: "bandpass" }, extraNoise: { duration: 0.05, gain: 0.045, frequency: 3000, type: "highpass", delay: 0.01 } };
      case "knuckle": return { tones: [{ from: 138 + v * 4, to: 42, duration: 0.16, gain: 0.16, wave: "sine" }, { from: 225, to: 78, duration: 0.1, gain: 0.09, wave: "triangle" }], noise: { duration: 0.095, gain: 0.1, frequency: 520, type: "lowpass" } };
      case "pistol": return { tones: [{ from: 148, to: 38, duration: 0.13, gain: 0.17, wave: "square" }, { from: 690, to: 175, duration: 0.075, gain: 0.06, wave: "triangle" }], noise: { duration: 0.12, gain: 0.15, frequency: 1350, type: "lowpass" }, extraNoise: { duration: 0.04, gain: 0.07, frequency: 3600, type: "highpass", delay: 0.008 } };
      case "rifle": return { tones: [{ from: 94, to: 27, duration: 0.22, gain: 0.22, wave: "square" }, { from: 480, to: 92, duration: 0.12, gain: 0.075, wave: "triangle" }], noise: { duration: 0.18, gain: 0.18, frequency: 950, type: "lowpass" }, extraNoise: { duration: 0.055, gain: 0.09, frequency: 3200, type: "highpass", delay: 0.012 } };
      case "form": return { tones: [{ from: 180 + v * 10, to: 48, duration: 0.2, gain: 0.12, wave: "triangle" }, { from: 74, to: 30, duration: 0.22, gain: 0.16, wave: "sine" }], noise: { duration: 0.14, gain: 0.08, frequency: 480, type: "lowpass" } };
      case "unarmed": return { tones: [{ from: 145 + v * 4, to: 46, duration: 0.15, gain: 0.15, wave: "sine" }, { from: 250, to: 85, duration: 0.09, gain: 0.08, wave: "triangle" }], noise: { duration: 0.09, gain: 0.085, frequency: 580, type: "lowpass" } };
      default: return { tones: [{ from: 190 + v * 9, to: 55, duration: 0.16, gain: 0.1, wave: "triangle" }, { from: 90, to: 34, duration: 0.18, gain: 0.12, wave: "sine" }], noise: { duration: 0.11, gain: 0.07, frequency: 620, type: "lowpass" } };
    }
  }
}

export const sound = new GameAudio();
