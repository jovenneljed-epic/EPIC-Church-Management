/**
 * EPIC Worship Music Service
 * Pure Christian Praise & Worship Songs (Tagalog & English Only - No Worldly Songs)
 * 100% Reliable Local Static Audio Streams in /audio/ (Zero 403 / Zero Corruption)
 */

export type WorshipMood = "ALL" | "TAGALOG" | "ENGLISH";

export interface WorshipSong {
    id: string;
    title: string;
    artist: string;
    language: "Tagalog" | "English";
    albumCover: string;
    duration: string;
    durationSeconds: number;
    mood: WorshipMood;
    moodLabel: string;
    audioUrl: string;
    scriptureTheme: string;
    lyricsSnippet: string;
    chordsKey: "C" | "G" | "D" | "E" | "A";
    isCustom?: boolean;
}

export const WORSHIP_PLAYLIST: WorshipSong[] = [
    // ==========================================
    // 🇵🇭 TAGALOG CHRISTIAN PRAISE & WORSHIP SONGS
    // ==========================================
    {
        id: "song-tagalog-1",
        title: "Diyos Ka Sa Amin",
        artist: "Malayang Pilipino Music",
        language: "Tagalog",
        albumCover: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
        duration: "4:30",
        durationSeconds: 270,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Worship",
        audioUrl: "/audio/tagalog-diyos-ka-sa-amin.wav",
        scriptureTheme: "Awit 89:1 — 'Aawitin ko ang tapat Mong pag-ibig, O Panginoon, magpakailanman!'",
        lyricsSnippet: "Diyos Ka sa amin, tapat at totoo, noon, ngayon at magpakailanman! Sa bawat sandali, Ikaw ang aming sandigan.",
        chordsKey: "G"
    },
    {
        id: "song-tagalog-2",
        title: "Salamat, Salamat",
        artist: "Malayang Pilipino Music",
        language: "Tagalog",
        albumCover: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80",
        duration: "5:12",
        durationSeconds: 312,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Pasasalamat",
        audioUrl: "/audio/tagalog-salamat-salamat.wav",
        scriptureTheme: "1 Tesalonica 5:18 — 'Magpasalamat kayo sa lahat ng pagkakataon; sapagkat ito ang kalooban ng Diyos sa inyo.'",
        lyricsSnippet: "Salamat, salamat O Hesus sa pag-ibig Mo! Walang hanggang pasasalamat ang alay sa Iyo.",
        chordsKey: "E"
    },
    {
        id: "song-tagalog-3",
        title: "Banal Mong Tahanan",
        artist: "Rommel Guevara",
        language: "Tagalog",
        albumCover: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=400&q=80",
        duration: "4:48",
        durationSeconds: 288,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Soaking",
        audioUrl: "/audio/tagalog-banal-mong-tahanan.wav",
        scriptureTheme: "Awit 84:10 — 'Sapagkat ang isang araw sa Iyong mga looban ay higit na mabuti kaysa sanlibong araw sa iba.'",
        lyricsSnippet: "Ang puso ko'y dinudulog sa Iyo, nagpapakumbaba, nagsusumamo, dalangin ko'y patnubayan Mo sa banal Mong tahanan.",
        chordsKey: "D"
    },
    {
        id: "song-tagalog-4",
        title: "Dakilang Katapatan",
        artist: "Papuri Singers / Arnel de Pano",
        language: "Tagalog",
        albumCover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80",
        duration: "5:20",
        durationSeconds: 320,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Hymn",
        audioUrl: "/audio/tagalog-dakilang-katapatan.wav",
        scriptureTheme: "Panaghoy 3:22-23 — 'Dakila ang Iyong katapatan; bago tuwina ang Iyong habag tuwing umaga.'",
        lyricsSnippet: "Dakila Ka, O Diyos, tapat Ka ngang tunay! Magmula pa sa ugat ng aming buhay, katapatan Mo'y walang kapantay.",
        chordsKey: "D"
    },
    {
        id: "song-tagalog-5",
        title: "Tanging Pag-asa",
        artist: "Faithmusic Manila",
        language: "Tagalog",
        albumCover: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
        duration: "4:15",
        durationSeconds: 255,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Pag-asa",
        audioUrl: "/audio/tagalog-tanging-pag-asa.wav",
        scriptureTheme: "Awit 62:5 — 'Sa Diyos lamang nagpapahinga ang aking kaluluwa, sapagkat mula sa Kanya ang aking pag-asa.'",
        lyricsSnippet: "Ikaw ang tanging pag-asa, kagalakan ko't lakas, Panginoong Hesus Ikaw lamang ang aking kaligtasan.",
        chordsKey: "C"
    },
    {
        id: "song-tagalog-6",
        title: "Kay Buti-Buti Mo Panginoon",
        artist: "Rommel Guevara",
        language: "Tagalog",
        albumCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
        duration: "4:40",
        durationSeconds: 280,
        mood: "TAGALOG",
        moodLabel: "🇵🇭 Tagalog Papuri",
        audioUrl: "/audio/tagalog-kay-buti-buti-mo.wav",
        scriptureTheme: "Awit 107:1 — 'O magpasalamat sa Panginoon, sapagkat Siya ay mabuti; ang Kanyang kagandahang-loob ay magpakailanman.'",
        lyricsSnippet: "Kay buti-buti Mo, Panginoon! Sa lahat ng oras, sa bawat araw, Ika'y laging tapat at maaasahan.",
        chordsKey: "G"
    },

    // ==========================================
    // 🌐 ENGLISH CHRISTIAN PRAISE & WORSHIP SONGS
    // ==========================================
    {
        id: "song-eng-1",
        title: "Goodness of God",
        artist: "CeCe Winans / Bethel Music",
        language: "English",
        albumCover: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
        duration: "4:56",
        durationSeconds: 296,
        mood: "ENGLISH",
        moodLabel: "🌐 English Praise",
        audioUrl: "/audio/english-goodness-of-god.wav",
        scriptureTheme: "Psalm 23:6 — 'Surely goodness and mercy shall follow me all the days of my life, and I will dwell in the house of the Lord forever.'",
        lyricsSnippet: "All my life You have been faithful, All my life You have been so, so good! With every breath that I am able, I will sing of the goodness of God.",
        chordsKey: "G"
    },
    {
        id: "song-eng-2",
        title: "Way Maker",
        artist: "Sinach / Leeland",
        language: "English",
        albumCover: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=400&q=80",
        duration: "5:04",
        durationSeconds: 304,
        mood: "ENGLISH",
        moodLabel: "🌐 English Warfare",
        audioUrl: "/audio/english-way-maker.wav",
        scriptureTheme: "Isaiah 43:19 — 'See, I am doing a new thing! I am making a way in the wilderness and streams in the wasteland.'",
        lyricsSnippet: "Way Maker, Miracle Worker, Promise Keeper, Light in the darkness, my God, that is who You are!",
        chordsKey: "C"
    },
    {
        id: "song-eng-3",
        title: "10,000 Reasons (Bless the Lord)",
        artist: "Matt Redman",
        language: "English",
        albumCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
        duration: "4:18",
        durationSeconds: 258,
        mood: "ENGLISH",
        moodLabel: "🌐 English Morning",
        audioUrl: "/audio/english-10000-reasons.wav",
        scriptureTheme: "Psalm 103:1 — 'Bless the Lord, O my soul, and all that is within me, bless His holy name.'",
        lyricsSnippet: "Bless the Lord O my soul, O my soul, worship His holy name. Sing like never before, O my soul, I'll worship Your holy name.",
        chordsKey: "G"
    },
    {
        id: "song-eng-4",
        title: "What A Beautiful Name",
        artist: "Hillsong Worship",
        language: "English",
        albumCover: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=400&q=80",
        duration: "5:20",
        durationSeconds: 320,
        mood: "ENGLISH",
        moodLabel: "🌐 English Exaltation",
        audioUrl: "/audio/english-what-a-beautiful-name.wav",
        scriptureTheme: "Philippians 2:9 — 'God exalted Him to the highest place and gave Him the name that is above every name.'",
        lyricsSnippet: "What a beautiful Name it is, What a beautiful Name it is, The Name of Jesus Christ my King!",
        chordsKey: "D"
    },
    {
        id: "song-eng-5",
        title: "Amazing Grace (My Chains Are Gone)",
        artist: "Chris Tomlin",
        language: "English",
        albumCover: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80",
        duration: "4:24",
        durationSeconds: 264,
        mood: "ENGLISH",
        moodLabel: "🌐 English Hymn",
        audioUrl: "/audio/english-amazing-grace.wav",
        scriptureTheme: "Romans 8:1 — 'There is now no condemnation for those who are in Christ Jesus.'",
        lyricsSnippet: "My chains are gone, I've been set free! My God, my Savior has ransomed me. And like a flood His mercy rains, unending love, amazing grace.",
        chordsKey: "E"
    },
    {
        id: "song-eng-6",
        title: "How Great Thou Art",
        artist: "Classic Hymn / Carl Boberg",
        language: "English",
        albumCover: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=400&q=80",
        duration: "4:50",
        durationSeconds: 290,
        mood: "ENGLISH",
        moodLabel: "🌐 English Majestic Hymn",
        audioUrl: "/audio/english-how-great-thou-art.wav",
        scriptureTheme: "Psalm 8:1 — 'O Lord, our Lord, how majestic is Your name in all the earth!'",
        lyricsSnippet: "Then sings my soul, my Savior God, to Thee: How great Thou art, how great Thou art!",
        chordsKey: "A"
    }
];

