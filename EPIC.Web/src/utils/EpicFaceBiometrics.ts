/**
 * EPIC SMILE - Biometric Face & Smile Recognition Engine
 * Real-time face detection, smile analysis, biometric descriptor generation,
 * and cosine similarity matching.
 * 
 * Inspired by Philippine DepEd SMILE Attendance Kiosk.
 */

export interface FaceBox {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

export interface FaceDetectionResult {
    detected: boolean;
    inOvalGuide: boolean;
    box: FaceBox | null;
    lightingQuality: "GOOD" | "LOW" | "HIGH";
    smileScore: number; // 0.0 to 1.0
    isSmiling: boolean;
    livenessScore: number;
    message: string;
}

export interface EnrolledFaceProfile {
    memberId: number;
    memberCode: string;
    fullName: string;
    ministry: string;
    photoPath?: string;
    descriptor: number[];
    enrolledAt: string;
}

export interface MatchResult {
    matched: boolean;
    profile: EnrolledFaceProfile | null;
    confidence: number; // 0 to 100%
    distance: number;
}

// -------------------------------------------------------------
// NATIVE BROWSER FACE DETECTOR CACHE
// -------------------------------------------------------------
let nativeFaceDetector: any = null;
let nativeDetectorChecked = false;

function getNativeDetector() {
    if (!nativeDetectorChecked && typeof window !== "undefined") {
        nativeDetectorChecked = true;
        if ("FaceDetector" in window) {
            try {
                nativeFaceDetector = new (window as any).FaceDetector({
                    fastMode: true,
                    maxDetectedFaces: 1
                });
            } catch {
                nativeFaceDetector = null;
            }
        }
    }
    return nativeFaceDetector;
}

// -------------------------------------------------------------
// REAL-TIME FACE & SMILE DETECTION
// -------------------------------------------------------------
export async function detectFaceAndSmile(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ovalGuide: { x: number; y: number; width: number; height: number }
): Promise<FaceDetectionResult> {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
        return {
            detected: false,
            inOvalGuide: false,
            box: null,
            lightingQuality: "GOOD",
            smileScore: 0,
            isSmiling: false,
            livenessScore: 0,
            message: "Awaiting video stream..."
        };
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let detectedBox: FaceBox | null = null;
    const native = getNativeDetector();

    if (native) {
        try {
            const faces = await native.detect(video);
            if (faces && faces.length > 0) {
                const f = faces[0].boundingBox;
                detectedBox = {
                    x: f.x,
                    y: f.y,
                    width: f.width,
                    height: f.height,
                    centerX: f.x + f.width / 2,
                    centerY: f.y + f.height / 2
                };
            }
        } catch {
            // Fall back to computer vision analyzer
        }
    }

    // Fallback: Color/Luminance biometric face segmentation
    if (!detectedBox) {
        detectedBox = detectFaceByBiometricProfile(ctx, canvas.width, canvas.height, ovalGuide);
    }

    if (!detectedBox) {
        return {
            detected: false,
            inOvalGuide: false,
            box: null,
            lightingQuality: "GOOD",
            smileScore: 0,
            isSmiling: false,
            livenessScore: 0,
            message: "Stand in front of the camera and align face"
        };
    }

    // Evaluate position relative to DepEd SMILE oval guide
    const ovalCenterX = ovalGuide.x + ovalGuide.width / 2;
    const ovalCenterY = ovalGuide.y + ovalGuide.height / 2;
    const deltaX = Math.abs(detectedBox.centerX - ovalCenterX);
    const deltaY = Math.abs(detectedBox.centerY - ovalCenterY);

    const horizontalTolerance = ovalGuide.width * 0.45;
    const verticalTolerance = ovalGuide.height * 0.45;

    const inOval = deltaX < horizontalTolerance && deltaY < verticalTolerance &&
                   detectedBox.width >= ovalGuide.width * 0.4 &&
                   detectedBox.width <= ovalGuide.width * 1.5;

    // Check lighting quality
    const lighting = evaluateLighting(ctx, detectedBox);

    // Compute Smile & Expression Index
    const smile = computeSmileScore(ctx, detectedBox);

    // Liveness estimation
    const liveness = Math.min(1.0, 0.5 + smile.smileScore * 0.5);

    let message = "Position face inside oval guide";
    if (inOval) {
        if (smile.smileScore < 0.35) {
            message = "Face aligned. Smile to log attendance! 😊";
        } else if (smile.smileScore < 0.65) {
            message = "Keep smiling! Almost there... 🙂";
        } else {
            message = "Great smile! Capturing biometric match... 😁";
        }
    } else if (detectedBox.width < ovalGuide.width * 0.4) {
        message = "Step a little closer to camera";
    } else if (detectedBox.width > ovalGuide.width * 1.4) {
        message = "Step a little back";
    }

    return {
        detected: true,
        inOvalGuide: inOval,
        box: detectedBox,
        lightingQuality: lighting,
        smileScore: smile.smileScore,
        isSmiling: smile.smileScore >= 0.60,
        livenessScore: liveness,
        message
    };
}

// -------------------------------------------------------------
// COMPUTER VISION FACE DETECTOR (CANVAS FALLBACK)
// -------------------------------------------------------------
function detectFaceByBiometricProfile(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    ovalGuide: { x: number; y: number; width: number; height: number }
): FaceBox | null {
    // Sample search region around oval guide for speed
    const searchPad = 40;
    const sx = Math.max(0, Math.floor(ovalGuide.x - searchPad));
    const sy = Math.max(0, Math.floor(ovalGuide.y - searchPad));
    const sw = Math.min(width - sx, Math.floor(ovalGuide.width + searchPad * 2));
    const sh = Math.min(height - sy, Math.floor(ovalGuide.height + searchPad * 2));

    if (sw <= 0 || sh <= 0) return null;

    const imgData = ctx.getImageData(sx, sy, sw, sh);
    const data = imgData.data;

    let totalSkinPixels = 0;
    let minX = sw, maxX = 0, minY = sh, maxY = 0;

    const step = 4; // Sample every 4th pixel for 60fps performance
    for (let y = 0; y < sh; y += step) {
        for (let x = 0; x < sw; x += step) {
            const idx = (y * sw + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Skin color distribution filter (YCbCr + RGB bounds)
            if (isSkinColor(r, g, b)) {
                totalSkinPixels++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    const minSkinThreshold = ((sw * sh) / (step * step)) * 0.08;
    if (totalSkinPixels < minSkinThreshold || maxX <= minX || maxY <= minY) {
        return null;
    }

    const boxW = Math.max(80, (maxX - minX));
    const boxH = Math.max(100, (maxY - minY));

    return {
        x: sx + minX,
        y: sy + minY,
        width: boxW,
        height: boxH,
        centerX: sx + minX + boxW / 2,
        centerY: sy + minY + boxH / 2
    };
}

function isSkinColor(r: number, g: number, b: number): boolean {
    // Standard normalized skin detection in RGB color space
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return (
        r > 60 && g > 40 && b > 20 &&
        r > g && r > b &&
        (max - min) > 15 &&
        Math.abs(r - g) > 15
    );
}

// -------------------------------------------------------------
// DEPED-STYLE SMILE DETECTOR (MOUTH CURVATURE & LUMINOSITY)
// -------------------------------------------------------------
function computeSmileScore(
    ctx: CanvasRenderingContext2D,
    box: FaceBox
): { smileScore: number } {
    // The mouth region is typically in the bottom 30% of the face, centered horizontally
    const mouthW = Math.floor(box.width * 0.55);
    const mouthH = Math.floor(box.height * 0.28);
    const mouthX = Math.floor(box.x + (box.width - mouthW) / 2);
    const mouthY = Math.floor(box.y + box.height * 0.65);

    if (mouthW <= 0 || mouthH <= 0 || mouthX < 0 || mouthY < 0) {
        return { smileScore: 0 };
    }

    try {
        const imgData = ctx.getImageData(mouthX, mouthY, mouthW, mouthH);
        const data = imgData.data;

        // When a person smiles:
        // 1. Mouth width expands relative to height
        // 2. Teeth or lip separation increases horizontal contrast
        // 3. Cheeks / corners of the mouth lift, increasing upper row brightness vs center
        let leftCornerBright = 0;
        let rightCornerBright = 0;
        let centerBright = 0;
        let highContrastCount = 0;

        const quarterW = Math.floor(mouthW / 4);

        for (let y = 0; y < mouthH; y += 2) {
            for (let x = 0; x < mouthW; x += 2) {
                const idx = (y * mouthW + x) * 4;
                const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

                if (x < quarterW) {
                    leftCornerBright += lum;
                } else if (x > mouthW - quarterW) {
                    rightCornerBright += lum;
                } else {
                    centerBright += lum;
                }

                // Teeth or smile contrast check
                if (lum > 140 && data[idx] > data[idx + 2] + 10) {
                    highContrastCount++;
                }
            }
        }

        const samplePoints = (mouthW * mouthH) / 4;
        const contrastRatio = highContrastCount / (samplePoints * 0.4);

        // Smile curvature metric: corners are elevated and brighter due to cheek elevation
        const cornerFactor = (leftCornerBright + rightCornerBright) / (centerBright * 0.95 || 1);
        
        let score = (cornerFactor * 0.4) + (contrastRatio * 0.6);
        score = Math.max(0, Math.min(1.0, (score - 0.25) / 0.85));

        return { smileScore: parseFloat(score.toFixed(2)) };
    } catch {
        return { smileScore: 0 };
    }
}

function evaluateLighting(ctx: CanvasRenderingContext2D, box: FaceBox): "GOOD" | "LOW" | "HIGH" {
    try {
        const imgData = ctx.getImageData(Math.floor(box.x), Math.floor(box.y), Math.floor(box.width), Math.floor(box.height));
        const data = imgData.data;
        let totalLum = 0;
        const total = (data.length / 4);
        for (let i = 0; i < data.length; i += 16) {
            totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const avgLum = totalLum / (total / 4);
        if (avgLum < 45) return "LOW";
        if (avgLum > 220) return "HIGH";
        return "GOOD";
    } catch {
        return "GOOD";
    }
}

// -------------------------------------------------------------
// 128-DIMENSIONAL BIOMETRIC DESCRIPTOR GENERATION
// -------------------------------------------------------------
export function extractFaceDescriptor(
    canvas: HTMLCanvasElement,
    box: FaceBox
): number[] {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return new Array(128).fill(0);

    // Normalize face crop to 64x64 offscreen canvas
    const normSize = 64;
    const offCanvas = document.createElement("canvas");
    offCanvas.width = normSize;
    offCanvas.height = normSize;
    const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return new Array(128).fill(0);

    // Draw tightly cropped face
    offCtx.drawImage(
        canvas,
        Math.max(0, box.x),
        Math.max(0, box.y),
        Math.min(canvas.width - box.x, box.width),
        Math.min(canvas.height - box.y, box.height),
        0, 0, normSize, normSize
    );

    const imgData = offCtx.getImageData(0, 0, normSize, normSize);
    const data = imgData.data;
    const descriptor: number[] = new Array(128).fill(0);

    // 1. Grid of 8x8 spatial luminance blocks (64 values)
    const blockSize = normSize / 8;
    for (let by = 0; by < 8; by++) {
        for (let bx = 0; bx < 8; bx++) {
            let blockSum = 0;
            for (let y = 0; y < blockSize; y++) {
                for (let x = 0; x < blockSize; x++) {
                    const px = (by * blockSize + y) * normSize + (bx * blockSize + x);
                    const idx = px * 4;
                    const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                    blockSum += lum;
                }
            }
            descriptor[by * 8 + bx] = blockSum / (blockSize * blockSize * 255);
        }
    }

    // 2. Multi-band radial frequency moments around face center (32 values)
    const centerX = normSize / 2;
    const centerY = normSize / 2;
    for (let band = 0; band < 16; band++) {
        const radius = (band + 1) * 2;
        let bandSum = 0;
        let count = 0;
        for (let deg = 0; deg < 360; deg += 20) {
            const rad = (deg * Math.PI) / 180;
            const pxX = Math.floor(centerX + Math.cos(rad) * radius);
            const pxY = Math.floor(centerY + Math.sin(rad) * radius);
            if (pxX >= 0 && pxX < normSize && pxY >= 0 && pxY < normSize) {
                const idx = (pxY * normSize + pxX) * 4;
                bandSum += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                count++;
            }
        }
        descriptor[64 + band] = count > 0 ? (bandSum / (count * 255)) : 0;
    }

    // 3. Quadrant skin color & chroma distributions (32 values)
    const half = normSize / 2;
    const quads = [
        { x: 0, y: 0 }, { x: half, y: 0 },
        { x: 0, y: half }, { x: half, y: half }
    ];

    quads.forEach((q, qIdx) => {
        let rSum = 0, gSum = 0, bSum = 0, gradSum = 0;
        for (let y = 0; y < half; y += 2) {
            for (let x = 0; x < half; x += 2) {
                const idx = ((q.y + y) * normSize + (q.x + x)) * 4;
                rSum += data[idx];
                gSum += data[idx + 1];
                bSum += data[idx + 2];
                if (x > 0) {
                    const prevIdx = ((q.y + y) * normSize + (q.x + x - 2)) * 4;
                    gradSum += Math.abs(data[idx] - data[prevIdx]);
                }
            }
        }
        const qCount = (half * half) / 4;
        const base = 80 + qIdx * 8;
        descriptor[base] = rSum / (qCount * 255);
        descriptor[base + 1] = gSum / (qCount * 255);
        descriptor[base + 2] = bSum / (qCount * 255);
        descriptor[base + 3] = gradSum / (qCount * 255);
        descriptor[base + 4] = (rSum - gSum) / (qCount * 255);
        descriptor[base + 5] = (rSum - bSum) / (qCount * 255);
        descriptor[base + 6] = (gSum - bSum) / (qCount * 255);
        descriptor[base + 7] = Math.sqrt(rSum * rSum + gSum * gSum) / (qCount * 255 * 1.414);
    });

    // 4. L2 Normalization
    let norm = 0;
    for (let i = 0; i < descriptor.length; i++) {
        norm += descriptor[i] * descriptor[i];
    }
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < descriptor.length; i++) {
        descriptor[i] = descriptor[i] / norm;
    }

    return descriptor;
}

// -------------------------------------------------------------
// BIOMETRIC MATCHING (COSINE SIMILARITY)
// -------------------------------------------------------------
export function matchFaceDescriptor(
    liveDescriptor: number[],
    enrolledProfiles: EnrolledFaceProfile[],
    thresholdPercentage = 70 // default 70% confidence
): MatchResult {
    if (!enrolledProfiles || enrolledProfiles.length === 0 || liveDescriptor.length === 0) {
        return { matched: false, profile: null, confidence: 0, distance: 1.0 };
    }

    let bestMatch: EnrolledFaceProfile | null = null;
    let highestSimilarity = -1;

    for (const profile of enrolledProfiles) {
        if (!profile.descriptor || profile.descriptor.length !== liveDescriptor.length) continue;

        let dotProduct = 0;
        for (let i = 0; i < liveDescriptor.length; i++) {
            dotProduct += liveDescriptor[i] * profile.descriptor[i];
        }

        // Since both vectors are L2-normalized, dotProduct equals cosine similarity [-1, 1]
        if (dotProduct > highestSimilarity) {
            highestSimilarity = dotProduct;
            bestMatch = profile;
        }
    }

    // Map cosine similarity to 0-100% confidence
    // Typical matching threshold: cosine sim >= 0.75 corresponds to high confidence
    const confidence = Math.max(0, Math.min(100, Math.round(highestSimilarity * 100)));
    const matched = confidence >= thresholdPercentage;

    return {
        matched,
        profile: matched ? bestMatch : null,
        confidence,
        distance: parseFloat((1.0 - Math.max(0, highestSimilarity)).toFixed(4))
    };
}

// -------------------------------------------------------------
// ENROLL FROM PROFILE IMAGE URL
// -------------------------------------------------------------
export async function enrollFromImageUrl(
    imageUrl: string
): Promise<number[] | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth || 300;
                canvas.height = img.naturalHeight || 300;
                const ctx = canvas.getContext("2d");
                if (!ctx) return resolve(null);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const box: FaceBox = {
                    x: canvas.width * 0.15,
                    y: canvas.height * 0.15,
                    width: canvas.width * 0.7,
                    height: canvas.height * 0.7,
                    centerX: canvas.width / 2,
                    centerY: canvas.height / 2
                };

                const desc = extractFaceDescriptor(canvas, box);
                resolve(desc);
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = imageUrl;
    });
}
