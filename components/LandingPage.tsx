"use client";

import Image from "next/image";

const CSS = `
html { scroll-behavior: smooth; }

.cl-landing * { box-sizing: border-box; margin: 0; padding: 0; }
.cl-landing {
  background: #1C2333;
  color: #fff;
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.55;
  letter-spacing: -0.005em;
  min-height: 100vh;
}

/* Nav */
.cl-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
  height: 60px;
  background: rgba(28,35,51,0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.cl-nav-wordmark {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-weight: 500;
  font-size: 17px;
  letter-spacing: -0.02em;
  color: #fff;
  text-decoration: none;
}
.cl-nav-links {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 32px;
  list-style: none;
}
.cl-nav-links a {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  transition: color 150ms;
}
.cl-nav-links a:hover { color: #fff; }
.cl-nav-cta {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: #1C2333;
  background: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: opacity 160ms;
}
.cl-nav-cta:hover { opacity: 0.88; }

/* Wrap */
.cl-wrap {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 80px;
}

/* Hero */
.cl-hero {
  padding-top: 140px;
  padding-bottom: 64px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cl-eyebrow {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
  margin-bottom: 28px;
}
.cl-hero-hed {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-weight: 500;
  font-size: clamp(48px, 6.4vw, 88px);
  line-height: 0.98;
  letter-spacing: -0.035em;
  color: #fff;
  margin-bottom: 28px;
}
.cl-hero-hed span { color: rgba(255,255,255,0.4); }
.cl-hero-sub {
  font-size: 17px;
  font-weight: 400;
  color: rgba(255,255,255,0.65);
  line-height: 1.6;
  max-width: 540px;
  margin-bottom: 44px;
  letter-spacing: -0.005em;
}

/* Email form */
.cl-cta-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
  max-width: 520px;
}
.cl-email-wrap {
  display: flex;
  align-items: center;
  width: 100%;
  height: 52px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.04);
  overflow: hidden;
  transition: border-color 150ms, background 150ms;
}
.cl-email-wrap:focus-within {
  border-color: rgba(255,255,255,0.32);
  background: rgba(255,255,255,0.07);
}
.cl-email-input {
  flex: 1;
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.005em;
  color: #fff;
  background: transparent;
  border: none;
  padding: 0 18px;
  outline: none;
  height: 100%;
}
.cl-email-input::placeholder { color: rgba(255,255,255,0.35); }
.cl-email-submit {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: #1C2333;
  background: #fff;
  border: none;
  height: 40px;
  padding: 0 20px;
  margin: 0 6px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 160ms;
}
.cl-email-submit:hover { opacity: 0.88; }
.cl-email-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.cl-guest-link {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.36);
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  margin-top: 20px;
  display: block;
  transition: color 150ms;
}
.cl-guest-link:hover { color: rgba(255,255,255,0.65); }
.cl-magic-sent {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.55);
  text-align: center;
}
.cl-magic-error {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-size: 12px;
  color: #8A7373;
  text-align: center;
}
.cl-privacy {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.28);
  text-align: center;
  margin-top: 4px;
}

/* Screenshot */
.cl-screenshot-wrap {
  width: 100%;
  padding: 0 40px 56px;
}
.cl-screenshot-inner {
  max-width: 1400px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.05) inset,
    0 60px 120px -20px rgba(0,0,0,0.5),
    0 30px 60px -30px rgba(0,0,0,0.4);
}
.cl-screenshot-inner img { width: 100%; height: auto; display: block; }

/* Strip divider */
.cl-strip-divider {
  border: none;
  border-top: 1px solid rgba(255,255,255,0.07);
  width: 100%;
}

/* Proof strip */
.cl-proof {
  padding: 24px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cl-proof-item {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
  text-align: center;
  padding: 0 28px;
}
.cl-proof-item + .cl-proof-item {
  border-left: 1px solid rgba(255,255,255,0.07);
}

/* Sections */
.cl-section { padding: 88px 0; }
.cl-section-label {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  margin-bottom: 44px;
}

/* How grid */
.cl-how-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 56px;
  border-top: 1px solid rgba(255,255,255,0.07);
  padding-top: 40px;
}
.cl-step-num {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.28);
  margin-bottom: 16px;
}
.cl-step-title {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-weight: 500;
  font-size: 18px;
  line-height: 1.25;
  letter-spacing: -0.015em;
  color: #fff;
  margin-bottom: 12px;
}
.cl-step-desc {
  font-size: 14px;
  font-weight: 400;
  color: rgba(255,255,255,0.55);
  line-height: 1.65;
  letter-spacing: -0.005em;
}

/* Feature blocks */
.cl-feature-block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 96px;
  align-items: start;
  padding: 64px 0;
  border-top: 1px solid rgba(255,255,255,0.07);
}
.cl-feature-block:last-child { border-bottom: 1px solid rgba(255,255,255,0.07); }
.cl-feature-block:first-child { border-top: none; }
.cl-feature-block.flip .cl-ft { order: 2; }
.cl-feature-block.flip .cl-fv { order: 1; }
.cl-feature-kicker {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  margin-bottom: 14px;
}
.cl-feature-title {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-weight: 500;
  font-size: 28px;
  line-height: 1.12;
  letter-spacing: -0.025em;
  color: #fff;
  margin-bottom: 16px;
}
.cl-feature-desc {
  font-size: 14px;
  font-weight: 400;
  color: rgba(255,255,255,0.55);
  line-height: 1.7;
  margin-bottom: 22px;
  letter-spacing: -0.005em;
}
.cl-feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.cl-feature-list li {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  padding-left: 16px;
  position: relative;
  line-height: 1.5;
  letter-spacing: -0.005em;
}
.cl-feature-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: rgba(255,255,255,0.25);
}
.cl-fv img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3);
}

/* Final CTA */
.cl-final-cta {
  padding: 88px 0 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cl-cta-hed {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-weight: 500;
  font-size: clamp(36px, 5vw, 56px);
  line-height: 1.0;
  letter-spacing: -0.03em;
  color: #fff;
  max-width: 560px;
  margin-bottom: 18px;
  text-align: center;
}
.cl-cta-sub {
  font-size: 15px;
  font-weight: 400;
  color: rgba(255,255,255,0.55);
  margin-bottom: 36px;
  max-width: 400px;
  line-height: 1.65;
  text-align: center;
  letter-spacing: -0.005em;
}

/* Footer */
.cl-footer {
  border-top: 1px solid rgba(255,255,255,0.07);
  padding: 20px 0;
  display: flex;
  align-items: center;
}
.cl-footer-note {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
}

/* Mobile */
@media (max-width: 768px) {
  .cl-wrap { padding: 0 24px; }
  .cl-nav { padding: 0 20px; height: 54px; }
  .cl-nav-links { display: none; }
  .cl-nav-cta { font-size: 12px; padding: 7px 14px; }
  .cl-hero { padding-top: 100px; padding-bottom: 48px; }
  .cl-hero-hed { font-size: clamp(36px, 10vw, 56px); margin-bottom: 20px; }
  .cl-hero-sub { font-size: 16px; margin-bottom: 36px; }
  .cl-cta-group { max-width: 100%; }
  .cl-email-wrap { height: 48px; }
  .cl-screenshot-wrap { padding: 0 16px 36px; }
  .cl-screenshot-inner { border-radius: 10px; }
  .cl-proof { flex-direction: column; gap: 0; padding: 0; }
  .cl-proof-item { padding: 14px 0; border-left: none !important; border-bottom: 1px solid rgba(255,255,255,0.07); width: 100%; }
  .cl-proof-item:last-child { border-bottom: none; }
  .cl-section { padding: 60px 0; }
  .cl-how-grid { grid-template-columns: 1fr; gap: 36px; }
  .cl-feature-block { grid-template-columns: 1fr; gap: 32px; padding: 52px 0; }
  .cl-feature-block.flip .cl-ft { order: 1; }
  .cl-feature-block.flip .cl-fv { order: 2; }
  .cl-feature-title { font-size: 22px; }
  .cl-final-cta { padding: 64px 0; }
  .cl-cta-hed { font-size: clamp(28px, 8vw, 40px); }
}
@media (max-width: 480px) {
  .cl-wrap { padding: 0 20px; }
  .cl-hero-hed { font-size: clamp(32px, 9vw, 44px); }
  .cl-screenshot-wrap { padding: 0 12px 28px; }
}
/* Below sm: (640px) — stack input + button vertically as separate full-width elements */
@media (max-width: 639px) {
  .cl-email-wrap {
    flex-direction: column;
    height: auto;
    border: none;
    background: transparent;
    gap: 8px;
    overflow: visible;
  }
  .cl-email-wrap:focus-within {
    border-color: transparent;
    background: transparent;
  }
  .cl-email-input {
    width: 100%;
    height: 52px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.04);
    padding: 0 18px;
    flex: none;
  }
  .cl-email-submit {
    width: 100%;
    height: 52px;
    border-radius: 10px;
    margin: 0;
    font-size: 15px;
  }
}
`;

