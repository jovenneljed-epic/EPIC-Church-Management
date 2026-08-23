
import React from "react";
import "./BlogPage.css";

interface BlogPost {
    id: number;
    category: string;
    date: string;
    title: string;
    excerpt: string;
    icon: string;
    featured?: boolean;
}

interface BlogPageProps {
    onNavigate?: (page: string) => void;
}

const BlogPage: React.FC<BlogPageProps> = ({
    onNavigate,
}) => {
    const posts: BlogPost[] = [
        {
            id: 1,
            category: "FAITH",
            date: "August 2026",
            title: "Growing Deeper in Our Walk With Christ",
            excerpt:
                "Faith is not simply something we believe. It is a daily journey of knowing Christ, trusting His Word, and allowing Him to transform the way we live.",
            icon: "✝",
            featured: true,
        },
        {
            id: 2,
            category: "DISCIPLESHIP",
            date: "August 2026",
            title: "Why Discipleship Matters",
            excerpt:
                "Discover why intentional discipleship is essential for spiritual growth and how we can help one another become faithful followers of Jesus.",
            icon: "📖",
        },
        {
            id: 3,
            category: "FAMILY",
            date: "August 2026",
            title: "Building Stronger Families",
            excerpt:
                "Strong families are built through faith, love, communication, forgiveness, and a shared commitment to follow God's purpose.",
            icon: "❤️",
        },
        {
            id: 4,
            category: "LEADERSHIP",
            date: "August 2026",
            title: "Leading Through Servanthood",
            excerpt:
                "Christian leadership begins with a heart willing to serve. Learn how servant leadership reflects the character of Christ.",
            icon: "🤝",
        },
        {
            id: 5,
            category: "COMMUNITY",
            date: "August 2026",
            title: "The Power of Christian Community",
            excerpt:
                "We were never designed to walk alone. Fellowship gives us opportunities to encourage, support, pray for, and grow with one another.",
            icon: "👥",
        },
        {
            id: 6,
            category: "SPIRITUAL GROWTH",
            date: "August 2026",
            title: "Making Room for God Every Day",
            excerpt:
                "Small daily practices of prayer, Scripture, worship, and reflection can help us develop a deeper and more consistent relationship with God.",
            icon: "🌱",
        },
    ];

    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        }
    };

    return (
        <div className="epic-public-page epic-public-blog">

            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="blog-hero">

                <div className="blog-hero-overlay" />

                <div className="blog-hero-content">

                    <span className="blog-eyebrow">
                        EPIC BLOG
                    </span>

                    <h1>
                        Faith.
                        <span>Life. Purpose.</span>
                    </h1>

                    <p>
                        Encouragement, biblical insights, practical
                        wisdom, and stories designed to help you
                        grow in faith and live with purpose.
                    </p>

                </div>

            </section>

            {/* =====================================================
                INTRO
            ===================================================== */}

            <section className="blog-intro">

                <div className="blog-container">

                    <div className="blog-intro-grid">

                        <div className="blog-intro-content">

                            <span className="blog-section-label">
                                FROM THE EPIC COMMUNITY
                            </span>

                            <h2>
                                Stories That
                                <span> Inspire Growth</span>
                            </h2>

                            <p>
                                The Christian journey is filled with
                                lessons, challenges, victories, and
                                opportunities to grow. Our blog is a
                                place to share biblical encouragement
                                and practical reflections for everyday
                                life.
                            </p>

                            <p>
                                Whether you are beginning your journey
                                with Christ or have been following Him
                                for years, we hope these resources
                                encourage you to keep growing.
                            </p>

                        </div>

                        <div className="blog-intro-card">

                            <div className="blog-intro-icon">
                                ✦
                            </div>

                            <strong>
                                Grow. Reflect. Live.
                            </strong>

                            <p>
                                Every story can point us toward
                                Christ and help us discover how
                                faith shapes everyday life.
                            </p>

                        </div>

                    </div>

                </div>

            </section>

            {/* =====================================================
                FEATURED POST
            ===================================================== */}

            <section className="blog-featured">

                <div className="blog-container">

                    <div className="blog-section-heading">

                        <span className="blog-section-label">
                            FEATURED
                        </span>

                        <h2>
                            Featured Reflection
                        </h2>

                    </div>

                    <article className="blog-featured-card">

                        <div className="blog-featured-visual">

                            <div className="blog-featured-symbol">
                                ✝
                            </div>

                            <span>
                                ENGAGING PEOPLE INTO CHRIST
                            </span>

                        </div>

                        <div className="blog-featured-content">

                            <div className="blog-post-meta">

                                <span>
                                    {posts[0].category}
                                </span>

                                <span>
                                    {posts[0].date}
                                </span>

                            </div>

                            <h3>
                                {posts[0].title}
                            </h3>

                            <p>
                                {posts[0].excerpt}
                            </p>

                            <button
                                type="button"
                                className="blog-primary-button"
                                onClick={() =>
                                    handleNavigate("contact")
                                }
                            >
                                Read More
                                <span>→</span>
                            </button>

                        </div>

                    </article>

                </div>

            </section>

            {/* =====================================================
                BLOG POSTS
            ===================================================== */}

            <section className="blog-posts">

                <div className="blog-container">

                    <div className="blog-section-heading">

                        <span className="blog-section-label">
                            LATEST ARTICLES
                        </span>

                        <h2>
                            Explore Our Blog
                        </h2>

                        <p>
                            Practical encouragement and biblical
                            reflections for your journey of faith.
                        </p>

                    </div>

                    <div className="blog-grid">

                        {posts.slice(1).map((post) => (

                            <article
                                key={post.id}
                                className="blog-card"
                            >

                                <div className="blog-card-image">

                                    <div className="blog-card-icon">
                                        {post.icon}
                                    </div>

                                    <span>
                                        {post.category}
                                    </span>

                                </div>

                                <div className="blog-card-content">

                                    <div className="blog-card-date">
                                        {post.date}
                                    </div>

                                    <h3>
                                        {post.title}
                                    </h3>

                                    <p>
                                        {post.excerpt}
                                    </p>

                                    <button
                                        type="button"
                                        className="blog-read-more"
                                        onClick={() =>
                                            handleNavigate("contact")
                                        }
                                    >
                                        Read Article
                                        <span>→</span>
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>

                </div>

            </section>

            {/* =====================================================
                EPIC LEARNING CONNECTION
            ===================================================== */}

            <section className="blog-learning">

                <div className="blog-container">

                    <div className="blog-learning-card">

                        <div className="blog-learning-content">

                            <span className="blog-section-label">
                                GO DEEPER
                            </span>

                            <h2>
                                Turn Inspiration Into
                                <span> Spiritual Growth</span>
                            </h2>

                            <p>
                                Reading can inspire us, but discipleship
                                helps us grow. Explore EPIC Learning for
                                structured lessons designed to help you
                                understand God's Word and strengthen
                                your relationship with Christ.
                            </p>

                            <button
                                type="button"
                                className="blog-primary-button"
                                onClick={() =>
                                    handleNavigate("learning")
                                }
                            >
                                Explore EPIC Learning
                                <span>→</span>
                            </button>

                        </div>

                        <div className="blog-learning-mark">

                            <div className="blog-learning-logo">
                                📚
                            </div>

                            <strong>
                                EPIC Learning
                            </strong>

                            <span>
                                Grow in Faith
                            </span>

                        </div>

                    </div>

                </div>

            </section>

            {/* =====================================================
                CTA
            ===================================================== */}

            <section className="blog-cta">

                <div className="blog-cta-overlay" />

                <div className="blog-cta-content">

                    <span className="blog-section-label">
                        KEEP GROWING
                    </span>

                    <h2>
                        Your Journey of Faith
                        <span> Is Worth Investing In.</span>
                    </h2>

                    <p>
                        Connect with the EPIC community, discover
                        opportunities to grow, and take your next
                        step toward Christ.
                    </p>

                    <div className="blog-cta-actions">

                        <button
                            type="button"
                            className="blog-primary-button light"
                            onClick={() =>
                                handleNavigate("ministries")
                            }
                        >
                            Find a Ministry
                            <span>→</span>
                        </button>

                        <button
                            type="button"
                            className="blog-secondary-button light"
                            onClick={() =>
                                handleNavigate("contact")
                            }
                        >
                            Connect With Us
                        </button>

                    </div>

                </div>

            </section>

        </div>
    );
};

export default BlogPage;

