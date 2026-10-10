import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import "./EpicSmileScanner.css";
import { API_BASE_URL } from "./config";
import {
    playSuccessChime,
    playAlreadyRecordedChime,
    playRetryTone,
    speakGreeting
} from "./utils/EpicAudioChimes";
import {
    detectFaceAndSmile,
    extractFaceDescriptor,
    matchFaceDescriptor,
    enrollFromImageUrl
} from "./utils/EpicFaceBiometrics";
import type {
    EnrolledFaceProfile,
    FaceDetectionResult
} from "./utils/EpicFaceBiometrics";
import {
    Camera,
    Maximize,
    Minimize,
    Volume2,
    VolumeX,
    MessageSquare,
    UserCheck,
    Search,
    CheckCircle2,
    Clock,
    X,
    Users,
    Sparkles,
    Settings,
    Smile,
    RefreshCw
} from "lucide-react";

interface Service {
    churchServiceId: number;
    serviceName: string;
    serviceDate: string;
    startTime: string;
    endTime: string;
    status: string;
}

interface MemberRow {
    memberId: number;
    memberCode: string;
    fullName: string;
    ministry: string;
    photoPath?: string;
    status: string;
    recordedDate: string | null;
    recordedBy?: string;
}

interface ScannedRecord {
    id: string;
    memberId: number;
    fullName: string;
    memberCode: string;
    ministry: string;
    photoPath?: string;
    status: string;
    time: string;
    alreadyRecorded: boolean;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = ["token", "accessToken", "jwt", "authToken", "epicToken"]
        .map(key => localStorage.getItem(key))
        .find(Boolean);
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token.replace(/^Bearer\s+/i, "").trim()}`);
    if (options.body) headers.set("Content-Type", "application/json");
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : {}; } catch { body = {}; }
    if (!response.ok) {
        throw new Error(body.message || `Request failed (${response.status})`);
    }
    return body as T;
}

function getTodayLocalDate(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function EpicSmileScanner() {
    // ---------------------------------------------------------
    // SERVICES & ATTENDANCE DATA
    // ---------------------------------------------------------
    const [services, setServices] = useState<Service[]>([]);
    const [serviceId, setServiceId] = useState<string>("");
    const [showAllServices, setShowAllServices] = useState<boolean>(false);
    const [membersRoster, setMembersRoster] = useState<MemberRow[]>([]);
    const [scannedRecords, setScannedRecords] = useState<ScannedRecord[]>([]);
    const [enrolledProfiles, setEnrolledProfiles] = useState<EnrolledFaceProfile[]>([]);

    // ---------------------------------------------------------
    // CAMERA & STREAM
    // ---------------------------------------------------------
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
    const [cameraActive, setCameraActive] = useState<boolean>(false);
    const [cameraError, setCameraError] = useState<string>("");

    // ---------------------------------------------------------
    // REAL-TIME BIOMETRIC STATE
    // ---------------------------------------------------------
    const [detectionResult, setDetectionResult] = useState<FaceDetectionResult | null>(null);
    const [smileScore, setSmileScore] = useState<number>(0);
    const [statusPrompt, setStatusPrompt] = useState<string>("Stand in front of the camera and smile 😊");

    // ---------------------------------------------------------
    // CONFIRMATION OVERLAY STATE
    // ---------------------------------------------------------
    const [confirmedRecord, setConfirmedRecord] = useState<ScannedRecord | null>(null);
    const recentScanCooldownRef = useRef<Map<number, number>>(new Map()); // memberId -> timestamp

    // ---------------------------------------------------------
    // KIOSK SETTINGS
    // ---------------------------------------------------------
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [voiceGreetingEnabled, setVoiceGreetingEnabled] = useState<boolean>(true);
    const [mirrored, setMirrored] = useState<boolean>(true);
    const [smileThreshold, setSmileThreshold] = useState<number>(0.55); // 55% smile
    const [sensitivityThreshold, setSensitivityThreshold] = useState<number>(68); // 68% confidence

    // ---------------------------------------------------------
    // MODALS
    // ---------------------------------------------------------
    const [showEnrollModal, setShowEnrollModal] = useState<boolean>(false);
    const [showManualSearch, setShowManualSearch] = useState<boolean>(false);
    const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
    const [enrollSearch, setEnrollSearch] = useState<string>("");
    const [manualSearch, setManualSearch] = useState<string>("");
    const [autoEnrolling, setAutoEnrolling] = useState<boolean>(false);
    const [enrollMessage, setEnrollMessage] = useState<string>("");

    // ---------------------------------------------------------
    // LIVE MEMBER FACE ENROLLMENT STUDIO STATE
    // ---------------------------------------------------------
    const [activeEnrollMember, setActiveEnrollMember] = useState<MemberRow | null>(null);
    const [studioCapturedSnapshot, setStudioCapturedSnapshot] = useState<string | null>(null);
    const [studioDescriptor, setStudioDescriptor] = useState<number[] | null>(null);
    const [studioSmileScore, setStudioSmileScore] = useState<number>(0);
    const [studioCountdown, setStudioCountdown] = useState<number | null>(null);
    const [studioShutterFlash, setStudioShutterFlash] = useState<boolean>(false);
    const studioVideoRef = useRef<HTMLVideoElement | null>(null);
    const studioCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Clock
    const [currentTime, setCurrentTime] = useState<string>("");
    const [currentDate, setCurrentDate] = useState<string>("");

    // Processing animation lock
    const isProcessingScanRef = useRef<boolean>(false);

    // ---------------------------------------------------------
    // CLOCK TICK
    // ---------------------------------------------------------
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
            setCurrentDate(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }));
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    // Today's local date (YYYY-MM-DD) avoiding UTC timezone shift
    const todayLocalDate = useMemo(() => getTodayLocalDate(), []);

    const todayServices = useMemo(() => {
        return services.filter(s => s.serviceDate?.slice(0, 10) === todayLocalDate && s.status !== "CANCELLED");
    }, [services, todayLocalDate]);

    // ---------------------------------------------------------
    // LOAD SERVICES
    // ---------------------------------------------------------
    useEffect(() => {
        let mounted = true;
        void apiRequest<Service[] | { services: Service[] }>("/ChurchServices")
            .then(data => {
                if (!mounted) return;
                const list = (Array.isArray(data) ? data : data.services || []).sort((a, b) => b.serviceDate.localeCompare(a.serviceDate));
                setServices(list);
                if (list.length > 0) {
                    const today = getTodayLocalDate();
                    const todayService = list.find(s => s.serviceDate?.slice(0, 10) === today && s.status !== "CANCELLED");
                    const pastService = list.find(s => s.serviceDate?.slice(0, 10) <= today && s.status !== "CANCELLED");
                    const def = todayService || pastService || list[0];
                    if (def) setServiceId(String(def.churchServiceId));
                }
            })
            .catch(() => {});
        return () => { mounted = false; };
    }, []);

    // ---------------------------------------------------------
    // LOAD ROSTER & ATTENDANCE
    // ---------------------------------------------------------
    const loadRoster = useCallback(async () => {
        if (!serviceId) return;
        try {
            const data = await apiRequest<{ attendance: MemberRow[] }>(`/Attendance/church-service/${serviceId}/automatic`);
            if (data?.attendance) {
                setMembersRoster(data.attendance);
                // Populate already scanned feed for today
                const recorded = data.attendance
                    .filter(m => ["PRESENT", "EARLY", "LATE"].includes(m.status))
                    .map(m => ({
                        id: `hist-${m.memberId}-${m.recordedDate || Date.now()}`,
                        memberId: m.memberId,
                        fullName: m.fullName,
                        memberCode: m.memberCode,
                        ministry: m.ministry || "Member",
                        photoPath: m.photoPath,
                        status: m.status,
                        time: m.recordedDate ? new Date(m.recordedDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "Recorded",
                        alreadyRecorded: true
                    }));
                setScannedRecords(recorded);
            }
        } catch {
            // Silently handle
        }
    }, [serviceId]);

    useEffect(() => {
        void loadRoster();
        const poll = setInterval(loadRoster, 15000);
        return () => clearInterval(poll);
    }, [loadRoster]);

    // ---------------------------------------------------------
    // LOAD ENROLLED BIOMETRIC PROFILES
    // ---------------------------------------------------------
    const loadBiometrics = useCallback(async () => {
        try {
            const res = await apiRequest<{ profiles: Record<string, EnrolledFaceProfile> }>("/Attendance/face-biometrics");
            if (res?.profiles) {
                const list = Object.values(res.profiles);
                setEnrolledProfiles(list);
                localStorage.setItem("epic_smile_profiles", JSON.stringify(list));
            }
        } catch {
            // Fallback to local storage
            const local = localStorage.getItem("epic_smile_profiles");
            if (local) {
                try {
                    setEnrolledProfiles(JSON.parse(local));
                } catch {
                    // Ignore
                }
            }
        }
    }, []);

    useEffect(() => {
        void loadBiometrics();
    }, [loadBiometrics]);

    // ---------------------------------------------------------
    // INITIALIZE WEBCAM & DEVICES
    // ---------------------------------------------------------
    useEffect(() => {
        // Enumerate video devices
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            void navigator.mediaDevices.enumerateDevices().then(devices => {
                const videoInputs = devices.filter(d => d.kind === "videoinput");
                setVideoDevices(videoInputs);
                if (videoInputs.length > 0 && !selectedDeviceId) {
                    setSelectedDeviceId(videoInputs[0].deviceId);
                }
            });
        }
    }, [selectedDeviceId]);

    useEffect(() => {
        let active = true;
        const startCamera = async () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            try {
                const constraints: MediaStreamConstraints = {
                    video: selectedDeviceId
                        ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
                        : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false
                };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (!active) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                setCameraActive(true);
                setCameraError("");
            } catch (err) {
                if (active) {
                    setCameraActive(false);
                    setCameraError("Camera access denied or webcam unavailable. Please allow camera permissions in your browser.");
                }
            }
        };

        void startCamera();

        return () => {
            active = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [selectedDeviceId]);

    // ---------------------------------------------------------
    // SUBMIT ATTENDANCE LOGIC
    // ---------------------------------------------------------
    const handleRecordAttendance = useCallback(async (
        member: { memberId: number; fullName: string; memberCode: string; ministry: string; photoPath?: string },
        confidenceScore = 95
    ) => {
        if (!serviceId || isProcessingScanRef.current) return;

        // Anti-spam debounce (8 seconds per member)
        const now = Date.now();
        const lastScan = recentScanCooldownRef.current.get(member.memberId) || 0;
        if (now - lastScan < 8000) {
            return;
        }
        recentScanCooldownRef.current.set(member.memberId, now);
        isProcessingScanRef.current = true;

        try {
            const result = await apiRequest<{
                success: boolean;
                alreadyRecorded: boolean;
                message: string;
                status: string;
                fullName: string;
                memberCode: string;
                ministry: string;
                photoPath: string;
                recordedDate: string;
            }>(`/Attendance/church-service/${serviceId}/face-scan`, {
                method: "POST",
                body: JSON.stringify({
                    memberId: member.memberId,
                    scanMode: "SMILE_SCANNER",
                    confidence: confidenceScore
                })
            });

            const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const record: ScannedRecord = {
                id: `scan-${member.memberId}-${now}`,
                memberId: member.memberId,
                fullName: result.fullName || member.fullName,
                memberCode: result.memberCode || member.memberCode,
                ministry: result.ministry || member.ministry || "Member",
                photoPath: result.photoPath || member.photoPath,
                status: result.status || "PRESENT",
                time: timeStr,
                alreadyRecorded: result.alreadyRecorded
            };

            // Play audio chimes & speech greeting
            if (soundEnabled) {
                if (result.alreadyRecorded) {
                    playAlreadyRecordedChime();
                } else {
                    playSuccessChime();
                }
            }
            if (voiceGreetingEnabled) {
                speakGreeting(record.fullName, record.status, result.alreadyRecorded);
            }

            // Display celebration overlay
            setConfirmedRecord(record);
            setScannedRecords(prev => [record, ...prev.filter(r => r.memberId !== member.memberId)]);

            // Update roster row locally
            setMembersRoster(prev => prev.map(m => m.memberId === member.memberId ? { ...m, status: record.status } : m));

            // Auto dismiss overlay after 3.5 seconds
            setTimeout(() => {
                setConfirmedRecord(null);
                isProcessingScanRef.current = false;
            }, 3500);

        } catch (err) {
            if (soundEnabled) playRetryTone();
            setStatusPrompt(err instanceof Error ? err.message : "Attendance record failed.");
            isProcessingScanRef.current = false;
        }
    }, [serviceId, soundEnabled, voiceGreetingEnabled]);

    // ---------------------------------------------------------
    // REAL-TIME BIOMETRIC SCANNING LOOP
    // ---------------------------------------------------------
    useEffect(() => {
        let animId: number;
        let lastFrameTime = 0;

        const loop = async (timestamp: number) => {
            // Process at ~15-20 fps to conserve CPU while remaining ultra-responsive
            if (timestamp - lastFrameTime > 55) {
                lastFrameTime = timestamp;

                if (videoRef.current && canvasRef.current && cameraActive && !isProcessingScanRef.current && !confirmedRecord) {
                    const video = videoRef.current;
                    const canvas = canvasRef.current;

                    const vw = video.videoWidth || 640;
                    const vh = video.videoHeight || 480;

                    const ovalGuide = {
                        x: vw * 0.25,
                        y: vh * 0.15,
                        width: vw * 0.5,
                        height: vh * 0.7
                    };

                    try {
                        const result = await detectFaceAndSmile(video, canvas, ovalGuide);
                        setDetectionResult(result);
                        setSmileScore(result.smileScore);

                        if (result.detected) {
                            if (result.inOvalGuide) {
                                if (result.smileScore >= smileThreshold) {
                                    setStatusPrompt("SMILE DETECTED! Processing biometric match... 😁");

                                    // Extract 128-dimensional biometric descriptor
                                    if (result.box) {
                                        const descriptor = extractFaceDescriptor(canvas, result.box);
                                        const match = matchFaceDescriptor(descriptor, enrolledProfiles, sensitivityThreshold);

                                        if (match.matched && match.profile) {
                                            void handleRecordAttendance(match.profile, match.confidence);
                                        } else {
                                            // Fallback: If not explicitly enrolled, match against roster by photo or prompt
                                            const member = membersRoster.find(m => m.memberId === match.profile?.memberId);
                                            if (member) {
                                                void handleRecordAttendance(member, match.confidence);
                                            } else {
                                                setStatusPrompt("Face recognized, but member not enrolled yet. Please enroll face!");
                                            }
                                        }
                                    }
                                } else {
                                    setStatusPrompt(result.message);
                                }
                            } else {
                                setStatusPrompt(result.message);
                            }
                        } else {
                            setStatusPrompt("Stand in front of the camera and smile 😊");
                        }
                    } catch {
                        // Silent error catch
                    }
                }
            }

            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [cameraActive, smileThreshold, sensitivityThreshold, enrolledProfiles, membersRoster, confirmedRecord, handleRecordAttendance]);

    // ---------------------------------------------------------
    // BATCH AUTO-ENROLL FROM MEMBER PHOTOS
    // ---------------------------------------------------------
    const handleAutoEnrollFromPhotos = async () => {
        setAutoEnrolling(true);
        setEnrollMessage("Scanning member profile photos for facial descriptors...");

        const membersWithPhotos = membersRoster.filter(m => m.photoPath && m.photoPath.trim().length > 0);
        if (membersWithPhotos.length === 0) {
            setEnrollMessage("No members currently have uploaded profile photos.");
            setAutoEnrolling(false);
            return;
        }

        const newProfiles: Record<string, EnrolledFaceProfile> = {};
        let successCount = 0;

        for (const member of membersWithPhotos) {
            try {
                const photoUrl = member.photoPath?.startsWith("http")
                    ? member.photoPath
                    : `${API_BASE_URL.replace("/api", "")}${member.photoPath?.startsWith("/") ? "" : "/"}${member.photoPath}`;

                const descriptor = await enrollFromImageUrl(photoUrl);
                if (descriptor) {
                    newProfiles[String(member.memberId)] = {
                        memberId: member.memberId,
                        memberCode: member.memberCode,
                        fullName: member.fullName,
                        ministry: member.ministry || "Member",
                        photoPath: member.photoPath,
                        descriptor,
                        enrolledAt: new Date().toISOString()
                    };
                    successCount++;
                }
            } catch {
                // Next member
            }
        }

        // Save to backend and local storage
        if (successCount > 0) {
            try {
                await apiRequest("/Attendance/face-biometrics", {
                    method: "POST",
                    body: JSON.stringify({ profiles: newProfiles })
                });
                const merged = [...enrolledProfiles.filter(p => !newProfiles[String(p.memberId)]), ...Object.values(newProfiles)];
                setEnrolledProfiles(merged);
                localStorage.setItem("epic_smile_profiles", JSON.stringify(merged));
                setEnrollMessage(`Successfully enrolled ${successCount} members from their profile photos!`);
            } catch {
                const merged = [...enrolledProfiles.filter(p => !newProfiles[String(p.memberId)]), ...Object.values(newProfiles)];
                setEnrolledProfiles(merged);
                localStorage.setItem("epic_smile_profiles", JSON.stringify(merged));
                setEnrollMessage(`Enrolled ${successCount} members locally!`);
            }
        } else {
            setEnrollMessage("Could not extract facial profiles from member photos. You can enroll members with the live camera below.");
        }

        setAutoEnrolling(false);
    };

    // ---------------------------------------------------------
    // FACE ENROLLMENT STUDIO: BIND STREAM & REAL-TIME DETECTION
    // ---------------------------------------------------------
    useEffect(() => {
        if (activeEnrollMember && studioVideoRef.current && streamRef.current) {
            studioVideoRef.current.srcObject = streamRef.current;
            void studioVideoRef.current.play().catch(() => {});
        }
    }, [activeEnrollMember]);

    useEffect(() => {
        if (!activeEnrollMember || studioCapturedSnapshot) return;

        let animId: number;
        let lastTime = 0;

        const studioLoop = async (time: number) => {
            if (time - lastTime > 60) {
                lastTime = time;
                if (studioVideoRef.current && studioCanvasRef.current) {
                    const v = studioVideoRef.current;
                    const c = studioCanvasRef.current;
                    const vw = v.videoWidth || 640;
                    const vh = v.videoHeight || 480;
                    const guide = {
                        x: vw * 0.25,
                        y: vh * 0.15,
                        width: vw * 0.5,
                        height: vh * 0.7
                    };
                    try {
                        const res = await detectFaceAndSmile(v, c, guide);
                        setStudioSmileScore(res.smileScore);
                    } catch {
                        // Ignore
                    }
                }
            }
            animId = requestAnimationFrame(studioLoop);
        };

        animId = requestAnimationFrame(studioLoop);
        return () => cancelAnimationFrame(animId);
    }, [activeEnrollMember, studioCapturedSnapshot]);

    const handleTakeStudioSnapshot = () => {
        if (!studioVideoRef.current || !studioCanvasRef.current || !activeEnrollMember) return;
        const video = studioVideoRef.current;
        const canvas = studioCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Flash effect
        setStudioShutterFlash(true);
        setTimeout(() => setStudioShutterFlash(false), 350);

        // Extract biometric descriptor
        const vw = canvas.width;
        const vh = canvas.height;
        const box = {
            x: vw * 0.25,
            y: vh * 0.15,
            width: vw * 0.5,
            height: vh * 0.7,
            centerX: vw / 2,
            centerY: vh / 2
        };

        const desc = extractFaceDescriptor(canvas, box);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

        setStudioDescriptor(desc);
        setStudioCapturedSnapshot(dataUrl);

        if (soundEnabled) playAlreadyRecordedChime();
    };

    const handleStartCountdown = () => {
        if (studioCountdown !== null) return;
        setStudioCountdown(3);
        setTimeout(() => {
            setStudioCountdown(2);
            setTimeout(() => {
                setStudioCountdown(1);
                setTimeout(() => {
                    setStudioCountdown(null);
                    handleTakeStudioSnapshot();
                }, 1000);
            }, 1000);
        }, 1000);
    };

    const handleSaveStudioEnrollment = async () => {
        if (!activeEnrollMember || !studioDescriptor) return;

        const newProfile: EnrolledFaceProfile = {
            memberId: activeEnrollMember.memberId,
            memberCode: activeEnrollMember.memberCode,
            fullName: activeEnrollMember.fullName,
            ministry: activeEnrollMember.ministry || "Member",
            photoPath: activeEnrollMember.photoPath || studioCapturedSnapshot || "",
            descriptor: studioDescriptor,
            enrolledAt: new Date().toISOString()
        };

        const updated = [...enrolledProfiles.filter(p => p.memberId !== activeEnrollMember.memberId), newProfile];
        setEnrolledProfiles(updated);
        localStorage.setItem("epic_smile_profiles", JSON.stringify(updated));

        // Sync to server
        const payload: Record<string, EnrolledFaceProfile> = {};
        updated.forEach(p => { payload[String(p.memberId)] = p; });
        void apiRequest("/Attendance/face-biometrics", {
            method: "POST",
            body: JSON.stringify({ profiles: payload })
        }).catch(() => {});

        if (soundEnabled) playSuccessChime();
        if (voiceGreetingEnabled) {
            speakGreeting(activeEnrollMember.fullName, "PRESENT");
        }

        setEnrollMessage(`Face biometrics enrolled with best smile for ${activeEnrollMember.fullName}!`);
        setActiveEnrollMember(null);
        setStudioCapturedSnapshot(null);
        setStudioDescriptor(null);
    };

    // ---------------------------------------------------------
    // FULLSCREEN TOGGLE
    // ---------------------------------------------------------
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            void document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            void document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    };

    // Filtered lists
    const filteredEnrollList = useMemo(() => {
        return membersRoster.filter(m =>
            m.fullName.toLowerCase().includes(enrollSearch.toLowerCase()) ||
            m.memberCode.toLowerCase().includes(enrollSearch.toLowerCase())
        );
    }, [membersRoster, enrollSearch]);

    const filteredManualList = useMemo(() => {
        return membersRoster.filter(m =>
            m.fullName.toLowerCase().includes(manualSearch.toLowerCase()) ||
            m.memberCode.toLowerCase().includes(manualSearch.toLowerCase())
        );
    }, [membersRoster, manualSearch]);

    const enrolledIds = useMemo(() => new Set(enrolledProfiles.map(p => p.memberId)), [enrolledProfiles]);

    // Stats
    const totalPresent = useMemo(() => membersRoster.filter(m => ["PRESENT", "EARLY", "LATE"].includes(m.status)).length, [membersRoster]);
    const totalEarly = useMemo(() => membersRoster.filter(m => m.status === "EARLY").length, [membersRoster]);
    const totalLate = useMemo(() => membersRoster.filter(m => m.status === "LATE").length, [membersRoster]);

    return (
        <div className={`smile-kiosk-page ${isFullscreen ? "fullscreen-mode" : ""}`}>
            {/* =========================================================
               TOP KIOSK CONTROL BAR
            ========================================================= */}
            <header className="smile-header">
                <div className="smile-brand">
                    <div className="smile-brand-icon">
                        😊
                    </div>
                    <div className="smile-brand-text">
                        <h1>
                            EPIC SMILE
                            <span className="smile-brand-tag">FACE KIOSK</span>
                        </h1>
                        <p>EPIC SMILE powered by <span className="kezjed-brand">KEZJED SOLUTIONS</span></p>
                    </div>
                </div>

                {/* Service Selector */}
                <div className="smile-service-selector">
                    <Clock size={16} color="#38bdf8" />
                    <select
                        value={serviceId}
                        onChange={e => {
                            if (e.target.value === "__VIEW_ALL__") {
                                setShowAllServices(true);
                            } else if (e.target.value === "__VIEW_TODAY__") {
                                setShowAllServices(false);
                                if (todayServices.length > 0) {
                                    setServiceId(String(todayServices[0].churchServiceId));
                                }
                            } else {
                                setServiceId(e.target.value);
                            }
                        }}
                        title={!showAllServices ? `Viewing today's schedule (${todayLocalDate})` : "Viewing all church schedules"}
                    >
                        {todayServices.length === 0 && !showAllServices && (
                            <option disabled value="">⚠️ No Service Scheduled Today ({todayLocalDate})</option>
                        )}

                        {!showAllServices && todayServices.length > 0 && (
                            <>
                                <optgroup label={`📅 Scheduled Today (${todayLocalDate})`}>
                                    {todayServices.map(s => (
                                        <option key={s.churchServiceId} value={s.churchServiceId}>
                                            {s.serviceName} ({s.startTime ? `${s.startTime}` : "Today"})
                                        </option>
                                    ))}
                                </optgroup>
                                {services.length > todayServices.length && (
                                    <option value="__VIEW_ALL__">🌐 View other dates ({services.length})...</option>
                                )}
                            </>
                        )}

                        {(showAllServices || todayServices.length === 0) && (
                            <>
                                {todayServices.length > 0 && (
                                    <optgroup label={`⭐ Scheduled Today (${todayLocalDate})`}>
                                        {todayServices.map(s => (
                                            <option key={s.churchServiceId} value={s.churchServiceId}>
                                                {s.serviceName} ({s.serviceDate.slice(0, 10)})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                <optgroup label={todayServices.length > 0 ? "Other Schedules" : "All Church Schedules"}>
                                    {services
                                        .filter(s => !todayServices.some(t => t.churchServiceId === s.churchServiceId))
                                        .map(s => (
                                            <option key={s.churchServiceId} value={s.churchServiceId}>
                                                {s.serviceName} ({s.serviceDate.slice(0, 10)})
                                            </option>
                                        ))}
                                </optgroup>
                                {todayServices.length > 0 && (
                                    <option value="__VIEW_TODAY__">↩ Back to Today Only</option>
                                )}
                            </>
                        )}
                    </select>

                    {todayServices.length > 0 && (
                        <button
                            type="button"
                            className={`smile-today-pill-btn ${!showAllServices ? "active" : ""}`}
                            onClick={() => {
                                setShowAllServices(prev => {
                                    const next = !prev;
                                    if (!next && todayServices.length > 0) {
                                        setServiceId(String(todayServices[0].churchServiceId));
                                    }
                                    return next;
                                });
                            }}
                            title={showAllServices ? "Switch back to Today's schedule only" : "View all church schedules"}
                        >
                            {!showAllServices ? `● Today (${todayServices.length})` : "All Dates"}
                        </button>
                    )}
                </div>

                {/* Live Digital Clock */}
                <div className="smile-clock-badge">
                    <span className="smile-clock-time">{currentTime || "--:--:--"}</span>
                    <span className="smile-clock-date">{currentDate}</span>
                </div>

                {/* Actions & Toolbar */}
                <div className="smile-header-actions">
                    <button
                        type="button"
                        className="smile-btn smile-btn-secondary"
                        onClick={() => setShowManualSearch(true)}
                        title="Manual Check-In Fallback"
                    >
                        <Search size={15} />
                        <span>Manual Check-in</span>
                    </button>

                    <button
                        type="button"
                        className="smile-btn smile-btn-primary"
                        onClick={() => setShowEnrollModal(true)}
                        title="Face Enrollment Center"
                    >
                        <UserCheck size={15} />
                        <span>Enroll Faces ({enrolledProfiles.length})</span>
                    </button>

                    <button
                        type="button"
                        className={`smile-btn-icon ${soundEnabled ? "active" : ""}`}
                        onClick={() => setSoundEnabled(v => !v)}
                        title={soundEnabled ? "Mute Chimes" : "Enable Chimes"}
                    >
                        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>

                    <button
                        type="button"
                        className={`smile-btn-icon ${voiceGreetingEnabled ? "active" : ""}`}
                        onClick={() => setVoiceGreetingEnabled(v => !v)}
                        title={voiceGreetingEnabled ? "Voice Greetings Enabled" : "Voice Greetings Muted"}
                    >
                        <MessageSquare size={18} />
                    </button>

                    <button
                        type="button"
                        className="smile-btn-icon"
                        onClick={() => setShowSettingsModal(true)}
                        title="Kiosk Settings"
                    >
                        <Settings size={18} />
                    </button>

                    <button
                        type="button"
                        className="smile-btn-icon"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Kiosk"}
                    >
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                </div>
            </header>

            {/* =========================================================
               MAIN SCANNER BODY
            ========================================================= */}
            <div className="smile-body">
                {/* CAMERA & SCANNER STAGE */}
                <div className="smile-viewport-container">
                    {/* Hidden Canvas for High-Speed Computer Vision Processing */}
                    <canvas ref={canvasRef} style={{ display: "none" }} />

                    {/* Live Webcam Stream */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`smile-video-element ${mirrored ? "mirrored" : ""}`}
                    />

                    {/* Cinematic Vignette */}
                    <div className="smile-viewport-overlay" />

                    {/* Camera Error Message */}
                    {cameraError && (
                        <div style={{
                            position: "absolute",
                            top: "30%",
                            padding: "20px 30px",
                            background: "rgba(185, 28, 28, 0.9)",
                            borderRadius: "12px",
                            color: "#fff",
                            textAlign: "center",
                            maxWidth: "400px",
                            zIndex: 25
                        }}>
                            <p style={{ fontWeight: 700, margin: "0 0 10px" }}>Camera Unavailable</p>
                            <p style={{ fontSize: "0.85rem", margin: 0 }}>{cameraError}</p>
                        </div>
                    )}

                    {/* -------------------------------------------------
                       DEPED-STYLE BIOMETRIC OVAL TARGET RETICLE
                    ------------------------------------------------- */}
                    <div className="smile-reticle-wrap">
                        <div className={`smile-reticle-oval ${
                            detectionResult?.isSmiling ? "smiling" : detectionResult?.inOvalGuide ? "aligned" : ""
                        }`}>
                            {/* Sweeping Animated Laser Scanner */}
                            <div className="smile-laser-line" />

                            {/* Corner Biometric Target Brackets */}
                            <div className="smile-corner tl" />
                            <div className="smile-corner tr" />
                            <div className="smile-corner bl" />
                            <div className="smile-corner br" />
                        </div>
                    </div>

                    {/* -------------------------------------------------
                       HUD: SMILE METER & REAL-TIME PROMPTS
                    ------------------------------------------------- */}
                    <div className="smile-hud-bottom">
                        {/* Live Instruction Pill */}
                        <div className={`smile-instruction-pill ${smileScore >= smileThreshold ? "highlight" : ""}`}>
                            <Smile size={18} color={smileScore >= smileThreshold ? "#34d399" : "#38bdf8"} />
                            <span>{statusPrompt}</span>
                        </div>

                        {/* DepEd-style Smile Index Gauge Bar */}
                        <div className="smile-gauge-bar-wrap">
                            <div className="smile-gauge-labels">
                                <span style={{ color: "#94a3b8" }}>
                                    {smileScore < 0.3 ? "😐 Neutral" : smileScore < 0.6 ? "🙂 Smiling" : "😁 BIG SMILE!"}
                                </span>
                                <span className="smile-gauge-score">
                                    {Math.round(smileScore * 100)}% SMILE INDEX
                                </span>
                            </div>
                            <div className="smile-gauge-track">
                                <div
                                    className="smile-gauge-fill"
                                    style={{ width: `${Math.min(100, Math.round(smileScore * 100))}%` }}
                                />
                                <div
                                    className="smile-gauge-threshold-line"
                                    style={{ left: `${Math.round(smileThreshold * 100)}%` }}
                                    title="Smile Threshold (Trigger)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* -------------------------------------------------
                       INSTANT ATTENDANCE CELEBRATION / CONFIRMATION CARD
                    ------------------------------------------------- */}
                    {confirmedRecord && (
                        <div className="smile-confirmation-overlay">
                            <div className="smile-confirmation-card">
                                <div className="smile-confirm-check-badge">
                                    <CheckCircle2 size={46} strokeWidth={2.5} />
                                </div>

                                <div className="smile-member-photo-frame">
                                    {confirmedRecord.photoPath ? (
                                        <img
                                            src={confirmedRecord.photoPath.startsWith("http")
                                                ? confirmedRecord.photoPath
                                                : `${API_BASE_URL.replace("/api", "")}${confirmedRecord.photoPath.startsWith("/") ? "" : "/"}${confirmedRecord.photoPath}`}
                                            alt={confirmedRecord.fullName}
                                        />
                                    ) : (
                                        <div className="smile-avatar-initials">
                                            {confirmedRecord.fullName[0]}
                                        </div>
                                    )}
                                </div>

                                <h2 className="smile-confirm-name">{confirmedRecord.fullName}</h2>
                                <div className="smile-confirm-code">{confirmedRecord.memberCode}</div>

                                <div className="smile-confirm-badges">
                                    <span className={`smile-status-badge ${confirmedRecord.status}`}>
                                        {confirmedRecord.status}
                                    </span>
                                    {confirmedRecord.ministry && (
                                        <span className="smile-ministry-badge">
                                            {confirmedRecord.ministry}
                                        </span>
                                    )}
                                </div>

                                <p className="smile-confirm-msg">
                                    {confirmedRecord.alreadyRecorded
                                        ? "Attendance Already Logged Today!"
                                        : "Attendance Successfully Recorded!"}
                                </p>
                                <div className="smile-confirm-time">
                                    <Clock size={14} />
                                    <span>Time: {confirmedRecord.time}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* =========================================================
                   LIVE ACTIVITY SIDEBAR
                ========================================================= */}
                <aside className="smile-sidebar">
                    {/* Real-Time Stats */}
                    <div className="smile-stats-row">
                        <div className="smile-stat-box">
                            <span className="smile-stat-num" style={{ color: "#38bdf8" }}>{totalPresent}</span>
                            <span className="smile-stat-label">Checked In</span>
                        </div>
                        <div className="smile-stat-box">
                            <span className="smile-stat-num" style={{ color: "#34d399" }}>{totalEarly}</span>
                            <span className="smile-stat-label">Early</span>
                        </div>
                        <div className="smile-stat-box">
                            <span className="smile-stat-num" style={{ color: "#fbbf24" }}>{totalLate}</span>
                            <span className="smile-stat-label">Late</span>
                        </div>
                    </div>

                    {/* Live Ticker Feed */}
                    <div className="smile-feed-card">
                        <div className="smile-feed-header">
                            <h3>
                                <Users size={16} />
                                <span>Today's Attendees</span>
                            </h3>
                            <div className="smile-live-indicator">
                                <span className="smile-pulse-dot" />
                                <span>LIVE</span>
                            </div>
                        </div>

                        <div className="smile-feed-list">
                            {scannedRecords.length === 0 ? (
                                <div className="smile-feed-empty">
                                    No attendees checked in yet today. Ready to scan!
                                </div>
                            ) : (
                                scannedRecords.map(item => (
                                    <div key={item.id} className="smile-feed-item">
                                        <div className="smile-feed-avatar">
                                            {item.photoPath ? (
                                                <img
                                                    src={item.photoPath.startsWith("http")
                                                        ? item.photoPath
                                                        : `${API_BASE_URL.replace("/api", "")}${item.photoPath.startsWith("/") ? "" : "/"}${item.photoPath}`}
                                                    alt={item.fullName}
                                                />
                                            ) : (
                                                item.fullName[0]
                                            )}
                                        </div>
                                        <div className="smile-feed-info">
                                            <div className="smile-feed-name">{item.fullName}</div>
                                            <div className="smile-feed-sub">
                                                <span className={`smile-status-badge ${item.status}`} style={{ fontSize: "0.62rem", padding: "1px 6px" }}>
                                                    {item.status}
                                                </span>
                                                <span>{item.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            {/* =========================================================
               MODAL: FACE ENROLLMENT CENTER
            ========================================================= */}
            {showEnrollModal && (
                <div className="smile-modal-overlay" onClick={() => setShowEnrollModal(false)}>
                    <div className="smile-modal" onClick={e => e.stopPropagation()}>
                        <div className="smile-modal-header">
                            <h2>
                                <UserCheck size={20} color="#10b981" />
                                <span>Face Enrollment Center</span>
                            </h2>
                            <button type="button" className="smile-btn-icon" onClick={() => setShowEnrollModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="smile-modal-body">
                            <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: 0, marginBottom: 14 }}>
                                Enroll members into the biometric facial recognition system. You can automatically generate face descriptors from their uploaded profile photos, or capture a live face from the camera.
                            </p>

                            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                                <button
                                    type="button"
                                    className="smile-btn smile-btn-primary"
                                    onClick={handleAutoEnrollFromPhotos}
                                    disabled={autoEnrolling}
                                    style={{ flex: 1 }}
                                >
                                    <Sparkles size={16} />
                                    <span>{autoEnrolling ? "Processing Photos..." : "Auto-Enroll from Profile Photos"}</span>
                                </button>
                                <button
                                    type="button"
                                    className="smile-btn smile-btn-secondary"
                                    onClick={loadBiometrics}
                                    title="Reload Profiles"
                                >
                                    <RefreshCw size={15} />
                                </button>
                            </div>

                            {enrollMessage && (
                                <div style={{
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    background: "rgba(14, 165, 233, 0.15)",
                                    border: "1px solid rgba(56, 189, 248, 0.3)",
                                    color: "#38bdf8",
                                    fontSize: "0.82rem",
                                    marginBottom: "14px"
                                }}>
                                    {enrollMessage}
                                </div>
                            )}

                            <input
                                type="text"
                                className="smile-search-input"
                                placeholder="Search member by name or code..."
                                value={enrollSearch}
                                onChange={e => setEnrollSearch(e.target.value)}
                            />

                            <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                                {filteredEnrollList.map(member => {
                                    const isEnrolled = enrolledIds.has(member.memberId);
                                    return (
                                        <div key={member.memberId} className="smile-member-enroll-row">
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <div className="smile-feed-avatar" style={{ width: "32px", height: "32px" }}>
                                                    {member.photoPath ? (
                                                        <img
                                                            src={member.photoPath.startsWith("http")
                                                                ? member.photoPath
                                                                : `${API_BASE_URL.replace("/api", "")}${member.photoPath.startsWith("/") ? "" : "/"}${member.photoPath}`}
                                                            alt={member.fullName}
                                                        />
                                                    ) : (
                                                        member.fullName[0]
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{member.fullName}</div>
                                                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                                                        {member.memberCode} • {member.ministry || "General"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span className={`smile-enroll-badge ${isEnrolled ? "enrolled" : "pending"}`}>
                                                    {isEnrolled ? "Enrolled" : "Not Enrolled"}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="smile-btn smile-btn-secondary"
                                                    style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                                                    onClick={() => {
                                                        setActiveEnrollMember(member);
                                                        setStudioCapturedSnapshot(null);
                                                        setStudioDescriptor(null);
                                                        setStudioCountdown(null);
                                                    }}
                                                >
                                                    <Camera size={13} />
                                                    <span>{isEnrolled ? "Re-Capture" : "Capture Face"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               MODAL: MANUAL CHECK-IN FALLBACK
            ========================================================= */}
            {showManualSearch && (
                <div className="smile-modal-overlay" onClick={() => setShowManualSearch(false)}>
                    <div className="smile-modal" onClick={e => e.stopPropagation()}>
                        <div className="smile-modal-header">
                            <h2>
                                <Search size={20} color="#38bdf8" />
                                <span>Manual Attendee Check-In</span>
                            </h2>
                            <button type="button" className="smile-btn-icon" onClick={() => setShowManualSearch(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="smile-modal-body">
                            <input
                                type="text"
                                className="smile-search-input"
                                placeholder="Type member name or member code..."
                                value={manualSearch}
                                onChange={e => setManualSearch(e.target.value)}
                                autoFocus
                            />

                            <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                                {filteredManualList.map(member => (
                                    <div key={member.memberId} className="smile-member-enroll-row">
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div className="smile-feed-avatar">
                                                {member.photoPath ? (
                                                    <img
                                                        src={member.photoPath.startsWith("http")
                                                            ? member.photoPath
                                                            : `${API_BASE_URL.replace("/api", "")}${member.photoPath.startsWith("/") ? "" : "/"}${member.photoPath}`}
                                                        alt={member.fullName}
                                                    />
                                                ) : (
                                                    member.fullName[0]
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{member.fullName}</div>
                                                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                                                    {member.memberCode} • {member.ministry || "General"}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="smile-btn smile-btn-primary"
                                            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                                            onClick={() => {
                                                setShowManualSearch(false);
                                                void handleRecordAttendance(member, 100);
                                            }}
                                        >
                                            <CheckCircle2 size={14} />
                                            <span>Check In</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               MODAL: KIOSK SETTINGS
            ========================================================= */}
            {showSettingsModal && (
                <div className="smile-modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="smile-modal" onClick={e => e.stopPropagation()}>
                        <div className="smile-modal-header">
                            <h2>
                                <Settings size={20} color="#f59e0b" />
                                <span>Kiosk Settings</span>
                            </h2>
                            <button type="button" className="smile-btn-icon" onClick={() => setShowSettingsModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="smile-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Camera device selection */}
                            <div>
                                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                                    Select Camera Device:
                                </label>
                                <select
                                    className="smile-search-input"
                                    value={selectedDeviceId}
                                    onChange={e => setSelectedDeviceId(e.target.value)}
                                    style={{ margin: 0 }}
                                >
                                    {videoDevices.map(d => (
                                        <option key={d.deviceId} value={d.deviceId}>
                                            {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Mirror video toggle */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>Mirror Video</div>
                                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Flips camera horizontally like a mirror</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={mirrored}
                                    onChange={e => setMirrored(e.target.checked)}
                                    style={{ width: 18, height: 18, cursor: "pointer" }}
                                />
                            </div>

                            {/* Smile Sensitivity Threshold */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>Smile Trigger Threshold:</span>
                                    <span style={{ fontSize: "0.82rem", color: "#38bdf8", fontWeight: 700 }}>{Math.round(smileThreshold * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="35"
                                    max="85"
                                    value={Math.round(smileThreshold * 100)}
                                    onChange={e => setSmileThreshold(Number(e.target.value) / 100)}
                                    style={{ width: "100%", cursor: "pointer" }}
                                />
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748b" }}>
                                    <span>Easy (35%)</span>
                                    <span>Normal (55%)</span>
                                    <span>Big Smile (85%)</span>
                                </div>
                            </div>

                            {/* Biometric Match Sensitivity */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>Biometric Confidence Threshold:</span>
                                    <span style={{ fontSize: "0.82rem", color: "#10b981", fontWeight: 700 }}>{sensitivityThreshold}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="55"
                                    max="85"
                                    value={sensitivityThreshold}
                                    onChange={e => setSensitivityThreshold(Number(e.target.value))}
                                    style={{ width: "100%", cursor: "pointer" }}
                                />
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748b" }}>
                                    <span>Forgiving (55%)</span>
                                    <span>Balanced (68%)</span>
                                    <span>Strict (85%)</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="smile-btn smile-btn-primary"
                                onClick={() => setShowSettingsModal(false)}
                                style={{ marginTop: 8 }}
                            >
                                Save & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               LIVE MEMBER FACE ENROLLMENT STUDIO MODAL
               Shows the member their own live camera stream with biometric
               oval guide and real-time smile meter so they put their best smile!
            ========================================================= */}
            {activeEnrollMember && (
                <div className="smile-studio-overlay" onClick={() => setActiveEnrollMember(null)}>
                    <div className="smile-studio-modal" onClick={e => e.stopPropagation()}>
                        {/* Studio Header */}
                        <div className="smile-studio-header">
                            <div className="smile-studio-member-info">
                                <div className="smile-studio-avatar">
                                    {activeEnrollMember.photoPath ? (
                                        <img
                                            src={activeEnrollMember.photoPath.startsWith("http")
                                                ? activeEnrollMember.photoPath
                                                : `${API_BASE_URL.replace("/api", "")}${activeEnrollMember.photoPath.startsWith("/") ? "" : "/"}${activeEnrollMember.photoPath}`}
                                            alt={activeEnrollMember.fullName}
                                        />
                                    ) : (
                                        activeEnrollMember.fullName[0]
                                    )}
                                </div>
                                <div>
                                    <h2 className="smile-studio-name">{activeEnrollMember.fullName}</h2>
                                    <div className="smile-studio-sub">
                                        {activeEnrollMember.memberCode} • {activeEnrollMember.ministry || "General"}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="smile-btn-icon"
                                onClick={() => setActiveEnrollMember(null)}
                                title="Close Studio"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Studio Camera Viewport */}
                        <div className="smile-studio-viewport">
                            <canvas ref={studioCanvasRef} style={{ display: "none" }} />

                            {studioCapturedSnapshot ? (
                                <>
                                    <img
                                        src={studioCapturedSnapshot}
                                        alt="Captured Best Smile"
                                        className="smile-snapshot-preview"
                                    />
                                    <div className="smile-snapshot-badge">
                                        <CheckCircle2 size={16} />
                                        <span>Smile Captured • {Math.round(studioSmileScore * 100)}% Smile Score</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <video
                                        ref={studioVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="smile-studio-video"
                                    />

                                    {/* Shutter flash effect */}
                                    {studioShutterFlash && <div className="smile-shutter-flash" />}

                                    {/* 3-2-1 Countdown */}
                                    {studioCountdown !== null && (
                                        <div className="smile-studio-countdown">
                                            <div className="smile-countdown-number">{studioCountdown}</div>
                                            <div className="smile-countdown-hint">Put on your best smile! 😊</div>
                                        </div>
                                    )}

                                    {/* DepEd-style Biometric Oval Reticle */}
                                    <div className={`smile-studio-reticle ${studioSmileScore >= 0.55 ? "smiling" : ""}`} />

                                    {/* Live Smile Meter HUD inside Studio */}
                                    <div className="smile-studio-hud">
                                        <div className="smile-instruction-pill" style={{ fontSize: "0.85rem", padding: "6px 16px" }}>
                                            <Smile size={16} color={studioSmileScore >= 0.55 ? "#34d399" : "#38bdf8"} />
                                            <span>
                                                {studioSmileScore < 0.35
                                                    ? "Align face in oval guide & smile! 😊"
                                                    : studioSmileScore < 0.65
                                                    ? "Nice! Give a bigger joyful smile... 🙂"
                                                    : "PERFECT SMILE! Ready to capture! 😁"}
                                            </span>
                                        </div>

                                        <div className="smile-gauge-bar-wrap" style={{ padding: "8px 14px" }}>
                                            <div className="smile-gauge-labels">
                                                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                                                    {studioSmileScore < 0.35 ? "😐 Neutral" : studioSmileScore < 0.65 ? "🙂 Smiling" : "😁 BEST SMILE!"}
                                                </span>
                                                <span className="smile-gauge-score" style={{ fontSize: "0.78rem" }}>
                                                    {Math.round(studioSmileScore * 100)}% SMILE
                                                </span>
                                            </div>
                                            <div className="smile-gauge-track" style={{ height: "10px" }}>
                                                <div
                                                    className="smile-gauge-fill"
                                                    style={{ width: `${Math.min(100, Math.round(studioSmileScore * 100))}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Studio Footer Controls */}
                        <div className="smile-studio-footer">
                            {studioCapturedSnapshot ? (
                                <>
                                    <button
                                        type="button"
                                        className="smile-studio-action-btn secondary"
                                        onClick={() => {
                                            setStudioCapturedSnapshot(null);
                                            setStudioDescriptor(null);
                                        }}
                                    >
                                        <RefreshCw size={16} />
                                        <span>Retake Photo</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="smile-studio-action-btn primary"
                                        onClick={handleSaveStudioEnrollment}
                                    >
                                        <CheckCircle2 size={18} />
                                        <span>Save Best Smile Biometrics</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="smile-studio-action-btn secondary"
                                        onClick={handleStartCountdown}
                                        disabled={studioCountdown !== null}
                                    >
                                        <Clock size={16} />
                                        <span>3-Sec Smile Countdown</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="smile-studio-action-btn primary"
                                        onClick={handleTakeStudioSnapshot}
                                        disabled={studioCountdown !== null}
                                    >
                                        <Camera size={18} />
                                        <span>📸 Capture Best Smile</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
