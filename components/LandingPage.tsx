"use client";

import Image from "next/image";

const CSS = `
html { scroll-behavior: smooth; }
.claro-landing * { box-sizing: border-box; margin: 0; padding: 0; }
.claro-landing h1, .claro-landing h2, .claro-landing h3 { font-weight: normal; }
.claro-landing {
  background: #F6F0E4;
  color: #231812;
  font-family: var(--font-dm-sans), 'DM Sans', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  min-height: 100vh;
}
.cl-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
  height: 58px;
  background: #F6F0E4;
  backdrop-filter: blur(14px);
}
.cl-nav-wordmark {
  font-family: var(--font-instrument-serif), 'Instrument Serif', Georgia, serif;
  font-style: italic;
  font-size: 20px;
  color: #231812;
  text-decoration: none;
  letter-spacing: -0.01em;
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
  font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8A857F;
  text-decoration: none;
}
.cl-nav-links a:hover { color: #231812; }
.cl-nav-cta {
  font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #FDF7EA;
  background: #231812;
  border: none;
  padding: 7px 20px 11px;
  border-radius: 2px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}
.cl-nav-cta:hover { opacity: 0.78; }
.cl-wrap {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 80px;
}
.cl-hero {
  padding-top: 120px;
  padding-bottom: 56px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cl-eyebrow {
  font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #8A857F;
  margin-bottom: 24px;
}
.cl-hero-hed {
  font-family: var(--font-instrument-serif), 'Instrument Serif', Georgia, serif;
  font-style: italic;
  font-size: clamp(52px, 5.5vw, 88px);
  line-height: 1.06;
  letter-spacing: -0.025em;
  color: #231812;
  margin-bottom: 24px;
  max-width: 820px;
}
.cl-hero-sub {
  font-size: 17px;
  font-weight: 300;
  color: #4A3C34;
  line-height: 1.7;
  max-width: 520px;
  margin-bottom: 40px;
}
.cl-cta-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
  max-width: 530px;
}
.cl-rule {
  border: none;
  border-top: 1px solid rgba(26,26,26,0.12);
  width: 100%;
  margin-bottom: 0;
}
.cl-email-form {
  display: flex;
  width: 100%;
}
.cl-email-input {
  flex: 1;
  font-family: var(--font-dm-sans), 'DM Sans', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 300;
  color: #231812;
  background: #FDF7EA;
  border: 1px solid rgba(26,26,26,0.12);
  border-right: none;
  padding: 13px 20px;
  outline: none;
}
.cl-email-input::placeholder { color: #8A857F; opacity: 0.7; }
.cl-email-submit {
  font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #FDF7EA;
  background: #231812;
  border: 1px solid #231812;
  padding: 11px 28px 15px;
  border-radius: 2px;
  cursor: pointer;
  white-space: nowrap;
}
.cl-email-submit:hover { opacity: 0.78; }
.cl-email-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.cl-guest-link {
  font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8A857F;
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}
.cl-guest-link:hover { color: #231812; }
.cl-magic-sent {
  font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #231812;
  text-align: center;
}
.cl-magic-error {
  font-family: var(--font-dm-sans), 'DM Sans', system-ui, sans-serif;
  font-size: 12px;
  color: #C4622D;
  text-align: center;
}
.cl-screenshot-wrap {
  width: 100%;
  padding: 0 40px 48px;
}
.cl-screenshot-inner {
  max-width: 1400px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(35,24,18,0.10), 0 2px 12px rgba(35,24,18,0.07);
}
.cl-screenshot-inner img {
  width: 100%;
  height: auto;
  display: block;
}
.cl-proof {
  border-bottom: 1px solid rgba(26,26,26,0.12);
  padding: 24px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cl-proof-item {
  font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8A857F;
  text-align: center;
  padding: 0 28px;
}
.cl-proof-item + .cl-proof-item {
  border-left: 1px solid rgba(26,26,26,0.12);
}
.cl-section { padding: 84px 0; }
.cl-section-label {
  font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #8A857F;
  margin-bottom: 40px;
}
.cl-how-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 56px;
  border-top: 1px solid rgba(26,26,26,0.12);
  padding-top: 36px;
}
.cl-step-num {
  font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: #8A857F;
  margin-bottom: 14px;
}
.cl-step-title {
  font-family: var(--font-instrument-serif), 'Instrument Serif', Georgia, serif;
  font-style: italic;
  font-size: 22px;
  line-height: 1.18;
  color: #231812;
  margin-bottom: 11px;
}
.cl-step-desc {
  font-size: 13px;
  font-weight: 300;
  color: #4A3C34;
  line-height: 1.65;
}
.cl-feature-block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 96px;
  align-items: start;
  padding: 60px 0;
  border-top: 1px solid rgba(26,26,26,0.12);
}
.cl-feature-block:last-child { border-bottom: 1px solid rgba(26,26,26,0.12); }
.cl-feature-block:first-child { border-top: none; }
.cl-feature-block.flip .cl-ft { order: 2; }
.cl-feature-block.flip .cl-fv { order: 1; }
.cl-feature-kicker {
  font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #8A857F;
  margin-bottom: 13px;
}
.cl-feature-title {
  font-family: var(--font-instrument-serif), 'Instrument Serif', Georgia, serif;
  font-style: italic;
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: #231812;
  margin-bottom: 16px;
}
.cl-feature-desc {
  font-size: 14px;
  font-weight: 300;
  color: #4A3C34;
  line-height: 1.7;
  margin-bottom: 20px;
}
.cl-feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cl-feature-list li {
  font-size: 13px;
  color: #4A3C34;
  padding-left: 16px;
  position: relative;
  line-height: 1.45;
}
.cl-feature-list li::before {
  content: '—';
  position: absolute;
  left: 0;
  color: #8A857F;
  opacity: 0.6;
}
.cl-fv img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(35,24,18,0.09), 0 1px 6px rgba(35,24,18,0.06);
}
.cl-final-cta {
  padding: 80px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cl-cta-hed {
  font-family: var(--font-instrument-serif), 'Instrument Serif', Georgia, serif;
  font-style: italic;
  font-size: clamp(34px, 5vw, 50px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #231812;
  max-width: 560px;
  margin-bottom: 18px;
  text-align: center;
}
.cl-cta-sub {
  font-size: 15px;
  font-weight: 300;
  color: #4A3C34;
  margin-bottom: 32px;
  max-width: 400px;
  line-height: 1.65;
  text-align: center;
}
.cl-footer {
  border-top: 1px solid rgba(26,26,26,0.12);
  padding: 20px 0;
  display: flex;
  align-items: center;
}
.cl-footer-note {
  font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #8A857F;
  opacity: 0.6;
}

/* ── MOBILE ─────────────────────────────────── */
@media (max-width: 768px) {

  .cl-wrap {
    padding: 0 24px;
  }

  /* Nav */
  .cl-nav {
    padding: 0 20px;
    height: 52px;
  }

  .cl-nav-links {
    display: none;
  }

  .cl-nav-cta {
    font-size: 10px;
    padding: 6px 14px 9px;
    letter-spacing: 0.08em;
  }

  /* Hero */
  .cl-hero {
    padding-top: 88px;
    padding-bottom: 40px;
  }

  .cl-hero-hed {
    font-size: clamp(36px, 10vw, 52px);
    margin-bottom: 20px;
  }

  .cl-hero-sub {
    font-size: 15px;
    margin-bottom: 32px;
  }

  .cl-cta-group {
    max-width: 100%;
  }

  .cl-email-form {
    flex-direction: column;
    gap: 0;
  }

  .cl-email-input {
    border-right: 1px solid rgba(26,26,26,0.12);
    border-bottom: none;
    padding: 13px 16px;
    width: 100%;
  }

  .cl-email-submit {
    width: 100%;
    text-align: center;
    padding: 12px 16px 15px;
    border-radius: 0 0 2px 2px;
  }

  /* Screenshot */
  .cl-screenshot-wrap {
    padding: 0 16px 32px;
  }

  .cl-screenshot-inner {
    border-radius: 10px;
  }

  /* Proof strip */
  .cl-proof {
    flex-direction: column;
    gap: 0;
    padding: 0;
  }

  .cl-proof-item {
    padding: 14px 0;
    border-left: none !important;
    border-bottom: 1px solid rgba(26,26,26,0.12);
    width: 100%;
    text-align: center;
  }

  .cl-proof-item:last-child {
    border-bottom: none;
  }

  /* How it works */
  .cl-section {
    padding: 56px 0;
  }

  .cl-how-grid {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  /* Features */
  .cl-feature-block {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 48px 0;
  }

  .cl-feature-block.flip .cl-ft { order: 1; }
  .cl-feature-block.flip .cl-fv { order: 2; }

  .cl-feature-title {
    font-size: 26px;
  }

  /* Final CTA */
  .cl-final-cta {
    padding: 64px 0;
  }

  .cl-cta-hed {
    font-size: clamp(28px, 8vw, 40px);
  }

  .cl-cta-sub {
    font-size: 14px;
  }
}

/* ── SMALL MOBILE ────────────────────────────── */
@media (max-width: 480px) {

  .cl-hero-hed {
    font-size: clamp(32px, 9vw, 44px);
  }

  .cl-wrap {
    padding: 0 20px;
  }

  .cl-screenshot-wrap {
    padding: 0 12px 28px;
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

// Defined at module scope so React never treats it as a new component type on re-render.
// If it were defined inside LandingPage, every keystroke (setEmail → re-render) would
// create a new function reference, causing React to unmount+remount the input and kill focus.
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
          <form className="cl-email-form" onSubmit={handleSubmit}>
            <input
              type="email"
              className="cl-email-input"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="cl-email-submit" disabled={sendingMagicLink}>
              {sendingMagicLink ? "Sending..." : <>Continue with email <span style={{fontSize:14}}>→</span></>}
            </button>
          </form>
          {magicLinkError && <p className="cl-magic-error">{magicLinkError}</p>}
          <hr className="cl-rule" />
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
    <div className="claro-landing">
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="cl-nav">
        <a href="/" className="cl-nav-wordmark" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Claro</a>
        <ul className="cl-nav-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#features">Features</a></li>
        </ul>
        <a href="#get-started" className="cl-nav-cta">
          Continue with email <span style={{fontSize:14}}>→</span>
        </a>
      </nav>

      {/* HERO */}
      <div className="cl-wrap">
        <div className="cl-hero">
          <p className="cl-eyebrow">Career Copilot</p>
          <h1 className="cl-hero-hed">Know your fit<br />before you write<br />a single word.</h1>
          <p className="cl-hero-sub">Claro reads your resume, scores any job description against your actual background, and tells you exactly what a recruiter will think — and what to do about it.</p>
          <EmailForm email={email} setEmail={setEmail} onSendMagicLink={onSendMagicLink} sendingMagicLink={sendingMagicLink} magicLinkSent={magicLinkSent} magicLinkError={magicLinkError} onSkip={onSkip} />
        </div>
      </div>

      {/* HERO SCREENSHOT */}
      <div className="cl-screenshot-wrap">
        <div className="cl-screenshot-inner">
          <Image
            src="/app-screenshot.png"
            alt="Claro app dashboard"
            width={2800}
            height={1547}
            style={{width:'100%', height:'auto'}}
            priority
          />
        </div>
      </div>

      {/* PROOF STRIP */}
      <div className="cl-wrap">
        <hr className="cl-rule" />
        <div className="cl-proof">
          <div className="cl-proof-item">Honest scores, not encouragement</div>
          <div className="cl-proof-item">Recruiter concern flag on every score</div>
          <div className="cl-proof-item">Full application brief to act on</div>
          <div className="cl-proof-item">Free to start</div>
        </div>
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
              <h3 className="cl-step-title">Get your Application Brief</h3>
              <p className="cl-step-desc">A consolidated action plan: what to lead with, what language to mirror, what concern to preempt, and a numbered to-do list you can email to yourself and act on anywhere.</p>
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
                <li>Recommended LinkedIn headline, plus four alternatives</li>
              </ul>
            </div>
            <div className="cl-fv">
              <Image src="/profile-screenshot.png" alt="Claro Profile tab" width={1920} height={1061} style={{width:'100%', height:'auto'}} />
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
              <Image src="/jobfit-screenshot.png" alt="Claro Job Fit tab" width={1920} height={1061} style={{width:'100%', height:'auto'}} />
            </div>
          </div>

          <div className="cl-feature-block">
            <div className="cl-ft">
              <p className="cl-feature-kicker">Application Brief</p>
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
              <Image src="/brief-screenshot.png" alt="Claro Application Brief" width={1920} height={1061} style={{width:'100%', height:'auto'}} />
            </div>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="cl-wrap" id="get-started">
        <div className="cl-final-cta">
          <h2 className="cl-cta-hed">Apply to fewer jobs.<br />Land the right ones.</h2>
          <p className="cl-cta-sub">Free to start. No resume builder, no job board, no generic advice. Just a clear read on where you fit and exactly what to do about it.</p>
          <EmailForm email={email} setEmail={setEmail} onSendMagicLink={onSendMagicLink} sendingMagicLink={sendingMagicLink} magicLinkSent={magicLinkSent} magicLinkError={magicLinkError} onSkip={onSkip} style={{maxWidth: 530}} />
        </div>
        <footer className="cl-footer">
          <div className="cl-footer-note">© 2026 Claro. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
}
