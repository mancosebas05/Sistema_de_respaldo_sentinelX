import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─── Google Fonts ─── */
const FontLink = () => (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  </>
);

/* ─── CSS Global ─── */
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #060910;
      --bg2:       #0b0f1a;
      --card:      rgba(11, 15, 28, 0.85);
      --border:    rgba(255,255,255,0.07);
      --border2:   rgba(99,149,255,0.35);
      --blue:      #4F7FFF;
      --violet:    #8B5CF6;
      --cyan:      #22D3EE;
      --text:      #F0F4FF;
      --muted:     #4A5878;
      --muted2:    #7A90B8;
      --input-bg:  rgba(255,255,255,0.035);
      --danger:    #F87171;
      --success:   #34D399;
      --font-head: 'Outfit', sans-serif;
      --font-body: 'Space Grotesk', sans-serif;
    }

    body { overflow-x: hidden; }

    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeSlideRight {
      from { opacity: 0; transform: translateX(-18px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeSlideLeft {
      from { opacity: 0; transform: translateX(18px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(1.05); }
    }
    @keyframes spinLoader {
      to { transform: rotate(360deg); }
    }
    @keyframes shimmer {
      from { background-position: -200% center; }
      to   { background-position:  200% center; }
    }
    @keyframes floatDot {
      0%, 100% { transform: translateY(0px); opacity: 0.6; }
      50%       { transform: translateY(-8px); opacity: 1; }
    }
    @keyframes borderPulse {
      0%, 100% { border-color: rgba(99,149,255,0.2); }
      50%       { border-color: rgba(99,149,255,0.5); }
    }

    .login-root {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: var(--bg);
      font-family: var(--font-body);
      position: relative;
      overflow: hidden;
    }

    /* ── Canvas background ── */
    .bg-canvas {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }

    /* ── Orbs ── */
    .orb {
      position: fixed;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
    }
    .orb-1 {
      width: 600px; height: 600px;
      top: -120px; left: -60px;
      background: radial-gradient(circle, rgba(79,127,255,0.10) 0%, transparent 65%);
      animation: pulseGlow 7s ease-in-out infinite;
    }
    .orb-2 {
      width: 480px; height: 480px;
      bottom: -80px; left: 35%;
      background: radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 65%);
      animation: pulseGlow 9s ease-in-out infinite 1.5s;
    }
    .orb-3 {
      width: 320px; height: 320px;
      top: 30%; right: 360px;
      background: radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 65%);
      animation: pulseGlow 11s ease-in-out infinite 3s;
    }

    /* ── Layout ── */
    .left-panel {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 48px 56px 48px 60px;
      position: relative;
      z-index: 1;
      animation: fadeSlideRight 0.7s ease both;
      overflow-y: auto;
    }

    .right-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 52px;
      position: relative;
      z-index: 1;
      animation: fadeSlideLeft 0.7s ease 0.1s both;
      border-left: 1px solid rgba(255,255,255,0.04);
      background: rgba(5,7,18,0.4);
    }

    /* ── Logo ── */
    .logo-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-icon {
      width: 44px; height: 44px;
      border-radius: 14px;
      background: linear-gradient(135deg, #4F7FFF 0%, #8B5CF6 100%);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 1px rgba(79,127,255,0.4), 0 8px 28px rgba(79,127,255,0.3);
      flex-shrink: 0;
    }
    .logo-text-wrap { line-height: 1; }
    .logo-name {
      font-family: var(--font-head);
      font-size: 19px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.02em;
    }
    .logo-name span { color: var(--blue); }
    .logo-sub {
      font-size: 9px;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-top: 3px;
    }

    /* ── Left hero content ── */
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 100px;
      background: rgba(79,127,255,0.08);
      border: 1px solid rgba(79,127,255,0.2);
      font-size: 10px;
      font-weight: 600;
      color: var(--blue);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .hero-badge::before {
      content: '';
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--blue);
      box-shadow: 0 0 6px var(--blue);
    }

    .hero-title {
      font-family: var(--font-head);
      font-size: clamp(30px, 3.2vw, 46px);
      font-weight: 800;
      line-height: 1.08;
      letter-spacing: -0.035em;
      color: var(--text);
      margin-bottom: 18px;
    }
    .hero-title .gradient-text {
      background: linear-gradient(90deg, #4F7FFF 0%, #8B5CF6 40%, #22D3EE 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      background-size: 200% auto;
      animation: shimmer 4s linear infinite;
    }

    .hero-desc {
      font-size: 13.5px;
      color: var(--muted2);
      line-height: 1.75;
      max-width: 400px;
      margin-bottom: 40px;
    }

    /* ── Feature list ── */
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 40px;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 14px;
      animation: fadeSlideUp 0.5s ease both;
    }
    .feature-icon {
      width: 38px; height: 38px;
      border-radius: 10px;
      background: rgba(79,127,255,0.08);
      border: 1px solid rgba(79,127,255,0.15);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      color: #7EB3FF;
      transition: all 0.2s;
    }
    .feature-item:hover .feature-icon {
      background: rgba(79,127,255,0.16);
      border-color: rgba(79,127,255,0.35);
      box-shadow: 0 0 16px rgba(79,127,255,0.15);
    }
    .feature-title {
      font-size: 13px;
      font-weight: 600;
      color: #C8D8FF;
      margin-bottom: 2px;
    }
    .feature-desc {
      font-size: 11.5px;
      color: var(--muted);
      line-height: 1.5;
    }

    /* ── Illustration area ── */
    .illo-wrap {
      display: flex;
      gap: 20px;
      align-items: flex-end;
    }

    /* ── Trust badges ── */
    .trust-bar {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10.5px;
      color: var(--muted);
      font-weight: 500;
    }
    .trust-dot {
      width: 4px; height: 4px;
      border-radius: 50%;
      background: var(--muted);
      opacity: 0.4;
    }

    /* ── Card ── */
    .card {
      width: 100%;
      max-width: 400px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 36px 32px 32px;
      backdrop-filter: blur(30px);
      -webkit-backdrop-filter: blur(30px);
      box-shadow:
        0 0 0 1px rgba(79,127,255,0.06) inset,
        0 40px 100px rgba(0,0,0,0.55),
        0 1px 0 rgba(255,255,255,0.04) inset;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(79,127,255,0.4), rgba(139,92,246,0.4), transparent);
    }

    /* ── Card header ── */
    .card-avatar {
      width: 56px; height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(79,127,255,0.15), rgba(139,92,246,0.15));
      border: 1px solid rgba(79,127,255,0.25);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 18px;
      color: #6EB4FF;
      box-shadow: 0 0 30px rgba(79,127,255,0.15);
    }
    .card-title {
      font-family: var(--font-head);
      font-size: 22px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.025em;
      text-align: center;
      margin-bottom: 6px;
    }
    .card-sub {
      font-size: 12.5px;
      color: var(--muted2);
      text-align: center;
      margin-bottom: 28px;
    }

    /* ── Form ── */
    .form-group { margin-bottom: 16px; }
    .form-label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: var(--muted2);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .input-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0 14px;
      height: 48px;
      transition: all 0.2s ease;
    }
    .input-wrap.focused {
      background: rgba(79,127,255,0.05);
      border-color: rgba(79,127,255,0.45);
      box-shadow: 0 0 0 3px rgba(79,127,255,0.09);
    }
    .input-icon { color: var(--muted); display: flex; flex-shrink: 0; }
    .input-wrap.focused .input-icon { color: #6EB4FF; }
    .form-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: var(--text);
      font-size: 14px;
      font-family: var(--font-body);
    }
    .form-input::placeholder { color: var(--muted); }
    .eye-btn {
      background: none; border: none;
      cursor: pointer; color: var(--muted);
      display: flex; padding: 2px;
      transition: color 0.2s;
    }
    .eye-btn:hover { color: var(--muted2); }

    .forgot-link {
      display: block;
      text-align: right;
      font-size: 11.5px;
      color: var(--blue);
      margin-top: 7px;
      cursor: pointer;
      text-decoration: none;
      font-weight: 500;
      opacity: 0.85;
      transition: opacity 0.2s;
    }
    .forgot-link:hover { opacity: 1; }

    /* ── Submit button ── */
    .submit-btn {
      width: 100%;
      height: 50px;
      border-radius: 13px;
      border: none;
      background: linear-gradient(135deg, #4F7FFF 0%, #7C53E8 100%);
      color: #fff;
      font-size: 14.5px;
      font-weight: 700;
      font-family: var(--font-body);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 0 0 1px rgba(79,127,255,0.3), 0 6px 24px rgba(79,127,255,0.3);
      margin-top: 22px;
      letter-spacing: 0.01em;
      position: relative;
      overflow: hidden;
    }
    .submit-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 0 0 1px rgba(79,127,255,0.4), 0 10px 36px rgba(79,127,255,0.45);
    }
    .submit-btn:hover::before { opacity: 1; }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { cursor: wait; opacity: 0.8; }

    /* ── Divider ── */
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 18px 0;
    }
    .divider-line {
      flex: 1;
      height: 1px;
      background: var(--border);
    }
    .divider-text {
      font-size: 11px;
      color: var(--muted);
      font-weight: 500;
    }

    /* ── Google button ── */
    .google-btn {
      width: 100%;
      height: 46px;
      border-radius: 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 13.5px;
      font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.2s ease;
    }
    .google-btn:hover {
      background: rgba(255,255,255,0.07);
      border-color: rgba(255,255,255,0.14);
    }

    /* ── Error box ── */
    .error-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(248,113,113,0.08);
      border: 1px solid rgba(248,113,113,0.25);
      border-radius: 11px;
      padding: 10px 14px;
      font-size: 12.5px;
      color: #FCA5A5;
      margin-bottom: 16px;
    }

    /* ── Demo section ── */
    .demo-section {
      margin-top: 20px;
      border-top: 1px solid var(--border);
      padding-top: 18px;
    }
    .demo-label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 10px;
      color: var(--muted);
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .demo-label-dot {
      color: #F59E0B;
      font-size: 11px;
    }
    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }
    .demo-btn {
      background: rgba(79,127,255,0.05);
      border: 1px solid rgba(79,127,255,0.12);
      border-radius: 9px;
      padding: 8px 0;
      color: #8AABD8;
      font-size: 11.5px;
      font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer;
      transition: all 0.18s ease;
      text-align: center;
    }
    .demo-btn:hover {
      background: rgba(79,127,255,0.12);
      border-color: rgba(79,127,255,0.3);
      color: #B8CEFF;
    }

    /* ── Footer ── */
    .card-footer {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: var(--muted);
    }
    .card-footer a {
      color: var(--blue);
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .card-footer a:hover { text-decoration: underline; }

    /* ── Left tagline ── */
    .tagline {
      font-size: 10.5px;
      color: rgba(74,88,120,0.6);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .tagline::before {
      content: '';
      width: 24px; height: 1px;
      background: rgba(74,88,120,0.4);
      flex-shrink: 0;
    }

    /* ── Animated scan line ── */
    .scan-line {
      position: absolute;
      inset: 0;
      border-radius: 24px;
      pointer-events: none;
      overflow: hidden;
    }
    .scan-line::after {
      content: '';
      position: absolute;
      top: -100%;
      left: 0; right: 0;
      height: 40%;
      background: linear-gradient(transparent, rgba(79,127,255,0.02), transparent);
      animation: scanMove 5s linear infinite;
    }
    @keyframes scanMove {
      from { top: -40%; }
      to   { top: 140%; }
    }

    /* ── Stats bar (mini) ── */
    .stats-bar {
      display: flex;
      gap: 24px;
      padding: 16px 0;
      border-top: 1px solid rgba(255,255,255,0.04);
      border-bottom: 1px solid rgba(255,255,255,0.04);
      margin-bottom: 32px;
    }
    .stat-item { line-height: 1.2; }
    .stat-num {
      font-family: var(--font-head);
      font-size: 20px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.02em;
    }
    .stat-num span { color: var(--blue); }
    .stat-label { font-size: 10px; color: var(--muted); margin-top: 2px; }

    @media (max-width: 900px) {
      .login-root { grid-template-columns: 1fr; }
      .left-panel { display: none; }
    }
  `}</style>
);

/* ─── SVG Icons ─── */
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3"/><polyline points="2,4 12,13 22,4"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = ({ off }) => off ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconShield = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconGoogle = () => (
  <svg width="17" height="17" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ─── Animated canvas background ─── */
const Background = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.45 + 0.08,
      color: ['79,127,255', '139,92,246', '34,211,238'][Math.floor(Math.random() * 3)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(40,60,110,0.07)';
      ctx.lineWidth = 0.5;
      const s = 64;
      for (let x = 0; x < canvas.width; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="bg-canvas" />;
};

/* ─── Server SVG illustration ─── */
const ServerIllo = () => (
  <svg viewBox="0 0 380 220" style={{ width: '100%', maxWidth: 380 }}>
    <defs>
      <linearGradient id="gB" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4F7FFF" stopOpacity="0.95"/>
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.95"/>
      </linearGradient>
      <linearGradient id="gC" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#4F7FFF" stopOpacity="0.8"/>
      </linearGradient>
      <filter id="glow2">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="orbG" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#4F7FFF" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#4F7FFF" stopOpacity="0"/>
      </radialGradient>
    </defs>

    <ellipse cx="190" cy="160" rx="130" ry="60" fill="url(#orbG)"/>

    {/* Server 1 */}
    <rect x="30" y="70" width="88" height="130" rx="7" fill="rgba(12,20,48,0.92)" stroke="rgba(79,127,255,0.25)" strokeWidth="1"/>
    {[0,1,2,3,4].map(i => <rect key={i} x="38" y={80+i*22} width="72" height="14" rx="3.5" fill="rgba(25,45,95,0.7)" stroke="rgba(79,127,255,0.15)" strokeWidth="0.5"/>)}
    {[0,1,2,3,4].map(i => <circle key={i} cx="96" cy={87+i*22} r="3.5" fill={i%2===0?'#4F7FFF':'#22D3EE'} filter="url(#glow2)"/>)}

    {/* Server 2 */}
    <rect x="138" y="52" width="96" height="148" rx="7" fill="rgba(10,16,40,0.96)" stroke="rgba(99,149,255,0.38)" strokeWidth="1.2"/>
    {[0,1,2,3,4,5].map(i => <rect key={i} x="146" y={62+i*22} width="80" height="14" rx="3.5" fill="rgba(20,38,85,0.8)" stroke="rgba(79,127,255,0.18)" strokeWidth="0.5"/>)}
    {[0,1,2,3,4,5].map(i => <circle key={i} cx="210" cy={69+i*22} r="3" fill={['#4F7FFF','#22D3EE','#8B5CF6','#4F7FFF','#22D3EE','#8B5CF6'][i]} filter="url(#glow2)"/>)}

    {/* Cloud */}
    <g transform="translate(240, 18)" filter="url(#glow2)">
      <ellipse cx="40" cy="30" rx="32" ry="19" fill="url(#gB)" opacity="0.88"/>
      <ellipse cx="62" cy="33" rx="24" ry="15" fill="url(#gB)" opacity="0.88"/>
      <ellipse cx="20" cy="35" rx="20" ry="14" fill="url(#gB)" opacity="0.88"/>
      <rect x="8" y="32" width="68" height="14" fill="url(#gB)" opacity="0.88"/>
      <line x1="40" y1="44" x2="40" y2="20" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <polyline points="32,30 40,20 48,30" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </g>

    <line x1="186" y1="42" x2="186" y2="52" stroke="url(#gC)" strokeWidth="1.3" strokeDasharray="4,3" opacity="0.7"/>
    <line x1="268" y1="64" x2="238" y2="80" stroke="url(#gB)" strokeWidth="1.3" strokeDasharray="4,3" opacity="0.6"/>

    {/* Shield */}
    <g transform="translate(306, 120)" filter="url(#glow2)">
      <circle cx="24" cy="24" r="23" fill="rgba(12,20,50,0.95)" stroke="rgba(79,127,255,0.45)" strokeWidth="1.3"/>
      <path d="M24 8l13 5v8c0 7.5-13 13-13 13s-13-5.5-13-13v-8z" fill="url(#gB)" opacity="0.88"/>
      <polyline points="18,24 22.5,28.5 30,20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </g>

    {/* Floating dots */}
    {[[14,120,3.5],[22,180,2.5],[340,80,3],[355,185,2.2],[85,44,2]].map(([x,y,r],i) => (
      <circle key={i} cx={x} cy={y} r={r} fill={i%2===0?'#4F7FFF':'#22D3EE'} opacity="0.55" filter="url(#glow2)"/>
    ))}

    <rect x="60" y="200" width="260" height="1.5" rx="1" fill="url(#gB)" opacity="0.25"/>
  </svg>
);

const FEATURES = [
  {
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    title: 'Backups automáticos', desc: 'Ejecución programada sin intervención manual', delay: '0.25s',
  },
  {
    icon: <IconShield size={15} />,
    title: 'Cifrado AES-256 + SHA-256', desc: 'Integridad verificada en cada respaldo generado', delay: '0.35s',
  },
  {
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    title: 'Recuperación rápida (RTO ≤ 2h)', desc: 'Restauración selectiva o total desde cualquier punto', delay: '0.45s',
  },
  {
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    title: 'Auditoría en tiempo real', desc: 'Trazabilidad completa con logs inmutables', delay: '0.55s',
  },
];

const DEMO_USERS = [
  { label: '👑 Admin',     email: 'admin@sentinelx.io',     pass: 'Admin2024!' },
  { label: '🔧 TI',        email: 'ti@sentinelx.io',        pass: 'Ti2024!'    },
  { label: '👤 Operativo', email: 'operativo@sentinelx.io', pass: 'Op2024!'    },
  { label: '📊 Directivo', email: 'directivo@sentinelx.io', pass: 'Dir2024!'   },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [focusEmail, setFocusEmail] = useState(false);
  const [focusPass, setFocusPass]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.message || 'Credenciales incorrectas. Intenta de nuevo.');
  };

  const fillDemo = (e, p) => { setEmail(e); setPassword(p); setError(''); };

  return (
    <>
      <FontLink />
      <GlobalStyles />

      <div className="login-root">
        <Background />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* ─── LEFT PANEL ─── */}
        <div className="left-panel">
          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo-icon">
              <IconShield size={20} />
            </div>
            <div className="logo-text-wrap">
              <div className="logo-name">SENTINEL<span>X</span></div>
              <div className="logo-sub">Smart Backup System</div>
            </div>
          </div>

          {/* Hero */}
          <div>
            <div className="hero-badge" style={{ animationDelay: '0.1s', animation: 'fadeSlideUp 0.6s ease both' }}>
              ISO/IEC 27001 · CIA Triad · RBAC
            </div>

            <h1 className="hero-title" style={{ animation: 'fadeSlideUp 0.6s ease 0.15s both' }}>
              Tus datos,<br />
              <span className="gradient-text">siempre protegidos.</span>
            </h1>

            <p className="hero-desc" style={{ animation: 'fadeSlideUp 0.6s ease 0.2s both' }}>
              Sistema centralizado de respaldo para PyMEs. Automatización inteligente, cifrado robusto y recuperación garantizada.
            </p>

            {/* Mini stats */}
            <div className="stats-bar" style={{ animation: 'fadeSlideUp 0.6s ease 0.22s both' }}>
              <div className="stat-item">
                <div className="stat-num">99<span>.9%</span></div>
                <div className="stat-label">Uptime garantizado</div>
              </div>
              <div className="stat-item">
                <div className="stat-num"><span>&lt;</span>2h</div>
                <div className="stat-label">Tiempo de recuperación</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">256<span>bit</span></div>
                <div className="stat-label">Cifrado AES</div>
              </div>
            </div>

            <div className="features-list">
              {FEATURES.map((f, i) => (
                <div key={i} className="feature-item" style={{ animationDelay: f.delay, animation: `fadeSlideUp 0.5s ease ${f.delay} both` }}>
                  <div className="feature-icon">{f.icon}</div>
                  <div>
                    <div className="feature-title">{f.title}</div>
                    <div className="feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div style={{ animation: 'fadeSlideUp 0.7s ease 0.65s both' }}>
            <ServerIllo />
          </div>

          {/* Tagline */}
          <div className="tagline" style={{ animation: 'fadeSlideUp 0.6s ease 0.8s both' }}>
            Corporación Universitaria Minuto de Dios · Práctica Profesional 2026
          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="right-panel">
          <div className="card">
            <div className="scan-line" />

            {/* Card header */}
            <div className="card-avatar">
              <IconShield size={24} />
            </div>
            <div className="card-title">Bienvenido de nuevo</div>
            <div className="card-sub">Ingresa tus credenciales para acceder a la bóveda</div>

            {/* Error */}
            {error && (
              <div className="error-box">
                <IconAlert />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <div className={`input-wrap${focusEmail ? ' focused' : ''}`}>
                  <span className="input-icon"><IconMail /></span>
                  <input
                    type="email" required
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusEmail(true)}
                    onBlur={() => setFocusEmail(false)}
                    className="form-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <div className={`input-wrap${focusPass ? ' focused' : ''}`}>
                  <span className="input-icon"><IconLock /></span>
                  <input
                    type={showPass ? 'text' : 'password'} required
                    placeholder="••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusPass(true)}
                    onBlur={() => setFocusPass(false)}
                    className="form-input"
                    autoComplete="current-password"
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                    <IconEye off={showPass} />
                  </button>
                </div>
                <a className="forgot-link">¿Olvidaste tu contraseña?</a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spinLoader 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : (
                  <>Iniciar sesión <IconArrow /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">o continúa con</span>
              <div className="divider-line" />
            </div>

            {/* Google */}
            <button type="button" className="google-btn">
              <IconGoogle /> Continuar con Google
            </button>

            {/* Demo */}
            <div className="demo-section">
              <div className="demo-label">
                <span className="demo-label-dot">▲</span>
                Acceso de demostración
              </div>
              <div className="demo-grid">
                {DEMO_USERS.map(d => (
                  <button
                    key={d.label}
                    type="button"
                    className="demo-btn"
                    onClick={() => fillDemo(d.email, d.pass)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="card-footer">
              ¿Sin acceso? <a>Contactar administrador</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}