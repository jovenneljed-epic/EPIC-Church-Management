import React, { useState, useRef } from "react";
import {
    Music,
    Upload,
    FileAudio,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Eye,
    Edit3,
    Image,
    BookOpen,
    KeyRound,
    X,
    Radio
} from "lucide-react";
import { useWorshipAudio } from "../context/WorshipAudioContext";
import { type WorshipSong } from "../services/worshipService";
import "./UploadWorshipSongModal.css";

const YoutubeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 15, color = "#ef4444" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill={color} />
    </svg>
);

interface UploadWorshipSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSongUploaded?: (song: WorshipSong) => void;
}

type AudioSourceType = "youtube" | "file" | "url";

const QUICK_KEYS = ["C", "D", "E", "F", "G", "A", "B", "Em", "Am", "Dm"];

const ENGLISH_TEMPLATE = `[Verse 1]
Sing praise to the Lord, all the earth
Proclaim His salvation day after day
Declare His glory among the nations
His marvelous deeds among all peoples

[Pre-Chorus]
For great is the Lord and most worthy of praise
He is to be feared above all gods

[Chorus]
Holy, Holy is the Lord Almighty
The whole earth is full of His glory
Hallelujah, we worship Your Name!
King of kings, forever You reign

[Verse 2]
Splendor and majesty are before Him
Strength and glory are in His sanctuary
Give to the Lord all praise and honor
Bow down and worship in the beauty of holiness

[Chorus]
Holy, Holy is the Lord Almighty
The whole earth is full of His glory
Hallelujah, we worship Your Name!
King of kings, forever You reign

[Bridge]
Ascribe to the Lord the glory due His Name
Bring an offering and come into His courts
Worship the Lord in the splendor of His holiness
Tremble before Him, all the earth

[Chorus]
Holy, Holy is the Lord Almighty
The whole earth is full of His glory
Hallelujah, we worship Your Name!
King of kings, forever You reign

[Outro]
We bow down and praise Your holy Name
Amen and Amen`;

const TAGALOG_TEMPLATE = `[Verse 1]
O Diyos, Ikaw ang tunay na dakila sa mundo
Ikaw ang Haring nagmahal ng tulad ko
Ginawa Mo'ng lahat, niligtas ang buhay ko
Pag-ibig Mo ay tapat at wagas kailanman

[Pre-Chorus]
Walang papantay sa kabutihan Mo
Ang Ngalan Mo'y itataas sa buhay ko

[Chorus]
Sa lahat ng panahon, Diyos Ka sa amin
Sa lahat ng oras, nariyan para sa amin
Panginoong Hesus, purihin Ka!
Dakilain Ka sa aming pagsamba
Aming sandigan, tapat Ka kailanman

[Verse 2]
O Diyos, walang hanggan ang Iyong kapangyarihan
Bawat tuhod ay luluhod sa Iyong harapan
Sundin ang kalooban Mo sa buhay ko
Iparinig ang nais Mo, O Panginoon

[Chorus]
Sa lahat ng panahon, Diyos Ka sa amin
Sa lahat ng oras, nariyan para sa amin
Panginoong Hesus, purihin Ka!
Dakilain Ka sa aming pagsamba
Aming sandigan, tapat Ka kailanman

[Bridge]
Di nagbabago, Diyos Ka sa amin
Tanging sandigan, nariyan para sa amin
Panginoong Hesus, maghari Ka
Magliwanag Ka sa buong mundo

[Chorus]
Sa lahat ng panahon, Diyos Ka sa amin
Sa lahat ng oras, nariyan para sa amin
Panginoong Hesus, purihin Ka!
Dakilain Ka sa aming pagsamba
Aming sandigan, tapat Ka kailanman

[Outro]
Purihin ang Panginoon magpakailanman
Salamat, salamat O Diyos!
Amen`;

