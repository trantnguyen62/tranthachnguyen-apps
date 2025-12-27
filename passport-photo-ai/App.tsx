import React, { useState, useCallback, useMemo } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { PhotoEditor } from './components/PhotoEditor';
import { PassportImage, AppStatus } from './types';

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
  const [result, setResult] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleImageSelected = useCallback((img: PassportImage | null) => {
    setImage(img);
    setResult(null);
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
        <PhotoEditor
          image={image}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
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
              🎨
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
            maxWidth: 500, 
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Your creative AI studio for perfect passport photos.<br/>
            <span style={{ color: accentGold }}>Upload</span> · <span style={{ color: accentPink }}>Enhance</span> · <span style={{ color: accentPurple }}>Export</span>
          </p>
        </header>

        {/* Main Content */}
        <main style={{ 
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
              <span style={{ fontSize: 20 }}>📸</span>
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
                <span>✨</span> Auto-Fix
              </button>
              <button
                onClick={handleCheck}
                disabled={!image || status === AppStatus.CHECKING}
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
                  <span style={{ animation: 'pulse 1s infinite' }}>Analyzing...</span>
                ) : (
                  <>🔍 Analyze</>
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
              <span style={{ fontSize: 20 }}>📋</span>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 600 }}>Analysis</h2>
            </div>
            
            {result ? (
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
                    <div style={{ 
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
                        {result.compliant ? 'Perfect Shot!' : 'Needs Attention'}
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
                        fontSize: 14, color: 'rgba(255,255,255,0.8)'
                      }}>
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
                        fontSize: 14, color: 'rgba(255,255,255,0.8)'
                      }}>
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
                <div style={{ 
                  fontSize: 64, marginBottom: 16, opacity: 0.3,
                  filter: 'grayscale(100%)'
                }}>🖼️</div>
                <p style={{ fontSize: 15, maxWidth: 220, lineHeight: 1.6 }}>
                  Upload a photo to receive AI-powered feedback and suggestions
                </p>
              </div>
            )}
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
            Crafted with <span style={{ color: accentPink }}>♥</span> by PassportLens Studio · {new Date().getFullYear()}
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}