interface EmailFormProps {
  email: string;
  setEmail: (v: string) => void;
  onSendMagicLink: () => void;
  sendingMagicLink: boolean;
  magicLinkSent: boolean;
  magicLinkError: string;
  onSkip: () => void;
  style?: React.CSSProperties;
}

function EmailForm({
  email, setEmail, onSendMagicLink,
  sendingMagicLink, magicLinkSent, magicLinkError, onSkip, style,
}: EmailFormProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSendMagicLink();
  }
  return (
    <div className="cl-cta-group" style={style}>
      {magicLinkSent ? (
        <p className="cl-magic-sent">Check your email for a sign-in link.</p>
      ) : (
        <>
          <form className="cl-email-wrap" onSubmit={handleSubmit}>
            <input
              type="email"
              className="cl-email-input"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="cl-email-submit" disabled={sendingMagicLink}>
              {sendingMagicLink ? "Sending..." : "Continue with email →"}
            </button>
          </form>
          {magicLinkError && <p className="cl-magic-error">{magicLinkError}</p>}
          <button className="cl-guest-link" onClick={onSkip}>
            Try without signing up →
          </button>
        </>
      )}
    </div>
  );
}

interface LandingPageProps {
  email: string;
  setEmail: (v: string) => void;
  onSendMagicLink: () => void;
  sendingMagicLink: boolean;
  magicLinkSent: boolean;
  magicLinkError: string;
  onSkip: () => void;
}

