import React, { createContext, useContext, useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
    type WorshipSong,
    type WorshipMood,
    type CreateWorshipSongRequest,
    WORSHIP_PLAYLIST,
    getCustomWorshipSongs,
    saveCustomWorshipSong,
    getDeletedSongIds,
    adminDeleteSong,
    adminRestoreAllSongs
} from "../services/worshipService";

interface WorshipAudioContextType {
    currentSong: WorshipSong;
    isPlaying: boolean;
    isMuted: boolean;
    volume: number;
    worshipMood: WorshipMood;
    allSongs: WorshipSong[];
    filteredSongs: WorshipSong[];
    deletedSongIds: string[];
    isSoundBarVisible: boolean;
    isSoundBarExpanded: boolean;
    showVideoPlayer: boolean;
    activeLyricsSong: WorshipSong | null;
    showLyricsModal: boolean;
    playSong: (song: WorshipSong) => void;
    togglePlay: () => void;
    pause: () => void;
    resume: () => void;
    nextSong: () => void;
    prevSong: () => void;
    setVolume: (v: number) => void;
    toggleMute: () => void;
    setWorshipMood: (mood: WorshipMood) => void;
    toggleSoundBar: () => void;
    setIsSoundBarVisible: (v: boolean) => void;
    setIsSoundBarExpanded: (v: boolean) => void;
    setShowVideoPlayer: React.Dispatch<React.SetStateAction<boolean>>;
    openLyrics: (song?: WorshipSong) => void;
    closeLyrics: () => void;
    deleteSong: (songId: string) => void;
    restoreAllSongs: () => void;
    addNewSong: (song: CreateWorshipSongRequest) => WorshipSong;
}

const WorshipAudioContext = createContext<WorshipAudioContextType | undefined>(undefined);

const ACTIVE_SONG_KEY = "epic_community_active_song_id";
const SOUNDBAR_EXPANDED_KEY = "epic_soundbar_expanded";

