import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import "./ViewCourse.css";
import LessonViewer from "./LessonViewer";

// =========================================================
// API
// =========================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5109/api";

// =========================================================
// TYPES
// =========================================================

interface LessonProgress {
    progressPercentage: number;
    isCompleted: boolean;
    startedDate?: string | null;
    completedDate?: string | null;
}

interface Lesson {
    lessonId: number;
    title: string;

    content?: string | null;
    videoUrl?: string | null;
    resourceUrl?: string | null;

    sortOrder: number;
    estimatedMinutes: number;
    isFreePreview: boolean;

    progress?: LessonProgress | null;

    moduleId: number;
    moduleSortOrder: number;
}

interface CourseModule {
    courseModuleId: number;
    title: string;
    description?: string | null;
    sortOrder: number;
    lessons: Lesson[];
}

interface CourseData {
    courseId: number;
    courseTitle: string;
    courseDescription?: string | null;

    courseEnrollmentId: number;

    progressPercentage: number;
    isCompleted: boolean;

    enrolledDate: string;
    completedDate?: string | null;

    totalLessons: number;
    completedLessons: number;

    currentLessonId?: number | null;

    modules: CourseModule[];
}

interface ViewCourseProps {
    courseId: number;

    onBack: () => void;

    onLessonSelect?: (
        lessonId: number
    ) => void;
}

// =========================================================
// COMPONENT
// =========================================================

