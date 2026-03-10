import React, { useState, useCallback, lazy, Suspense } from 'react';
import { ImageUploader } from './components/ImageUploader';
const PhotoEditor = lazy(() => import('./components/PhotoEditor').then(m => ({ default: m.PhotoEditor })));
import { PassportImage, PassportCheckResult, AppStatus } from './types';

const CURRENT_YEAR = new Date().getFullYear();

// Theme constants moved outside component
const THEME = {
  accentPink: '#E94560',
  accentGold: '#F4A261',
  accentPurple: '#9D4EDD',
  darkBg: 'rgba(13, 13, 13, 0.6)',
} as const;

export default function App() {
  const [image, setImage] = useState<PassportImage | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<PassportCheckResult | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleImageSelected = useCallback((img: PassportImage | null) => {
    setImage(img);
    setResult(null);
    setStatus(AppStatus.IDLE);
    // Preload the PhotoEditor chunk in the background when a photo is ready
    if (img) void import('./components/PhotoEditor');
  }, []);

  const handleEditorSave = useCallback((img: PassportImage) => {
    setImage(img);
    setShowEditor(false);
    setResult(null);
  }, []);

  const handleEditorCancel = useCallback(() => {
    setShowEditor(false);
  }, []);

  const handleOpenEditor = useCallback(() => {
    setShowEditor(true);
  }, []);

  const handleCheck = useCallback(async () => {
    if (!image) return;
    setStatus(AppStatus.CHECKING);
    try {
      const res = await fetch('/api/passport/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image: image.data }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
      setStatus(AppStatus.COMPLETED);
    } catch {
      setStatus(AppStatus.ERROR);
    }
  }, [image]);

  const { accentPink, accentGold, accentPurple, darkBg } = THEME;

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Artistic background elements */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -200, right: -200, width: 500, height: 500, background: `radial-gradient(circle, ${accentPink}22 0%, transparent 70%)`, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -150, left: -150, width: 400, height: 400, background: `radial-gradient(circle, ${accentPurple}22 0%, transparent 70%)`, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '40%', left: '60%', width: 300, height: 300, background: `radial-gradient(circle, ${accentGold}15 0%, transparent 70%)`, borderRadius: '50%' }} />
      </div>

      {showEditor && image && (
        <Suspense fallback={null}>
          <PhotoEditor
            image={image}
            onSave={handleEditorSave}
            onCancel={handleEditorCancel}
          />
        </Suspense>
      )}

      <div style={{ position: 'relative', zIndex: 1, padding: '40px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48,
              background: `linear-gradient(135deg, ${accentPink}, ${accentGold})`,
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, boxShadow: `0 8px 32px ${accentPink}44`
            }}>
              <span aria-hidden="true">🪪</span>
            </div>
            <h1 style={{ 
              fontFamily: "'Syne', sans-serif", 
              fontSize: 'clamp(2.5rem, 6vw, 4rem)', 
              fontWeight: 800,
              background: `linear-gradient(135deg, #fff 0%, ${accentGold} 50%, ${accentPink} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em'
            }}>
              PassportLens
            </h1>
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '1.1rem',
            maxWidth: 520,
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Get your passport photo right the first time — free AI compliance check against international biometric photo standards.<br/>
            <span style={{ color: accentGold }}>Upload</span> · <span style={{ color: accentPink }}>Analyze</span> · <span style={{ color: accentPurple }}>Download</span>
          </p>
        </header>

        {/* Main Content */}
        <main id="main-content" style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
          gap: 32,
          alignItems: 'start'
        }}>
          {/* Left: Upload Section */}
          <section style={{ 
            background: darkBg, 
            backdropFilter: 'blur(20px)',
            borderRadius: 24, 
            padding: 28,
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span aria-hidden="true" style={{ fontSize: 20 }}>📸</span>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 600 }}>Your Photo</h2>
              {image && (
                <span style={{ 
                  marginLeft: 'auto', fontSize: 11, 
                  background: `linear-gradient(135deg, ${accentPink}, ${accentGold})`,
                  padding: '4px 10px', borderRadius: 20, fontWeight: 600
                }}>
                  Ready
                </span>
              )}
            </div>
            
            <ImageUploader onImageSelected={handleImageSelected} currentImage={image} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
              <button
                onClick={handleOpenEditor}
                disabled={!image}
                style={{
                  padding: '16px 12px', borderRadius: 14,
                  border: image ? `1px solid ${accentPurple}44` : '1px solid transparent',
                  background: image ? `linear-gradient(135deg, ${accentPurple}33, ${accentPurple}11)` : 'rgba(255,255,255,0.03)',
                  color: image ? accentPurple : 'rgba(255,255,255,0.2)', 
                  fontWeight: 600, cursor: image ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                <span aria-hidden="true">✨</span> Fix Background
              </button>
              <button
                onClick={handleCheck}
                disabled={!image || status === AppStatus.CHECKING}
                aria-busy={status === AppStatus.CHECKING}
                style={{
                  padding: '16px 12px', borderRadius: 14,
                  border: 'none', 
                  background: image ? `linear-gradient(135deg, ${accentPink}, ${accentGold})` : 'rgba(255,255,255,0.03)',
                  color: image ? '#fff' : 'rgba(255,255,255,0.2)', 
                  fontWeight: 600, cursor: image ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: image ? `0 8px 24px ${accentPink}33` : 'none',
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                {status === AppStatus.CHECKING ? (
                  <>
                    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Checking...
                  </>
                ) : (
                  <><span aria-hidden="true">🔍</span> Check Photo</>
                )}
              </button>
            </div>
          </section>

          {/* Right: Results Section */}
          <section style={{ 
            background: darkBg, 
            backdropFilter: 'blur(20px)',
            borderRadius: 24, 
            padding: 28,
            border: '1px solid rgba(255,255,255,0.08)',
            minHeight: 450
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span aria-hidden="true" style={{ fontSize: 20 }}>📋</span>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 600 }}>Compliance Check</h2>
            </div>
            
            <div aria-live="polite" aria-atomic="true">
            {status === AppStatus.CHECKING ? (
              <div style={{ height: 350, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, padding: '0 4px' }} aria-label="Checking photo compliance…">
                <div style={{ height: 72, borderRadius: 16, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 0.75, 0.55].map((w, i) => (
                    <div key={i} style={{ height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.04)', width: `${w * 100}%`, animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {[1, 0.85].map((w, i) => (
                    <div key={i} style={{ height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.03)', width: `${w * 100}%`, animation: `pulse 1.5s ease-in-out ${0.4 + i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            ) : status === AppStatus.ERROR ? (
              <div style={{
                height: 350,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center'
              }}>
                <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <p style={{ color: accentPink, fontWeight: 600, marginBottom: 8 }}>Analysis failed</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 220, marginBottom: 20 }}>
                  Could not reach the server. Check your connection and try again. For large images, try reducing the file size below 4 MB.
                </p>
                <button
                  onClick={handleCheck}
                  disabled={!image}
                  style={{
                    padding: '10px 24px', borderRadius: 12,
                    border: `1px solid ${accentPink}44`,
                    background: `${accentPink}18`,
                    color: accentPink, fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 13, transition: 'all 0.2s ease'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : result ? (
              <div style={{ animation: 'fadeSlideIn 0.5s ease' }}>
                {/* Status Card */}
                <div style={{
                  padding: 20, borderRadius: 16, marginBottom: 24,
                  background: result.compliant 
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                    : `linear-gradient(135deg, ${accentPink}22, ${accentPink}08)`,
                  border: result.compliant 
                    ? '1px solid rgba(16,185,129,0.3)'
                    : `1px solid ${accentPink}44`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div aria-hidden="true" style={{
                      width: 56, height: 56, borderRadius: 16,
                      background: result.compliant ? '#10B981' : accentPink,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, boxShadow: `0 8px 24px ${result.compliant ? '#10B98144' : accentPink + '44'}`
                    }}>
                      {result.compliant ? '✓' : '!'}
                    </div>
                    <div>
                      <h3 style={{ 
                        fontFamily: "'Syne', sans-serif", 
                        fontSize: 18, fontWeight: 700,
                        color: result.compliant ? '#10B981' : accentPink,
                        marginBottom: 4
                      }}>
                        {result.compliant ? 'Photo Meets Standards' : 'Issues Detected'}
                      </h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                        {result.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Issues */}
                {result.issues?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ 
                      fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', 
                      color: accentGold, marginBottom: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      <span style={{ width: 16, height: 2, background: accentGold, borderRadius: 1 }} />
                      Issues Found
                    </h4>
                    {result.issues.map((issue: string, idx: number) => (
                      <div key={idx} style={{
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 10,
                        marginBottom: 8,
                        borderLeft: `3px solid ${accentGold}`,
                        fontSize: 14, color: 'rgba(255,255,255,0.8)',
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        animation: `fadeSlideIn 0.4s ease both`,
                        animationDelay: `${idx * 0.07}s`
                      }}>
                        <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: `${accentGold}22`, border: `1px solid ${accentGold}55`, color: accentGold, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{idx + 1}</span>
                        {issue}
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {result.suggestions?.length > 0 && (
                  <div>
                    <h4 style={{ 
                      fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', 
                      color: accentPurple, marginBottom: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      <span style={{ width: 16, height: 2, background: accentPurple, borderRadius: 1 }} />
                      Pro Tips
                    </h4>
                    {result.suggestions.map((tip: string, idx: number) => (
                      <div key={idx} style={{
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 10,
                        marginBottom: 8,
                        borderLeft: `3px solid ${accentPurple}`,
                        fontSize: 14, color: 'rgba(255,255,255,0.8)',
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        animation: `fadeSlideIn 0.4s ease both`,
                        animationDelay: `${idx * 0.07}s`
                      }}>
                        <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: `${accentPurple}22`, border: `1px solid ${accentPurple}55`, color: accentPurple, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{idx + 1}</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                height: 350,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.25)',
                textAlign: 'center'
              }}>
                <div aria-hidden="true" style={{
                  fontSize: 64, marginBottom: 16, opacity: 0.3,
                  filter: 'grayscale(100%)'
                }}>🪪</div>
                <p style={{ fontSize: 15, maxWidth: 240, lineHeight: 1.6, marginBottom: 20 }}>
                  Upload a photo and click <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Check Photo</strong> — catch compliance issues before submitting your passport or visa application
                </p>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', marginBottom: 8, fontWeight: 600 }}>
                    What we check
                  </p>
                  <ul style={{ listStyle: 'none', fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 2.1 }}>
                    <li>✓ Face centered, 70–80% of frame height</li>
                    <li>✓ Neutral expression, eyes open &amp; visible</li>
                    <li>✓ Plain white or off-white background</li>
                    <li>✓ Even lighting, no harsh shadows on face</li>
                    <li>✓ Sharp focus, sufficient resolution</li>
                    <li>✓ No glasses or lens reflections</li>
                  </ul>
                </div>
              </div>
            )}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer style={{ 
          marginTop: 60, textAlign: 'center', 
          padding: '24px 0', 
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.3)', fontSize: 13
        }}>
          <p>
            Made with <span style={{ color: accentPink }}>♥</span> by PassportLens · {CURRENT_YEAR}
          </p>
          <p style={{ marginTop: 8, fontSize: 12 }}>
            100% private — your photos are processed instantly and never stored, logged, or shared with third parties.
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}




