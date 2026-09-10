/**
 * EPIC Worship Music Service
 * Curated Christian Worship Songs & Auto-Play Audio Engine
 */

export type WorshipMood = "ALL" | "PRAISE" | "SOAKING" | "PEACE" | "WARFARE" | "HYMN";

export interface WorshipSong {
    id: string;
    title: string;
    artist: string;
    albumCover: string;
    duration: string;
    durationSeconds: number;
    mood: WorshipMood;
    moodLabel: string;
    audioUrl: string;
    scriptureTheme: string;
    lyricsSnippet: string;
    chordsKey: "C" | "G" | "D" | "E" | "A";
}

export const WORSHIP_PLAYLIST: WorshipSong[] = [
    {
        id: "song-1",
        title: "Goodness of God",
        artist: "CeCe Winans / Bethel Music",
        albumCover: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
        duration: "4:56",
        durationSeconds: 296,
        mood: "PRAISE",
        moodLabel: "🙏 Praise & Gratitude",
        audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3",
        scriptureTheme: "Psalm 23:6 — 'Surely goodness and mercy shall follow me all the days of my life.'",
        lyricsSnippet: "All my life You have been faithful, All my life You have been so, so good! With every breath that I am able, I will sing of the goodness of God.",
        chordsKey: "G"
    },
    {
        id: "song-2",
        title: "Way Maker",
        artist: "Sinach / Leeland",
        albumCover: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=400&q=80",
        duration: "5:04",
        durationSeconds: 304,
        mood: "WARFARE",
        moodLabel: "⚔️ Faith & Breakthrough",
        audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=piano-moment-9835.mp3",
        scriptureTheme: "Isaiah 43:19 — 'I am making a way in the wilderness and streams in the wasteland.'",
        lyricsSnippet: "Way Maker, Miracle Worker, Promise Keeper, Light in the darkness, my God, that is who You are!",
        chordsKey: "C"
    },
    {
        id: "song-3",
        title: "10,000 Reasons (Bless the Lord)",
        artist: "Matt Redman",
        albumCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
        duration: "4:18",
        durationSeconds: 258,
        mood: "SOAKING",
        moodLabel: "☀️ Morning Worship",
        audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=inspiring-cinematic-ambient-116199.mp3",
        scriptureTheme: "Psalm 103:1 — 'Bless the Lord, O my soul, and all that is within me, bless His holy name.'",
        lyricsSnippet: "Bless the Lord O my soul, O my soul, worship His holy name. Sing like never before, O my soul, I'll worship Your holy name.",
        chordsKey: "G"
    },
    {
        id: "song-4",
        title: "What A Beautiful Name",
        artist: "Hillsong Worship",
        albumCover: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=400&q=80",
        duration: "5:20",
        durationSeconds: 320,
        mood: "PRAISE",
        moodLabel: "👑 Christ Exaltation",
        audioUrl: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_3341ab738e.mp3?filename=the-cradle-of-your-soul-5753.mp3",
        scriptureTheme: "Philippians 2:9 — 'God exalted Him to the highest place and gave Him the name that is above every name.'",
        lyricsSnippet: "What a beautiful Name it is, What a beautiful Name it is, The Name of Jesus Christ my King!",
        chordsKey: "D"
    },
    {
        id: "song-5",
        title: "Oceans (Where Feet May Fail)",
        artist: "Hillsong UNITED",
        albumCover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
        duration: "6:10",
        durationSeconds: 370,
        mood: "SOAKING",
        moodLabel: "🌊 Deep Surrender",
        audioUrl: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f772cb.mp3?filename=meditation-piano-123415.mp3",
        scriptureTheme: "Matthew 14:29 — 'Come,' He said. Then Peter got down out of the boat, walked on the water and came toward Jesus.",
        lyricsSnippet: "Spirit lead me where my trust is without borders, Let me walk upon the waters wherever You would call me.",
        chordsKey: "D"
    },
    {
        id: "song-6",
        title: "Gratitude",
        artist: "Brandon Lake",
        albumCover: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=400&q=80",
        duration: "4:32",
        durationSeconds: 272,
        mood: "SOAKING",
        moodLabel: "❤️ Heartfelt Thanksgiving",
        audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591461e.mp3?filename=relaxing-piano-110624.mp3",
        scriptureTheme: "Psalm 100:4 — 'Enter His gates with thanksgiving and His courts with praise; give thanks to Him and praise His name.'",
        lyricsSnippet: "So I throw up my hands and praise You again and again, 'Cause all that I have is a hallelujah, hallelujah!",
        chordsKey: "C"
    },
    {
        id: "song-7",
        title: "Peace Be Still",
        artist: "Hope Darst",
        albumCover: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80",
        duration: "4:12",
        durationSeconds: 252,
        mood: "PEACE",
        moodLabel: "🕊️ Peace & Healing",
        audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/24/audio_3d1ef9b265.mp3?filename=peaceful-garden-healing-light-11833.mp3",
        scriptureTheme: "Mark 4:39 — 'He got up, rebuked the wind and said to the waves, \"Quiet! Be still!\" Then the wind died down and it was completely calm.'",
        lyricsSnippet: "Peace be still, say the word and I will. I believe that You are here now, Standing in the storm with me.",
        chordsKey: "G"
    },
    {
        id: "song-8",
        title: "Great Are You Lord",
        artist: "All Sons & Daughters",
        albumCover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80",
        duration: "4:45",
        durationSeconds: 285,
        mood: "WARFARE",
        moodLabel: "🌬️ Breath in Our Lungs",
        audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3?filename=calm-piano-ambient-10149.mp3",
        scriptureTheme: "Ezekiel 37:5 — 'This is what the Sovereign Lord says: I will make breath enter you, and you will come to life.'",
        lyricsSnippet: "It's Your breath in our lungs, so we pour out our praise, we pour out our praise! Great are You, Lord!",
        chordsKey: "A"
    },
    {
        id: "song-9",
        title: "Amazing Grace (My Chains Are Gone)",
        artist: "Chris Tomlin",
        albumCover: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
        duration: "4:24",
        durationSeconds: 264,
        mood: "HYMN",
        moodLabel: "✝️ Timeless Hymn",
        audioUrl: "https://cdn.pixabay.com/download/audio/2022/11/06/audio_9246a36c53.mp3?filename=hopeful-piano-ambient-126284.mp3",
        scriptureTheme: "Romans 8:1 — 'Therefore, there is now no condemnation for those who are in Christ Jesus.'",
        lyricsSnippet: "My chains are gone, I've been set free! My God, my Savior has ransomed me. And like a flood His mercy rains, unending love, amazing grace.",
        chordsKey: "E"
    }
];

