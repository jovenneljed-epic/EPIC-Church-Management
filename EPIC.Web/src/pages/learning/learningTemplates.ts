// ============================================================
// EPIC CHURCH MANAGEMENT SYSTEM
// learningTemplates.ts
//
// Ready-Made Lesson & Curriculum Templates for School Curriculum Specialists
// Supporting Video Embeds, Google Classroom, Google Sheets, & Summative Assessments.
// ============================================================

export interface QuizQuestion {
    id: string;
    question: string;
    type: "multiple_choice" | "true_false" | "short_answer";
    options: string[];
    correctAnswer: number | string | boolean;
    explanation?: string;
    points?: number;
}

export interface QuizData {
    title: string;
    description?: string;
    passingScorePercent: number;
    questions: QuizQuestion[];
}

export interface LessonTemplate {
    id: string;
    name: string;
    category: "Discipleship" | "Video" | "Classroom" | "Assessment" | "Practicum" | "Custom";
    description: string;
    icon: string;
    badge: string;
    estimatedMinutes: number;
    defaultTitle: string;
    defaultVideoUrl?: string;
    defaultGoogleClassroomUrl?: string;
    defaultGoogleSheetsUrl?: string;
    defaultContent: string;
    defaultQuiz?: QuizData;
}

// ============================================================
// URL HELPERS (YouTube, Vimeo, Google Sheets, Google Classroom)
// ============================================================

export function formatVideoEmbedUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;

    // YouTube: youtu.be/<id>
    const youtuBeMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
    if (youtuBeMatch && youtuBeMatch[1]) {
        return `https://www.youtube.com/embed/${youtuBeMatch[1]}`;
    }

    // YouTube: youtube.com/watch?v=<id>
    const ytWatchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/i);
    if (ytWatchMatch && ytWatchMatch[1]) {
        return `https://www.youtube.com/embed/${ytWatchMatch[1]}`;
    }

    // YouTube: youtube.com/embed/<id>
    if (trimmed.includes("youtube.com/embed/")) {
        return trimmed;
    }

    // Vimeo: vimeo.com/<id>
    const vimeoMatch = trimmed.match(/vimeo\.com\/([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return trimmed;
}

export function formatGoogleSheetsEmbedUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed.includes("docs.google.com/spreadsheets")) {
        return trimmed;
    }

    // If it already ends in pubhtml, widget=true, etc.
    if (trimmed.includes("/pubhtml") || trimmed.includes("/preview")) {
        return trimmed;
    }

    // Cleanly convert edit URL to preview/embed URL
    const cleanUrl = trimmed.split("/edit")[0];
    return `${cleanUrl}/preview?rm=minimal`;
}

export function isGoogleClassroomUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.toLowerCase().includes("classroom.google.com");
}

export function isGoogleSheetsUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.toLowerCase().includes("docs.google.com/spreadsheets");
}

// ============================================================
// READY-MADE TEMPLATES LIBRARY
// ============================================================