export const UploadWorshipSongModal: React.FC<UploadWorshipSongModalProps> = ({
    isOpen,
    onClose,
    onSongUploaded
}) => {
    const { addNewSong } = useWorshipAudio();

    // Source Type
    const [sourceType, setSourceType] = useState<AudioSourceType>("youtube");

    // Form fields
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [language, setLanguage] = useState<"Tagalog" | "English">("Tagalog");
    const [chordsKey, setChordsKey] = useState("G");
    const [duration, setDuration] = useState("5:00");
    const [scriptureTheme, setScriptureTheme] = useState("");

    // YouTube source
    const [youtubeInput, setYoutubeInput] = useState("");

    // Audio file / URL source
    const [audioFileName, setAudioFileName] = useState("");
    const [audioFileDataUrl, setAudioFileDataUrl] = useState("");
    const [directAudioUrl, setDirectAudioUrl] = useState("");

    // Artwork
    const [customCoverUrl, setCustomCoverUrl] = useState("");

    // Lyrics
    const [fullLyrics, setFullLyrics] = useState("");
    const [lyricsTab, setLyricsTab] = useState<"edit" | "preview">("edit");

    // Validation & Status
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const lyricsTextareaRef = useRef<HTMLTextAreaElement>(null);

    if (!isOpen) return null;

    // Helper: Extract YouTube ID
    const extractYoutubeId = (input: string): string => {
        const val = input.trim();
        if (!val) return "";
        if (val.includes("v=")) {
            return val.split("v=")[1].split("&")[0];
        }
        if (val.includes("youtu.be/")) {
            return val.split("youtu.be/")[1].split("?")[0];
        }
        if (val.includes("/embed/")) {
            return val.split("/embed/")[1].split("?")[0];
        }
        if (val.length === 11 && !val.includes("/")) {
            return val;
        }
        return val;
    };

    const currentYoutubeId = extractYoutubeId(youtubeInput);
    const computedCoverUrl =
        customCoverUrl.trim() ||
        (currentYoutubeId
            ? `https://img.youtube.com/vi/${currentYoutubeId}/hqdefault.jpg`
            : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80");

    // Handle Local Audio File Selection
    const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAudioFileName(file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setAudioFileDataUrl(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    // Quick Insert Section Tag into Lyrics Textarea
    const handleInsertSection = (tag: string) => {
        const textarea = lyricsTextareaRef.current;
        if (!textarea) {
            setFullLyrics((prev) => (prev ? `${prev}\n\n[${tag}]\n` : `[${tag}]\n`));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const textBefore = fullLyrics.substring(0, start);
        const textAfter = fullLyrics.substring(end);

        const snippet = `\n\n[${tag}]\n`;
        const nextText = textBefore + snippet + textAfter;
        setFullLyrics(nextText);

        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = start + snippet.length;
            textarea.selectionEnd = start + snippet.length;
        }, 10);
    };

    // Load Praise & Worship Lyrics Template
    const handleLoadTemplate = () => {
        if (
            fullLyrics.trim() &&
            !window.confirm("Replace current lyrics with structured worship template?")
        ) {
            return;
        }
        if (language === "Tagalog") {
            setFullLyrics(TAGALOG_TEMPLATE);
        } else {
            setFullLyrics(ENGLISH_TEMPLATE);
        }
    };

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!title.trim()) {
            setErrorMsg("Please enter the song title.");
            return;
        }
        if (!artist.trim()) {
            setErrorMsg("Please enter the artist or worship team name.");
            return;
        }

        // Validate audio source
        let finalYoutubeId = "";
        let finalAudioUrl = "";

        if (sourceType === "youtube") {
            finalYoutubeId = extractYoutubeId(youtubeInput);
            if (!finalYoutubeId) {
                setErrorMsg("Please enter a valid Christian worship YouTube URL or video ID.");
                return;
            }
        } else if (sourceType === "file") {
            if (!audioFileDataUrl) {
                setErrorMsg("Please select an audio file (.mp3, .wav, .m4a) to upload.");
                return;
            }
            finalAudioUrl = audioFileDataUrl;
        } else if (sourceType === "url") {
            if (!directAudioUrl.trim()) {
                setErrorMsg("Please provide a direct audio stream URL.");
                return;
            }
            finalAudioUrl = directAudioUrl.trim();
        }

        // Validate proper lyrics
        if (!fullLyrics.trim()) {
            setErrorMsg("Please enter proper word-for-word lyrics for this worship song.");
            return;
        }
        if (fullLyrics.trim().length < 40) {
            setErrorMsg("Lyrics appear too short. Please provide full proper lyrics with verses and chorus.");
            return;
        }

        setIsSubmitting(true);

        try {
            const created = addNewSong({
                title: title.trim(),
                artist: artist.trim(),
                language,
                albumCover: computedCoverUrl,
                duration: duration.trim() || "5:00",
                youtubeUrlOrId: finalYoutubeId || undefined,
                audioUrl: finalAudioUrl || undefined,
                scriptureTheme:
                    scriptureTheme.trim() ||
                    (language === "Tagalog"
                        ? "Awit 100:1-2 — 'Magkaingay kayo na may kagalakan sa Panginoon, kayong lahat na lupain.'"
                        : "Psalm 100:1-2 — 'Shout for joy to the Lord, all the earth. Worship the Lord with gladness.'"),
                fullLyrics: fullLyrics.trim(),
                chordsKey
            });

            if (onSongUploaded) {
                onSongUploaded(created);
            }

            onClose();
        } catch (err: any) {
            setErrorMsg(err?.message || "Failed to upload song. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate section badges found in lyrics
    const sectionsCount = (fullLyrics.match(/\[(.*?)\]/g) || []).length;

    return (
        <div className="comm-modal-overlay" onClick={onClose}>
            <div
                className="comm-modal-card upload-worship-card"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="comm-modal-header upload-worship-header">
                    <div className="upload-header-left">
                        <div className="upload-header-icon-badge">
                            <Music size={22} color="#38bdf8" />
                        </div>
                        <div>
                            <div className="upload-header-title-row">
                                <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#f8fafc" }}>
                                    Upload Worship Song
                                </h2>
                                <span className="upload-admin-pill">
                                    <KeyRound size={12} /> 👑 Admin Verified
                                </span>
                            </div>
                            <p className="upload-header-sub">
                                Add authentic Christian praise &amp; worship tracks with proper lyrics to the Sanctuary Playlist
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="comm-modal-close-btn"
                        onClick={onClose}
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {errorMsg && (
                    <div className="upload-worship-error-banner">
                        <AlertCircle size={17} color="#f87171" style={{ flexShrink: 0 }} />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="upload-worship-form">
                    <div className="upload-worship-grid">
                        {/* LEFT COLUMN: Audio Source & Metadata */}
                        <div className="upload-col-left">
                            {/* Audio Source Tabs */}
                            <div className="upload-source-section">
                                <label className="upload-field-label">
                                    <Radio size={14} color="#38bdf8" /> Audio Playback Source *
                                </label>
                                <div className="upload-source-tabs">
                                    <button
                                        type="button"
                                        className={`upload-source-tab ${sourceType === "youtube" ? "active" : ""}`}
                                        onClick={() => setSourceType("youtube")}
                                    >
                                        <YoutubeIcon size={15} color="#ef4444" />
                                        <span>YouTube Master</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`upload-source-tab ${sourceType === "file" ? "active" : ""}`}
                                        onClick={() => setSourceType("file")}
                                    >
                                        <Upload size={15} color="#10b981" />
                                        <span>Audio File</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`upload-source-tab ${sourceType === "url" ? "active" : ""}`}
                                        onClick={() => setSourceType("url")}
                                    >
                                        <FileAudio size={15} color="#a855f7" />
                                        <span>Stream URL</span>
                                    </button>
                                </div>

                                {/* Tab Content 1: YouTube */}
                                {sourceType === "youtube" && (
                                    <div className="upload-source-input-box">
                                        <input
                                            type="text"
                                            placeholder="Paste Christian YouTube URL (e.g. https://youtu.be/BMZmyvr5IAM)"
                                            value={youtubeInput}
                                            onChange={(e) => setYoutubeInput(e.target.value)}
                                            className="upload-text-input"
                                            required={sourceType === "youtube"}
                                        />
                                        <small className="upload-field-hint">
                                            {currentYoutubeId ? (
                                                <span style={{ color: "#34d399" }}>
                                                    ✓ YouTube Master ID: <strong>{currentYoutubeId}</strong>
                                                </span>
                                            ) : (
                                                "Accepts official YouTube video URLs, shorts, or video IDs."
                                            )}
                                        </small>
                                    </div>
                                )}

                                {/* Tab Content 2: Audio File Upload */}
                                {sourceType === "file" && (
                                    <div className="upload-source-input-box">
                                        <label className="upload-file-dropzone">
                                            <input
                                                type="file"
                                                accept="audio/mp3,audio/wav,audio/m4a,audio/ogg,audio/*"
                                                onChange={handleAudioFileChange}
                                                style={{ display: "none" }}
                                            />
                                            <Upload size={22} color="#10b981" />
                                            <span>
                                                {audioFileName
                                                    ? `Selected: ${audioFileName}`
                                                    : "Click to choose .mp3 / .wav / .m4a audio file"}
                                            </span>
                                            <small style={{ color: "#64748b" }}>
                                                Plays directly in browser with continuous sound bar integration
                                            </small>
                                        </label>
                                    </div>
                                )}

                                {/* Tab Content 3: Stream URL */}
                                {sourceType === "url" && (
                                    <div className="upload-source-input-box">
                                        <input
                                            type="url"
                                            placeholder="https://example.com/audio/worship_song.mp3"
                                            value={directAudioUrl}
                                            onChange={(e) => setDirectAudioUrl(e.target.value)}
                                            className="upload-text-input"
                                            required={sourceType === "url"}
                                        />
                                        <small className="upload-field-hint">
                                            Direct HTTPS audio link (.mp3, .aac, .m4a).
                                        </small>
                                    </div>
                                )}
                            </div>

                            {/* Basic Song Metadata */}
                            <div className="upload-fields-row">
                                <div className="upload-field-group">
                                    <label className="upload-field-label">Song Title *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Goodness of God"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="upload-text-input"
                                        required
                                    />
                                </div>
                                <div className="upload-field-group">
                                    <label className="upload-field-label">Artist / Worship Team *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Bethel Music / Jenn Johnson"
                                        value={artist}
                                        onChange={(e) => setArtist(e.target.value)}
                                        className="upload-text-input"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Language & Key Row */}
                            <div className="upload-fields-row">
                                <div className="upload-field-group">
                                    <label className="upload-field-label">Language *</label>
                                    <div className="upload-lang-toggle">
                                        <button
                                            type="button"
                                            className={`lang-btn ${language === "Tagalog" ? "active" : ""}`}
                                            onClick={() => setLanguage("Tagalog")}
                                        >
                                            🇵🇭 Tagalog
                                        </button>
                                        <button
                                            type="button"
                                            className={`lang-btn ${language === "English" ? "active" : ""}`}
                                            onClick={() => setLanguage("English")}
                                        >
                                            🌐 English
                                        </button>
                                    </div>
                                </div>

                                <div className="upload-field-group">
                                    <label className="upload-field-label">Musical Key (Chords)</label>
                                    <div className="upload-key-selector">
                                        {QUICK_KEYS.map((k) => (
                                            <button
                                                key={k}
                                                type="button"
                                                className={`key-chip ${chordsKey === k ? "active" : ""}`}
                                                onClick={() => setChordsKey(k)}
                                            >
                                                {k}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Scripture Reference & Duration */}
                            <div className="upload-fields-row">
                                <div className="upload-field-group" style={{ flex: 2 }}>
                                    <label className="upload-field-label">
                                        <BookOpen size={13} color="#38bdf8" /> Scripture Reference &amp; Theme
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Psalm 23:6 — 'Your goodness and love will follow me...'"
                                        value={scriptureTheme}
                                        onChange={(e) => setScriptureTheme(e.target.value)}
                                        className="upload-text-input"
                                    />
                                </div>
                                <div className="upload-field-group" style={{ flex: 1 }}>
                                    <label className="upload-field-label">Duration</label>
                                    <input
                                        type="text"
                                        placeholder="5:12"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="upload-text-input"
                                    />
                                </div>
                            </div>

                            {/* Album Artwork Preview */}
                            <div className="upload-field-group">
                                <label className="upload-field-label">
                                    <Image size={13} color="#38bdf8" /> Album Cover Artwork
                                </label>
                                <div className="upload-cover-preview-wrap">
                                    <img
                                        src={computedCoverUrl}
                                        alt="Cover Preview"
                                        className="upload-cover-preview-img"
                                    />
                                    <div className="upload-cover-inputs">
                                        <input
                                            type="url"
                                            placeholder="Custom Image URL (optional)"
                                            value={customCoverUrl}
                                            onChange={(e) => setCustomCoverUrl(e.target.value)}
                                            className="upload-text-input"
                                        />
                                        <small className="upload-field-hint">
                                            {sourceType === "youtube" && currentYoutubeId
                                                ? "✓ Automatically loaded high-definition YouTube master artwork"
                                                : "Leave blank to use default Christian worship artwork"}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Proper Lyrics Editor & Live Sing-Along Preview */}
                        <div className="upload-col-right">
                            <div className="upload-lyrics-header-row">
                                <div>
                                    <label className="upload-field-label" style={{ marginBottom: 2 }}>
                                        <Sparkles size={14} color="#f59e0b" /> Proper Structured Lyrics *
                                    </label>
                                    <small className="upload-field-hint">
                                        Include section tags (e.g. [Verse 1], [Chorus]) for authentic sing-along
                                    </small>
                                </div>

                                <div className="upload-lyrics-tab-toggle">
                                    <button
                                        type="button"
                                        className={`tab-btn ${lyricsTab === "edit" ? "active" : ""}`}
                                        onClick={() => setLyricsTab("edit")}
                                    >
                                        <Edit3 size={13} /> Edit
                                    </button>
                                    <button
                                        type="button"
                                        className={`tab-btn ${lyricsTab === "preview" ? "active" : ""}`}
                                        onClick={() => setLyricsTab("preview")}
                                    >
                                        <Eye size={13} /> Preview ({sectionsCount} sections)
                                    </button>
                                </div>
                            </div>

                            {/* Section Inserter Toolbar */}
                            <div className="upload-section-toolbar">
                                <span className="toolbar-label">Insert Section:</span>
                                <button
                                    type="button"
                                    className="section-insert-btn"
                                    onClick={() => handleInsertSection("Verse 1")}
                                >
                                    + Verse 1
                                </button>
                                <button
                                    type="button"
                                    className="section-insert-btn"
                                    onClick={() => handleInsertSection("Verse 2")}
                                >
                                    + Verse 2
                                </button>
                                <button
                                    type="button"
                                    className="section-insert-btn"
                                    onClick={() => handleInsertSection("Pre-Chorus")}
                                >
                                    + Pre-Chorus
                                </button>
                                <button
                                    type="button"
                                    className="section-insert-btn chorus"
                                    onClick={() => handleInsertSection("Chorus")}
                                >
                                    + Chorus
                                </button>
                                <button
                                    type="button"
                                    className="section-insert-btn bridge"
                                    onClick={() => handleInsertSection("Bridge")}
                                >
                                    + Bridge
                                </button>
                                <button
                                    type="button"
                                    className="section-insert-btn"
                                    onClick={() => handleInsertSection("Outro")}
                                >
                                    + Outro
                                </button>
                                <button
                                    type="button"
                                    className="section-insert-btn template"
                                    onClick={handleLoadTemplate}
                                    title={`Load complete standard ${language} worship structure`}
                                >
                                    ✨ Load {language} Template
                                </button>
                            </div>

                            {/* Lyrics Editor / Preview Body */}
                            {lyricsTab === "edit" ? (
                                <div className="upload-lyrics-textarea-wrap">
                                    <textarea
                                        ref={lyricsTextareaRef}
                                        value={fullLyrics}
                                        onChange={(e) => setFullLyrics(e.target.value)}
                                        placeholder={`[Verse 1]\nWrite verse 1 lyrics here...\n\n[Chorus]\nWrite uplifting chorus lyrics here...\n\n[Bridge]\nWrite powerful bridge lyrics here...`}
                                        rows={18}
                                        className="upload-lyrics-textarea"
                                        required
                                    />
                                    <div className="upload-lyrics-stats">
                                        <span>
                                            {sectionsCount > 0 ? (
                                                <span style={{ color: "#34d399" }}>
                                                    ✓ {sectionsCount} structured sections detected
                                                </span>
                                            ) : (
                                                <span style={{ color: "#fbbf24" }}>
                                                    💡 Tip: Add [Verse 1] and [Chorus] for proper sing-along formatting
                                                </span>
                                            )}
                                        </span>
                                        <span>{fullLyrics.length} characters</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="upload-lyrics-preview-wrap">
                                    <div className="upload-preview-header">
                                        <strong>{title || "Song Title"}</strong>
                                        <span>{artist || "Worship Team"} • Key of {chordsKey}</span>
                                    </div>
                                    <div className="upload-preview-body">
                                        {fullLyrics.trim() ? (
                                            fullLyrics.split("\n").map((line, idx) => {
                                                const trimmed = line.trim();
                                                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                                                    const tag = trimmed.slice(1, -1);
                                                    const isChorus = tag.toLowerCase().includes("chorus");
                                                    const isBridge = tag.toLowerCase().includes("bridge");
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`preview-tag ${isChorus ? "chorus" : isBridge ? "bridge" : ""}`}
                                                        >
                                                            {tag}
                                                        </div>
                                                    );
                                                }
                                                if (!trimmed) {
                                                    return <div key={idx} style={{ height: 10 }} />;
                                                }
                                                return (
                                                    <p key={idx} className="preview-line">
                                                        {line}
                                                    </p>
                                                );
                                            })
                                        ) : (
                                            <div className="preview-empty">
                                                No lyrics entered yet. Switch to "Edit" tab or click "Load Template".
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="comm-modal-footer upload-worship-footer">
                        <div className="upload-footer-notice">
                            <CheckCircle2 size={15} color="#34d399" />
                            <span>
                                Songs will immediately be published to the church playlist and synced in the background sound bar.
                            </span>
                        </div>
                        <div className="upload-footer-btns">
                            <button
                                type="button"
                                className="comm-btn-cancel"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="comm-btn-submit upload-submit-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    "Publishing to Sanctuary..."
                                ) : (
                                    <>
                                        <Sparkles size={16} /> Publish Worship Song with Lyrics
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
