import React, { useState } from "react";
import {
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Volume2,
    VolumeX,
    Volume1,
    FileText,
    Tv,
    Copy,
    ChevronUp,
    ChevronDown,
    Music,
    Radio,
    Plus,
    Repeat,
    ListMusic,
    Search,
    X
} from "lucide-react";
import { useWorshipAudio } from "../context/WorshipAudioContext";
import { checkIsAdminVerified } from "../hooks/useAdminAuth";
import { UploadWorshipSongModal } from "./UploadWorshipSongModal";
import "./GlobalWorshipSoundBar.css";

export const GlobalWorshipSoundBar: React.FC = () => {
    const {
        currentSong,
        isPlaying,
        isMuted,
        volume,
        allSongs,
        playSong,
        isSoundBarVisible,
        isSoundBarExpanded,
        showVideoPlayer,
        activeLyricsSong,
        showLyricsModal,
        isContinuousLoop,
        currentTime,
        durationTime,
        togglePlay,
        nextSong,
        prevSong,
        seekTo,
        toggleContinuousLoop,
        setVolume,
        toggleMute,
        toggleSoundBar,
        setIsSoundBarVisible,
        setShowVideoPlayer,
        openLyrics,
        closeLyrics
    } = useWorshipAudio();

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [playlistSearch, setPlaylistSearch] = useState("");
    const [playlistMood, setPlaylistMood] = useState<"ALL" | "TAGALOG" | "ENGLISH">("ALL");
    const isAdmin = checkIsAdminVerified();

    const quickPlaylistSongs = (allSongs || []).filter((s) => {
        const matchesMood =
            playlistMood === "ALL" ||
            (playlistMood === "TAGALOG" && s.language === "Tagalog") ||
            (playlistMood === "ENGLISH" && s.language === "English");
        const q = playlistSearch.toLowerCase().trim();
        const matchesSearch =
            !q ||
            s.title.toLowerCase().includes(q) ||
            s.artist.toLowerCase().includes(q) ||
            (s.scriptureTheme && s.scriptureTheme.toLowerCase().includes(q));
        return matchesMood && matchesSearch;
    });

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleNavigateToCommunity = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.location.pathname !== "/community") {
            window.history.pushState({}, "", "/community");
            window.dispatchEvent(new PopStateEvent("popstate"));
        }
    };

    if (!isSoundBarVisible || !currentSong) {
        return (
            <div
                className="epic-soundbar-reopen-trigger"
                onClick={() => setIsSoundBarVisible(true)}
                title="Open Christian Worship Sound Bar"
            >
                <Music size={15} color="#38bdf8" />
                <span>Worship</span>
            </div>
        );
    }

    return (
        <>
            {/* Global Bottom Sound Bar */}
            <div
                className={`epic-soundbar-wrapper ${isSoundBarExpanded ? "expanded" : "minimized"} ${isPlaying ? "playing" : ""}`}
            >
                {/* Minimized Pill Mode */}
                {!isSoundBarExpanded ? (
                    <div className="epic-soundbar-min-pill" onClick={toggleSoundBar} title="Tap to expand Worship Sound Bar">
                        <div className={`epic-soundbar-min-disc ${isPlaying ? "spinning" : ""}`}>
                            <img src={currentSong.albumCover} alt={currentSong.title} />
                        </div>

                        <div className="epic-soundbar-min-info">
                            <strong className="epic-soundbar-min-title">{currentSong.title}</strong>
                            <span className="epic-soundbar-min-artist">{currentSong.artist}</span>
                        </div>

                        {/* Equalizer Wave in Pill */}
                        <div className={`epic-eq-wave ${isPlaying ? "active" : ""}`}>
                            <span className="eq-bar bar-1"></span>
                            <span className="eq-bar bar-2"></span>
                            <span className="eq-bar bar-3"></span>
                            <span className="eq-bar bar-4"></span>
                        </div>

                        <button
                            type="button"
                            className="epic-soundbar-pill-play"
                            onClick={(e) => {
                                e.stopPropagation();
                                togglePlay();
                            }}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: 1 }} />}
                        </button>

                        <button
                            type="button"
                            className="epic-soundbar-pill-expand-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleSoundBar();
                            }}
                            title="Expand Sound Bar"
                        >
                            <ChevronUp size={14} />
                            <span>Expand</span>
                        </button>

                        <button
                            type="button"
                            className="epic-soundbar-pill-close-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsSoundBarVisible(false);
                                setShowVideoPlayer(false);
                            }}
                            title="Close Sound Bar"
                        >
                            <X size={13} />
                        </button>
                    </div>
                ) : (
                    /* Expanded Full Sound Bar Mode */
                    <div className="epic-soundbar-full-card">
                        {/* LEFT: Song Metadata & Animated Sound Visualizer */}
                        <div
                            className="epic-soundbar-left-meta"
                            onClick={handleNavigateToCommunity}
                            title="Click to view Worship Sanctuary in Community"
                        >
                            <div className={`epic-soundbar-vinyl-thumb ${isPlaying ? "spinning" : ""}`}>
                                <img src={currentSong.albumCover} alt={currentSong.title} />
                                <div className="epic-soundbar-vinyl-center-hole"></div>
                            </div>

                            <div className="epic-soundbar-titles-box">
                                <div className="epic-soundbar-title-row">
                                    <strong className="epic-soundbar-song-title">{currentSong.title}</strong>
                                    <span className={`epic-soundbar-lang-badge ${currentSong.language.toLowerCase()}`}>
                                        {currentSong.language === "Tagalog" ? "🇵🇭 Tagalog" : "🌐 English"}
                                    </span>
                                </div>
                                <div className="epic-soundbar-artist-row">
                                    <span>{currentSong.artist}</span>
                                    <span className="meta-sep">•</span>
                                    <span className="epic-soundbar-scripture-pill">{currentSong.duration}</span>
                                </div>
                            </div>

                            {/* Sound Equalizer Visualizer */}
                            <div className={`epic-eq-wave desktop-eq ${isPlaying ? "active" : ""}`} title="Active Sound Waves">
                                <span className="eq-bar bar-1"></span>
                                <span className="eq-bar bar-2"></span>
                                <span className="eq-bar bar-3"></span>
                                <span className="eq-bar bar-4"></span>
                                <span className="eq-bar bar-5"></span>
                            </div>
                        </div>

                        {/* CENTER: Playback Controls */}
                        <div className="epic-soundbar-center-ctrls">
                            <div className="epic-soundbar-center-buttons-row">
                                <button
                                    type="button"
                                    className="epic-soundbar-ctrl-btn skip"
                                    onClick={prevSong}
                                    title="Previous Worship Song"
                                >
                                    <SkipBack size={17} />
                                </button>

                                <button
                                    type="button"
                                    className={`epic-soundbar-main-play-btn ${isPlaying ? "playing" : ""}`}
                                    onClick={togglePlay}
                                    title={isPlaying ? "Pause Worship" : "Play Worship"}
                                >
                                    {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                                </button>

                                <button
                                    type="button"
                                    className="epic-soundbar-ctrl-btn skip"
                                    onClick={nextSong}
                                    title="Next Worship Song"
                                >
                                    <SkipForward size={17} />
                                </button>

                                <button
                                    type="button"
                                    className={`epic-soundbar-ctrl-btn loop ${isContinuousLoop ? "active" : ""}`}
                                    onClick={toggleContinuousLoop}
                                    title={
                                        isContinuousLoop
                                            ? "Continuous Worship Loop: Active (Loops automatically after last song)"
                                            : "Continuous Loop: Disabled"
                                    }
                                >
                                    <Repeat size={14} color={isContinuousLoop ? "#34d399" : "#64748b"} />
                                </button>
                            </div>

                            {/* Track Progress Bar */}
                            <div className="epic-soundbar-progress-row">
                                <span className="epic-soundbar-time-text">{formatTime(currentTime)}</span>
                                <div
                                    className="epic-soundbar-progress-track"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                                        seekTo(ratio * (durationTime || 300));
                                    }}
                                    title="Click to seek position"
                                >
                                    <div
                                        className="epic-soundbar-progress-fill"
                                        style={{ width: `${Math.min(100, (currentTime / (durationTime || 300)) * 100)}%` }}
                                    >
                                        <div className="epic-soundbar-progress-scrubber-handle" />
                                    </div>
                                </div>
                                <span className="epic-soundbar-time-text">{formatTime(durationTime)}</span>
                            </div>

                            <div className="epic-soundbar-status-indicator">
                                <Radio size={12} color="#34d399" className={isPlaying ? "live-pulse" : ""} />
                                <span>
                                    {isPlaying
                                        ? `Continuous Praise Active ${isContinuousLoop ? "🔁 (Looping after last song)" : ""}`
                                        : "Worship Audio Paused"}
                                </span>
                            </div>
                        </div>

                        {/* RIGHT: Volume & Sound Bar Toggles */}
                        <div className="epic-soundbar-right-actions">
                            {/* Volume Slider & Mute Toggle */}
                            <div className="epic-soundbar-volume-group">
                                <button
                                    type="button"
                                    className="epic-soundbar-vol-btn"
                                    onClick={toggleMute}
                                    title={isMuted ? "Unmute" : "Mute"}
                                >
                                    {isMuted || volume === 0 ? (
                                        <VolumeX size={16} color="#f87171" />
                                    ) : volume < 50 ? (
                                        <Volume1 size={16} color="#38bdf8" />
                                    ) : (
                                        <Volume2 size={16} color="#38bdf8" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="epic-soundbar-vol-slider"
                                    title={`Volume: ${isMuted ? 0 : volume}%`}
                                />
                            </div>

                            {/* Sing-Along Lyrics Button */}
                            <button
                                type="button"
                                className="epic-soundbar-action-btn lyrics"
                                onClick={() => openLyrics(currentSong)}
                                title="View Sing-Along Lyrics & Chords"
                            >
                                <FileText size={14} />
                                <span className="btn-text">Lyrics</span>
                            </button>

                            {/* Toggle Video Picture-in-Picture Frame */}
                            <button
                                type="button"
                                className={`epic-soundbar-action-btn video ${showVideoPlayer ? "active" : ""}`}
                                onClick={() => setShowVideoPlayer((v) => !v)}
                                title={showVideoPlayer ? "Hide Video" : "Toggle Video Player"}
                            >
                                <Tv size={14} />
                                <span className="btn-text">{showVideoPlayer ? "Hide Video" : "Video"}</span>
                            </button>

                            {/* Admin Upload Worship Song Button */}
                            {isAdmin && (
                                <button
                                    type="button"
                                    className="epic-soundbar-action-btn upload"
                                    onClick={() => setIsUploadModalOpen(true)}
                                    title="Admin: Upload Christian Worship Song with Proper Lyrics"
                                >
                                    <Plus size={14} color="#38bdf8" />
                                    <span className="btn-text">Upload</span>
                                </button>
                            )}

                            {/* Quick Playlist Drawer Button */}
                            <button
                                type="button"
                                className={`epic-soundbar-action-btn playlist ${showPlaylistModal ? "active" : ""}`}
                                onClick={() => setShowPlaylistModal((v) => !v)}
                                title={`Browse All ${allSongs?.length || 52} Praise & Worship Songs`}
                            >
                                <ListMusic size={14} color="#38bdf8" />
                                <span className="btn-text">Songs ({allSongs?.length || 52})</span>
                            </button>

                            {/* Go to Sanctuary */}
                            <button
                                type="button"
                                className="epic-soundbar-action-btn sanctuary"
                                onClick={handleNavigateToCommunity}
                                title="Open Full Worship Sanctuary in Community"
                            >
                                <span style={{ fontSize: 13 }}>❤️</span>
                                <span className="btn-text">Sanctuary</span>
                            </button>

                            {/* Window Actions: Prominent Minimize and Close Buttons */}
                            <div className="epic-soundbar-window-controls">
                                <button
                                    type="button"
                                    className="epic-soundbar-minimize-btn"
                                    onClick={() => {
                                        toggleSoundBar();
                                        setShowVideoPlayer(false);
                                    }}
                                    title="Minimize Sound Bar so it won't block any content"
                                >
                                    <ChevronDown size={15} />
                                    <span>Minimize</span>
                                </button>

                                <button
                                    type="button"
                                    className="epic-soundbar-close-btn"
                                    onClick={() => {
                                        setIsSoundBarVisible(false);
                                        setShowVideoPlayer(false);
                                    }}
                                    title="Close Sound Bar"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sing-Along Full Lyrics Modal (Accessible across entire app & dashboard) */}
            {showLyricsModal && activeLyricsSong && (
                <div className="epic-lyrics-modal-overlay" onClick={closeLyrics}>
                    <div className="epic-lyrics-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="epic-lyrics-modal-header">
                            <div className="epic-lyrics-modal-title-wrap">
                                <FileText size={20} color="#38bdf8" />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#f8fafc" }}>
                                        {activeLyricsSong.title}
                                    </h3>
                                    <small style={{ color: "#94a3b8" }}>
                                        {activeLyricsSong.artist} • Key of {activeLyricsSong.chordsKey}
                                    </small>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button
                                    type="button"
                                    className="epic-lyrics-copy-btn"
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            `${activeLyricsSong.title} - ${activeLyricsSong.artist}\nKey of ${activeLyricsSong.chordsKey}\n\n${activeLyricsSong.fullLyrics}`
                                        );
                                        alert("Lyrics copied to clipboard!");
                                    }}
                                    title="Copy full lyrics to clipboard"
                                >
                                    <Copy size={14} /> Copy Lyrics
                                </button>
                                <button
                                    type="button"
                                    className="epic-lyrics-close-btn"
                                    onClick={closeLyrics}
                                    title="Close Lyrics"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="epic-lyrics-modal-body">
                            <div className="epic-lyrics-meta-pill">
                                <span>📖 {activeLyricsSong.scriptureTheme}</span>
                            </div>
                            <div className="epic-lyrics-structured-box">
                                {activeLyricsSong.fullLyrics.split("\n").map((line, idx) => {
                                    const trimmed = line.trim();
                                    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                                        const tag = trimmed.slice(1, -1);
                                        const isChorus = tag.toLowerCase().includes("chorus");
                                        const isBridge = tag.toLowerCase().includes("bridge");
                                        return (
                                            <div
                                                key={idx}
                                                className={`epic-lyrics-badge ${isChorus ? "chorus" : isBridge ? "bridge" : ""}`}
                                            >
                                                {tag}
                                            </div>
                                        );
                                    }
                                    if (!trimmed) {
                                        return <div key={idx} style={{ height: 10 }} />;
                                    }
                                    return (
                                        <p key={idx} className="epic-lyrics-line">
                                            {line}
                                        </p>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick 52-Song Playlist Modal / Drawer */}
            {showPlaylistModal && (
                <div className="epic-soundbar-playlist-modal-overlay" onClick={() => setShowPlaylistModal(false)}>
                    <div className="epic-soundbar-playlist-card" onClick={(e) => e.stopPropagation()}>
                        <div className="epic-soundbar-playlist-header">
                            <div className="epic-soundbar-playlist-header-left">
                                <ListMusic size={22} color="#38bdf8" />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#f8fafc" }}>
                                        Christian Praise & Worship Songs
                                    </h3>
                                    <small style={{ color: "#94a3b8" }}>
                                        {allSongs?.length || 52} Master Recordings • Pure Worship (Tagalog & English)
                                    </small>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="epic-lyrics-close-btn"
                                onClick={() => setShowPlaylistModal(false)}
                                title="Close Playlist"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search & Mood Filter Bar */}
                        <div className="epic-soundbar-playlist-filter-bar">
                            <div className="epic-soundbar-playlist-search-box">
                                <Search size={14} color="#64748b" />
                                <input
                                    type="text"
                                    placeholder="Search 52 songs by title, artist, or scripture..."
                                    value={playlistSearch}
                                    onChange={(e) => setPlaylistSearch(e.target.value)}
                                    className="epic-soundbar-playlist-search-input"
                                />
                                {playlistSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setPlaylistSearch("")}
                                        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            <div className="epic-soundbar-playlist-tabs">
                                <button
                                    type="button"
                                    className={`epic-playlist-tab-btn ${playlistMood === "ALL" ? "active" : ""}`}
                                    onClick={() => setPlaylistMood("ALL")}
                                >
                                    ✨ All ({allSongs?.length || 52})
                                </button>
                                <button
                                    type="button"
                                    className={`epic-playlist-tab-btn ${playlistMood === "TAGALOG" ? "active" : ""}`}
                                    onClick={() => setPlaylistMood("TAGALOG")}
                                >
                                    🇵🇭 Tagalog ({(allSongs || []).filter((s) => s.language === "Tagalog").length})
                                </button>
                                <button
                                    type="button"
                                    className={`epic-playlist-tab-btn ${playlistMood === "ENGLISH" ? "active" : ""}`}
                                    onClick={() => setPlaylistMood("ENGLISH")}
                                >
                                    🌐 English ({(allSongs || []).filter((s) => s.language === "English").length})
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Song List */}
                        <div className="epic-soundbar-playlist-list">
                            {quickPlaylistSongs.map((song, idx) => {
                                const isThis = currentSong?.id === song.id;
                                const isThisPlaying = isThis && isPlaying;
                                return (
                                    <div
                                        key={song.id}
                                        className={`epic-playlist-row ${isThis ? "active" : ""}`}
                                        onClick={() => playSong(song)}
                                    >
                                        <div className="epic-playlist-row-left">
                                            <span className="epic-playlist-num">
                                                {isThisPlaying ? "🔊" : idx + 1}
                                            </span>
                                            <div className="epic-playlist-thumb">
                                                <img src={song.albumCover} alt={song.title} />
                                                {isThisPlaying && <div className="epic-thumb-glow" />}
                                            </div>
                                            <div className="epic-playlist-meta">
                                                <div className="epic-playlist-title-row">
                                                    <strong className="epic-playlist-title">{song.title}</strong>
                                                    <span className={`epic-playlist-lang-tag ${song.language.toLowerCase()}`}>
                                                        {song.language === "Tagalog" ? "🇵🇭 Tagalog" : "🌐 English"}
                                                    </span>
                                                </div>
                                                <span className="epic-playlist-artist">{song.artist}</span>
                                                <small className="epic-playlist-theme">{song.scriptureTheme}</small>
                                            </div>
                                        </div>

                                        <div className="epic-playlist-row-right">
                                            <span className="epic-playlist-duration">{song.duration}</span>
                                            <button
                                                type="button"
                                                className="epic-playlist-lyrics-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openLyrics(song);
                                                }}
                                                title="View Lyrics"
                                            >
                                                <FileText size={12} /> Lyrics
                                            </button>
                                            <button
                                                type="button"
                                                className={`epic-playlist-play-btn ${isThisPlaying ? "playing" : ""}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isThis) {
                                                        togglePlay();
                                                    } else {
                                                        playSong(song);
                                                    }
                                                }}
                                            >
                                                {isThisPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 1 }} />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Upload Worship Song Modal */}
            <UploadWorshipSongModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
            />
        </>
    );
};
