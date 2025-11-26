interface AudioSettings {
    click: string | null; // URL or Base64
    match: string | null;
    shuffle: string | null;
    combo15: string | null;
    combo30: string | null;
    combo50: string | null;
}

const DEFAULT_SETTINGS: AudioSettings = {
    click: null, // Use synthesized default
    match: null,
    shuffle: null,
    combo15: null,
    combo30: null,
    combo50: null
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
                const parsed = JSON.parse(saved);
                // Only keep keys that exist in DEFAULT_SETTINGS to avoid legacy keys
                const validKeys = Object.keys(DEFAULT_SETTINGS) as (keyof AudioSettings)[];
                const filtered: Partial<AudioSettings> = {};
                for (const key of validKeys) {
                    if (key in parsed) {
                        filtered[key] = parsed[key];
                    }
                }
                this.settings = { ...DEFAULT_SETTINGS, ...filtered };
                this.reloadAllBuffers();
            } catch (e) {
                console.error('Failed to load settings', e);
            }
        }
    }

    private reloadAllBuffers() {
        this.buffers.clear();
        Object.entries(this.settings).forEach(([key, url]) => {
            if (url) this.loadAudio(key, url);
        });
    }

    async saveSettings(newSettings: AudioSettings) {
        this.settings = newSettings;
        try {
            localStorage.setItem('link-up-settings', JSON.stringify(newSettings));
        } catch (e) {
            console.error('Failed to save settings to localStorage (probably too large)', e);
            alert('Audio file too large to save! It will work for this session but will be lost on refresh.');
        }
        // Reload buffers regardless of save success
        this.reloadAllBuffers();
    }

    getSettings() {
        return { ...this.settings };
    }

    private async loadAudio(key: string, url: string) {
        if (!this.ctx) return;
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            // Decode data - we need to handle the promise properly
            // Note: Older Safari uses callback syntax for decodeAudioData, but most modern browsers support Promise.
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.buffers.set(key, audioBuffer);
            console.log(`Loaded audio for ${key}`);
        } catch (e) {
            console.error(`Failed to load audio for ${key}`, e);
        }
    }

    private playBuffer(key: string) {
        if (!this.ctx) return false;
        
        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        if (!this.buffers.has(key)) {
            // Debug info: why is it missing?
            if (this.settings[key as keyof AudioSettings]) {
                console.warn(`Buffer for ${key} missing but setting exists. Still loading?`);
            }
            return false;
        }

        try {
            const source = this.ctx.createBufferSource();
            source.buffer = this.buffers.get(key)!;
            source.connect(this.ctx.destination);
            source.start();
            return true;
        } catch (e) {
            console.error(`Error playing buffer ${key}`, e);
            return false;
        }
    }

    // Synthesized fallbacks
    private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
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

        console.log(`Combo: ${this.comboCount}`); // Debug log

        // 只在达到里程碑的那一次播放特殊音效
        if (this.comboCount === 50) {
            if (this.playBuffer('combo50')) return this.comboCount;
            console.log('Fallback from combo50');
        } else if (this.comboCount === 30) {
            if (this.playBuffer('combo30')) return this.comboCount;
            console.log('Fallback from combo30');
        } else if (this.comboCount === 15) {
            if (this.playBuffer('combo15')) return this.comboCount;
            console.log('Fallback from combo15');
        }

        // 其他情况播放普通 match 音效
        if (this.playBuffer('match')) return this.comboCount;

        // Default match sound (synthesized)
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
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

    /**
     * Preview a specific sound by key, bypassing combo logic.
     * Used by Settings to preview combo sounds directly.
     */
    previewSound(key: string) {
        // Try custom buffer first
        if (this.playBuffer(key)) return true;

        // Fall back to synthesized defaults
        switch (key) {
            case 'click':
                this.playTone(800, 'sine', 0.1);
                return true;
            case 'shuffle':
                this.playTone(500, 'square', 0.1, 0);
                this.playTone(500, 'square', 0.1, 0.1);
                return true;
            case 'match':
            case 'combo15':
            case 'combo30':
            case 'combo50':
                // Default synthesized match sound
                if (this.ctx) {
                    if (this.ctx.state === 'suspended') this.ctx.resume();
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
                    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    osc.stop(this.ctx.currentTime + 0.1);
                }
                return true;
            default:
                return false;
        }
    }
}

export const audioManager = new AudioManager();
