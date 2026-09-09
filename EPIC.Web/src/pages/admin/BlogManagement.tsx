import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  PenTool,
  Image as ImageIcon,
  Share2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Search,
  Upload,
  Link as LinkIcon,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
  Quote,
  Video,
  List,
  HeartHandshake
} from "lucide-react";
import {
  getAdminBlogs,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost
} from "../../services/blogService";
import type { BlogPost } from "../../services/blogService";
import "./blogManagement.css";

const CATEGORIES = [
  "Faith & Life",
  "Documentary & Truth",
  "Church News",
  "Pastoral Leadership",
  "Discipleship & Worship",
  "Marriage & Family",
  "Biblical Truth",
  "Mental Health & Healing",
  "Youth & Campus",
  "Missions & Outreach",
  "Community & Fellowship",
  "Events & Announcements"
];

const AUTHORS = [
  "Pastor Ronnel M. Aviguetero",
  "EPIC Pastoral Council",
  "EPIC Media Ministry",
  "Youth & Campus Leadership"
];

const TAGLINE_PRESETS = [
  {
    name: "Docu: Pastor's Wife",
    tagline: "Documentary: The Silent Sacrifices & Sacred Calling",
    url: "/images/og/pastors-wife-documentary-tagline.jpg"
  },
  {
    name: "Celebrity Pastor Culture",
    tagline: "The Fall of the Celebrity Pastor & Return to Shepherding",
    url: "/images/og/celebrity-pastor-tagline.jpg"
  },
  {
    name: "Pastoral Burnout",
    tagline: "When the Pulpit Hurts: Overcoming Pastoral Burnout in Silence",
    url: "/images/og/pastoral-burnout-tagline.jpg"
  },
  {
    name: "EPIC Main Banner",
    tagline: "Equipping Churches, Empowering Shepherds, Impacting Generations",
    url: "/images/og/epic-main-tagline.jpg"
  }
];

