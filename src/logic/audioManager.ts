interface AudioSettings {
    click: string | null; // URL or Base64
    match: string | null;
    shuffle: string | null;
    combo10: string | null;
    combo20: string | null;
    combo30: string | null;
}

const DEFAULT_SETTINGS: AudioSettings = {
    click: null, // Use synthesized default
    match: null,
    shuffle: null,
    combo10: null,
    combo20: null,
    combo30: null
};

class AudioManager {
    private ctx: AudioContext | null = null;
    private settings: AudioSettings = DEFAULT_SETTINGS;
    private buffers: Map<string, AudioBuffer> = new Map();

    // Combo state
    private comboCount: number = 0;
    private lastMatchTime: number = 0;
    private readonly COMBO_WINDOW = 5000; // 5 seconds

    constructor() {
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.loadSettings();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    private loadSettings() {
        const saved = localStorage.getItem('link-up-settings');
        if (saved) {
            try {
                this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
                // Preload custom sounds
                Object.entries(this.settings).forEach(([key, url]) => {
                    if (url) this.loadAudio(key, url);
                });
            } catch (e) {
                console.error('Failed to load settings', e);
            }
        }
    }

    saveSettings(newSettings: AudioSettings) {
        this.settings = newSettings;
        localStorage.setItem('link-up-settings', JSON.stringify(newSettings));
        // Reload buffers
        this.buffers.clear();
        Object.entries(this.settings).forEach(([key, url]) => {
            if (url) this.loadAudio(key, url);
        });
    }

    getSettings() {
        return { ...this.settings };
    }

    private async loadAudio(key: string, url: string) {
        if (!this.ctx) return;
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.buffers.set(key, audioBuffer);
        } catch (e) {
            console.error(`Failed to load audio for ${key}`, e);
        }
    }

    private playBuffer(key: string) {
        if (!this.ctx || !this.buffers.has(key)) return false;
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers.get(key)!;
        source.connect(this.ctx.destination);
        source.start();
        return true;
    }

    // Synthesized fallbacks
    private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    playClick() {
        if (this.playBuffer('click')) return;
        this.playTone(800, 'sine', 0.1);
    }

    playShuffle() {
        if (this.playBuffer('shuffle')) return;
        this.playTone(500, 'square', 0.1, 0);
        this.playTone(500, 'square', 0.1, 0.1);
    }

    playMatch() {
        const now = Date.now();
        if (now - this.lastMatchTime < this.COMBO_WINDOW) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }
        this.lastMatchTime = now;

        // Check combo milestones
        if (this.comboCount >= 30 && this.playBuffer('combo30')) return this.comboCount;
        if (this.comboCount >= 20 && this.playBuffer('combo20')) return this.comboCount;
        if (this.comboCount >= 10 && this.playBuffer('combo10')) return this.comboCount;

        if (this.playBuffer('match')) return this.comboCount;

        // Default match sound (synthesized)
        if (this.ctx) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200 + (this.comboCount * 20), this.ctx.currentTime); // Pitch up with combo
            osc.frequency.linearRampToValueAtTime(600 + (this.comboCount * 20), this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.1);
        }

        return this.comboCount;
    }

    resetCombo() {
        this.comboCount = 0;
        this.lastMatchTime = 0;
    }
}

export const audioManager = new AudioManager();
