import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import bustImg from "../assets/hero-bust.jpg";
import "./Landing.css";

// ── Floating 3D Cube Helper Component ─────────────────────────────
// Renders a parameterized 3D CSS cube with standard rotations
function FloatingCube({ size, top, left, delay, duration }) {
  return (
    <div
      className="floating-cube"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      <div className="cube-inner" style={{ width: `${size}px`, height: `${size}px` }}>
        <div className="cube-face front" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(0deg) translateZ(${size / 2}px)` }} />
        <div className="cube-face back" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(180deg) translateZ(${size / 2}px)` }} />
        <div className="cube-face left" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(-90deg) translateZ(${size / 2}px)` }} />
        <div className="cube-face right" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateY(90deg) translateZ(${size / 2}px)` }} />
        <div className="cube-face top" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateX(90deg) translateZ(${size / 2}px)` }} />
        <div className="cube-face bottom" style={{ width: `${size}px`, height: `${size}px`, transform: `rotateX(-90deg) translateZ(${size / 2}px)` }} />
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("annual"); // "monthly" | "annual"

  // ── Typing Simulation State ─────────────────────────────────────
  const [activeTab, setActiveTab] = useState("proposal"); // "proposal" | "notes"
  const [editorText, setEditorText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [syncStatus, setSyncStatus] = useState("saved"); // "saved" | "syncing"
  const [userHasEdited, setUserHasEdited] = useState(false);
  
  // Collaborative mock cursor coordinates (relative inside editor-text)
  const [sarahCursor, setSarahCursor] = useState({ top: 30, left: 10, visible: false });
  const [alexCursor, setAlexCursor] = useState({ top: 60, left: 35, visible: false });

  const typingTimeoutRef = useRef(null);

  // Scripted typing simulation sequences
  const textSequences = {
    proposal: [
      { text: "# Project reDoc Proposal\n\n", author: "sarah", startDelay: 500 },
      { text: "reDoc is a collaborative editor designed for fast team alignment.\n\n", author: "sarah", startDelay: 300 },
      { text: "## Key Features:\n", author: "alex", startDelay: 800 },
      { text: "- Real-time, multi-user document synchronization\n", author: "alex", startDelay: 400 },
      { text: "- Beautiful typography and Markdown compatibility\n", author: "sarah", startDelay: 600 },
      { text: "- Seamless cloud saving and export capabilities\n\n", author: "sarah", startDelay: 300 },
      { text: "Let's co-author this layout and check the response times!", author: "alex", startDelay: 900 }
    ],
    notes: [
      { text: "# Meeting Notes — July 2026\n\n", author: "sarah", startDelay: 400 },
      { text: "Attendees: Sarah, Alex, Jordan\n\n", author: "sarah", startDelay: 200 },
      { text: "Discussed the launch plan for our real-time editor. ", author: "alex", startDelay: 600 },
      { text: "Everyone loved the clean classical bust aesthetics and floating 3D cubes. ", author: "sarah", startDelay: 800 },
      { text: "Let's proceed to make it fully production-ready by next Monday.", author: "alex", startDelay: 500 }
    ]
  };

  // Run typing simulation
  useEffect(() => {
    if (userHasEdited) return; // Stop simulation if user starts typing manually

    setEditorText("");
    setIsTyping(true);
    setSyncStatus("saved");
    setSarahCursor(c => ({ ...c, visible: false }));
    setAlexCursor(c => ({ ...c, visible: false }));

    const sequence = textSequences[activeTab];
    let sequenceIndex = 0;
    let charIndex = 0;
    let accumulatedText = "";

    const typeNextChar = () => {
      if (sequenceIndex >= sequence.length) {
        setIsTyping(false);
        setSyncStatus("saved");
        setSarahCursor(c => ({ ...c, visible: false }));
        setAlexCursor(c => ({ ...c, visible: false }));
        return;
      }

      const currentItem = sequence[sequenceIndex];
      const targetText = currentItem.text;
      const author = currentItem.author;

      // Position cursor near typing position (simulated)
      if (charIndex === 0) {
        setSyncStatus("syncing");
        if (author === "sarah") {
          setSarahCursor({
            top: 25 + sequenceIndex * 24,
            left: 15 + Math.min(targetText.length * 4, 300),
            visible: true
          });
          setAlexCursor(c => ({ ...c, visible: false }));
        } else {
          setAlexCursor({
            top: 25 + sequenceIndex * 24,
            left: 15 + Math.min(targetText.length * 4, 300),
            visible: true
          });
          setSarahCursor(c => ({ ...c, visible: false }));
        }
      }

      // Add character
      accumulatedText += targetText[charIndex];
      setEditorText(accumulatedText);
      charIndex++;

      // Move simulated cursor along with text
      if (author === "sarah") {
        setSarahCursor(c => ({ ...c, left: 15 + (charIndex * 6) % 350 }));
      } else {
        setAlexCursor(c => ({ ...c, left: 15 + (charIndex * 6) % 350 }));
      }

      if (charIndex < targetText.length) {
        typingTimeoutRef.current = setTimeout(typeNextChar, 35 + Math.random() * 20);
      } else {
        // Current string done, pause then start next item
        sequenceIndex++;
        charIndex = 0;
        setSyncStatus("saved");
        typingTimeoutRef.current = setTimeout(typeNextChar, currentItem.startDelay || 800);
      }
    };

    // Begin typing
    typingTimeoutRef.current = setTimeout(typeNextChar, 1000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeTab, userHasEdited]);

  // Handle user manual editing
  const handleUserType = (e) => {
    setUserHasEdited(true);
    setSyncStatus("syncing");
    setEditorText(e.target.value);
    setSarahCursor(c => ({ ...c, visible: false }));
    setAlexCursor(c => ({ ...c, visible: false }));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setSyncStatus("saved");
    }, 1000);
  };

  return (
    <div className="landing-page">
      {/* ── Capsule Navigation Bar ──────────────────────────────────── */}
      <div className="landing-nav-wrapper">
        <nav className="landing-nav">
          <a href="#" className="landing-nav-logo">
            <span className="landing-logo-icon">
              {/* Custom SVG Dot-Cross Logo matching Brainka */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                <circle cx="12" cy="5" r="2" fill="currentColor" />
                <circle cx="12" cy="19" r="2" fill="currentColor" />
                <circle cx="5" cy="12" r="2" fill="currentColor" />
                <circle cx="19" cy="12" r="2" fill="currentColor" />
              </svg>
            </span>
            reDoc
          </a>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#pricing" className="landing-nav-link">Pricing</a>
            <a href="#about" className="landing-nav-link">About</a>
          </div>
          <a
            href="/dashboard"
            className="landing-nav-cta"
            onClick={(e) => {
              e.preventDefault();
              navigate("/dashboard");
            }}
          >
            Launch App
          </a>
        </nav>
      </div>

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <header className="landing-hero">
        <div className="hero-tag">Meet reDoc</div>
        <div className="hero-title-container">
          <h1 className="landing-hero-title">
            Write, edit, <span>collaborate,</span> and organize connections effortlessly.
          </h1>
        </div>
        <p className="landing-hero-subtitle">
          A real-time workspace that lets you create rich, collaborative documents and structured outlines with instant cloud saving.
        </p>

        <div className="hero-cta-group">
          <a
            href="/dashboard"
            className="hero-primary-cta"
            onClick={(e) => {
              e.preventDefault();
              navigate("/dashboard");
            }}
          >
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14m-7-7 7 7-7 7"/>
            </svg>
          </a>
          <a href="#demo" className="hero-secondary-cta">
            Watch Live Demo
          </a>
        </div>

        {/* Centerpiece Stippled Bust Illustration with Floating Cubes */}
        <div className="hero-illustration-container">
          <div className="bust-image-wrapper">
            <img src={bustImg} alt="Classical bust sculpture design asset" className="bust-image" />
          </div>

          {/* Floating 3D Cubes (Strategic sizes and animation parameters) */}
          <FloatingCube size={28} top={12} left={15} delay={0.2} duration={14} />
          <FloatingCube size={20} top={20} left={80} delay={1.5} duration={11} />
          <FloatingCube size={36} top={55} left={10} delay={0.8} duration={16} />
          <FloatingCube size={24} top={65} left={82} delay={2.3} duration={13} />
          <FloatingCube size={16} top={75} left={25} delay={3.1} duration={9} />
          <FloatingCube size={32} top={40} left={88} delay={0.5} duration={15} />
        </div>
      </header>

      {/* ── Live Editor Demo Section ────────────────────────────────── */}
      <section id="demo" className="demo-section">
        <div className="demo-container">
          <div className="section-header">
            <h2 className="section-title">Experience Real-Time Sync</h2>
            <p className="section-subtitle">
              Watch mock team members edit the document in real time, or click inside the sheet to edit it yourself.
            </p>
          </div>

          <div className="browser-mockup">
            <div className="browser-bar">
              <div className="browser-dots">
                <span className="browser-dot red" />
                <span className="browser-dot yellow" />
                <span className="browser-dot green" />
              </div>
              <div className="browser-address-bar">https://redoc.app/document/live-demo</div>
              <div className={`browser-save-status ${syncStatus === "syncing" ? "syncing" : ""}`}>
                {syncStatus === "syncing" ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "rotate-cube 1.5s linear infinite" }}>
                      <path d="M21 12a9 9 0 0 1-9 9m-9-9a9 9 0 0 1 9-9" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved to Cloud
                  </>
                )}
              </div>
            </div>

            <div className="browser-content">
              {/* Simulated Sidebar */}
              <div className="mockup-sidebar">
                <span className="sidebar-title">Documents</span>
                <div className="mockup-doc-list">
                  <div
                    className={`mockup-doc-item ${activeTab === "proposal" ? "active" : ""}`}
                    onClick={() => {
                      setUserHasEdited(false);
                      setActiveTab("proposal");
                    }}
                  >
                    📄 project_proposal.md
                  </div>
                  <div
                    className={`mockup-doc-item ${activeTab === "notes" ? "active" : ""}`}
                    onClick={() => {
                      setUserHasEdited(false);
                      setActiveTab("notes");
                    }}
                  >
                    📄 meeting_notes.md
                  </div>
                </div>
              </div>

              {/* Simulated Rich Editor */}
              <div className="mockup-editor-area">
                <input
                  type="text"
                  className="mockup-editor-title"
                  value={activeTab === "proposal" ? "Project Proposal" : "Meeting Notes"}
                  readOnly
                />
                
                <textarea
                  className="mockup-editor-text"
                  value={editorText}
                  onChange={handleUserType}
                  placeholder="Click here to type and try editing yourself..."
                />

                {/* Simulated Cursors typing along */}
                {sarahCursor.visible && (
                  <div className="mockup-cursor sarah" style={{ top: `${sarahCursor.top}px`, left: `${sarahCursor.left}px` }}>
                    <svg width="14" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.5 3v15.5l4.5-4.5 4.5 9 3-1.5-4.5-9 6.5-.5z" />
                    </svg>
                    <span className="cursor-flag">Sarah (Editor)</span>
                  </div>
                )}

                {alexCursor.visible && (
                  <div className="mockup-cursor alex" style={{ top: `${alexCursor.top}px`, left: `${alexCursor.left}px` }}>
                    <svg width="14" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.5 3v15.5l4.5-4.5 4.5 9 3-1.5-4.5-9 6.5-.5z" />
                    </svg>
                    <span className="cursor-flag">Alex (Viewer)</span>
                  </div>
                )}

                {!userHasEdited && (
                  <div className="editor-interactive-toast">
                    💡 Click inside the sheet to edit!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────────── */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Crafted for Modern Collaboration</h2>
          <p className="section-subtitle">
            All the tools you need to create, share, and review documents without clutter.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="feature-title">Real-Time Editing</h3>
            <p className="feature-desc">
              Edit docs together in real time. Share a secure link and see remote collaborator cursors move as they type.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </div>
            <h3 className="feature-title">WYSIWYG Markdown</h3>
            <p className="feature-desc">
              Write naturally using clean rich text powered by TipTap, or leverage keyboard shortcuts to format on the fly.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className="feature-title">Drag &amp; Drop Uploads</h3>
            <p className="feature-desc">
              Instantly import existing `.txt` and `.md` documents. Simply drop a file into the dashboard to start editing.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ─────────────────────────────────────────── */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <h2 className="section-title">Transparent, Minimalist Pricing</h2>
          <p className="section-subtitle">
            Start writing for free, or upgrade to unlock advanced cloud and team features.
          </p>
        </div>

        <div className="pricing-toggle-container">
          <span className={`toggle-label ${billingCycle === "monthly" ? "active" : ""}`}>Monthly</span>
          <div
            className={`pricing-switch ${billingCycle === "annual" ? "active" : ""}`}
            onClick={() => setBillingCycle(c => c === "monthly" ? "annual" : "monthly")}
          />
          <span className={`toggle-label ${billingCycle === "annual" ? "active" : ""}`}>Yearly (Save 20%)</span>
        </div>

        <div className="pricing-cards-container">
          {/* Free Tier */}
          <div className="pricing-card">
            <span className="pricing-tier">Free</span>
            <div className="pricing-price">
              $0 <span>/ month</span>
            </div>
            <ul className="pricing-features-list">
              <li className="pricing-feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Create up to 10 documents
              </li>
              <li className="pricing-feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Real-time collaboration preview
              </li>
              <li className="pricing-feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Export documents to Markdown &amp; TXT
              </li>
            </ul>
            <a
              href="/dashboard"
              className="pricing-btn outline"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard");
              }}
            >
              Get Started
            </a>
          </div>

          {/* Pro Tier */}
          <div className="pricing-card premium">
            <span className="pricing-badge">Popular</span>
            <span className="pricing-tier">Pro Plan</span>
            <div className="pricing-price">
              ${billingCycle === "annual" ? "6.40" : "8.00"} <span>/ month</span>
            </div>
            <ul className="pricing-features-list">
              <li className="pricing-feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Unlimited documents and folders
              </li>
              <li className="pricing-feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Full collaborator access controls
              </li>
              <li className="pricing-feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                High speed file imports up to 50MB
              </li>
              <li className="pricing-feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Full version history recovery
              </li>
            </ul>
            <a
              href="/dashboard"
              className="pricing-btn solid"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard");
              }}
            >
              Upgrade to Pro
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer id="about" className="landing-footer">
        <div className="footer-content">
          <a href="#" className="footer-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <circle cx="12" cy="5" r="2" fill="currentColor" />
              <circle cx="12" cy="19" r="2" fill="currentColor" />
              <circle cx="5" cy="12" r="2" fill="currentColor" />
              <circle cx="19" cy="12" r="2" fill="currentColor" />
            </svg>
            reDoc
          </a>
          <div className="footer-links">
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">GitHub</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
          </div>
        </div>
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} reDoc Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