export const READY_MADE_LESSON_TEMPLATES: LessonTemplate[] = [
    {
        id: "discipleship_exposition",
        name: "Discipleship & Scripture Study",
        category: "Discipleship",
        badge: "Biblical Core",
        icon: "📖",
        description: "Scripture anchor passage, core doctrinal objectives, exposition, reflection prompts, and memory verse quiz.",
        estimatedMinutes: 25,
        defaultTitle: "Lesson: Living by Faith and Grace",
        defaultContent: `<h2>📖 Anchor Scripture</h2>
<blockquote style="border-left: 4px solid #3b82f6; padding-left: 14px; margin: 14px 0; color: #93c5fd; font-style: italic;">
  “For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, lest anyone should boast.” — Ephesians 2:8-9
</blockquote>

<h3>🎯 Learning Objectives</h3>
<ul>
  <li>Understand the biblical definition of grace and unconditional redemption.</li>
  <li>Distinguish between salvation by grace through faith versus salvation by human works.</li>
  <li>Apply gospel principles in daily Christian living and discipleship relationships.</li>
</ul>

<hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 24px 0;" />

<h3>💡 Biblical Exposition</h3>
<p>
  The apostle Paul reminds believers that salvation is fundamentally an act of divine love and initiative. 
  We were spiritually dead in trespasses, yet God, being rich in mercy, made us alive together with Christ.
</p>

<h4>1. The Meaning of Grace (Charis)</h4>
<p>
  Grace is unmerited, unearned divine favor. It cannot be purchased through human merit, church attendance, 
  or religious ritual. It is freely given to all who believe on Jesus Christ.
</p>

<h4>2. The Instrument of Faith (Pistis)</h4>
<p>
  Faith is trusting reliance upon Jesus Christ alone for salvation. It is not merely intellectual agreement, 
  but personal commitment to God's truth.
</p>

<hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 24px 0;" />

<h3>🤝 Discipleship Discussion & Reflection</h3>
<ol>
  <li>How does recognizing that your salvation is 100% a gift of grace eliminate personal pride and anxiety?</li>
  <li>In what ways do believers sometimes subtly fall into the trap of trying to earn God's favor?</li>
  <li>Who in your circle of influence needs to hear this liberating message of grace this week?</li>
</ol>

<div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 16px; margin-top: 20px;">
  <strong style="color: #60a5fa; display: block; font-size: 14px;">🧠 Memory Verse for the Week:</strong>
  <p style="margin: 6px 0 0; color: #e2e8f0; font-size: 15px;">“Therefore, having been justified by faith, we have peace with God through our Lord Jesus Christ.” — Romans 5:1</p>
</div>`,
        defaultQuiz: {
            title: "Summative Assessment: Faith & Grace",
            description: "Verify your comprehension of the core doctrinal principles taught in this lesson.",
            passingScorePercent: 80,
            questions: [
                {
                    id: "q1",
                    question: "According to Ephesians 2:8-9, how are believers saved?",
                    type: "multiple_choice",
                    options: [
                        "By righteous living and keeping the law",
                        "By grace through faith, as a gift of God",
                        "By baptism and regular church attendance",
                        "By intellectual understanding and personal virtue"
                    ],
                    correctAnswer: 1,
                    explanation: "Ephesians 2:8-9 states that salvation is by grace through faith, not of works, lest anyone should boast.",
                    points: 25
                },
                {
                    id: "q2",
                    question: "True or False: Biblical grace can be earned through consistent good works.",
                    type: "true_false",
                    options: ["True", "False"],
                    correctAnswer: "False",
                    explanation: "Grace by definition is unmerited, unearned divine favor.",
                    points: 25
                },
                {
                    id: "q3",
                    question: "What does the Greek word 'Pistis' (Faith) emphasize in biblical discipleship?",
                    type: "multiple_choice",
                    options: [
                        "Passive wishful thinking",
                        "Active, trusting reliance upon Jesus Christ",
                        "Blind adherence without questioning",
                        "Only ritual confession"
                    ],
                    correctAnswer: 1,
                    explanation: "Biblical faith is active surrender and trusting reliance upon the person and work of Christ.",
                    points: 25
                },
                {
                    id: "q4",
                    question: "According to Romans 5:1, what is the immediate result of being justified by faith?",
                    type: "multiple_choice",
                    options: [
                        "Freedom from all earthly trials",
                        "Peace with God through Jesus Christ",
                        "Guaranteed financial prosperity",
                        "Instant sinless perfection"
                    ],
                    correctAnswer: 1,
                    explanation: "Romans 5:1 declares: 'Therefore, having been justified by faith, we have peace with God through our Lord Jesus Christ.'",
                    points: 25
                }
            ]
        }
    },
    {
        id: "video_lecture_mastery",
        name: "Video Lecture & Digital Classroom",
        category: "Video",
        badge: "Media-Rich",
        icon: "🎬",
        description: "Embedded video player, chapter timestamps, study notes outline, and video comprehension test.",
        estimatedMinutes: 30,
        defaultTitle: "Lecture: Foundations of Biblical Leadership",
        defaultVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        defaultContent: `<h2>🎬 Lecture Overview & Syllabus</h2>
<p>
  Watch the video lecture above attentively. Follow along with the lecture outline below and note key insights 
  for your summative assessment.
</p>

<h3>⏱ Video Chapter Timestamps</h3>
<ul style="list-style-type: none; padding-left: 0;">
  <li style="padding: 6px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
    <strong style="color: #60a5fa;">00:00</strong> — Introduction & The Biblical Call to Leadership
  </li>
  <li style="padding: 6px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
    <strong style="color: #60a5fa;">06:15</strong> — Servant Leadership Modeled by Jesus (Mark 10:42-45)
  </li>
  <li style="padding: 6px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
    <strong style="color: #60a5fa;">14:30</strong> — Character vs. Competence in Church Ministry
  </li>
  <li style="padding: 6px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
    <strong style="color: #60a5fa;">22:45</strong> — Practical Steps for Mentoring Emerging Leaders
  </li>
  <li style="padding: 6px 0;">
    <strong style="color: #60a5fa;">28:00</strong> — Summary & Concluding Prayer
  </li>
</ul>

<hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 24px 0;" />

<h3>📝 Key Takeaways & Study Notes</h3>
<ul>
  <li><strong>The Heart of Christian Leadership:</strong> Spiritual leadership is about serving, guiding, and reproducing Christlike character in others.</li>
  <li><strong>Authority in Christ's Kingdom:</strong> Secular power dominates; Christ's authority serves (washing feet).</li>
  <li><strong>The Priority of Spiritual Integrity:</strong> Giftings attract people, but Christlike character sustains ministry impact over decades.</li>
</ul>

<div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 16px; margin-top: 20px;">
  <strong style="color: #34d399; display: block; font-size: 14px;">💡 Action Assignment:</strong>
  <p style="margin: 6px 0 0; color: #cbd5e1; font-size: 14px;">
    Write down 3 specific qualities of servant leadership you will intentionally model in your ministry department this coming Sunday.
  </p>
</div>`,
        defaultQuiz: {
            title: "Video Comprehension Quiz: Biblical Leadership",
            description: "Test your understanding of the principles discussed in the video lecture.",
            passingScorePercent: 75,
            questions: [
                {
                    id: "vq1",
                    question: "According to Jesus in Mark 10:45, why did the Son of Man come?",
                    type: "multiple_choice",
                    options: [
                        "To be served and exalted by all nations",
                        "To not be served, but to serve, and give His life as a ransom for many",
                        "To establish a political earthly kingdom",
                        "To collect religious tithes from the temples"
                    ],
                    correctAnswer: 1,
                    explanation: "Mark 10:45 states: 'For even the Son of Man did not come to be served, but to serve, and to give His life a ransom for many.'",
                    points: 33
                },
                {
                    id: "vq2",
                    question: "True or False: In Christian ministry, spiritual gifts are more important than godly character.",
                    type: "true_false",
                    options: ["True", "False"],
                    correctAnswer: "False",
                    explanation: "Biblical qualifications for ministry (1 Timothy 3, Titus 1) focus overwhelmingly on godly character over mere talent.",
                    points: 33
                },
                {
                    id: "vq3",
                    question: "What is the primary indicator of authentic servant leadership in the local church?",
                    type: "multiple_choice",
                    options: [
                        "Having the highest title in the church roster",
                        "Empowering, equipping, and humbly serving others",
                        "Controlling all administrative decisions alone",
                        "Avoiding collaboration with other leaders"
                    ],
                    correctAnswer: 1,
                    explanation: "Servant leadership prioritizes equipping the saints and serving the body with humility.",
                    points: 34
                }
            ]
        }
    },
    {
        id: "google_classroom_sheets_lab",
        name: "Google Classroom & Sheets Workshop",
        category: "Classroom",
        badge: "G-Suite Integrated",
        icon: "🏫",
        description: "Google Classroom class link, Google Sheets interactive workbook link, deliverables, and assignment rubric.",
        estimatedMinutes: 45,
        defaultTitle: "Workshop: Ministry Budgeting & Stewardship Lab",
        defaultGoogleClassroomUrl: "https://classroom.google.com",
        defaultGoogleSheetsUrl: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
        defaultContent: `<h2>🏫 Google Classroom & Sheets Curriculum Lab</h2>
<p>
  This lesson is fully integrated with your <strong>Google Classroom</strong> and <strong>Google Sheets</strong> 
  interactive workbook. Use the direct buttons and embedded tools below to complete your coursework.
</p>

<div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 18px; margin: 16px 0;">
  <strong style="color: #fbbf24; font-size: 15px; display: block;">📋 Lab Workflow & Instructions:</strong>
  <ol style="margin: 8px 0 0; padding-left: 20px; color: #e2e8f0; line-height: 1.6;">
    <li>Open the <strong>Google Sheets Workbook</strong> linked below to access your department's annual budget template.</li>
    <li>Input your ministry projections, tithe allocations, and expense categorizations.</li>
    <li>Submit your completed spreadsheet file inside <strong>Google Classroom</strong> under the assignment portal.</li>
    <li>Complete the verification assessment below to receive your milestone credit.</li>
  </ol>
</div>

<h3>📊 Ministry Budgeting Principles</h3>
<ul>
  <li><strong>Transparency & Accountability:</strong> Maintaining faithful records honoring the Lord and church members.</li>
  <li><strong>Prudent Allocation:</strong> Prioritizing gospel evangelism, community discipleship, and benevolent care.</li>
  <li><strong>Contingency Reserves:</strong> Establishing healthy emergency reserves for unpredictable facility and outreach needs.</li>
</ul>

<hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 24px 0;" />

<h3>📑 Grading Rubric</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
  <thead>
    <tr style="background: rgba(255, 255, 255, 0.05); text-align: left;">
      <th style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">Criteria</th>
      <th style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">Weight</th>
      <th style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">Standard</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">Google Sheet Accuracy</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">40%</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">All revenue and expense formulas balanced.</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">Classroom Submission</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">30%</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">Uploaded on time in Google Classroom.</td>
    </tr>
    <tr>
      <td style="padding: 10px;">Summative Quiz Score</td>
      <td style="padding: 10px;">30%</td>
      <td style="padding: 10px;">Passing grade of at least 80% achieved.</td>
    </tr>
  </tbody>
</table>`,
        defaultQuiz: {
            title: "Stewardship & Spreadsheet Assessment",
            description: "Verify your practical understanding of ministry stewardship and spreadsheet calculations.",
            passingScorePercent: 80,
            questions: [
                {
                    id: "gq1",
                    question: "Why is financial transparency essential in Christian church leadership?",
                    type: "multiple_choice",
                    options: [
                        "To comply with legal auditing and protect the testimony of the gospel (2 Cor 8:21)",
                        "To boast to neighboring churches about income numbers",
                        "To satisfy government tax collectors exclusively",
                        "It is not necessary if the pastor is trustworthy"
                    ],
                    correctAnswer: 0,
                    explanation: "2 Corinthians 8:21 instructs: 'providing honorable things, not only in the sight of the Lord, but also in the sight of men.'",
                    points: 50
                },
                {
                    id: "gq2",
                    question: "True or False: After editing your Google Sheet workbook, you must turn in the link in Google Classroom.",
                    type: "true_false",
                    options: ["True", "False"],
                    correctAnswer: "True",
                    explanation: "Submission in Google Classroom allows the school curriculum specialist to grade and record your work.",
                    points: 50
                }
            ]
        }
    },
    {
        id: "summative_exam_mastery",
        name: "Summative Assessment & Final Exam",
        category: "Assessment",
        badge: "Official Evaluation",
        icon: "🏆",
        description: "Comprehensive exam module with randomized question bank, passing threshold, and certificate eligibility.",
        estimatedMinutes: 40,
        defaultTitle: "Comprehensive Summative Exam: Discipleship Track",
        defaultContent: `<h2>🏆 Summative Course Assessment & Certification Exam</h2>
<p>
  Welcome to the final summative evaluation. This examination evaluates your cumulative comprehension of all course modules.
</p>

<div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 18px; margin: 16px 0;">
  <strong style="color: #c4b5fd; font-size: 15px; display: block;">📜 Examination Guidelines & Honor Code:</strong>
  <ul style="margin: 8px 0 0; padding-left: 20px; color: #e2e8f0; line-height: 1.6;">
    <li><strong>Passing Requirement:</strong> A minimum score of <strong>80%</strong> is required to pass and earn course completion status.</li>
    <li><strong>Honor Code:</strong> As ambassadors of Jesus Christ, answer all questions honestly without external coaching.</li>
    <li><strong>Immediate Results:</strong> Your assessment will be scored instantly upon clicking Submit.</li>
  </ul>
</div>

<h3>📚 Covered Theological Domains</h3>
<ul>
  <li>Biblical Hermeneutics & Scripture Authority</li>
  <li>Grace, Faith, and Justification Doctrine</li>
  <li>Spiritual Disciplines (Prayer, Fasting, Word Meditation)</li>
  <li>Ministry Leadership & Servant Stewardship</li>
</ul>`,
        defaultQuiz: {
            title: "Official Summative Course Examination",
            description: "Final comprehensive test to certify mastery of this curriculum.",
            passingScorePercent: 80,
            questions: [
                {
                    id: "eq1",
                    question: "According to 2 Timothy 3:16-17, what is the inspiration of Scripture profitable for?",
                    type: "multiple_choice",
                    options: [
                        "Exclusively for private religious philosophy",
                        "Doctrine, reproof, correction, and instruction in righteousness",
                        "Only historical ancient poetry",
                        "Personal economic prosperity"
                    ],
                    correctAnswer: 1,
                    explanation: "2 Timothy 3:16-17 states all Scripture is breathed out by God and profitable for doctrine, reproof, correction, and instruction in righteousness.",
                    points: 20
                },
                {
                    id: "eq2",
                    question: "What is the foundational doctrine of justification by faith alone known historically as?",
                    type: "multiple_choice",
                    options: [
                        "Sola Fide",
                        "Sola Scriptura",
                        "Sola Gratia",
                        "Solus Christus"
                    ],
                    correctAnswer: 0,
                    explanation: "Sola Fide is the historical Latin phrase meaning 'Faith Alone'.",
                    points: 20
                },
                {
                    id: "eq3",
                    question: "True or False: Authentic Christian discipleship involves both spiritual inward transformation and outward ministry fruit.",
                    type: "true_false",
                    options: ["True", "False"],
                    correctAnswer: "True",
                    explanation: "Jesus stated in John 15:8: 'By this My Father is glorified, that you bear much fruit; so you will be My disciples.'",
                    points: 20
                },
                {
                    id: "eq4",
                    question: "Which of the following best exemplifies Christlike servant leadership?",
                    type: "multiple_choice",
                    options: [
                        "Demanding absolute obedience from church members",
                        "Washing the disciples' feet and giving one's life as a ransom (John 13, Mark 10)",
                        "Refusing to associate with ordinary believers",
                        "Accumulating personal worldly recognition"
                    ],
                    correctAnswer: 1,
                    explanation: "Jesus washed His disciples' feet in John 13 and gave Himself as a ransom for all.",
                    points: 20
                },
                {
                    id: "eq5",
                    question: "What is the Great Commission commanded by Jesus in Matthew 28:19-20?",
                    type: "multiple_choice",
                    options: [
                        "Go and build cathedral buildings",
                        "Go and make disciples of all the nations, baptizing and teaching them",
                        "Stay inside Jerusalem and keep silent",
                        "Debate philosophies with worldly rulers"
                    ],
                    correctAnswer: 1,
                    explanation: "Matthew 28:19-20 instructs us to go and make disciples of all nations, baptizing and teaching them.",
                    points: 20
                }
            ]
        }
    },
    {
        id: "ministry_practicum_lab",
        name: "Ministry Practicum & Fieldwork",
        category: "Practicum",
        badge: "Field Work",
        icon: "👥",
        description: "Hands-on ministry practicum, mentorship checkpoints, peer evaluation, and practical service rubrics.",
        estimatedMinutes: 60,
        defaultTitle: "Practicum: Hospital & Home Visitation Ministry",
        defaultContent: `<h2>👥 Ministry Fieldwork Practicum & Field Lab</h2>
<p>
  True discipleship is lived out in compassionate action. This practicum equips you to minister comfort, 
  prayer, and God's Word to the sick, elderly, and homebound.
</p>

<h3>🎯 Core Practicum Objectives</h3>
<ul>
  <li>Conduct at least 1 pastoral hospital or home visitation under the guidance of a church ministry mentor.</li>
  <li>Practice active, compassionate listening and ministering scriptural encouragement.</li>
  <li>Submit your visitation reflection and feedback report in Google Classroom.</li>
</ul>

<hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 24px 0;" />

<h3>📋 Practical Visitation Protocol</h3>
<ol>
  <li><strong>Preparation & Prayer:</strong> Pray for spiritual sensitivity, wisdom, and God's peace prior to arriving.</li>
  <li><strong>Respect Boundaries:</strong> Respect family privacy, hospital regulations, and resting schedules.</li>
  <li><strong>Keep Visits Focused:</strong> Standard hospital visits should be uplifting and typically last 15–20 minutes.</li>
  <li><strong>Scripture & Prayer:</strong> Share a comforting psalm (e.g. Psalm 23, Psalm 121) and pray with genuine empathy.</li>
</ol>`,
        defaultQuiz: {
            title: "Visitation Practicum Knowledge Check",
            description: "Confirm your understanding of pastoral visitation protocols.",
            passingScorePercent: 80,
            questions: [
                {
                    id: "pq1",
                    question: "What is the recommended ideal length of a standard hospital pastoral visit?",
                    type: "multiple_choice",
                    options: [
                        "Over 2 hours",
                        "15 to 20 minutes of focused, uplifting prayer and Scripture",
                        "5 minutes in the hallway only",
                        "All day until the patient discharges"
                    ],
                    correctAnswer: 1,
                    explanation: "Patients need rest; brief, focused 15-20 minute visits provide encouragement without causing physical fatigue.",
                    points: 50
                },
                {
                    id: "pq2",
                    question: "True or False: Confidential pastoral details shared during a visit should be kept private and handled with strict pastoral discretion.",
                    type: "true_false",
                    options: ["True", "False"],
                    correctAnswer: "True",
                    explanation: "Confidentiality and pastoral trust are essential principles in Christian ministry care.",
                    points: 50
                }
            ]
        }
    },
    {
        id: "custom_blank_lesson",
        name: "Custom Blank Lesson Canvas",
        category: "Custom",
        badge: "Flexible Canvas",
        icon: "✨",
        description: "Clean slate with 1-click blocks to insert video, scripture, Google Classroom/Sheets, and summative quizzes.",
        estimatedMinutes: 20,
        defaultTitle: "New Curriculum Lesson",
        defaultContent: `<h2>Lesson Title</h2>
<p>
  Enter your lesson introduction and objectives here. You can embed video lectures, link Google Classroom assignments, 
  attach Google Sheets workbooks, and create summative tests.
</p>

<h3>Core Concepts</h3>
<ul>
  <li>First core principle or biblical truth.</li>
  <li>Second practical application.</li>
</ul>`,
        defaultQuiz: {
            title: "Lesson Review Quiz",
            description: "Quick quiz to test student comprehension.",
            passingScorePercent: 80,
            questions: [
                {
                    id: "cq1",
                    question: "Sample Question: What was the main takeaway of this lesson?",
                    type: "multiple_choice",
                    options: [
                        "Key concept A",
                        "Key concept B",
                        "Key concept C",
                        "Key concept D"
                    ],
                    correctAnswer: 0,
                    explanation: "Enter explanation for students after they submit.",
                    points: 100
                }
            ]
        }
    }
];