export default function LandingPage({
  email, setEmail, onSendMagicLink,
  sendingMagicLink, magicLinkSent, magicLinkError, onSkip,
}: LandingPageProps) {
  return (
    <div className="cl-landing">
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="cl-nav">
        <a href="/" className="cl-nav-wordmark" style={{display:'flex', alignItems:'center', gap:8}} onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <div style={{width:18, height:18, background:'#fff', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
            <span style={{color:'#1C2333', fontSize:10, fontWeight:600, lineHeight:1, letterSpacing:'-0.01em'}}>C</span>
          </div>
          Claro
        </a>
        <ul className="cl-nav-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#features">Features</a></li>
        </ul>
        <a href="#get-started" className="cl-nav-cta">Continue with email →</a>
      </nav>

      {/* HERO */}
      <div className="cl-wrap">
        <div className="cl-hero">
          <p className="cl-eyebrow">Career Copilot</p>
          <h1 className="cl-hero-hed">Know your fit<br /><span>before you apply.</span></h1>
          <p className="cl-hero-sub">Claro reads your resume and scores any job description against your actual background. Honest fit score, recruiter concern flag, and a precise action plan — before you write a single word.</p>
          <EmailForm email={email} setEmail={setEmail} onSendMagicLink={onSendMagicLink} sendingMagicLink={sendingMagicLink} magicLinkSent={magicLinkSent} magicLinkError={magicLinkError} onSkip={onSkip} />
        </div>
      </div>

      {/* HERO SCREENSHOT */}
      <div className="cl-screenshot-wrap">
        <div className="cl-screenshot-inner">
          <Image src="/screenshots/app-screenshot.png" alt="Claro app dashboard" width={3360} height={1858} style={{width:'100%',height:'auto'}} priority />
        </div>
      </div>

      {/* PROOF STRIP */}
      <div className="cl-wrap">
        <hr className="cl-strip-divider" />
        <div className="cl-proof">
          <div className="cl-proof-item">Honest scores, not encouragement</div>
          <div className="cl-proof-item">Recruiter concern flag on every score</div>
          <div className="cl-proof-item">Full prep guide to act on</div>
        </div>
        <hr className="cl-strip-divider" />
      </div>

      {/* HOW IT WORKS */}
      <div className="cl-wrap" id="how-it-works">
        <div className="cl-section">
          <p className="cl-section-label">How it works</p>
          <div className="cl-how-grid">
            <div>
              <p className="cl-step-num">01</p>
              <h3 className="cl-step-title">Upload your resume</h3>
              <p className="cl-step-desc">Claro maps your background into best-fit role clusters — with honest positioning risks and the LinkedIn headline you should actually be using.</p>
            </div>
            <div>
              <p className="cl-step-num">02</p>
              <h3 className="cl-step-title">Score any job description</h3>
              <p className="cl-step-desc">Paste a JD or drop in a URL. Get a 1–10 fit score across four dimensions, an apply or skip recommendation, and the specific recruiter concern most likely to sink your application.</p>
            </div>
            <div>
              <p className="cl-step-num">03</p>
              <h3 className="cl-step-title">Build your prep guide</h3>
              <p className="cl-step-desc">Generate everything you need to apply — cover letter angle, outreach messages, and interview prep. Your brief assembles automatically and you can email it to yourself in one click.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="cl-wrap" id="features">
        <div className="cl-section" style={{paddingTop:0, paddingBottom:0}}>
          <p className="cl-section-label">What you get</p>

          <div className="cl-feature-block">
            <div className="cl-ft">
              <p className="cl-feature-kicker">Profile Analysis</p>
              <h2 className="cl-feature-title">See how the market reads your background.</h2>
              <p className="cl-feature-desc">Most experienced professionals apply broadly and get silence. Not because they&apos;re underqualified — because their profile doesn&apos;t immediately answer the question every recruiter asks first: what should we hire this person for?</p>
              <ul className="cl-feature-list">
                <li>Best-fit role clusters with Pursue / Stretch ratings</li>
                <li>Core strengths framed for the roles you&apos;re targeting</li>
                <li>Positioning risks with specific guidance on how to address each one</li>
                <li>Recommended LinkedIn headline, optimized for how recruiters search</li>
              </ul>
            </div>
            <div className="cl-fv">
              <Image src="/screenshots/profile-screenshot.png" alt="Claro Profile tab" width={1920} height={1061} style={{width:'100%',height:'auto'}} />
            </div>
          </div>

          <div className="cl-feature-block flip">
            <div className="cl-ft">
              <p className="cl-feature-kicker">Job Fit Scoring</p>
              <h2 className="cl-feature-title">Know if it&apos;s worth your time before you apply.</h2>
              <p className="cl-feature-desc">A 1–10 fit score across four dimensions. A clear apply or skip recommendation. And the one recruiter concern most likely to flag your application — so you can address it before they ever see your resume.</p>
              <ul className="cl-feature-list">
                <li>Functional, seniority, industry, and keyword fit — each scored separately</li>
                <li>Recruiter concern flag: the specific objection you need to preempt</li>
                <li>What you have vs. what&apos;s missing — dismissable, re-score without gaps you&apos;ve addressed</li>
                <li>Paste text or drop in a URL — Claro fetches the JD directly</li>
              </ul>
            </div>
            <div className="cl-fv">
              <Image src="/screenshots/jobfit-screenshot.png" alt="Claro Job Fit tab" width={1920} height={1061} style={{width:'100%',height:'auto'}} />
            </div>
          </div>

          <div className="cl-feature-block">
            <div className="cl-ft">
              <p className="cl-feature-kicker">Your Brief</p>
              <h2 className="cl-feature-title">A precise plan, not a generic checklist.</h2>
              <p className="cl-feature-desc">The Application Brief is the core thing Claro produces. It tells you exactly what your cover letter, outreach, and resume need to accomplish — so you can write them yourself, armed with the right strategy, in any tool you want.</p>
              <ul className="cl-feature-list">
                <li>Lead strengths to emphasize — with exact framing language</li>
                <li>JD phrases to mirror in your materials</li>
                <li>What to de-emphasize and why</li>
                <li>Numbered action plan, emailable to yourself</li>
              </ul>
            </div>
            <div className="cl-fv">
              <Image src="/screenshots/brief-screenshot.png" alt="Claro Application Brief" width={1920} height={1061} style={{width:'100%',height:'auto'}} />
            </div>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="cl-wrap" id="get-started">
        <div className="cl-final-cta">
          <h2 className="cl-cta-hed">Apply to fewer jobs.<br />Land the right ones.</h2>
          <p className="cl-cta-sub">Completely free. No resume builder, no job board, no generic advice. Just a clear read on where you fit and exactly what to do about it.</p>
          <EmailForm email={email} setEmail={setEmail} onSendMagicLink={onSendMagicLink} sendingMagicLink={sendingMagicLink} magicLinkSent={magicLinkSent} magicLinkError={magicLinkError} onSkip={onSkip} style={{maxWidth: 520}} />
        </div>
        <footer className="cl-footer">
          <div className="cl-footer-note">© 2026 Claro. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
}
