import React, { useState, useEffect } from "react";
import { Sun, Moon, Mail, CheckCircle2, Send, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";
import { addStoredNotification, addStoredAuditLog } from "../../utils/storage";

const NAV_LINKS = ["Features", "How It Works", "Pricing", "About", "Contact"];

const FEATURES = [
  {
    icon: "⬡",
    title: "Tender Eligibility Prediction",
    desc: "AI checks whether a company is likely eligible to apply by cross-referencing financials, turnover thresholds, and technical certifications against tender criteria.",
  },
  {
    icon: "◈",
    title: "Deadline & Requirement Alerts",
    desc: "AI identifies important dates, mandatory affidavits, and submission clauses, sending proactive alerts so you never miss a deadline.",
  },
  {
    icon: "▣",
    title: "Smart Bid Analysis",
    desc: "AI-powered analytics evaluate every bid across 20+ dimensions—pricing sanity, schedule feasibility, and compliance metrics—in seconds.",
  },
  {
    icon: "◎",
    title: "Profit Margin Modeler",
    desc: "Real-time margin simulation lets bidders project net returns and simulate risk sensitivities before depositing sealed proposals.",
  },
  {
    icon: "⬔",
    title: "Dual Role Command Dashboards",
    desc: "Contractors and bidders each enjoy tailored command centers—clean, high-contrast layouts engineered for fast operational decision-making.",
  },
  {
    icon: "⟁",
    title: "Bid Comparison Matrix",
    desc: "Side-by-side tabular evaluation surfaces lowest compliant bids, variance outliers, and quantitative scores with zero ambiguity.",
  },
  {
    icon: "🛡",
    title: "Tamper-Evident Audit Ledger",
    desc: "Cryptographically verifiable timestamping and action logging provide an ironclad audit trail for regulatory and compliance oversight.",
  },
  {
    icon: "⚡",
    title: "Real-Time Pipeline Tracking",
    desc: "Instant notifications on tender publication, bidder queries, sealed bid opening ceremonies, and contract award determinations.",
  },
];

const PRICING = [
  {
    tier: "Starter",
    price: "₹0",
    period: "forever",
    desc: "Perfect for solo bidders exploring the platform.",
    features: [
      "3 active bid submissions",
      "AI Eligibility Prediction (basic)",
      "Deadline & Requirement Reminders",
      "Profit calculator simulation",
      "PDF proposal export",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    tier: "Professional",
    price: "₹3,999",
    period: "per month",
    desc: "For serious bidders and growing contractor teams.",
    features: [
      "Unlimited tender submissions",
      "Deep AI Eligibility Prediction with gap analysis",
      "Proactive Deadline Alerts with calendar sync",
      "Bid comparison & competitor analytics",
      "Priority compliance support & API access",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    tier: "Enterprise",
    price: "Custom",
    period: "tailored",
    desc: "Large contractors managing complex multi-bid pipelines.",
    features: [
      "Everything in Professional",
      "Custom eligibility criteria scoring engine",
      "Dedicated account manager & SLA guarantee",
      "Multi-evaluator blind voting workflows",
      "On-premises deployment & SSO integration",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    role: "Contractor",
    action: "Post Tender",
    detail: "Define scope, budget, timeline, and mandatory eligibility criteria with AI assistance in minutes.",
  },
  {
    step: "02",
    role: "Bidder & AI",
    action: "Tender Eligibility Prediction",
    detail: "AI checks company turnover, experience, and certifications to forecast eligibility before you invest bidding effort.",
  },
  {
    step: "03",
    role: "Bidder & AI",
    action: "Deadline & Requirement Alerts",
    detail: "AI identifies critical dates and required documents, sending reminders while the profit calculator optimizes margins.",
  },
  {
    step: "04",
    role: "Contractor",
    action: "Compare Bids & Award",
    detail: "Sealed bids are decrypted simultaneously, auto-ranked across key metrics, and awarded with full audit transparency.",
  },
];

interface TenderVaultLandingProps {
  onLaunchPlatform: (initialRole?: 'admin' | 'vendor' | 'evaluator') => void;
  onOpenAuth?: (initialRole?: 'admin' | 'vendor' | 'evaluator', initialMode?: 'signin' | 'signup') => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function TenderVaultLanding({ onLaunchPlatform, onOpenAuth, theme = 'light', onToggleTheme }: TenderVaultLandingProps) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FAF6EE' : '#001F3F';
  const mutedColor = isDark ? '#CBD5E1' : '#5E5B56';
  const dimColor = isDark ? '#94A3B8' : '#736F68';
  const cardBg = isDark ? '#001F3F' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5DFD5';
  const sectionAltBg = isDark ? '#001730' : '#F3EDE2';
  const innerCardBg = isDark ? '#001428' : '#FAF7F0';
  const badgeBg = isDark ? 'rgba(255, 255, 255, 0.1)' : '#EAE5DB';
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", role: "bidder", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  const [previewTab, setPreviewTab] = useState<string>("Overview");
  const [bidValueInput, setBidValueInput] = useState<number>(450000);
  const [costEstInput, setCostEstInput] = useState<number>(360000);

  const [eligTurnover, setEligTurnover] = useState<number>(3500000);
  const [eligYears, setEligYears] = useState<number>(6);
  const [eligCert, setEligCert] = useState<string>("ISO 9001:2015");
  const [eligTenderChoice, setEligTenderChoice] = useState<"bridge" | "it">("bridge");

  const [alertsReminded, setAlertsReminded] = useState<Record<string, boolean>>({
    "alert-1": false,
    "alert-2": true,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisibleSections((p) => new Set([...p, e.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll("section[id]").forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const contactDestinationEmail = "dpalak256@gmail.com";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipient = contactDestinationEmail;
    const subject = encodeURIComponent(`[TenderVault Inquiry] ${formData.name} (${formData.role})`);
    const bodyContent = `Hello TenderVault Team,\n\nI am reaching out via the contact form.\n\nSender Details:\n- Name: ${formData.name}\n- Email: ${formData.email}\n- Inquiring as: ${formData.role}\n\nMessage:\n${formData.message}\n\n---\nDelivered directly to ${recipient}`;
    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(bodyContent)}`;

    addStoredNotification({
      title: `Message Dispatched to ${recipient}`,
      message: `From ${formData.name} (${formData.email}) - "${formData.message.slice(0, 60)}..."`,
      type: 'status_change',
    });
    addStoredAuditLog(
      formData.name,
      'vendor',
      'Contact Message Transmitted',
      'system',
      'contact-form',
      `Message forwarded to ${recipient} from ${formData.email}. Role: ${formData.role}`
    );

    try {
      const mailWindow = window.open(mailtoUrl, '_blank');
      if (!mailWindow || mailWindow.closed || typeof mailWindow.closed === 'undefined') {
        window.location.href = mailtoUrl;
      }
    } catch {
      window.location.href = mailtoUrl;
    }

    setSubmitted(true);
  };

  const visible = (id: string) => visibleSections.has(id);

  const profitMargin = Math.max(0, bidValueInput - costEstInput);
  const profitPercentage = bidValueInput > 0 ? ((profitMargin / bidValueInput) * 100).toFixed(1) : "0";

  return (
    <div
      className={theme === "dark" ? "dark" : ""}
      style={{
        fontFamily: "'Syne', sans-serif",
        background: theme === "dark" ? "#001428" : "#FAF6EE",
        color: theme === "dark" ? "#FAF6EE" : "#001F3F",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 clamp(20px, 4vw, 48px)",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled
            ? theme === "dark"
              ? "rgba(0, 20, 40, 0.96)"
              : "rgba(250, 246, 238, 0.96)"
            : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled
            ? theme === "dark"
              ? "1px solid rgba(255, 255, 255, 0.15)"
              : "1px solid #E5DFD5"
            : "1px solid transparent",
          transition: "all 0.4s ease",
        }}
      >
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "#001F3F",
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "0.06em", color: textColor }}>
            TENDER<span style={{ color: dimColor }}>VAULT</span>
          </span>
        </div>

        <div className="desktop-nav" style={{ display: "flex", gap: "36px", alignItems: "center" }}>
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                color: mutedColor,
                fontSize: 13,
                letterSpacing: "0.06em",
                textDecoration: "none",
                textTransform: "uppercase",
                fontWeight: 600,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#001F3F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6C6963")}
            >
              {l}
            </a>
          ))}
          {onToggleTheme && (
            <button
              id="landing-theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label="Toggle visual theme"
              title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
              style={{
                background: theme === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 31, 63, 0.06)",
                border: `1px solid ${theme === "dark" ? "rgba(255, 255, 255, 0.25)" : "#D5CFC5"}`,
                borderRadius: "10px",
                padding: "8px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: theme === "dark" ? "#FAF6EE" : "#001F3F",
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                transition: "all 0.2s ease",
              }}
            >
              {theme === "dark" ? (
                <>
                  <Sun style={{ width: 14, height: 14, color: "#F59E0B" }} />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon style={{ width: 14, height: 14, color: textColor }} />
                  <span>Dark</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={() => onLaunchPlatform("admin")}
            className="btn-primary"
            style={{ padding: "10px 24px", fontSize: 12 }}
          >
            Login
          </button>
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "none",
            flexDirection: "column",
            gap: "5px",
            padding: "8px",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 22, height: 2, background: "#001F3F" }} />
          ))}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div
          className="mobile-menu"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99,
            background: isDark ? "#001730" : "#FAF6EE",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "28px",
            borderBottom: "2px solid #E5DFD5",
          }}
        >
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close mobile navigation"
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              background: "none",
              border: "none",
              color: textColor,
              fontSize: 24,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setMenuOpen(false)}
              style={{
                color: textColor,
                fontSize: 22,
                fontWeight: 700,
                textDecoration: "none",
                letterSpacing: "0.06em",
              }}
            >
              {l}
            </a>
          ))}
          {onToggleTheme && (
            <button
              onClick={() => {
                onToggleTheme();
                setMenuOpen(false);
              }}
              style={{
                background: "rgba(0, 31, 63, 0.08)",
                border: "1px solid #D5CFC5",
                borderRadius: "12px",
                padding: "10px 20px",
                color: textColor,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {theme === "dark" ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
              <span>Toggle to {theme === "dark" ? "Light" : "Dark"} Theme</span>
            </button>
          )}
          <button
            onClick={() => {
              setMenuOpen(false);
              onLaunchPlatform("admin");
            }}
            className="btn-primary"
          >
            Login
          </button>
        </div>
      )}

      {/* HERO */}
      <section
        id="hero"
        className="noise grid-bg"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "130px 24px 80px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: "650px",
            height: "650px",
            background: "radial-gradient(circle, rgba(0, 31, 63, 0.045) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            color: dimColor,
            marginBottom: 24,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Tender Management Platform v2.0
        </div>

        <h1
          style={{
            fontSize: "clamp(42px, 7.5vw, 92px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 28,
            maxWidth: 960,
            color: textColor,
          }}
        >
          Win More Contracts.<br />
          <span style={{ color: dimColor }}>Lose Less Time.</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: mutedColor,
            maxWidth: 580,
            lineHeight: 1.7,
            marginBottom: 44,
            fontWeight: 400,
          }}
        >
          TenderVault is the command centre for modern procurement—where contractors post, bidders compete, and data decides the winner.
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => onLaunchPlatform("vendor")}
            className="btn-primary"
            style={{ fontSize: 14 }}
          >
            Start Bidding Free
          </button>
          <button
            onClick={() => onLaunchPlatform("admin")}
            className="btn-outline"
            style={{ fontSize: 14 }}
          >
            Post a Tender
          </button>
        </div>

        <div
          style={{
            marginTop: 80,
            display: "flex",
            gap: "clamp(32px, 6vw, 64px)",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            ["12K+", "Active Bidders"],
            ["3.4K", "Tenders Awarded"],
            ["₹18,000 Cr+", "Contract Value"],
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div
                className="mono"
                style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", color: textColor }}
              >
                {n}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: dimColor,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 1,
              height: 36,
              background: "linear-gradient(#736F68, transparent)",
            }}
          />
          <div className="mono" style={{ fontSize: 10, color: dimColor, letterSpacing: "0.15em" }}>
            SCROLL
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        style={{ padding: "120px clamp(20px, 4vw, 48px)", maxWidth: 1200, margin: "0 auto" }}
      >
        <div className={`reveal ${visible("features") ? "visible" : ""}`}>
          <div
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              color: dimColor,
              marginBottom: 16,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            01 — Capabilities
          </div>
          <h2
            style={{
              fontSize: "clamp(34px, 5vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 16,
              color: textColor,
              lineHeight: 1.1,
            }}
          >
            Everything a tender<br />needs. Nothing it doesn't.
          </h2>
          <p
            style={{
              color: mutedColor,
              fontSize: 16,
              maxWidth: 500,
              lineHeight: 1.7,
              marginBottom: 64,
            }}
          >
            Built for the full procurement lifecycle—from first post to final signature.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`feature-card reveal reveal-delay-${(i % 3) + 1} ${
                visible("features") ? "visible" : ""
              }`}
            >
              <div style={{ fontSize: 30, marginBottom: 20, color: textColor }}>{f.icon}</div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 19,
                  marginBottom: 12,
                  letterSpacing: "-0.01em",
                  color: textColor,
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: mutedColor, fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        style={{
          padding: "120px clamp(20px, 4vw, 48px)",
          background: sectionAltBg,
          borderTop: "1px solid " + cardBorder,
          borderBottom: "1px solid " + cardBorder,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className={`reveal ${visible("how-it-works") ? "visible" : ""}`}>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                color: dimColor,
                marginBottom: 16,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              02 — Process
            </div>
            <h2
              style={{
                fontSize: "clamp(34px, 5vw, 60px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: 72,
                color: textColor,
                lineHeight: 1.1,
              }}
            >
              Four steps.<br />One platform.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "32px",
            }}
          >
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={item.step}
                className={`reveal reveal-delay-${i + 1} ${visible("how-it-works") ? "visible" : ""}`}
                style={{
                  borderLeft: "2px solid #D5CFC5",
                  paddingLeft: 24,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: -2,
                    top: 0,
                    width: 2,
                    height: "40%",
                    background: "#001F3F",
                  }}
                />
                <div
                  className="mono"
                  style={{
                    fontSize: 12,
                    color: textColor,
                    fontWeight: 700,
                    marginBottom: 8,
                    letterSpacing: "0.1em",
                  }}
                >
                  {item.step}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: dimColor,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                    background: badgeBg,
                    display: "inline-block",
                    padding: "4px 10px",
                    fontWeight: 700,
                    border: "1px solid #DDD7CD",
                  }}
                >
                  {item.role}
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    marginBottom: 12,
                    letterSpacing: "-0.01em",
                    color: textColor,
                  }}
                >
                  {item.action}
                </h3>
                <p style={{ color: mutedColor, fontSize: 14, lineHeight: 1.7 }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section
        id="preview"
        style={{ padding: "120px clamp(20px, 4vw, 48px)", maxWidth: 1200, margin: "0 auto" }}
      >
        <div
          className={`reveal ${visible("features") ? "visible" : ""}`}
          style={{
            marginBottom: 48,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                color: dimColor,
                marginBottom: 16,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              03 — Interface Preview
            </div>
            <h2
              style={{
                fontSize: "clamp(32px, 4vw, 54px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: textColor,
              }}
            >
              Your dashboard. Your rules.
            </h2>
          </div>
        </div>

        {/* Mock / Interactive Dashboard UI */}
        <div
          style={{
            border: "1px solid " + cardBorder,
            background: cardBg,
            overflow: "hidden",
            boxShadow: "0 16px 36px -12px rgba(0, 31, 63, 0.08)",
            borderRadius: "16px",
          }}
        >
          {/* Topbar */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid " + cardBorder,
              background: innerCardBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div className="mono" style={{ fontSize: 12, color: textColor, fontWeight: 600 }}>
              TenderVault — {
                previewTab === "Profit Calc"
                  ? "Profit Margin Simulator"
                  : previewTab === "Eligibility AI"
                  ? "AI Tender Eligibility Prediction Engine"
                  : previewTab === "Deadline Alerts"
                  ? "AI Deadline & Requirement Monitoring Center"
                  : previewTab === "My Bids"
                  ? "Sealed Bids & Cryptographic Verification"
                  : "Bidder & Contractor Unified Dashboard"
              }
            </div>
            <button
              onClick={() => onLaunchPlatform("vendor")}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: textColor,
                background: badgeBg,
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid #D5CFC5",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Launch Live Suite ↗
            </button>
          </div>

          <div
            className="preview-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(190px, 230px) 1fr",
              minHeight: 460,
            }}
          >
            {/* Sidebar */}
            <div
              style={{
                borderRight: "1px solid " + cardBorder,
                padding: "24px 0",
                background: innerCardBg,
              }}
            >
              {[
                ["◈", "Overview"],
                ["✨", "Eligibility AI"],
                ["🔔", "Deadline Alerts"],
                ["⟁", "Profit Calc"],
                ["▣", "My Bids"],
              ].map(([icon, label]) => {
                const active = previewTab === label;
                return (
                  <div
                    key={label}
                    onClick={() => setPreviewTab(label)}
                    style={{
                      padding: "12px 24px",
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      background: active ? "#F3EDE2" : "transparent",
                      borderLeft: active ? "3px solid #001F3F" : "3px solid transparent",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    <span style={{ color: active ? "#001F3F" : "#736F68", fontSize: 14 }}>
                      {icon}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: active ? "#001F3F" : "#5E5B56",
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Main Content Area */}
            <div style={{ padding: "24px", background: cardBg }}>
              {previewTab === "Eligibility AI" ? (
                /* Interactive Tender Eligibility Prediction tool */
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: textColor }}>
                        AI Tender Eligibility Predictor
                      </h4>
                      <span className="mono" style={{ fontSize: 11, background: badgeBg, color: textColor, padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>
                        Real-time AI Match
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: dimColor, lineHeight: 1.5 }}>
                      Test your company credentials against target tender statutory criteria to evaluate likelihood of qualification.
                    </p>
                  </div>

                  {/* Tender selector */}
                  <div style={{ background: innerCardBg, padding: 14, border: "1px solid " + cardBorder, borderRadius: 8 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: mutedColor, display: "block", marginBottom: 6 }}>
                      Target Tender Specification
                    </label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setEligTenderChoice("bridge")}
                        style={{
                          padding: "8px 14px",
                          fontSize: 12,
                          fontWeight: eligTenderChoice === "bridge" ? 700 : 500,
                          background: eligTenderChoice === "bridge" ? "#001F3F" : "#FFFFFF",
                          color: eligTenderChoice === "bridge" ? "#FAF6EE" : "#001F3F",
                          border: "1px solid #D5CFC5",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        Bridge Renovation (₹2.4 Cr • Min ₹2 Cr Turnover • 5y Exp)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEligTenderChoice("it")}
                        style={{
                          padding: "8px 14px",
                          fontSize: 12,
                          fontWeight: eligTenderChoice === "it" ? 700 : 500,
                          background: eligTenderChoice === "it" ? "#001F3F" : "#FFFFFF",
                          color: eligTenderChoice === "it" ? "#FAF6EE" : "#001F3F",
                          border: "1px solid #D5CFC5",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        IT Infrastructure (₹89 Lakhs • Min ₹50 Lakhs Turnover • 3y Exp)
                      </button>
                    </div>
                  </div>

                  {/* Form inputs */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: mutedColor, display: "block", marginBottom: 6 }}>
                        Your Annual Turnover (₹)
                      </label>
                      <input
                        type="number"
                        step="100000"
                        value={eligTurnover}
                        onChange={(e) => setEligTurnover(Number(e.target.value))}
                        style={{ padding: "8px 12px", fontSize: 14, fontWeight: 600, width: "100%", borderRadius: 6 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: mutedColor, display: "block", marginBottom: 6 }}>
                        Years Operating Experience
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="50"
                        value={eligYears}
                        onChange={(e) => setEligYears(Number(e.target.value))}
                        style={{ padding: "8px 12px", fontSize: 14, fontWeight: 600, width: "100%", borderRadius: 6 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: mutedColor, display: "block", marginBottom: 6 }}>
                        Primary QA Certification
                      </label>
                      <select
                        value={eligCert}
                        onChange={(e) => setEligCert(e.target.value)}
                        style={{ padding: "8px 12px", fontSize: 13, width: "100%", borderRadius: 6 }}
                      >
                        <option value="ISO 9001:2015">ISO 9001:2015 (Standard)</option>
                        <option value="ISO 27001">ISO 27001 (Cyber/Security)</option>
                        <option value="CMMI Level 3">CMMI Level 3</option>
                        <option value="None">None / Pending</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Prediction Output Box */}
                  {(() => {
                    const minTurnover = eligTenderChoice === "bridge" ? 2000000 : 500000;
                    const minYears = eligTenderChoice === "bridge" ? 5 : 3;
                    const turnoverPass = eligTurnover >= minTurnover;
                    const yearsPass = eligYears >= minYears;
                    const certPass = eligCert !== "None";

                    let score = 25; // baseline tax & legal compliance
                    if (turnoverPass) score += 40; else score += Math.min(30, Math.floor((eligTurnover / minTurnover) * 35));
                    if (yearsPass) score += 20; else score += Math.min(15, Math.floor((eligYears / minYears) * 15));
                    if (certPass) score += 15;

                    const isHigh = score >= 80;
                    const isMed = score >= 60 && score < 80;

                    return (
                      <div style={{ background: innerCardBg, border: "1px solid " + cardBorder, borderRadius: 8, padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                          <div>
                            <span style={{ fontSize: 10, color: dimColor, textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                              AI Eligibility Match Score
                            </span>
                            <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: isHigh ? "#047857" : isMed ? "#B45309" : "#B91C1C" }}>
                              {score}% — {isHigh ? "Highly Likely to Qualify" : isMed ? "Moderate Likelihood" : "Low Eligibility Risk"}
                            </span>
                          </div>
                          <button
                            onClick={() => onLaunchPlatform("vendor")}
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              background: "#001F3F",
                              color: "#FAF6EE",
                              padding: "8px 14px",
                              borderRadius: 6,
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Launch Full Engine ↗
                          </button>
                        </div>

                        {/* Checklist */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, fontSize: 12, marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: turnoverPass ? "#047857" : "#B91C1C" }}>
                            <span>{turnoverPass ? "✓" : "✗"}</span>
                            <span>Turnover: ₹{eligTurnover.toLocaleString('en-IN')} (Req: ₹{minTurnover.toLocaleString('en-IN')})</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: yearsPass ? "#047857" : "#B91C1C" }}>
                            <span>{yearsPass ? "✓" : "✗"}</span>
                            <span>Experience: {eligYears} Yrs (Req: {minYears}+ yrs)</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: certPass ? "#047857" : "#B45309" }}>
                            <span>{certPass ? "✓" : "⚠"}</span>
                            <span>Certification: {eligCert}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#047857" }}>
                            <span>✓</span>
                            <span>Tax & Sanctions: Cleared</span>
                          </div>
                        </div>

                        <div style={{ fontSize: 11, color: mutedColor, background: cardBg, padding: "8px 12px", borderRadius: 4, border: "1px solid #EAE5DB" }}>
                          <strong>AI Recommendation:</strong> {isHigh
                            ? "Your company matches mandatory prerequisites. Financial & technical baseline confirms eligibility. Recommended to submit proposal."
                            : isMed
                            ? "Borderline score. Consider forming a Joint Venture or submitting supplementary QA certificates to satisfy bid committee criteria."
                            : "Prerequisites unmet. Bidding directly may lead to disqualification in technical stage 1."}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : previewTab === "Deadline Alerts" ? (
                /* Interactive Deadline & Requirement Alerts tool */
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: textColor }}>
                        AI Deadline & Requirement Alert Center
                      </h4>
                      <span className="mono" style={{ fontSize: 11, background: "#FEF3C7", color: "#92400E", padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>
                        2 Critical Deadlines Tracked
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: dimColor, lineHeight: 1.5 }}>
                      Proactive system scanning monitors tender addenda, query submission cutoffs, and required statutory affidavits.
                    </p>
                  </div>

                  {/* Alert cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div
                      style={{
                        padding: 16,
                        border: "1px solid " + cardBorder,
                        borderRadius: 8,
                        background: innerCardBg,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C", background: "#FEE2E2", padding: "2px 8px", borderRadius: 4 }}>
                              🚨 High Urgency (Closes in 48h 12m)
                            </span>
                            <span className="mono" style={{ fontSize: 11, color: dimColor }}>Ref: TV-2026-001</span>
                          </div>
                          <h5 style={{ fontSize: 14, fontWeight: 700, color: textColor, marginTop: 4 }}>
                            Bridge Renovation — Phase 3 (Metropolitan Authority)
                          </h5>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAlertsReminded(prev => ({ ...prev, "alert-1": !prev["alert-1"] }))}
                          style={{
                            padding: "6px 14px",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 6,
                            cursor: "pointer",
                            border: "1px solid #001F3F",
                            background: alertsReminded["alert-1"] ? "#001F3F" : "#FFFFFF",
                            color: alertsReminded["alert-1"] ? "#FAF6EE" : "#001F3F",
                            transition: "all 0.15s",
                          }}
                        >
                          {alertsReminded["alert-1"] ? "✓ Reminders Armed (SMS & Calendar)" : "Set Proactive Reminder 🔔"}
                        </button>
                      </div>

                      <div style={{ background: cardBg, padding: "10px 14px", borderRadius: 6, border: "1px solid " + cardBorder, fontSize: 12 }}>
                        <div style={{ fontWeight: 600, color: "#B91C1C", marginBottom: 2 }}>
                          AI Requirement Warning:
                        </div>
                        <div style={{ color: mutedColor }}>
                          Mandatory Bank Guarantee (₹5,00,000) must be physically deposited or lodged 24 hours prior to deadline cutoff. 1 of 3 required documents still pending in vault.
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 16,
                        border: "1px solid " + cardBorder,
                        borderRadius: 8,
                        background: innerCardBg,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "2px 8px", borderRadius: 4 }}>
                              ⏱ Window Closing in 24h
                            </span>
                            <span className="mono" style={{ fontSize: 11, color: dimColor }}>Ref: TV-2026-004</span>
                          </div>
                          <h5 style={{ fontSize: 14, fontWeight: 700, color: textColor, marginTop: 4 }}>
                            IT Infrastructure Upgrade (Health Services)
                          </h5>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAlertsReminded(prev => ({ ...prev, "alert-2": !prev["alert-2"] }))}
                          style={{
                            padding: "6px 14px",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 6,
                            cursor: "pointer",
                            border: "1px solid #001F3F",
                            background: alertsReminded["alert-2"] ? "#001F3F" : "#FFFFFF",
                            color: alertsReminded["alert-2"] ? "#FAF6EE" : "#001F3F",
                            transition: "all 0.15s",
                          }}
                        >
                          {alertsReminded["alert-2"] ? "✓ Reminders Armed (SMS & Calendar)" : "Set Proactive Reminder 🔔"}
                        </button>
                      </div>

                      <div style={{ background: cardBg, padding: "10px 14px", borderRadius: 6, border: "1px solid " + cardBorder, fontSize: 12 }}>
                        <div style={{ fontWeight: 600, color: textColor, marginBottom: 2 }}>
                          AI Requirement Warning:
                        </div>
                        <div style={{ color: mutedColor }}>
                          Pre-bid clarification questions cutoff is tomorrow at 17:00 UTC. Tender closing in 6 days. CMMI or ISO 27001 proof required with proposal envelope.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                    <span style={{ fontSize: 11, color: dimColor }}>
                      Synced with automated notifications engine • Push, Email & Webhook alerts
                    </span>
                    <button
                      onClick={() => onLaunchPlatform("vendor")}
                      className="btn-primary"
                      style={{ fontSize: 12, padding: "8px 18px" }}
                    >
                      Open Live Alert Manager →
                    </button>
                  </div>
                </div>
              ) : previewTab === "My Bids" ? (
                /* My Bids view */
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: textColor }}>
                        Encrypted Bids & Submissions
                      </h4>
                      <p style={{ fontSize: 12, color: dimColor }}>
                        Cryptographically sealed until official tender deadline opening.
                      </p>
                    </div>
                    <button
                      onClick={() => onLaunchPlatform("vendor")}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: "#001F3F",
                        color: "#FAF6EE",
                        padding: "8px 14px",
                        borderRadius: 6,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Submit New Sealed Bid +
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { tender: "Bridge Renovation — Phase 3", amount: "₹2,24,00,000", margin: "18.2%", status: "Sealed & Verified", hash: "sha256:8f4c...91b0" },
                      { tender: "Metro Traffic Signal Network", amount: "₹64,00,000", margin: "22.5%", status: "Under Review", hash: "sha256:1a7d...33e4" },
                    ].map((b) => (
                      <div key={b.tender} style={{ background: innerCardBg, border: "1px solid " + cardBorder, borderRadius: 8, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{b.tender}</div>
                          <div className="mono" style={{ fontSize: 11, color: dimColor, marginTop: 2 }}>
                            Audit Hash: {b.hash}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: textColor }}>{b.amount}</div>
                          <div style={{ fontSize: 11, color: "#047857", fontWeight: 600 }}>{b.status} ({b.margin} margin)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : previewTab === "Profit Calc" ? (
                /* Profit Calc Mini Interactive Tool */
                <div style={{ spaceY: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 4 }}>
                      Real-Time Bid Margin Modeler
                    </h4>
                    <p style={{ fontSize: 12, color: dimColor }}>
                      Adjust your target submission price and estimated costs to test projected returns.
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: mutedColor, display: "block", marginBottom: 6 }}>
                        Proposed Bid Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="5000"
                        value={bidValueInput}
                        onChange={(e) => setBidValueInput(Number(e.target.value))}
                        style={{ padding: "10px 14px", fontSize: 15, fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: mutedColor, display: "block", marginBottom: 6 }}>
                        Direct Estimated Costs (₹)
                      </label>
                      <input
                        type="number"
                        step="5000"
                        value={costEstInput}
                        onChange={(e) => setCostEstInput(Number(e.target.value))}
                        style={{ padding: "10px 14px", fontSize: 15, fontWeight: 600 }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 16,
                      background: innerCardBg,
                      padding: 16,
                      border: "1px solid " + cardBorder,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 10, color: dimColor, textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                        Projected Profit
                      </span>
                      <span className="mono" style={{ fontSize: 22, fontWeight: 600, color: textColor }}>
                        ₹{profitMargin.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: dimColor, textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                        Margin Rate
                      </span>
                      <span className="mono" style={{ fontSize: 22, fontWeight: 600, color: Number(profitPercentage) >= 15 ? "#047857" : "#B45309" }}>
                        {profitPercentage}%
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: dimColor, textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                        Viability Check
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: Number(profitPercentage) >= 15 ? "#047857" : "#B45309", marginTop: 4, display: "inline-block" }}>
                        {Number(profitPercentage) >= 15 ? "✓ Healthy Margin" : "⚠ Tight Margin"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onLaunchPlatform("vendor")}
                    className="btn-primary"
                    style={{ fontSize: 12, padding: "10px 20px" }}
                  >
                    Apply Model to Live Bids →
                  </button>
                </div>
              ) : (
                /* Standard Overview / Preview layout */
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    {[
                      ["Active Bids", "7", "+2 this week"],
                      ["Win Rate", "64%", "↑ 8% vs last month"],
                      ["Projected Profit", "₹14.2 Lakhs", "Based on 3 bids"],
                    ].map(([l, v, sub]) => (
                      <div
                        key={l}
                        style={{
                          background: innerCardBg,
                          padding: "20px",
                          border: "1px solid " + cardBorder,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: dimColor,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            marginBottom: 8,
                            fontWeight: 600,
                          }}
                        >
                          {l}
                        </div>
                        <div
                          className="mono"
                          style={{
                            fontSize: 28,
                            fontWeight: 600,
                            marginBottom: 4,
                            color: textColor,
                          }}
                        >
                          {v}
                        </div>
                        <div style={{ fontSize: 11, color: mutedColor }}>{sub}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: innerCardBg, border: "1px solid " + cardBorder, padding: 20 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: dimColor,
                        marginBottom: 16,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      Recent Tenders
                    </div>
                    {[
                      ["Bridge Renovation — Phase 3", "Closes in 4d", "₹2.4 Cr", "Open"],
                      ["IT Infrastructure Upgrade", "Closes in 9d", "₹89 Lakhs", "Bidding"],
                      ["School Complex Construction", "Closes in 14d", "₹5.1 Cr", "Open"],
                    ].map(([name, time, val, status]) => (
                      <div
                        key={name}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 0",
                          borderBottom: "1px solid " + cardBorder,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              marginBottom: 2,
                              color: textColor,
                            }}
                          >
                            {name}
                          </div>
                          <div className="mono" style={{ fontSize: 11, color: dimColor }}>
                            {time}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            className="mono"
                            style={{ fontSize: 14, fontWeight: 600, color: textColor }}
                          >
                            {val}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: status === "Bidding" ? "#001F3F" : "#736F68",
                              letterSpacing: "0.1em",
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                          >
                            {status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        style={{
          padding: "120px clamp(20px, 4vw, 48px)",
          background: sectionAltBg,
          borderTop: "1px solid " + cardBorder,
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            className={`reveal ${visible("pricing") ? "visible" : ""}`}
            style={{ textAlign: "center", marginBottom: 72 }}
          >
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                color: dimColor,
                marginBottom: 16,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              04 — Pricing
            </div>
            <h2
              style={{
                fontSize: "clamp(34px, 5vw, 60px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: 16,
                color: textColor,
                lineHeight: 1.1,
              }}
            >
              Transparent pricing.<br />No surprises.
            </h2>
            <p style={{ color: mutedColor, fontSize: 16 }}>Start free. Scale when you're ready.</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {PRICING.map((p, i) => (
              <div
                key={p.tier}
                className={`pricing-card ${p.highlight ? "highlighted" : ""} reveal reveal-delay-${
                  i + 1
                } ${visible("pricing") ? "visible" : ""}`}
                style={{
                  background: p.highlight ? "#001F3F" : "#FFFFFF",
                  color: p.highlight ? "#FAF6EE" : "#1A1A1A",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: p.highlight ? "#D5CFC5" : "#736F68",
                    marginBottom: 24,
                    fontWeight: 700,
                  }}
                >
                  {p.tier}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 48,
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    marginBottom: 4,
                    color: p.highlight ? "#FAF6EE" : "#001F3F",
                  }}
                >
                  {p.price}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: p.highlight ? "#D5CFC5" : "#736F68",
                    marginBottom: 16,
                  }}
                >
                  {p.period}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: p.highlight ? "#EAE5DB" : "#5E5B56",
                    marginBottom: 32,
                    lineHeight: 1.6,
                  }}
                >
                  {p.desc}
                </p>
                <div
                  style={{
                    borderTop: `1px solid ${p.highlight ? "rgba(255,255,255,0.15)" : "#E5DFD5"}`,
                    paddingTop: 24,
                    marginBottom: 32,
                  }}
                >
                  {p.features.map((f) => (
                    <div
                      key={f}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <span style={{ color: p.highlight ? "#FAF6EE" : "#001F3F", marginTop: 2 }}>
                        —
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: p.highlight ? "#FAF6EE" : "#5E5B56",
                          lineHeight: 1.5,
                        }}
                      >
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onLaunchPlatform(p.tier === "Starter" ? "vendor" : "admin")}
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: p.highlight ? "none" : "1px solid #D5CFC5",
                    background: p.highlight ? "#FAF6EE" : "#FAF6EE",
                    color: p.highlight ? "#001F3F" : "#001F3F",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    borderRadius: "8px",
                    boxShadow: p.highlight ? "0 4px 12px rgba(0, 0, 0, 0.2)" : "0 2px 6px rgba(0, 31, 63, 0.05)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        style={{ padding: "120px clamp(20px, 4vw, 48px)", maxWidth: 1200, margin: "0 auto" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "clamp(40px, 6vw, 80px)",
            alignItems: "center",
          }}
        >
          <div className={`reveal ${visible("about") ? "visible" : ""}`}>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                color: dimColor,
                marginBottom: 16,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              05 — About Us
            </div>
            <h2
              style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: 24,
                lineHeight: 1.1,
                color: textColor,
              }}
            >
              We make procurement<br />less painful.
            </h2>
            <p style={{ color: mutedColor, fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>
              TenderVault was built by a team that lived through the chaos of manual bid management—spreadsheets, email chains, missed deadlines. We knew there had to be a better way.
            </p>
            <p style={{ color: dimColor, fontSize: 15, lineHeight: 1.8, marginBottom: 40 }}>
              Today we serve thousands of contractors and bidders across infrastructure, tech, and construction—bringing speed, clarity, and fairness to every tender cycle.
            </p>
            <div style={{ display: "flex", gap: "40px" }}>
              {[
                ["2019", "Founded"],
                ["40+", "Countries"],
                ["99.9%", "Uptime"],
              ].map(([v, l]) => (
                <div key={l}>
                  <div
                    className="mono"
                    style={{ fontSize: 26, fontWeight: 600, color: textColor }}
                  >
                    {v}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: dimColor,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`reveal reveal-delay-2 ${visible("about") ? "visible" : ""}`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[
                ["Transparent", "Every bid, every action, fully auditable."],
                ["Neutral", "We never favour any party in the process."],
                ["Secure", "Bank-grade encryption, SOC2 compliant."],
                ["Fast", "Post to awarded in as little as 72 hours."],
              ].map(([t, d]) => (
                <div
                  key={t}
                  style={{
                    background: cardBg,
                    border: "1px solid " + cardBorder,
                    padding: "24px 20px",
                    boxShadow: "0 2px 8px rgba(0, 31, 63, 0.03)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 8,
                      color: textColor,
                    }}
                  >
                    {t}
                  </div>
                  <div style={{ color: mutedColor, fontSize: 13, lineHeight: 1.6 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        style={{
          padding: "120px clamp(20px, 4vw, 48px)",
          background: sectionAltBg,
          borderTop: "1px solid " + cardBorder,
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div
            className={`reveal ${visible("contact") ? "visible" : ""}`}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                color: dimColor,
                marginBottom: 16,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              06 — Contact
            </div>
            <h2
              style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: 16,
                color: textColor,
              }}
            >
              Let's talk tenders.
            </h2>
            <p style={{ color: mutedColor, fontSize: 15, marginBottom: 20 }}>
              Got questions? Direct your message straight to our team.
            </p>

            {/* Delivery address badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 9999,
                background: cardBg,
                border: "1px solid " + cardBorder,
                fontSize: 13,
                color: textColor,
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0, 31, 63, 0.04)",
              }}
            >
              <Mail style={{ width: 15, height: 15, color: textColor }} />
              <span>Delivering all inquiries to:</span>
              <span
                style={{
                  fontFamily: "monospace",
                  background: isDark ? "#001730" : "#FAF6EE",
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontWeight: 700,
                  color: textColor,
                  border: "1px solid " + cardBorder,
                }}
              >
                dpalak256@gmail.com
              </span>
            </div>
          </div>

          {submitted ? (
            <div
              className={`reveal ${visible("contact") ? "visible" : ""}`}
              style={{
                padding: "48px 36px",
                border: "1px solid " + cardBorder,
                background: cardBg,
                borderRadius: 16,
                boxShadow: "0 4px 20px rgba(0, 31, 63, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#E8F5E9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2E7D32",
                  }}
                >
                  <CheckCircle2 style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: textColor, margin: 0 }}>
                    Message Delivered to dpalak256@gmail.com
                  </h3>
                  <p style={{ color: mutedColor, fontSize: 13, margin: "4px 0 0 0" }}>
                    Your inquiry has been logged and dispatched directly to the designated address.
                  </p>
                </div>
              </div>

              {/* Delivery Receipt Box */}
              <div
                style={{
                  background: isDark ? "#001730" : "#FAF6EE",
                  border: "1px solid " + cardBorder,
                  borderRadius: 12,
                  padding: "16px 20px",
                  margin: "24px 0",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "8px 12px" }}>
                  <span style={{ color: dimColor, fontWeight: 600 }}>Destination:</span>
                  <span style={{ color: textColor, fontWeight: 700, fontFamily: "monospace" }}>
                    dpalak256@gmail.com
                  </span>

                  <span style={{ color: dimColor, fontWeight: 600 }}>Sender:</span>
                  <span style={{ color: textColor, fontWeight: 600 }}>
                    {formData.name} &lt;{formData.email}&gt;
                  </span>

                  <span style={{ color: dimColor, fontWeight: 600 }}>Inquiring As:</span>
                  <span style={{ color: textColor, textTransform: "capitalize" }}>
                    {formData.role}
                  </span>

                  <span style={{ color: dimColor, fontWeight: 600 }}>Message:</span>
                  <span style={{ color: textColor, whiteSpace: "pre-wrap" }}>
                    {formData.message}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={`mailto:dpalak256@gmail.com?subject=${encodeURIComponent(
                    `[TenderVault Inquiry] ${formData.name} (${formData.role})`
                  )}&body=${encodeURIComponent(
                    `Name: ${formData.name}\nEmail: ${formData.email}\nRole: ${formData.role}\n\nMessage:\n${formData.message}`
                  )}`}
                  className="btn-outline"
                  style={{ fontSize: 12, padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Send style={{ width: 13, height: 13 }} />
                  Re-send via Email Client
                </a>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", role: "bidder", message: "" });
                  }}
                  className="btn-primary"
                  style={{ fontSize: 12, padding: "10px 20px" }}
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className={`reveal ${visible("contact") ? "visible" : ""}`}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <input
                  placeholder="Your Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="bidder">I am a Bidder</option>
                <option value="contractor">I am a Contractor</option>
                <option value="enterprise">Enterprise Inquiry</option>
              </select>
              <textarea
                rows={5}
                placeholder="Write your message here... it will be delivered directly to dpalak256@gmail.com"
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{ resize: "vertical" }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  <span>Send Message to dpalak256@gmail.com</span>
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </button>
                <span style={{ fontSize: 12, color: dimColor }}>
                  Destination: <strong style={{ color: textColor }}>dpalak256@gmail.com</strong>
                </span>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: "48px clamp(20px, 4vw, 48px)",
          borderTop: "1px solid " + cardBorder,
          background: isDark ? "#001730" : "#FAF6EE",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 20,
              height: 20,
              background: "#001F3F",
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          />
          <span className="mono" style={{ color: dimColor, fontSize: 13, fontWeight: 500 }}>
            TENDERVAULT © 2026
          </span>
        </div>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          {["Privacy", "Terms", "Security", "Status"].map((l) => (
            <a
              key={l}
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                color: dimColor,
                fontSize: 12,
                textDecoration: "none",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 600,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#001F3F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#736F68")}
            >
              {l}
            </a>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "#8F8B83" }}>
          Built for precision procurement.
        </div>
      </footer>
    </div>
  );
}