export default function BlogManagement() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // The 8 Standardized Fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [coverImage, setCoverImage] = useState("/images/og/epic-main-tagline.jpg");
  const [category, setCategory] = useState("Faith & Life");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("Pastor Ronnel M. Aviguetero");
  const [isPublished, setIsPublished] = useState(true);

  // Form helpers
  const [imageTab, setImageTab] = useState<"presets" | "upload" | "url">("presets");
  const [editingId, setEditingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");

  // Load existing articles on mount
  async function loadBlogs() {
    try {
      const data = await getAdminBlogs();
      setBlogs(data);
    } catch (err) {
      console.error("Failed to fetch blogs", err);
    }
  }

  useEffect(() => {
    loadBlogs();
  }, []);

  // Auto-generate URL slug from title
  const computedSlug = useMemo(() => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, [title]);

  // Statistics
  const stats = useMemo(() => {
    const total = blogs.length;
    const published = blogs.filter((b) => b.isPublished).length;
    const drafts = total - published;
    return { total, published, drafts };
  }, [blogs]);

  // Filtered articles list
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesSearch =
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (blog.subtitle && blog.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (blog.author && blog.author.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat =
        filterCategory === "all" || blog.category.toLowerCase() === filterCategory.toLowerCase();

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "published" && blog.isPublished) ||
        (filterStatus === "draft" && !blog.isPublished);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [blogs, searchTerm, filterCategory, filterStatus]);

  // Handle local file upload (converts to base64 DataURL)
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAlert({ text: "Please upload a valid image file (PNG, JPG, WebP).", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setCoverImage(event.target.result);
        setAlert({ text: "Tagline image banner uploaded successfully!", type: "success" });
      }
    };
    reader.readAsDataURL(file);
  }

  // Quick toolbar insertion into article content
  function insertSnippet(snippet: string) {
    if (!contentTextareaRef.current) {
      setContent((prev) => prev + snippet);
      return;
    }

    const textarea = contentTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = content.substring(0, start);
    const textAfter = content.substring(end);

    const newContent = textBefore + snippet + textAfter;
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  }

  // Reset form
  function resetForm() {
    setTitle("");
    setSubtitle("");
    setCoverImage("/images/og/epic-main-tagline.jpg");
    setCategory("Faith & Life");
    setExcerpt("");
    setContent("");
    setAuthor("Pastor Ronnel M. Aviguetero");
    setIsPublished(true);
    setEditingId(null);
  }

  // Edit existing article
  function handleEdit(blog: BlogPost) {
    setEditingId(blog.blogPostId);
    setTitle(blog.title);
    setSubtitle(blog.subtitle || blog.excerpt || "");
    setCoverImage(blog.coverImage || "/images/og/epic-main-tagline.jpg");
    setCategory(blog.category || "Faith & Life");
    setExcerpt(blog.excerpt || "");
    setContent(blog.content || "");
    setAuthor(blog.author || "Pastor Ronnel M. Aviguetero");
    setIsPublished(blog.isPublished);

    window.scrollTo({ top: 0, behavior: "smooth" });
    setAlert({ text: `Loaded "${blog.title}" into the Publishing Studio for editing.`, type: "success" });
  }

  // Save / Publish post
  async function handleSave(publishState: boolean) {
    if (!title.trim()) {
      setAlert({ text: "Article Title is required before saving.", type: "error" });
      return;
    }
    if (!content.trim()) {
      setAlert({ text: "Article Content cannot be empty.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update existing article
        await updateBlogPost(editingId, {
          title,
          subtitle: subtitle || excerpt,
          category,
          excerpt: excerpt || subtitle,
          content,
          coverImage,
          author,
          isPublished: publishState
        });
        setAlert({
          text: `Article "${title}" updated successfully as ${publishState ? "Published" : "Draft"}!`,
          type: "success"
        });
      } else {
        // Create new article
        await createBlogPost({
          title,
          subtitle: subtitle || excerpt,
          category,
          excerpt: excerpt || subtitle,
          content,
          coverImage,
          author,
          isPublished: publishState
        });
        setAlert({
          text: `Article "${title}" created successfully as ${publishState ? "Published" : "Draft"}!`,
          type: "success"
        });
      }

      resetForm();
      await loadBlogs();
    } catch (err) {
      console.error("Save failed", err);
      setAlert({ text: "Failed to save article. Please check connection and try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Toggle publish status from table
  async function handleTogglePublish(blog: BlogPost) {
    try {
      await updateBlogPost(blog.blogPostId, {
        isPublished: !blog.isPublished
      });
      await loadBlogs();
      setAlert({
        text: `"${blog.title}" is now ${!blog.isPublished ? "Published" : "a Draft"}.`,
        type: "success"
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Delete article
  async function handleDelete(blog: BlogPost) {
    if (!window.confirm(`Are you sure you want to delete "${blog.title}"?`)) {
      return;
    }

    try {
      await deleteBlogPost(blog.blogPostId);
      await loadBlogs();
      setAlert({ text: `Article "${blog.title}" deleted successfully.`, type: "success" });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="blog-studio-container">
      {/* Studio Header */}
      <header className="studio-header">
        <div className="studio-header-title">
          <div className="studio-header-icon">
            <PenTool size={26} color="#ffffff" />
          </div>
          <div>
            <h1>EPIC Blog Publishing Studio</h1>
            <p>Standardized 8-field workflow with automated Open Graph tagline banners</p>
          </div>
        </div>

        <div className="studio-stats-badges">
          <div className="stat-badge">
            <Layers size={14} /> Total Articles: <strong>{stats.total}</strong>
          </div>
          <div className="stat-badge">
            <CheckCircle2 size={14} color="#34d399" /> Published: <strong>{stats.published}</strong>
          </div>
          <div className="stat-badge">
            <AlertCircle size={14} color="#fbbf24" /> Drafts: <strong>{stats.drafts}</strong>
          </div>
        </div>
      </header>

      {/* Alert Notification */}
      {alert && (
        <div className={`studio-alert ${alert.type}`}>
          {alert.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Studio Two-Column Layout */}
      <div className="studio-layout">
        {/* Left Column: 8-Field Publishing Form */}
        <section className="studio-form-panel">
          <h2 className="form-section-title">
            <Sparkles size={18} color="#38bdf8" />
            {editingId ? `Editing Article #${editingId}` : "Create New Article"}
          </h2>

          {/* FIELD 1: Article Title */}
          <div className="field-group">
            <label className="field-label">
              <span>1. Article Title <span className="req">*</span></span>
              <span className="hint">Main headline for the article and cards</span>
            </label>
            <input
              className="studio-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. When the Pulpit Hurts: Overcoming Pastoral Burnout in Silence"
            />
            {computedSlug && (
              <div className="slug-preview-bar">
                <span>Public URL:</span>
                <code>https://epic-cms.vercel.app/blog/{computedSlug}</code>
              </div>
            )}
          </div>

          {/* FIELD 2: Tagline / Subtitle */}
          <div className="field-group">
            <label className="field-label">
              <span>2. Tagline / Subtitle <span className="req">*</span></span>
              <span className="hint">Compelling line under the title</span>
            </label>
            <input
              className="studio-input"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. A Christian Documentary & Pastoral Survival Guide"
            />
          </div>

          {/* FIELD 3: Featured Image / Tagline Banner */}
          <div className="field-group">
            <label className="field-label">
              <span>3. Featured Image (Tagline Banner) <span className="req">*</span></span>
              <span className="hint">1200×630 banner for Facebook, Twitter, and cards</span>
            </label>

            <div className="image-upload-wrapper">
              <div className="image-source-toggle">
                <button
                  type="button"
                  className={`tab-btn ${imageTab === "presets" ? "active" : ""}`}
                  onClick={() => setImageTab("presets")}
                >
                  <Sparkles size={13} style={{ display: "inline", marginRight: 4 }} />
                  Tagline Presets
                </button>
                <button
                  type="button"
                  className={`tab-btn ${imageTab === "upload" ? "active" : ""}`}
                  onClick={() => setImageTab("upload")}
                >
                  <Upload size={13} style={{ display: "inline", marginRight: 4 }} />
                  Upload Banner
                </button>
                <button
                  type="button"
                  className={`tab-btn ${imageTab === "url" ? "active" : ""}`}
                  onClick={() => setImageTab("url")}
                >
                  <LinkIcon size={13} style={{ display: "inline", marginRight: 4 }} />
                  Direct URL
                </button>
              </div>

              {/* Tab 1: Presets */}
              {imageTab === "presets" && (
                <div>
                  <div className="tagline-presets-label">Click a pre-made high-converting tagline banner:</div>
                  <div className="tagline-presets-pills">
                    {TAGLINE_PRESETS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        className={`preset-pill ${coverImage === preset.url ? "active" : ""}`}
                        onClick={() => {
                          setCoverImage(preset.url);
                          if (!subtitle) {
                            setSubtitle(preset.tagline);
                          }
                        }}
                      >
                        <ImageIcon size={13} />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Upload */}
              {imageTab === "upload" && (
                <div
                  className="file-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <Upload size={28} color="#38bdf8" />
                  <p>Click or drag-and-drop to upload your 1200×630 tagline graphic</p>
                  <span className="hint" style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    Supports PNG, JPG, WebP
                  </span>
                </div>
              )}

              {/* Tab 3: URL Input */}
              {imageTab === "url" && (
                <input
                  className="studio-input"
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Paste banner image URL (e.g. https://...)"
                />
              )}

              {/* Thumbnail preview */}
              {coverImage && (
                <div className="image-preview-box">
                  <img src={coverImage} alt="Tagline Banner Preview" />
                  <div className="image-preview-badge">1200 × 630 Banner Active</div>
                </div>
              )}
            </div>
          </div>

          {/* FIELD 4: Category */}
          <div className="field-group">
            <label className="field-label">
              <span>4. Ministry Category <span className="req">*</span></span>
              <span className="hint">12 Church ministry topics</span>
            </label>
            <select
              className="studio-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* FIELD 5: Excerpt / Short Summary */}
          <div className="field-group">
            <label className="field-label">
              <span>5. Excerpt / Short Summary <span className="req">*</span></span>
              <span className="hint">{excerpt.length} characters</span>
            </label>
            <textarea
              className="studio-textarea"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="1-2 sentence compelling summary to hook readers when shared across Facebook, Twitter, and messaging apps..."
            />
          </div>

          {/* FIELD 6: Article Content & Rich Toolbar */}
          <div className="field-group">
            <label className="field-label">
              <span>6. Article Content <span className="req">*</span></span>
              <span className="hint">Rich formatting & media support</span>
            </label>

            {/* Content Toolbar Helpers */}
            <div className="rich-toolbar">
              <button
                type="button"
                className="tool-btn"
                onClick={() => insertSnippet("\n\n## Subheading Title\n\n")}
                title="Insert Subheading (H2)"
              >
                + H2 Heading
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={() =>
                  insertSnippet(
                    '\n\n> 📜 *"Your word is a lamp to my feet and a light to my path."* — **Psalm 119:105**\n\n'
                  )
                }
                title="Insert Bible Verse"
              >
                <BookOpen size={13} /> Bible Verse
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={() =>
                  insertSnippet(
                    '\n\n> 💬 *"Faith does not eliminate questions. But faith knows where to take them."*\n\n'
                  )
                }
                title="Insert Inspiring Quote"
              >
                <Quote size={13} /> Quote
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={() =>
                  insertSnippet(
                    '\n\n<div class="video-container">\n  <iframe src="https://www.youtube.com/embed/VIDEO_ID" title="Christian Sermon Video" frameborder="0" allowfullscreen></iframe>\n</div>\n\n'
                  )
                }
                title="Insert YouTube Video Embed"
              >
                <Video size={13} /> YouTube
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={() =>
                  insertSnippet(
                    "\n\n- Key Biblical Principle 1\n- Key Biblical Principle 2\n- Key Biblical Principle 3\n\n"
                  )
                }
                title="Insert Bullet List"
              >
                <List size={13} /> List
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={() =>
                  insertSnippet(
                    "\n\n### 🕊️ A Pastoral Prayer For You\nLord, give wisdom and courage to every shepherd and leader reading this today. Strengthen our families in Jesus' name.\n\n"
                  )
                }
                title="Insert Prayer / CTA"
              >
                <HeartHandshake size={13} /> Prayer / CTA
              </button>
            </div>

            <textarea
              ref={contentTextareaRef}
              className="studio-textarea with-toolbar"
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article here in Markdown or plain text. Use the helper buttons above to quickly add Bible verses, YouTube sermons, quotes, and headings..."
            />

            <div className="editor-footer">
              <span>Words: {content.trim() ? content.trim().split(/\s+/).length : 0}</span>
              <span>
                Est. Read Time:{" "}
                {Math.max(1, Math.ceil((content.trim() ? content.trim().split(/\s+/).length : 0) / 200))}{" "}
                min
              </span>
            </div>
          </div>

          {/* FIELD 7 & 8: Author and Publishing Status */}
          <div className="form-row-2">
            {/* FIELD 7: Author */}
            <div className="field-group">
              <label className="field-label">
                <span>7. Author <span className="req">*</span></span>
              </label>
              <select
                className="studio-select"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              >
                {AUTHORS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* FIELD 8: Status */}
            <div className="field-group">
              <label className="field-label">
                <span>8. Publishing Status <span className="req">*</span></span>
              </label>
              <select
                className="studio-select"
                value={isPublished ? "published" : "draft"}
                onChange={(e) => setIsPublished(e.target.value === "published")}
              >
                <option value="published">✅ Published (Live Immediately)</option>
                <option value="draft">📝 Draft (Private)</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="studio-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={() => handleSave(true)}
            >
              <CheckCircle2 size={16} />
              {loading ? "Publishing..." : editingId ? "Update & Publish" : "Publish Article"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={loading}
              onClick={() => handleSave(false)}
            >
              Save as Draft
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </section>

        {/* Right Column: Live Facebook / Social Feed Mockup */}
        <aside className="studio-sidebar">
          <div className="preview-card-box">
            <h3>
              <Share2 size={16} color="#38bdf8" />
              Live Facebook Feed Card Preview
            </h3>

            {/* Mockup card that reflects exactly what Facebook renders */}
            <div className="fb-feed-mockup">
              <div className="fb-card-image">
                {coverImage ? (
                  <img src={coverImage} alt="Social Card Tagline" />
                ) : (
                  <div className="placeholder">1200 × 630 Tagline Banner</div>
                )}
              </div>
              <div className="fb-card-meta">
                <div className="fb-domain">EPIC-CMS.VERCEL.APP</div>
                <div className="fb-title">
                  {title || "Your Compelling Blog Title Will Appear Here"}
                </div>
                <div className="fb-desc">
                  {subtitle ||
                    excerpt ||
                    "Your compelling tagline and short summary will be highlighted right here when this article is shared on Facebook, Messenger, and Twitter."}
                </div>
              </div>
            </div>

            <p className="preview-tip">
              ⚡ <strong>Dual-Tier Open Graph Engine Active</strong>: When anyone shares this article link
              on social platforms, Facebook and Twitter scrapers will automatically retrieve this exact
              1200×630 tagline graphic and description.
            </p>
          </div>
        </aside>
      </div>

      {/* Articles Management Table */}
      <section className="studio-list-panel">
        <div className="list-toolbar">
          <div className="list-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search articles by title, author, or subtitle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="studio-select"
            style={{ width: "auto", minWidth: 180, padding: "8px 12px", fontSize: "0.84rem" }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="list-filter-tabs">
            <button
              type="button"
              className={`filter-tab ${filterStatus === "all" ? "active" : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              All ({blogs.length})
            </button>
            <button
              type="button"
              className={`filter-tab ${filterStatus === "published" ? "active" : ""}`}
              onClick={() => setFilterStatus("published")}
            >
              Published ({blogs.filter((b) => b.isPublished).length})
            </button>
            <button
              type="button"
              className={`filter-tab ${filterStatus === "draft" ? "active" : ""}`}
              onClick={() => setFilterStatus("draft")}
            >
              Drafts ({blogs.filter((b) => !b.isPublished).length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="articles-table">
            <thead>
              <tr>
                <th style={{ minWidth: 280 }}>Article</th>
                <th>Category</th>
                <th>Author</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                    No articles found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr key={blog.blogPostId}>
                    <td>
                      <div className="table-article-info">
                        <img
                          src={blog.coverImage || "/images/og/epic-main-tagline.jpg"}
                          alt=""
                          className="table-thumb"
                        />
                        <div>
                          <div className="table-title">{blog.title}</div>
                          <div className="table-subtitle">
                            {blog.subtitle || blog.excerpt ? (
                              <span>{blog.subtitle || blog.excerpt}</span>
                            ) : (
                              <code>/blog/{blog.slug}</code>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-category">{blog.category}</span>
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                      {blog.author || "Pastor Ronnel M. Aviguetero"}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${blog.isPublished ? "published" : "draft"}`}
                        onClick={() => handleTogglePublish(blog)}
                        style={{ cursor: "pointer" }}
                        title="Click to toggle publish status"
                      >
                        {blog.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => handleEdit(blog)}
                          title="Edit article"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <a
                          href={`/blog/${blog.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon-action"
                          title="View live article"
                        >
                          <ExternalLink size={14} /> View
                        </a>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleDelete(blog)}
                          title="Delete article"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}