import React, { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CloudUpload,
  Code2,
  Contact,
  FileText,
  Gauge,
  Globe,
  History,
  Home,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  Mail,
  Menu,
  PanelTop,
  PlaySquare,
  Settings,
  Shield,
  Sparkles,
  User,
  UserPlus,
  X
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5001";

const summaryOptions = [
  { value: "short", label: "Short", helper: "Fast executive brief" },
  { value: "medium", label: "Medium", helper: "Balanced key points" },
  { value: "detailed", label: "Detailed", helper: "Structured deep read" }
];

const navGroups = [
  {
    title: "Workspace",
    items: [
      { id: "home", label: "Home", icon: Home },
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "text", label: "Text Summarizer", icon: FileText },
      { id: "file", label: "File Upload", icon: CloudUpload },
      { id: "pdf", label: "PDF Summarizer", icon: BookOpen },
      { id: "url", label: "URL / Article", icon: Globe },
      { id: "youtube", label: "YouTube Transcript", icon: PlaySquare },
      { id: "results", label: "Summary Results", icon: ClipboardList },
      { id: "history", label: "History", icon: History },
      { id: "analytics", label: "Analytics", icon: BarChart3 }
    ]
  },
  {
    title: "Account",
    items: [
      { id: "settings", label: "Settings", icon: Settings },
      { id: "api", label: "API Configuration", icon: KeyRound },
      { id: "profile", label: "User Profile", icon: User },
      { id: "login", label: "Login", icon: LogIn },
      { id: "signup", label: "Signup", icon: UserPlus },
      { id: "forgot", label: "Forgot Password", icon: LockKeyhole }
    ]
  },
  {
    title: "Company",
    items: [
      { id: "about", label: "About", icon: Sparkles },
      { id: "contact", label: "Contact / Support", icon: Contact },
      { id: "docs", label: "Documentation", icon: Code2 },
      { id: "admin", label: "Admin Panel", icon: Shield }
    ]
  }
];

const quickStats = [
  { label: "Summaries", value: "128", trend: "+18 this week" },
  { label: "Avg. compression", value: "72%", trend: "Across all formats" },
  { label: "Saved hours", value: "34", trend: "Estimated reading time" },
  { label: "Success rate", value: "99%", trend: "Healthy API status" }
];

const exampleHistory = [
  { title: "Market research notes", type: "Detailed", date: "Today", words: 1840 },
  { title: "Product launch article", type: "Medium", date: "Yesterday", words: 920 },
  { title: "Lecture transcript", type: "Short", date: "May 18", words: 4300 }
];