export const MOOD_CATEGORIES: { key: WorshipMood; label: string; icon: string }[] = [
    { key: "ALL", label: "All Songs", icon: "✨" },
    { key: "PRAISE", label: "Praise & Joy", icon: "❤️" },
    { key: "SOAKING", label: "Soaking Worship", icon: "🕊️" },
    { key: "PEACE", label: "Peace & Rest", icon: "🌿" },
    { key: "WARFARE", label: "Faith & Breakthrough", icon: "⚔️" },
    { key: "HYMN", label: "Classic Hymns", icon: "✝️" }
];

/**
 * Web Audio API Spiritual Ambient Synthesizer
 * Generates peaceful, resonant worship chords in real time
 * as an ultra-reliable, zero-dependency audio generator
 */
class SpiritualAmbientSynth {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private oscillators: OscillatorNode[] = [];
    private isPlaying = false;

    private getContext(): AudioContext {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
        return this.ctx;
    }

    public playWorshipChords(key: "C" | "G" | "D" | "E" | "A"): void {
        this.stop();
        const ctx = this.getContext();
        const frequencies = this.getChordFrequencies(key);

        frequencies.forEach((freq) => {
            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            // Gentle swelling envelope
            noteGain.gain.setValueAtTime(0.001, ctx.currentTime);
            noteGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 1.5);

            osc.connect(noteGain);
            if (this.masterGain) noteGain.connect(this.masterGain);

            osc.start();
            this.oscillators.push(osc);
        });

        this.isPlaying = true;
    }

    public setVolume(vol: number): void {
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
        }
    }

    public stop(): void {
        this.oscillators.forEach((osc) => {
            try {
                osc.stop();
                osc.disconnect();
            } catch {}
        });
        this.oscillators = [];
        this.isPlaying = false;
    }

    public getIsPlaying(): boolean {
        return this.isPlaying;
    }

    private getChordFrequencies(key: "C" | "G" | "D" | "E" | "A"): number[] {
        switch (key) {
            case "C":
                // C major (C3, E3, G3, B3, C4)
                return [130.81, 164.81, 196.0, 246.94, 261.63];
            case "G":
                // G major (G2, B2, D3, G3, B3)
                return [98.0, 123.47, 146.83, 196.0, 246.94];
            case "D":
                // D major (D3, F#3, A3, D4)
                return [146.83, 185.0, 220.0, 293.66];
            case "E":
                // E minor / major warmth
                return [82.41, 123.47, 164.81, 246.94];
            case "A":
                // A major warmth
                return [110.0, 138.59, 164.81, 220.0];
            default:
                return [130.81, 164.81, 196.0];
        }
    }
}

export const spiritualSynth = new SpiritualAmbientSynth();