export const WorshipAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Deleted & Custom Songs
    const [deletedSongIds, setDeletedSongIds] = useState<string[]>(() => getDeletedSongIds());
    const [customSongs, setCustomSongs] = useState<WorshipSong[]>(() => getCustomWorshipSongs());

    // 2. Compute all active songs
    const allSongs = useMemo(() => {
        const base = [...customSongs, ...WORSHIP_PLAYLIST];
        return base.filter((s) => !deletedSongIds.includes(s.id));
    }, [deletedSongIds, customSongs]);

    // 3. Current Active Song
    const [currentSong, setCurrentSong] = useState<WorshipSong>(() => {
        const savedId = localStorage.getItem(ACTIVE_SONG_KEY);
        if (savedId) {
            const found = allSongs.find((s) => s.id === savedId);
            if (found) return found;
        }
        return allSongs[0] || WORSHIP_PLAYLIST[0];
    });

    // 4. Playback State
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [volume, setVolumeState] = useState<number>(100);
    const [worshipMood, setWorshipMood] = useState<WorshipMood>("ALL");

    // 5. Sound Bar UI State
    const [isSoundBarVisible, setIsSoundBarVisible] = useState<boolean>(true);
    const [isSoundBarExpanded, setIsSoundBarExpanded] = useState<boolean>(() => {
        const saved = localStorage.getItem(SOUNDBAR_EXPANDED_KEY);
        return saved !== null ? saved === "true" : true;
    });
    const [showVideoPlayer, setShowVideoPlayer] = useState<boolean>(false);

    // 6. Lyrics Modal State
    const [activeLyricsSong, setActiveLyricsSong] = useState<WorshipSong | null>(null);
    const [showLyricsModal, setShowLyricsModal] = useState<boolean>(false);

    // 7. Persistent Audio Refs (YouTube Iframe & HTML5 Audio for uploaded tracks)
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const html5AudioRef = useRef<HTMLAudioElement>(null);
    const hasInitiatedPlayback = useRef<boolean>(false);

    // Sync HTML5 audio volume & mute
    useEffect(() => {
        if (html5AudioRef.current) {
            html5AudioRef.current.volume = isMuted ? 0 : volume / 100;
            html5AudioRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    // Sync HTML5 audio playback state
    useEffect(() => {
        if (!html5AudioRef.current) return;
        if (currentSong?.audioUrl) {
            if (isPlaying) {
                html5AudioRef.current.play().catch(() => {});
            } else {
                html5AudioRef.current.pause();
            }
        } else {
            html5AudioRef.current.pause();
        }
    }, [currentSong?.audioUrl, isPlaying]);

    // Send YouTube Command via postMessage
    const sendCommand = useCallback((func: string, args: any[] = []) => {
        try {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: "command", func, args }),
                    "*"
                );
            }
        } catch {}
    }, []);

    // Play specific song
    const playSong = useCallback((song: WorshipSong) => {
        setCurrentSong(song);
        setIsPlaying(true);
        hasInitiatedPlayback.current = true;
        localStorage.setItem(ACTIVE_SONG_KEY, song.id);
        if (song.audioUrl && html5AudioRef.current) {
            html5AudioRef.current.play().catch(() => {});
        }
    }, []);

    // Add new custom song (Admin upload with proper lyrics)
    const addNewSong = useCallback(
        (songRequest: CreateWorshipSongRequest): WorshipSong => {
            const created = saveCustomWorshipSong(songRequest);
            const updated = getCustomWorshipSongs();
            setCustomSongs(updated);
            playSong(created);
            return created;
        },
        [playSong]
    );

    // Toggle Play / Pause
    const togglePlay = useCallback(() => {
        if (!hasInitiatedPlayback.current) {
            hasInitiatedPlayback.current = true;
            setIsPlaying(true);
            if (currentSong.audioUrl && html5AudioRef.current) {
                html5AudioRef.current.play().catch(() => {});
            }
            return;
        }

        setIsPlaying((prev) => {
            const next = !prev;
            if (currentSong.audioUrl && html5AudioRef.current) {
                if (next) {
                    html5AudioRef.current.play().catch(() => {});
                } else {
                    html5AudioRef.current.pause();
                }
            } else {
                if (next) {
                    sendCommand("playVideo");
                } else {
                    sendCommand("pauseVideo");
                }
            }
            return next;
        });
    }, [currentSong.audioUrl, sendCommand]);

    const pause = useCallback(() => {
        setIsPlaying(false);
        if (currentSong.audioUrl && html5AudioRef.current) {
            html5AudioRef.current.pause();
        } else {
            sendCommand("pauseVideo");
        }
    }, [currentSong.audioUrl, sendCommand]);

    const resume = useCallback(() => {
        setIsPlaying(true);
        if (currentSong.audioUrl && html5AudioRef.current) {
            html5AudioRef.current.play().catch(() => {});
        } else {
            sendCommand("playVideo");
        }
    }, [currentSong.audioUrl, sendCommand]);

    // Next Song
    const nextSong = useCallback(() => {
        if (allSongs.length === 0) return;
        const currentIdx = allSongs.findIndex((s) => s.id === currentSong.id);
        const nextIdx = (currentIdx + 1) % allSongs.length;
        playSong(allSongs[nextIdx]);
    }, [allSongs, currentSong, playSong]);

    // Previous Song
    const prevSong = useCallback(() => {
        if (allSongs.length === 0) return;
        const currentIdx = allSongs.findIndex((s) => s.id === currentSong.id);
        const prevIdx = (currentIdx - 1 + allSongs.length) % allSongs.length;
        playSong(allSongs[prevIdx]);
    }, [allSongs, currentSong, playSong]);

    // Volume & Mute
    const setVolume = useCallback(
        (v: number) => {
            const clamped = Math.max(0, Math.min(100, v));
            setVolumeState(clamped);
            sendCommand("setVolume", [clamped]);
            if (html5AudioRef.current) {
                html5AudioRef.current.volume = clamped / 100;
            }
            if (clamped === 0) {
                setIsMuted(true);
                sendCommand("mute");
                if (html5AudioRef.current) html5AudioRef.current.muted = true;
            } else if (isMuted) {
                setIsMuted(false);
                sendCommand("unMute");
                if (html5AudioRef.current) html5AudioRef.current.muted = false;
            }
        },
        [sendCommand, isMuted]
    );

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            const next = !prev;
            if (next) {
                sendCommand("mute");
                if (html5AudioRef.current) html5AudioRef.current.muted = true;
            } else {
                sendCommand("unMute");
                sendCommand("setVolume", [volume || 80]);
                if (html5AudioRef.current) {
                    html5AudioRef.current.muted = false;
                    html5AudioRef.current.volume = (volume || 80) / 100;
                }
            }
            return next;
        });
    }, [sendCommand, volume]);

    // Toggle Sound Bar
    const toggleSoundBar = useCallback(() => {
        setIsSoundBarExpanded((prev) => {
            const next = !prev;
            localStorage.setItem(SOUNDBAR_EXPANDED_KEY, String(next));
            return next;
        });
    }, []);

    // Lyrics
    const openLyrics = useCallback(
        (song?: WorshipSong) => {
            setActiveLyricsSong(song || currentSong);
            setShowLyricsModal(true);
        },
        [currentSong]
    );

    const closeLyrics = useCallback(() => {
        setShowLyricsModal(false);
    }, []);

    // Admin Delete Song
    const deleteSong = useCallback(
        (songId: string) => {
            adminDeleteSong(songId);
            setDeletedSongIds(getDeletedSongIds());
            setCustomSongs(getCustomWorshipSongs());

            // If currently playing song was deleted, switch to next available
            if (currentSong.id === songId) {
                const remaining = allSongs.filter((s) => s.id !== songId);
                if (remaining.length > 0) {
                    playSong(remaining[0]);
                } else {
                    setIsPlaying(false);
                    if (html5AudioRef.current) html5AudioRef.current.pause();
                }
            }
        },
        [currentSong, allSongs, playSong]
    );

    // Admin Restore Songs
    const restoreAllSongs = useCallback(() => {
        adminRestoreAllSongs();
        setDeletedSongIds([]);
        setCustomSongs(getCustomWorshipSongs());
    }, []);

    // Filtered Songs by mood
    const filteredSongs = useMemo(() => {
        if (worshipMood === "ALL") return allSongs;
        return allSongs.filter((s) => s.mood === worshipMood);
    }, [allSongs, worshipMood]);

    // Video URL with YouTube embed options
    const iframeSrc = useMemo(() => {
        if (!currentSong?.youtubeId) return "";
        const auto = isPlaying ? 1 : 0;
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        return `https://www.youtube.com/embed/${currentSong.youtubeId}?autoplay=${auto}&enablejsapi=1&playsinline=1&rel=0${origin ? `&origin=${encodeURIComponent(origin)}` : ""}`;
    }, [currentSong?.youtubeId, isPlaying]);

    const value: WorshipAudioContextType = {
        currentSong,
        isPlaying,
        isMuted,
        volume,
        worshipMood,
        allSongs,
        filteredSongs,
        deletedSongIds,
        isSoundBarVisible,
        isSoundBarExpanded,
        showVideoPlayer,
        activeLyricsSong,
        showLyricsModal,
        playSong,
        togglePlay,
        pause,
        resume,
        nextSong,
        prevSong,
        setVolume,
        toggleMute,
        setWorshipMood,
        toggleSoundBar,
        setIsSoundBarVisible,
        setIsSoundBarExpanded,
        setShowVideoPlayer,
        openLyrics,
        closeLyrics,
        deleteSong,
        restoreAllSongs,
        addNewSong
    };

    return (
        <WorshipAudioContext.Provider value={value}>
            {children}

            {/* Hidden HTML5 Audio Element for Direct / Uploaded Audio Streams */}
            <audio
                ref={html5AudioRef}
                src={currentSong?.audioUrl || undefined}
                onEnded={nextSong}
                preload="auto"
                style={{ display: "none" }}
            />

            {/* Persistent Global YouTube Audio/Video Engine */}
            {/* When showVideoPlayer is false, keeps 1px background iframe active so audio NEVER stops */}
            {/* When showVideoPlayer is true, docks as a crisp picture-in-picture floating frame */}
            <div
                id="epic-global-worship-iframe-container"
                style={
                    showVideoPlayer
                        ? {
                              position: "fixed",
                              bottom: isSoundBarExpanded ? 88 : 70,
                              right: 20,
                              width: 320,
                              height: 180,
                              zIndex: 99998,
                              borderRadius: 14,
                              overflow: "hidden",
                              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(56, 189, 248, 0.4)",
                              background: "#020617",
                              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                          }
                        : {
                              position: "fixed",
                              bottom: -9999,
                              right: -9999,
                              width: 1,
                              height: 1,
                              opacity: 0.001,
                              pointerEvents: "none",
                              zIndex: -1
                          }
                }
            >
                {showVideoPlayer && (
                    <div
                        style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            zIndex: 10,
                            display: "flex",
                            gap: 4
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setShowVideoPlayer(false)}
                            style={{
                                background: "rgba(15, 23, 42, 0.85)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                color: "#cbd5e1",
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 700
                            }}
                            title="Minimize video (Audio continues in background)"
                        >
                            ✕
                        </button>
                    </div>
                )}
                {iframeSrc && (
                    <iframe
                        ref={iframeRef}
                        key={currentSong?.id}
                        src={iframeSrc}
                        title={currentSong?.title || "Christian Worship Master Audio"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            display: "block"
                        }}
                    />
                )}
            </div>
        </WorshipAudioContext.Provider>
    );
};

export function useWorshipAudio(): WorshipAudioContextType {
    const context = useContext(WorshipAudioContext);
    if (!context) {
        throw new Error("useWorshipAudio must be used within a WorshipAudioProvider");
    }
    return context;
}