const ViewCourse: React.FC<ViewCourseProps> = ({
    courseId,
    onBack,
    onLessonSelect
}) => {

    // =====================================================
    // STATE
    // =====================================================

    const [course, setCourse] =
        useState<CourseData | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [selectedLessonId, setSelectedLessonId] =
        useState<number | null>(null);

    // =====================================================
    // TOKEN
    // =====================================================

    const getToken = useCallback(() => {

        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("epicToken")
        );

    }, []);

    // =====================================================
    // AUTH HEADERS
    // =====================================================

    const getHeaders = useCallback((): HeadersInit => {

        const token = getToken();

        return {
            Authorization:
                `Bearer ${token}`,

            Accept:
                "application/json",

            "Content-Type":
                "application/json"
        };

    }, [getToken]);

    // =====================================================
    // NORMALIZE PROGRESS
    // =====================================================

    const normalizeProgress = (
        raw: any
    ): LessonProgress => {

        return {

            progressPercentage:
                Number(
                    raw?.progressPercentage ??
                    raw?.ProgressPercentage ??
                    0
                ),

            isCompleted:
                raw?.isCompleted === true ||
                raw?.IsCompleted === true,

            startedDate:
                raw?.startedDate ??
                raw?.StartedDate ??
                null,

            completedDate:
                raw?.completedDate ??
                raw?.CompletedDate ??
                null
        };

    };

    // =====================================================
    // LOAD COURSE
    // =====================================================

    const loadCourse = useCallback(
        async () => {

            try {

                setLoading(true);
                setError("");

                const token =
                    getToken();

                if (!token) {

                    throw new Error(
                        "Authentication token not found."
                    );

                }

                console.log(
                    "================================="
                );

                console.log(
                    "EPIC LOAD COURSE"
                );

                console.log(
                    "Course ID:",
                    courseId
                );

                console.log(
                    "================================="
                );

                // =================================================
                // LOAD COURSE STRUCTURE
                // =================================================

                const courseResponse =
                    await fetch(
                        `${API_BASE_URL}/LessonProgress/course/${courseId}`,
                        {
                            method: "GET",
                            headers:
                                getHeaders()
                        }
                    );

                console.log(
                    "Course response:",
                    courseResponse.status
                );

                if (!courseResponse.ok) {

                    let message =
                        `Failed to load course. Status: ${courseResponse.status}`;

                    try {

                        const data =
                            await courseResponse.json();

                        if (
                            typeof data?.message ===
                            "string"
                        ) {

                            message =
                                data.message;

                        }

                    } catch {
                        // ignore
                    }

                    throw new Error(
                        message
                    );

                }

                const rawCourse =
                    await courseResponse.json();

                console.log(
                    "================================="
                );

                console.log(
                    "EPIC RAW COURSE:"
                );

                console.log(
                    rawCourse
                );

                console.log(
                    "================================="
                );

                // =================================================
                // ENROLLMENT
                // =================================================

                const enrollmentId =
                    Number(
                        rawCourse?.courseEnrollmentId ??
                        rawCourse?.CourseEnrollmentId ??
                        rawCourse?.enrollmentId ??
                        rawCourse?.EnrollmentId ??
                        0
                    );

                console.log(
                    "Enrollment ID:",
                    enrollmentId
                );

                // =================================================
                // LOAD LESSON PROGRESS
                // =================================================

                const progressMap =
                    new Map<
                        number,
                        LessonProgress
                    >();

                if (enrollmentId > 0) {

                    try {

                        const progressResponse =
                            await fetch(
                                `${API_BASE_URL}/LessonProgress/enrollment/${enrollmentId}`,
                                {
                                    method: "GET",
                                    headers:
                                        getHeaders()
                                }
                            );

                        console.log(
                            "Progress response:",
                            progressResponse.status
                        );

                        if (
                            progressResponse.ok
                        ) {

                            const progressData =
                                await progressResponse.json();

                            console.log(
                                "EPIC RAW PROGRESS:",
                                progressData
                            );

                            let records: any[] = [];

                            if (
                                Array.isArray(
                                    progressData
                                )
                            ) {

                                records =
                                    progressData;

                            } else if (
                                Array.isArray(
                                    progressData?.progress
                                )
                            ) {

                                records =
                                    progressData.progress;

                            } else if (
                                Array.isArray(
                                    progressData?.lessonProgress
                                )
                            ) {

                                records =
                                    progressData.lessonProgress;

                            } else if (
                                Array.isArray(
                                    progressData?.data
                                )
                            ) {

                                records =
                                    progressData.data;

                            }

                            records.forEach(
                                record => {

                                    const lessonId =
                                        Number(
                                            record?.lessonId ??
                                            record?.LessonId
                                        );

                                    if (
                                        lessonId > 0
                                    ) {

                                        progressMap.set(
                                            lessonId,
                                            normalizeProgress(
                                                record
                                            )
                                        );

                                    }

                                }
                            );

                        }

                    } catch (progressError) {

                        console.warn(
                            "Progress loading failed:",
                            progressError
                        );

                    }

                }

                console.log(
                    "EPIC PROGRESS MAP:",
                    progressMap
                );

                // =================================================
                // FIND MODULES
                // =================================================

                let rawModules: any[] = [];

                if (
                    Array.isArray(
                        rawCourse?.modules
                    )
                ) {

                    rawModules =
                        rawCourse.modules;

                } else if (
                    Array.isArray(
                        rawCourse?.Modules
                    )
                ) {

                    rawModules =
                        rawCourse.Modules;

                } else if (
                    Array.isArray(
                        rawCourse?.courseModules
                    )
                ) {

                    rawModules =
                        rawCourse.courseModules;

                } else if (
                    Array.isArray(
                        rawCourse?.CourseModules
                    )
                ) {

                    rawModules =
                        rawCourse.CourseModules;

                } else if (
                    Array.isArray(
                        rawCourse?.data?.modules
                    )
                ) {

                    rawModules =
                        rawCourse.data.modules;

                }

                console.log(
                    "================================="
                );

                console.log(
                    "EPIC RAW MODULES"
                );

                console.log(
                    "Module count:",
                    rawModules.length
                );

                console.log(
                    rawModules
                );

                console.log(
                    "================================="
                );

                // =================================================
                // MODULE MAP
                // =================================================

                const moduleMap =
                    new Map<
                        number,
                        CourseModule
                    >();

                // =================================================
                // CREATE MODULES
                // =================================================

                rawModules.forEach(
                    (
                        rawModule,
                        moduleIndex
                    ) => {

                        const moduleId =
                            Number(
                                rawModule?.courseModuleId ??
                                rawModule?.CourseModuleId ??
                                rawModule?.moduleId ??
                                rawModule?.ModuleId
                            );

                        const finalModuleId =
                            moduleId ||
                            -(moduleIndex + 1);

                        if (
                            moduleMap.has(
                                finalModuleId
                            )
                        ) {

                            return;

                        }

                        moduleMap.set(
                            finalModuleId,
                            {

                                courseModuleId:
                                    finalModuleId,

                                title:
                                    rawModule?.title ??
                                    rawModule?.Title ??
                                    `Module ${moduleIndex + 1}`,

                                description:
                                    rawModule?.description ??
                                    rawModule?.Description ??
                                    null,

                                sortOrder:
                                    Number(
                                        rawModule?.sortOrder ??
                                        rawModule?.SortOrder ??
                                        moduleIndex
                                    ),

                                lessons: []

                            }
                        );

                    }
                );

                // =================================================
                // ADD LESSONS TO MODULES
                // =================================================

                rawModules.forEach(
                    (
                        rawModule,
                        moduleIndex
                    ) => {

                        const moduleId =
                            Number(
                                rawModule?.courseModuleId ??
                                rawModule?.CourseModuleId ??
                                rawModule?.moduleId ??
                                rawModule?.ModuleId
                            );

                        const finalModuleId =
                            moduleId ||
                            -(moduleIndex + 1);

                        let targetModule =
                            moduleMap.get(
                                finalModuleId
                            );

                        if (!targetModule) {

                            targetModule = {

                                courseModuleId:
                                    finalModuleId,

                                title:
                                    rawModule?.title ??
                                    rawModule?.Title ??
                                    `Module ${moduleIndex + 1}`,

                                description:
                                    rawModule?.description ??
                                    rawModule?.Description ??
                                    null,

                                sortOrder:
                                    Number(
                                        rawModule?.sortOrder ??
                                        rawModule?.SortOrder ??
                                        moduleIndex
                                    ),

                                lessons: []

                            };

                            moduleMap.set(
                                finalModuleId,
                                targetModule
                            );

                        }

                        // =================================================
                        // LESSON ARRAY
                        // =================================================

                        let rawLessons: any[] = [];

                        if (
                            Array.isArray(
                                rawModule?.lessons
                            )
                        ) {

                            rawLessons =
                                rawModule.lessons;

                        } else if (
                            Array.isArray(
                                rawModule?.Lessons
                            )
                        ) {

                            rawLessons =
                                rawModule.Lessons;

                        } else if (
                            Array.isArray(
                                rawModule?.courseLessons
                            )
                        ) {

                            rawLessons =
                                rawModule.courseLessons;

                        } else if (
                            Array.isArray(
                                rawModule?.CourseLessons
                            )
                        ) {

                            rawLessons =
                                rawModule.CourseLessons;

                        }

                        console.log(
                            `MODULE ${finalModuleId}: ${rawLessons.length} lessons`
                        );

                        // =================================================
                        // ADD LESSONS
                        // =================================================

                        rawLessons.forEach(
                            (
                                rawLesson,
                                lessonIndex
                            ) => {

                                const lessonId =
                                    Number(
                                        rawLesson?.lessonId ??
                                        rawLesson?.LessonId ??
                                        rawLesson?.id ??
                                        rawLesson?.Id
                                    );

                                if (
                                    lessonId <= 0
                                ) {

                                    console.warn(
                                        "Invalid lesson:",
                                        rawLesson
                                    );

                                    return;

                                }

                                // -----------------------------------------
                                // Prevent duplicate lessons
                                // -----------------------------------------

                                const alreadyExists =
                                    targetModule!.lessons.some(
                                        lesson =>
                                            lesson.lessonId ===
                                            lessonId
                                    );

                                if (
                                    alreadyExists
                                ) {

                                    return;

                                }

                                const progress =
                                    progressMap.get(
                                        lessonId
                                    ) ??
                                    (
                                        rawLesson?.progress ??
                                        rawLesson?.Progress
                                            ? normalizeProgress(
                                                rawLesson?.progress ??
                                                rawLesson?.Progress
                                            )
                                            : null
                                    );

                                targetModule!.lessons.push({

                                    lessonId,

                                    title:
                                        rawLesson?.title ??
                                        rawLesson?.Title ??
                                        `Lesson ${lessonIndex + 1}`,

                                    content:
                                        rawLesson?.content ??
                                        rawLesson?.Content ??
                                        null,

                                    videoUrl:
                                        rawLesson?.videoUrl ??
                                        rawLesson?.VideoUrl ??
                                        null,

                                    resourceUrl:
                                        rawLesson?.resourceUrl ??
                                        rawLesson?.ResourceUrl ??
                                        null,

                                    sortOrder:
                                        Number(
                                            rawLesson?.sortOrder ??
                                            rawLesson?.SortOrder ??
                                            lessonIndex
                                        ),

                                    estimatedMinutes:
                                        Number(
                                            rawLesson?.estimatedMinutes ??
                                            rawLesson?.EstimatedMinutes ??
                                            0
                                        ),

                                    isFreePreview:
                                        rawLesson?.isFreePreview === true ||
                                        rawLesson?.IsFreePreview === true,

                                    progress,

                                    moduleId:
                                        finalModuleId,

                                    moduleSortOrder:
                                        targetModule!.sortOrder

                                });

                            }
                        );

                    }
                );

                // =================================================
                // DIRECT COURSE LESSON FALLBACK
                // =================================================

                let directLessons: any[] = [];

                if (
                    Array.isArray(
                        rawCourse?.lessons
                    )
                ) {

                    directLessons =
                        rawCourse.lessons;

                } else if (
                    Array.isArray(
                        rawCourse?.Lessons
                    )
                ) {

                    directLessons =
                        rawCourse.Lessons;

                } else if (
                    Array.isArray(
                        rawCourse?.courseLessons
                    )
                ) {

                    directLessons =
                        rawCourse.courseLessons;

                } else if (
                    Array.isArray(
                        rawCourse?.CourseLessons
                    )
                ) {

                    directLessons =
                        rawCourse.CourseLessons;

                }

                // =================================================
                // ADD DIRECT LESSONS
                // =================================================

                if (
                    directLessons.length > 0
                ) {

                    console.log(
                        "DIRECT COURSE LESSONS:",
                        directLessons.length
                    );

                    let fallbackModule =
                        Array.from(
                            moduleMap.values()
                        )[0];

                    if (!fallbackModule) {

                        fallbackModule = {

                            courseModuleId:
                                1,

                            title:
                                "Course Lessons",

                            description:
                                null,

                            sortOrder:
                                0,

                            lessons: []

                        };

                        moduleMap.set(
                            1,
                            fallbackModule
                        );

                    }

                    directLessons.forEach(
                        (
                            rawLesson,
                            index
                        ) => {

                            const lessonId =
                                Number(
                                    rawLesson?.lessonId ??
                                    rawLesson?.LessonId ??
                                    rawLesson?.id ??
                                    rawLesson?.Id
                                );

                            if (
                                lessonId <= 0
                            ) {

                                return;

                            }

                            // Check globally
                            let exists =
                                false;

                            moduleMap.forEach(
                                module => {

                                    if (
                                        module.lessons.some(
                                            lesson =>
                                                lesson.lessonId ===
                                                lessonId
                                        )
                                    ) {

                                        exists = true;

                                    }

                                }
                            );

                            if (
                                exists
                            ) {

                                return;

                            }

                            const progress =
                                progressMap.get(
                                    lessonId
                                ) ??
                                null;

                            fallbackModule!.lessons.push({

                                lessonId,

                                title:
                                    rawLesson?.title ??
                                    rawLesson?.Title ??
                                    `Lesson ${index + 1}`,

                                content:
                                    rawLesson?.content ??
                                    rawLesson?.Content ??
                                    null,

                                videoUrl:
                                    rawLesson?.videoUrl ??
                                    rawLesson?.VideoUrl ??
                                    null,

                                resourceUrl:
                                    rawLesson?.resourceUrl ??
                                    rawLesson?.ResourceUrl ??
                                    null,

                                sortOrder:
                                    Number(
                                        rawLesson?.sortOrder ??
                                        rawLesson?.SortOrder ??
                                        index
                                    ),

                                estimatedMinutes:
                                    Number(
                                        rawLesson?.estimatedMinutes ??
                                        rawLesson?.EstimatedMinutes ??
                                        0
                                    ),

                                isFreePreview:
                                    rawLesson?.isFreePreview === true ||
                                    rawLesson?.IsFreePreview === true,

                                progress,

                                moduleId:
                                    fallbackModule!.courseModuleId,

                                moduleSortOrder:
                                    fallbackModule!.sortOrder

                            });

                        }
                    );

                }

                // =================================================
                // SORT MODULES
                // =================================================

                const modules =
                    Array.from(
                        moduleMap.values()
                    )
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                a.sortOrder -
                                b.sortOrder
                        );

                // =================================================
                // SORT LESSONS
                // =================================================

                modules.forEach(
                    module => {

                        module.lessons =
                            module.lessons
                                .sort(
                                    (
                                        a,
                                        b
                                    ) =>
                                        a.sortOrder -
                                        b.sortOrder
                                );

                    }
                );

                // =================================================
                // GLOBAL LESSON LIST
                // =================================================

                const lessonMap =
                    new Map<
                        number,
                        Lesson
                    >();

                modules.forEach(
                    module => {

                        module.lessons.forEach(
                            lesson => {

                                if (
                                    !lessonMap.has(
                                        lesson.lessonId
                                    )
                                ) {

                                    lessonMap.set(
                                        lesson.lessonId,
                                        lesson
                                    );

                                }

                            }
                        );

                    }
                );

                const allLoadedLessons =
                    Array.from(
                        lessonMap.values()
                    )
                        .sort(
                            (
                                a,
                                b
                            ) => {

                                if (
                                    a.moduleSortOrder !==
                                    b.moduleSortOrder
                                ) {

                                    return (
                                        a.moduleSortOrder -
                                        b.moduleSortOrder
                                    );

                                }

                                return (
                                    a.sortOrder -
                                    b.sortOrder
                                );

                            }
                        );

                // =================================================
                // REBUILD MODULES FROM UNIQUE LESSONS
                // =================================================

                const finalModules =
                    modules
                        .map(
                            module => ({

                                ...module,

                                lessons:
                                    allLoadedLessons
                                        .filter(
                                            lesson =>
                                                lesson.moduleId ===
                                                module.courseModuleId
                                        )

                            })
                        )
                        .filter(
                            module =>
                                module.lessons.length > 0
                        );

                // =================================================
                // COMPLETION
                // =================================================

                const totalLessons =
                    allLoadedLessons.length;

                const completedLessons =
                    allLoadedLessons.filter(
                        lesson =>
                            lesson.progress
                                ?.isCompleted === true
                    ).length;

                const progressPercentage =
                    totalLessons > 0
                        ? Math.round(
                            (
                                completedLessons /
                                totalLessons
                            ) *
                            100
                        )
                        : 0;

                // =================================================
                // FINAL COURSE
                // =================================================

                const finalCourse: CourseData = {

                    courseId:
                        Number(
                            rawCourse?.courseId ??
                            rawCourse?.CourseId ??
                            courseId
                        ),

                    courseTitle:
                        rawCourse?.courseTitle ??
                        rawCourse?.CourseTitle ??
                        rawCourse?.title ??
                        rawCourse?.Title ??
                        "Untitled Course",

                    courseDescription:
                        rawCourse?.courseDescription ??
                        rawCourse?.CourseDescription ??
                        rawCourse?.description ??
                        rawCourse?.Description ??
                        null,

                    courseEnrollmentId:
                        enrollmentId,

                    progressPercentage,

                    isCompleted:
                        totalLessons > 0 &&
                        completedLessons ===
                        totalLessons,

                    enrolledDate:
                        rawCourse?.enrolledDate ??
                        rawCourse?.EnrolledDate ??
                        new Date().toISOString(),

                    completedDate:
                        rawCourse?.completedDate ??
                        rawCourse?.CompletedDate ??
                        null,

                    totalLessons,

                    completedLessons,

                    currentLessonId:
                        rawCourse?.currentLessonId ??
                        rawCourse?.CurrentLessonId ??
                        null,

                    modules:
                        finalModules

                };

                // =================================================
                // FINAL DEBUG
                // =================================================

                console.log(
                    "================================="
                );

                console.log(
                    "EPIC FINAL COURSE"
                );

                console.log(
                    "Modules:",
                    finalCourse.modules.length
                );

                console.log(
                    "Lessons:",
                    finalCourse.totalLessons
                );

                console.log(
                    "Completed:",
                    finalCourse.completedLessons
                );

                console.log(
                    "Progress:",
                    finalCourse.progressPercentage
                );

                console.log(
                    "================================="
                );

                console.log(
                    "EPIC FINAL LESSON SEQUENCE:"
                );

                allLoadedLessons.forEach(
                    (
                        lesson,
                        index
                    ) => {

                        console.log(
                            `${index + 1}. ${lesson.lessonId} - ${lesson.title}`
                        );

                    }
                );

                console.log(
                    "================================="
                );

                setCourse(
                    finalCourse
                );

            } catch (err) {

                console.error(
                    "EPIC LOAD COURSE ERROR:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load course."
                );

            } finally {

                setLoading(false);

            }

        },
        [
            courseId,
            getHeaders,
            getToken
        ]
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(
        () => {

            if (!courseId) {

                setError(
                    "Invalid course."
                );

                setLoading(false);

                return;

            }

            loadCourse();

        },
        [
            courseId,
            loadCourse
        ]
    );

    // =====================================================
    // ALL LESSONS
    // =====================================================

    const allLessons =
        useMemo(
            () => {

                if (!course) {

                    return [];

                }

                return course.modules
                    .flatMap(
                        module =>
                            module.lessons
                    )
                    .sort(
                        (
                            a,
                            b
                        ) => {

                            if (
                                a.moduleSortOrder !==
                                b.moduleSortOrder
                            ) {

                                return (
                                    a.moduleSortOrder -
                                    b.moduleSortOrder
                                );

                            }

                            return (
                                a.sortOrder -
                                b.sortOrder
                            );

                        }
                    );

            },
            [
                course
            ]
        );

    // =====================================================
    // LESSON INDEX
    // =====================================================

    const getLessonIndex =
        useCallback(
            (
                lessonId: number
            ) => {

                return allLessons.findIndex(
                    lesson =>
                        lesson.lessonId ===
                        lessonId
                );

            },
            [
                allLessons
            ]
        );

    // =====================================================
    // COMPLETED
    // =====================================================

    const isLessonCompleted =
        useCallback(
            (
                lesson: Lesson
            ) => {

                return (
                    lesson.progress
                        ?.isCompleted === true
                );

            },
            []
        );

    // =====================================================
    // UNLOCKED
    // =====================================================

    const isLessonUnlocked =
        useCallback(
            (
                index: number
            ) => {

                if (
                    index <= 0
                ) {

                    return true;

                }

                const previous =
                    allLessons[
                        index - 1
                    ];

                if (!previous) {

                    return false;

                }

                return isLessonCompleted(
                    previous
                );

            },
            [
                allLessons,
                isLessonCompleted
            ]
        );

    // =====================================================
    // OPEN LESSON
    // =====================================================

    const openLesson =
        useCallback(
            (
                lessonId: number
            ) => {

                const index =
                    getLessonIndex(
                        lessonId
                    );

                if (
                    index < 0
                ) {

                    console.warn(
                        "Lesson not found:",
                        lessonId
                    );

                    return;

                }

                const lesson =
                    allLessons[index];

                if (!lesson) {

                    return;

                }

                if (
                    !isLessonUnlocked(
                        index
                    )
                ) {

                    console.log(
                        "🔒 Lesson locked:",
                        lesson.title
                    );

                    return;

                }

                console.log(
                    "================================="
                );

                console.log(
                    "EPIC OPEN LESSON"
                );

                console.log(
                    "Lesson:",
                    lesson.lessonId
                );

                console.log(
                    "Title:",
                    lesson.title
                );

                console.log(
                    "================================="
                );

                // =================================================
                // IMPORTANT:
                // ALWAYS CONTROL THE VIEWER LOCALLY
                // =================================================

                setSelectedLessonId(
                    lessonId
                );

                // Notify parent if needed,
                // but DO NOT let the parent replace
                // our internal navigation.
                if (onLessonSelect) {

                    onLessonSelect(
                        lessonId
                    );

                }

            },
            [
                allLessons,
                getLessonIndex,
                isLessonUnlocked,
                onLessonSelect
            ]
        );

    // =====================================================
    // SELECTED INDEX
    // =====================================================

    const selectedLessonIndex =
        selectedLessonId !== null
            ? getLessonIndex(
                selectedLessonId
            )
            : -1;

    // =====================================================
    // CURRENT LESSON
    // =====================================================

    const currentLesson =
        selectedLessonIndex >= 0
            ? allLessons[
                selectedLessonIndex
            ]
            : null;

    // =====================================================
    // PREVIOUS LESSON
    // =====================================================

    const previousLesson =
        selectedLessonIndex > 0
            ? allLessons[
                selectedLessonIndex - 1
            ]
            : null;

    // =====================================================
    // NEXT LESSON
    // =====================================================

    const nextLesson =
        selectedLessonIndex >= 0 &&
            selectedLessonIndex <
            allLessons.length - 1
            ? allLessons[
                selectedLessonIndex + 1
            ]
            : null;

    // =====================================================
    // PREVIOUS
    // =====================================================

    const handlePreviousLesson =
        useCallback(
            () => {

                if (!previousLesson) {

                    return;

                }

                console.log(
                    "Previous lesson:",
                    previousLesson.lessonId
                );

                setSelectedLessonId(
                    previousLesson.lessonId
                );

            },
            [
                previousLesson
            ]
        );

    // =====================================================
    // NEXT
    //
    // IMPORTANT:
    // DO NOT CHECK STALE ViewCourse PROGRESS HERE.
    // LessonViewer already controls whether Next is enabled.
    // =====================================================

    const handleNextLesson =
        useCallback(
            () => {

                if (!nextLesson) {

                    console.log(
                        "No next lesson."
                    );

                    return;

                }

                console.log(
                    "================================="
                );

                console.log(
                    "EPIC NEXT LESSON"
                );

                console.log(
                    "Current:",
                    currentLesson?.lessonId,
                    currentLesson?.title
                );

                console.log(
                    "Next:",
                    nextLesson.lessonId,
                    nextLesson.title
                );

                console.log(
                    "================================="
                );

                setSelectedLessonId(
                    nextLesson.lessonId
                );

            },
            [
                currentLesson,
                nextLesson
            ]
        );

    // =====================================================
    // PROGRESS UPDATED
    // =====================================================

    const handleProgressUpdated =
        useCallback(
            (
                completedLessonId: number
            ) => {

                console.log(
                    "EPIC PROGRESS UPDATED:",
                    completedLessonId
                );

                setCourse(
                    previousCourse => {

                        if (
                            !previousCourse
                        ) {

                            return previousCourse;

                        }

                        const updatedModules =
                            previousCourse.modules.map(
                                module => ({

                                    ...module,

                                    lessons:
                                        module.lessons.map(
                                            lesson => {

                                                if (
                                                    lesson.lessonId !==
                                                    completedLessonId
                                                ) {

                                                    return lesson;

                                                }

                                                return {

                                                    ...lesson,

                                                    progress: {

                                                        progressPercentage:
                                                            100,

                                                        isCompleted:
                                                            true,

                                                        startedDate:
                                                            lesson.progress
                                                                ?.startedDate ??
                                                            new Date().toISOString(),

                                                        completedDate:
                                                            new Date().toISOString()

                                                    }

                                                };

                                            }
                                        )

                                })
                            );

                        const updatedLessons =
                            updatedModules
                                .flatMap(
                                    module =>
                                        module.lessons
                                );

                        const totalLessons =
                            updatedLessons.length;

                        const completedLessons =
                            updatedLessons.filter(
                                lesson =>
                                    lesson.progress
                                        ?.isCompleted === true
                            ).length;

                        const progressPercentage =
                            totalLessons > 0
                                ? Math.round(
                                    (
                                        completedLessons /
                                        totalLessons
                                    ) *
                                    100
                                )
                                : 0;

                        return {

                            ...previousCourse,

                            modules:
                                updatedModules,

                            totalLessons,

                            completedLessons,

                            progressPercentage,

                            isCompleted:
                                totalLessons > 0 &&
                                completedLessons ===
                                totalLessons

                        };

                    }
                );

            },
            []
        );

    // =====================================================
    // LESSON VIEWER
    // =====================================================

    if (
        selectedLessonId !== null
    ) {

        return (

            <LessonViewer

                lessonId={
                    selectedLessonId
                }

                courseId={
                    courseId
                }

                onBack={() => {

                    setSelectedLessonId(
                        null
                    );

                }}

                hasPrevious={
                    !!previousLesson
                }

                onPrevious={
                    previousLesson
                        ? handlePreviousLesson
                        : undefined
                }

                hasNext={
                    !!nextLesson
                }

                onNext={
                    nextLesson
                        ? handleNextLesson
                        : undefined
                }

                onProgressUpdated={
                    handleProgressUpdated
                }

            />

        );

    }

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="view-course-loading">

                <div className="loading-spinner" />

                <p>
                    Loading course...
                </p>

            </div>

        );

    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div className="view-course-error">

                <h2>
                    Unable to load course
                </h2>

                <p>
                    {error}
                </p>

                <button
                    type="button"
                    onClick={onBack}
                >
                    ← Back to EPIC Learning
                </button>

            </div>

        );

    }

    // =====================================================
    // NO COURSE
    // =====================================================

    if (!course) {

        return (

            <div className="view-course-error">

                <h2>
                    Course not found
                </h2>

                <button
                    type="button"
                    onClick={onBack}
                >
                    ← Back to EPIC Learning
                </button>

            </div>

        );

    }

    // =====================================================
    // COURSE PAGE
    // =====================================================

    return (

        <div className="view-course">

            {/* =================================================
                BACK
            ================================================= */}

            <button
                type="button"
                className="view-course-back"
                onClick={onBack}
            >
                ← Back to EPIC Learning
            </button>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="view-course-header">

                <div className="view-course-header-content">

                    <span className="view-course-eyebrow">
                        EPIC LEARNING
                    </span>

                    <h1>
                        {course.courseTitle}
                    </h1>

                    {course.courseDescription && (

                        <p>
                            {course.courseDescription}
                        </p>

                    )}

                </div>

            </div>

            {/* =================================================
                PROGRESS
            ================================================= */}

            <div className="view-course-progress-card">

                <div className="view-course-progress-top">

                    <div>

                        <span>
                            Course Progress
                        </span>

                        <strong>
                            {course.progressPercentage}%
                        </strong>

                    </div>

                    <div className="view-course-progress-count">

                        {course.completedLessons}
                        {" / "}
                        {course.totalLessons}
                        {" lessons"}

                    </div>

                </div>

                <div className="view-course-progress-bar">

                    <div
                        className="view-course-progress-fill"
                        style={{
                            width:
                                `${course.progressPercentage}%`
                        }}
                    />

                </div>

                {course.isCompleted && (

                    <div className="course-completed-message">

                        🎉 Course Completed!

                    </div>

                )}

            </div>

            {/* =================================================
                LESSONS
            ================================================= */}

            <div className="view-course-modules">

                {allLessons.length === 0 ? (

                    <div className="view-course-error">

                        <h2>
                            No lessons found
                        </h2>

                        <p>
                            The course was loaded, but no
                            lessons were found in the API
                            response.
                        </p>

                        <p>

                            Open the browser console and check:

                            <br />

                            <strong>
                                EPIC RAW COURSE
                            </strong>

                            <br />

                            <strong>
                                EPIC RAW MODULES
                            </strong>

                        </p>

                    </div>

                ) : (

                    course.modules.map(
                        (
                            module,
                            moduleIndex
                        ) => (

                            <div
                                className="view-course-module"
                                key={
                                    `module-${module.courseModuleId}`
                                }
                            >

                                {/* =================================================
                                    MODULE HEADER
                                ================================================= */}

                                <div className="view-course-module-header">

                                    <div className="module-number">

                                        {moduleIndex + 1}

                                    </div>

                                    <div>

                                        <h2>
                                            {module.title}
                                        </h2>

                                        {module.description && (

                                            <p>
                                                {
                                                    module.description
                                                }
                                            </p>

                                        )}

                                    </div>

                                </div>

                                {/* =================================================
                                    LESSONS
                                ================================================= */}

                                <div className="view-course-lessons">

                                    {module.lessons.map(
                                        lesson => {

                                            const globalIndex =
                                                getLessonIndex(
                                                    lesson.lessonId
                                                );

                                            const completed =
                                                isLessonCompleted(
                                                    lesson
                                                );

                                            const unlocked =
                                                isLessonUnlocked(
                                                    globalIndex
                                                );

                                            const progress =
                                                Math.min(
                                                    100,
                                                    Math.max(
                                                        0,
                                                        lesson.progress
                                                            ?.progressPercentage ??
                                                        0
                                                    )
                                                );

                                            return (

                                                <div
                                                    key={
                                                        `lesson-${module.courseModuleId}-${lesson.lessonId}`
                                                    }

                                                    className={
                                                        `view-course-lesson ${
                                                            completed
                                                                ? "completed"
                                                                : ""
                                                        } ${
                                                            !unlocked
                                                                ? "locked"
                                                                : ""
                                                        }`
                                                    }

                                                    onClick={() => {

                                                        if (
                                                            unlocked
                                                        ) {

                                                            openLesson(
                                                                lesson.lessonId
                                                            );

                                                        }

                                                    }}

                                                    role="button"

                                                    tabIndex={
                                                        unlocked
                                                            ? 0
                                                            : -1
                                                    }

                                                    aria-disabled={
                                                        !unlocked
                                                    }

                                                    onKeyDown={
                                                        event => {

                                                            if (
                                                                !unlocked
                                                            ) {

                                                                return;

                                                            }

                                                            if (
                                                                event.key ===
                                                                "Enter" ||
                                                                event.key ===
                                                                " "
                                                            ) {

                                                                event.preventDefault();

                                                                openLesson(
                                                                    lesson.lessonId
                                                                );

                                                            }

                                                        }
                                                    }

                                                    title={
                                                        unlocked
                                                            ? `Open ${lesson.title}`
                                                            : "Complete the previous lesson first."
                                                    }
                                                >

                                                    {/* =================================================
                                                        LESSON NUMBER
                                                    ================================================= */}

                                                    <div
                                                        className={
                                                            `lesson-number ${
                                                                !unlocked
                                                                    ? "locked"
                                                                    : ""
                                                            }`
                                                        }
                                                    >

                                                        {completed
                                                            ? "✓"
                                                            : !unlocked
                                                                ? "🔒"
                                                                : globalIndex + 1}

                                                    </div>

                                                    {/* =================================================
                                                        LESSON CONTENT
                                                    ================================================= */}

                                                    <div className="lesson-content">

                                                        <h3>
                                                            {
                                                                lesson.title
                                                            }
                                                        </h3>

                                                        <div className="lesson-meta">

                                                            <span>
                                                                ⏱{" "}
                                                                {
                                                                    lesson.estimatedMinutes
                                                                }{" "}
                                                                min
                                                            </span>

                                                            {lesson.isFreePreview && (

                                                                <span className="lesson-preview">
                                                                    Preview
                                                                </span>

                                                            )}

                                                            {completed && (

                                                                <span className="lesson-completed">
                                                                    ✓ Completed
                                                                </span>

                                                            )}

                                                            {!unlocked && (

                                                                <span className="lesson-locked">
                                                                    🔒 Locked
                                                                </span>

                                                            )}

                                                        </div>

                                                        {!completed &&
                                                            unlocked &&
                                                            progress > 0 && (

                                                                <div className="lesson-mini-progress">

                                                                    <div>

                                                                        <span
                                                                            style={{
                                                                                width:
                                                                                    `${progress}%`
                                                                            }}
                                                                        />

                                                                    </div>

                                                                    <small>
                                                                        {progress}%
                                                                    </small>

                                                                </div>

                                                            )}

                                                    </div>

                                                    {/* =================================================
                                                        ACTION
                                                    ================================================= */}

                                                    <button
                                                        type="button"

                                                        className={
                                                            `lesson-action ${
                                                                !unlocked
                                                                    ? "locked"
                                                                    : ""
                                                            }`
                                                        }

                                                        disabled={
                                                            !unlocked
                                                        }

                                                        onClick={
                                                            event => {

                                                                event.stopPropagation();

                                                                if (
                                                                    unlocked
                                                                ) {

                                                                    openLesson(
                                                                        lesson.lessonId
                                                                    );

                                                                }

                                                            }
                                                        }

                                                        aria-label={
                                                            unlocked
                                                                ? `Open ${lesson.title}`
                                                                : `${lesson.title} is locked`
                                                        }
                                                    >

                                                        {unlocked
                                                            ? "→"
                                                            : "🔒"}

                                                    </button>

                                                </div>

                                            );

                                        }
                                    )}

                                </div>

                            </div>

                        )
                    )

                )}

            </div>

        </div>

    );

};

export default ViewCourse;