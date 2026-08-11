import React, { useEffect, useState } from "react";

interface Course {
    courseId: number;
    title: string;
    shortDescription?: string;
    description?: string;
    thumbnailUrl?: string;
    category?: string;
    level?: string;
    estimatedMinutes: number;
    isPublished: boolean;
    isFeatured: boolean;
    createdDate: string;
}

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5109/api";

const LearningPage: React.FC = () => {

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token") ||
                localStorage.getItem("accessToken") ||
                localStorage.getItem("jwt") ||
                localStorage.getItem("authToken") ||
                localStorage.getItem("epicToken");

            const response = await fetch(
                `${API_URL}/Courses`,
                {
                    headers: token
                        ? {
                            Authorization: `Bearer ${token}`,
                        }
                        : {},
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to load courses (${response.status})`
                );
            }

            const data = await response.json();

            setCourses(Array.isArray(data) ? data : []);

        } catch (err) {

            console.error(
                "EPIC Learning load error:",
                err
            );

            setError(
                "Unable to load learning courses."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="learning-page">

            {/* HEADER */}

            <div className="learning-header">

                <div>

                    <div className="learning-eyebrow">
                        EPIC LEARNING
                    </div>

                    <h1>
                        Grow. Learn. Serve.
                    </h1>

                    <p>
                        Equip your church members and leaders
                        through biblical learning and discipleship.
                    </p>

                </div>

                <div className="learning-header-icon">
                    📖
                </div>

            </div>

            {/* STATS */}

            <div className="learning-stats">

                <div className="learning-stat-card">

                    <span className="learning-stat-icon">
                        📚
                    </span>

                    <div>
                        <strong>
                            {courses.length}
                        </strong>

                        <span>
                            Available Courses
                        </span>
                    </div>

                </div>

                <div className="learning-stat-card">

                    <span className="learning-stat-icon">
                        🎓
                    </span>

                    <div>
                        <strong>
                            Learning
                        </strong>

                        <span>
                            Discipleship Program
                        </span>
                    </div>

                </div>

                <div className="learning-stat-card">

                    <span className="learning-stat-icon">
                        🏆
                    </span>

                    <div>
                        <strong>
                            Certificates
                        </strong>

                        <span>
                            Earned through completion
                        </span>
                    </div>

                </div>

            </div>

            {/* COURSES */}

            <div className="learning-section">

                <div className="learning-section-header">

                    <div>

                        <h2>
                            Featured Learning
                        </h2>

                        <p>
                            Explore courses designed to help
                            believers grow in faith and ministry.
                        </p>

                    </div>

                </div>

                {loading && (

                    <div className="learning-state">
                        Loading courses...
                    </div>

                )}

                {!loading && error && (

                    <div className="learning-state learning-error">
                        {error}
                    </div>

                )}

                {!loading &&
                    !error &&
                    courses.length === 0 && (

                        <div className="learning-empty">

                            <div className="learning-empty-icon">
                                📚
                            </div>

                            <h3>
                                No courses available yet
                            </h3>

                            <p>
                                Learning courses will appear here
                                once they are published.
                            </p>

                        </div>

                    )}

                {!loading &&
                    !error &&
                    courses.length > 0 && (

                        <div className="learning-course-grid">

                            {courses.map(course => (

                                <article
                                    className="learning-course-card"
                                    key={course.courseId}
                                >

                                    <div className="learning-course-image">

                                        {course.thumbnailUrl ? (

                                            <img
                                                src={course.thumbnailUrl}
                                                alt={course.title}
                                            />

                                        ) : (

                                            <div className="learning-course-placeholder">
                                                📖
                                            </div>

                                        )}

                                        {course.isFeatured && (

                                            <span className="learning-featured">
                                                FEATURED
                                            </span>

                                        )}

                                    </div>

                                    <div className="learning-course-body">

                                        <div className="learning-course-meta">

                                            {course.category && (
                                                <span>
                                                    {course.category}
                                                </span>
                                            )}

                                            {course.level && (
                                                <span>
                                                    {course.level}
                                                </span>
                                            )}

                                        </div>

                                        <h3>
                                            {course.title}
                                        </h3>

                                        <p>
                                            {course.shortDescription ||
                                                course.description ||
                                                "Start your learning journey."}
                                        </p>

                                        <div className="learning-course-footer">

                                            <span>
                                                ⏱{" "}
                                                {course.estimatedMinutes}
                                                {" "}minutes
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    alert(
                                                        `Course selected: ${course.title}`
                                                    )
                                                }
                                            >
                                                View Course
                                            </button>

                                        </div>

                                    </div>

                                </article>

                            ))}

                        </div>

                    )}

            </div>

        </div>
    );
};

export default LearningPage;