export const MOOD_CATEGORIES: { key: WorshipMood; label: string; icon: string }[] = [
    { key: "ALL", label: "✨ Lahat / All Christian Songs", icon: "✨" },
    { key: "TAGALOG", label: "🇵🇭 Tagalog Christian Worship", icon: "🇵🇭" },
    { key: "ENGLISH", label: "🌐 English Christian Worship", icon: "🌐" }
];

const CUSTOM_SONGS_STORAGE_KEY = "epic_community_custom_worship_songs";

export function getCustomWorshipSongs(): WorshipSong[] {
    try {
        const stored = localStorage.getItem(CUSTOM_SONGS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {}
    return [];
}

export function saveCustomWorshipSong(song: {
    title: string;
    artist: string;
    audioUrl: string;
    language?: "Tagalog" | "English";
    scriptureTheme?: string;
    lyricsSnippet?: string;
}): WorshipSong {
    const list = getCustomWorshipSongs();
    const lang = song.language || "Tagalog";
    const newSong: WorshipSong = {
        id: `custom-${Date.now()}`,
        title: song.title.trim(),
        artist: song.artist.trim() || "Worship Team",
        language: lang,
        albumCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
        duration: "4:00",
        durationSeconds: 240,
        mood: lang === "Tagalog" ? "TAGALOG" : "ENGLISH",
        moodLabel: lang === "Tagalog" ? "🇵🇭 Custom Tagalog Worship" : "🌐 Custom English Worship",
        audioUrl: song.audioUrl.trim(),
        scriptureTheme: song.scriptureTheme?.trim() || "Colossians 3:16 — 'Singing to God with thanksgiving in your hearts.'",
        lyricsSnippet: song.lyricsSnippet?.trim() || "Worship the Lord with gladness; come before Him with joyful songs!",
        chordsKey: "G",
        isCustom: true
    };

    list.unshift(newSong);
    try {
        localStorage.setItem(CUSTOM_SONGS_STORAGE_KEY, JSON.stringify(list));
    } catch {}
    return newSong;
}

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
                return [130.81, 164.81, 196.0, 246.94, 261.63];
            case "G":
                return [98.0, 123.47, 146.83, 196.0, 246.94];
            case "D":
                return [146.83, 185.0, 220.0, 293.66];
            case "E":
                return [82.41, 123.47, 164.81, 246.94];
            case "A":
                return [110.0, 138.59, 164.81, 220.0];
            default:
                return [130.81, 164.81, 196.0];
        }
    }
}

export const spiritualSynth = new SpiritualAmbientSynth();