function App() {
  const [activePage, setActivePage] = useState("home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [content, setContent] = useState("");
  const [summaryType, setSummaryType] = useState("medium");
  const [sourceLabel, setSourceLabel] = useState("Manual text");
  const [urlValue, setUrlValue] = useState("");
  const [youtubeValue, setYoutubeValue] = useState("");
  const [summary, setSummary] = useState("");
  const [history, setHistory] = useState(exampleHistory);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const activeLabel = useMemo(() => {
    for (const group of navGroups) {
      const match = group.items.find((item) => item.id === activePage);
      if (match) return match.label;
    }
    return "Home";
  }, [activePage]);

  function navigate(page) {
    setActivePage(page);
    setMobileNavOpen(false);
  }

  async function summarize(customContent = content, customSource = sourceLabel) {
    const trimmedContent = customContent.trim();
    if (!trimmedContent) {
      setError("Please add content before generating a summary.");
      setSummary("");
      return;
    }

    setIsLoading(true);
    setError("");
    setSummary("");

    try {
      const response = await fetch(`${API_URL}/api/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: trimmedContent,
          summaryType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate a summary.");
      }

      setSummary(data.summary);
      setSourceLabel(customSource);
      setHistory((items) => [
        {
          title: customSource,
          type: summaryOptions.find((option) => option.value === summaryType)?.label || "Medium",
          date: "Just now",
          words: trimmedContent.split(/\s+/).length
        },
        ...items
      ]);
      setActivePage("results");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(event, labelPrefix) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSourceLabel(`${labelPrefix}: ${file.name}`);

    if (file.type === "application/pdf") {
      setContent(`PDF selected: ${file.name}\n\nPaste extracted PDF text here, then generate a summary.`);
      return;
    }

    const text = await file.text();
    setContent(text);
  }

  function renderPage() {
    const sharedProps = {
      content,
      setContent,
      summaryType,
      setSummaryType,
      summarize,
      isLoading,
      error
    };

    switch (activePage) {
      case "dashboard":
        return <DashboardPage navigate={navigate} />;
      case "text":
        return <SummarizerPage {...sharedProps} title="Text Summarizer" mode="Text" />;
      case "file":
        return <FilePage {...sharedProps} onUpload={handleFileUpload} />;
      case "pdf":
        return <PdfPage {...sharedProps} onUpload={handleFileUpload} />;
      case "url":
        return (
          <UrlPage
            {...sharedProps}
            urlValue={urlValue}
            setUrlValue={setUrlValue}
            setSourceLabel={setSourceLabel}
          />
        );
      case "youtube":
        return (
          <YoutubePage
            {...sharedProps}
            youtubeValue={youtubeValue}
            setYoutubeValue={setYoutubeValue}
            setSourceLabel={setSourceLabel}
          />
        );
      case "results":
        return <ResultsPage summary={summary} sourceLabel={sourceLabel} summaryType={summaryType} navigate={navigate} />;
      case "history":
        return <HistoryPage history={history} navigate={navigate} />;
      case "analytics":
        return <AnalyticsPage />;
      case "settings":
        return <SettingsPage />;
      case "api":
        return <ApiConfigPage />;
      case "profile":
        return <ProfilePage />;
      case "login":
        return <AuthPage type="login" navigate={navigate} />;
      case "signup":
        return <AuthPage type="signup" navigate={navigate} />;
      case "forgot":
        return <ForgotPasswordPage navigate={navigate} />;
      case "about":
        return <AboutPage />;
      case "contact":
        return <ContactPage />;
      case "docs":
        return <DocsPage />;
      case "admin":
        return <AdminPage />;
      default:
        return <HomePage navigate={navigate} />;
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Brain size={22} />
          </div>
          <div>
            <strong>Summara AI</strong>
            <span>Content intelligence</span>
          </div>
        </div>

        <nav className="nav-scroll" aria-label="Primary navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <p>{group.title}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    className={activePage === item.id ? "nav-item active" : "nav-item"}
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <button className="icon-button mobile-only" type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div>
            <span>Workspace</span>
            <h1>{activeLabel}</h1>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" type="button" onClick={() => navigate("api")}>
              <KeyRound size={17} />
              API
            </button>
          <button className="avatar-button" type="button" onClick={() => navigate("profile")} aria-label="Open profile">
            SA
          </button>
        </div>
        </header>

        {mobileNavOpen && (
          <button className="scrim" type="button" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}>
            <X size={22} />
          </button>
        )}

        <div className="page-content">{renderPage()}</div>
      </main>
    </div>
  );
}

function HomePage({ navigate }) {
  return (
    <section className="hero-grid">
      <div className="hero-copy">
        <p className="eyebrow">AI-powered content summarizer</p>
        <h2>Read less, understand more, move faster.</h2>
        <p>
          Summara AI brings text, documents, articles, PDFs, and transcripts into one focused workspace for clear summaries,
          reusable notes, and team visibility.
        </p>
        <div className="hero-actions">
          <button type="button" onClick={() => navigate("text")}>
            <Sparkles size={18} />
            Start summarizing
          </button>
          <button className="secondary-button" type="button" onClick={() => navigate("dashboard")}>
            View dashboard
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="hero-preview">
        <div className="preview-toolbar">
          <span />
          <span />
          <span />
        </div>
        <div className="summary-card featured">
          <p>Summary quality</p>
          <strong>Clear, accurate, structured</strong>
          <small>Generated from articles, PDFs, URLs, and transcripts</small>
        </div>
        <div className="mini-grid">
          <InfoTile icon={FileText} label="Text" value="Paste notes" />
          <InfoTile icon={BookOpen} label="PDF" value="Upload files" />
          <InfoTile icon={Globe} label="URL" value="Article briefs" />
          <InfoTile icon={PlaySquare} label="Video" value="Transcript notes" />
        </div>
      </div>
    </section>
  );
}

function DashboardPage({ navigate }) {
  return (
    <section className="stack">
      <div className="stat-grid">
        {quickStats.map((stat) => (
          <article className="metric-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.trend}</p>
          </article>
        ))}
      </div>
      <div className="two-column">
        <Panel title="Quick Actions" icon={Gauge}>
          <div className="action-list">
            {[
              ["text", "Summarize pasted content", FileText],
              ["file", "Upload a document", CloudUpload],
              ["url", "Summarize an article URL", Globe],
              ["youtube", "Summarize a transcript", PlaySquare]
            ].map(([page, label, Icon]) => (
              <button className="action-row" type="button" key={page} onClick={() => navigate(page)}>
                <Icon size={18} />
                <span>{label}</span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="System Status" icon={Activity}>
          <StatusList />
        </Panel>
      </div>
    </section>
  );
}

function SummarizerPage({ title, mode, content, setContent, summaryType, setSummaryType, summarize, isLoading, error }) {
  return (
    <section className="summarizer-layout">
      <Panel title={title} icon={FileText}>
        <SummarizerControls summaryType={summaryType} setSummaryType={setSummaryType} />
        <label className="field">
          <span>{mode} content</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste article text, meeting notes, research material, or long-form content here."
          />
        </label>
        {error && <p className="message error">{error}</p>}
        <button type="button" disabled={isLoading} onClick={() => summarize(content, "Text summary")}>
          <Bot size={18} />
          {isLoading ? "Generating..." : "Generate summary"}
        </button>
      </Panel>
      <TipsPanel />
    </section>
  );
}

function FilePage(props) {
  return (
    <section className="summarizer-layout">
      <Panel title="File Upload Summarizer" icon={CloudUpload}>
        <UploadBox accept=".txt,.md,.csv,.json" label="Upload text-friendly files" onChange={(event) => props.onUpload(event, "Uploaded file")} />
        <SummarizerControls summaryType={props.summaryType} setSummaryType={props.setSummaryType} />
        <label className="field">
          <span>Uploaded content</span>
          <textarea
            value={props.content}
            onChange={(event) => props.setContent(event.target.value)}
            placeholder="Uploaded text will appear here. You can also paste content manually."
          />
        </label>
        {props.error && <p className="message error">{props.error}</p>}
        <button type="button" disabled={props.isLoading} onClick={() => props.summarize(props.content, "Uploaded file")}>
          <Bot size={18} />
          {props.isLoading ? "Generating..." : "Summarize file"}
        </button>
      </Panel>
      <TipsPanel />
    </section>
  );
}

function PdfPage(props) {
  return (
    <section className="summarizer-layout">
      <Panel title="PDF Summarizer" icon={BookOpen}>
        <UploadBox accept="application/pdf" label="Choose a PDF" onChange={(event) => props.onUpload(event, "PDF")} />
        <div className="notice">
          Browser PDF text extraction is not enabled yet. Select a PDF to label the source, paste extracted text below, and generate a summary.
        </div>
        <SummarizerControls summaryType={props.summaryType} setSummaryType={props.setSummaryType} />
        <label className="field">
          <span>PDF text</span>
          <textarea
            value={props.content}
            onChange={(event) => props.setContent(event.target.value)}
            placeholder="Paste PDF text here for summarization."
          />
        </label>
        {props.error && <p className="message error">{props.error}</p>}
        <button type="button" disabled={props.isLoading} onClick={() => props.summarize(props.content, "PDF summary")}>
          <BookOpen size={18} />
          {props.isLoading ? "Generating..." : "Summarize PDF"}
        </button>
      </Panel>
      <TipsPanel />
    </section>
  );
}

function UrlPage({ urlValue, setUrlValue, setSourceLabel, content, setContent, summaryType, setSummaryType, summarize, isLoading, error }) {
  function prepareUrlSummary() {
    setSourceLabel(urlValue || "Article URL");
    summarize(content || `Summarize the article at this URL: ${urlValue}`, urlValue || "Article URL");
  }

  return (
    <section className="summarizer-layout">
      <Panel title="URL / Article Summarizer" icon={Globe}>
        <label className="field">
          <span>Article URL</span>
          <input value={urlValue} onChange={(event) => setUrlValue(event.target.value)} placeholder="https://example.com/article" />
        </label>
        <SummarizerControls summaryType={summaryType} setSummaryType={setSummaryType} />
        <label className="field">
          <span>Article text or notes</span>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste article text for the most accurate result." />
        </label>
        {error && <p className="message error">{error}</p>}
        <button type="button" disabled={isLoading} onClick={prepareUrlSummary}>
          <Globe size={18} />
          {isLoading ? "Generating..." : "Summarize article"}
        </button>
      </Panel>
      <TipsPanel />
    </section>
  );
}

function YoutubePage({ youtubeValue, setYoutubeValue, setSourceLabel, content, setContent, summaryType, setSummaryType, summarize, isLoading, error }) {
  function prepareTranscriptSummary() {
    setSourceLabel(youtubeValue || "YouTube transcript");
    summarize(content || `Summarize this YouTube transcript or video reference: ${youtubeValue}`, youtubeValue || "YouTube transcript");
  }

  return (
    <section className="summarizer-layout">
      <Panel title="YouTube Transcript Summarizer" icon={PlaySquare}>
        <label className="field">
          <span>YouTube URL</span>
          <input value={youtubeValue} onChange={(event) => setYoutubeValue(event.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </label>
        <SummarizerControls summaryType={summaryType} setSummaryType={setSummaryType} />
        <label className="field">
          <span>Transcript</span>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste the video transcript here." />
        </label>
        {error && <p className="message error">{error}</p>}
        <button type="button" disabled={isLoading} onClick={prepareTranscriptSummary}>
          <PlaySquare size={18} />
          {isLoading ? "Generating..." : "Summarize transcript"}
        </button>
      </Panel>
      <TipsPanel />
    </section>
  );
}

function ResultsPage({ summary, sourceLabel, summaryType, navigate }) {
  return (
    <section className="stack">
      <Panel title="Summary Results" icon={ClipboardList}>
        <div className="result-meta">
          <span>{sourceLabel}</span>
          <span>{summaryType}</span>
        </div>
        <div className="result-box">
          {summary || "No summary generated yet. Start with any summarizer page to create your first result."}
        </div>
        <div className="button-row">
          <button type="button" onClick={() => navigate("text")}>
            <Sparkles size={18} />
            Create another
          </button>
          <button className="secondary-button" type="button" onClick={() => navigator.clipboard?.writeText(summary || "")}>
            Copy summary
          </button>
        </div>
      </Panel>
    </section>
  );
}

function HistoryPage({ history, navigate }) {
  return (
    <Panel title="Summary History" icon={History}>
      <div className="table-list">
        {history.map((item, index) => (
          <button className="history-row" type="button" key={`${item.title}-${index}`} onClick={() => navigate("results")}>
            <span>
              <strong>{item.title}</strong>
              <small>{item.date}</small>
            </span>
            <span>{item.type}</span>
            <span>{item.words} words</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function AnalyticsPage() {
  return (
    <section className="stack">
      <div className="stat-grid">
        {quickStats.map((stat) => (
          <article className="metric-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.trend}</p>
          </article>
        ))}
      </div>
      <Panel title="Usage Analytics" icon={BarChart3}>
        <div className="bar-chart" aria-label="Usage by content source">
          {[
            ["Text", 86],
            ["PDF", 64],
            ["URL", 48],
            ["YouTube", 38],
            ["Files", 58]
          ].map(([label, value]) => (
            <div className="bar-row" key={label}>
              <span>{label}</span>
              <div><i style={{ width: `${value}%` }} /></div>
              <strong>{value}%</strong>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function SettingsPage() {
  return (
    <Panel title="Settings" icon={Settings}>
      <div className="settings-grid">
        <ToggleRow title="Auto-save summaries" description="Save generated summaries to history automatically." checked />
        <ToggleRow title="Detailed safety checks" description="Prefer cautious summaries for sensitive content." checked />
        <ToggleRow title="Email weekly digest" description="Receive a weekly overview of your summary activity." />
      </div>
    </Panel>
  );
}

function ApiConfigPage() {
  return (
    <Panel title="API Configuration" icon={KeyRound}>
      <div className="form-grid">
        <label className="field">
          <span>Backend API URL</span>
          <input value={API_URL} readOnly />
        </label>
        <label className="field">
          <span>OpenAI API key location</span>
          <input value="backend/.env -> OPENAI_API_KEY" readOnly />
        </label>
        <label className="field">
          <span>Model</span>
          <input value="OPENAI_MODEL from backend/.env" readOnly />
        </label>
      </div>
      <div className="notice">API keys stay on the backend. The browser only talks to your Express API.</div>
    </Panel>
  );
}

function ProfilePage() {
  return (
    <Panel title="User Profile" icon={User}>
      <div className="profile-card">
        <div className="profile-avatar">SA</div>
        <div>
          <h3>Summara Admin</h3>
          <p>Product researcher using AI summaries for articles, notes, PDFs, and transcripts.</p>
        </div>
      </div>
      <div className="form-grid">
        <label className="field"><span>Name</span><input defaultValue="Summara Admin" /></label>
        <label className="field"><span>Email</span><input defaultValue="admin@example.com" /></label>
        <label className="field"><span>Role</span><input defaultValue="Workspace Owner" /></label>
      </div>
    </Panel>
  );
}

function AuthPage({ type, navigate }) {
  const isSignup = type === "signup";
  return (
    <section className="auth-wrap">
      <Panel title={isSignup ? "Create Account" : "Welcome Back"} icon={isSignup ? UserPlus : LogIn}>
        <div className="form-grid">
          {isSignup && <label className="field"><span>Name</span><input placeholder="Your name" /></label>}
          <label className="field"><span>Email</span><input placeholder="you@example.com" /></label>
          <label className="field"><span>Password</span><input type="password" placeholder="Password" /></label>
        </div>
        <button type="button" onClick={() => navigate("dashboard")}>
          {isSignup ? <UserPlus size={18} /> : <LogIn size={18} />}
          {isSignup ? "Create account" : "Login"}
        </button>
        <button className="link-button" type="button" onClick={() => navigate(isSignup ? "login" : "forgot")}>
          {isSignup ? "Already have an account?" : "Forgot password?"}
        </button>
      </Panel>
    </section>
  );
}

function ForgotPasswordPage({ navigate }) {
  return (
    <section className="auth-wrap">
      <Panel title="Forgot Password" icon={LockKeyhole}>
        <label className="field"><span>Email</span><input placeholder="you@example.com" /></label>
        <button type="button" onClick={() => navigate("login")}>
          <Mail size={18} />
          Send reset link
        </button>
      </Panel>
    </section>
  );
}

function AboutPage() {
  return (
    <Panel title="About Summara AI" icon={Sparkles}>
      <p className="body-copy">
        Summara AI is a focused workspace for reducing information overload. It helps users turn dense content into clear,
        accurate summaries while keeping API keys secure on the backend.
      </p>
      <div className="mini-grid">
        <InfoTile icon={Shield} label="Secure" value="Backend keys" />
        <InfoTile icon={Bot} label="AI first" value="Clear summaries" />
        <InfoTile icon={History} label="Trackable" value="History and analytics" />
        <InfoTile icon={PanelTop} label="Complete" value="Multi-source workspace" />
      </div>
    </Panel>
  );
}

function ContactPage() {
  return (
    <Panel title="Contact / Support" icon={Contact}>
      <div className="form-grid">
        <label className="field"><span>Name</span><input placeholder="Your name" /></label>
        <label className="field"><span>Email</span><input placeholder="you@example.com" /></label>
        <label className="field"><span>Message</span><textarea placeholder="How can support help?" /></label>
      </div>
      <button type="button">
        <Mail size={18} />
        Send message
      </button>
    </Panel>
  );
}

function DocsPage() {
  return (
    <Panel title="Documentation" icon={Code2}>
      <div className="docs-list">
        {[
          ["Setup", "Install frontend and backend dependencies, then add your backend .env file."],
          ["Summarize", "POST content and summaryType to /api/summarize."],
          ["Security", "Keep OPENAI_API_KEY on the server only. Never expose it in React."],
          ["Deploy", "Host React as static assets and run Express as a private API service."]
        ].map(([title, text]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function AdminPage() {
  return (
    <section className="stack">
      <div className="stat-grid">
        <article className="metric-card"><span>Users</span><strong>42</strong><p>12 active today</p></article>
        <article className="metric-card"><span>Requests</span><strong>1.8k</strong><p>This month</p></article>
        <article className="metric-card"><span>Errors</span><strong>3</strong><p>Needs review</p></article>
        <article className="metric-card"><span>Plan</span><strong>Pro</strong><p>Workspace tier</p></article>
      </div>
      <Panel title="Admin Panel" icon={Shield}>
        <StatusList />
      </Panel>
    </section>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <Icon size={20} />
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SummarizerControls({ summaryType, setSummaryType }) {
  return (
    <div className="summary-options" role="group" aria-label="Summary length">
      {summaryOptions.map((option) => (
        <button
          className={summaryType === option.value ? "option-chip active" : "option-chip"}
          type="button"
          key={option.value}
          onClick={() => setSummaryType(option.value)}
        >
          <span>{option.label}</span>
          <small>{option.helper}</small>
        </button>
      ))}
    </div>
  );
}

function UploadBox({ accept, label, onChange }) {
  return (
    <label className="upload-box">
      <CloudUpload size={28} />
      <span>{label}</span>
      <small>Choose a file from your computer</small>
      <input type="file" accept={accept} onChange={onChange} />
    </label>
  );
}

function TipsPanel() {
  return (
    <Panel title="Summary Tips" icon={CircleHelp}>
      <ul className="tips-list">
        <li>Use detailed mode for reports, research, and meeting transcripts.</li>
        <li>Paste clean article text when possible for stronger accuracy.</li>
        <li>Ask for shorter summaries when you only need decisions or next steps.</li>
      </ul>
    </Panel>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <article className="info-tile">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function StatusList() {
  return (
    <div className="status-list">
      {["OpenAI API configured on backend", "Frontend calls Express only", "History capture enabled", "Responsive UI ready"].map((item) => (
        <div key={item}>
          <CheckCircle2 size={18} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function ToggleRow({ title, description, checked = false }) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" defaultChecked={checked} />
    </label>
  );
}

export default App;
