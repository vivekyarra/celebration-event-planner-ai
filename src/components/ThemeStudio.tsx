import React, { useState } from 'react';
import {
  Palette,
  Copy,
  Check,
  Music,
  Mail,
  Share2,
  Sparkles,
  Shirt,
  Sun,
} from 'lucide-react';
import { EventPlan, InvitationDraft } from '../types';

interface ThemeStudioProps {
  plan: EventPlan;
}

export const ThemeStudio: React.FC<ThemeStudioProps> = ({ plan }) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const copyInvite = (invite: InvitationDraft) => {
    const fullText = `${invite.headline}\n\n${invite.body}\n\n${invite.callToAction}\nDate: ${plan.eventDate} | Time: ${plan.startTime}`;
    navigator.clipboard.writeText(fullText);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const shareWhatsApp = (invite: InvitationDraft) => {
    const text = encodeURIComponent(
      `🎉 *${invite.headline}*\n\n${invite.body}\n\n📍 ${plan.venueType} celebration on ${plan.eventDate} at ${plan.startTime}\n👉 ${invite.callToAction}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareEmail = (invite: InvitationDraft) => {
    const subject = encodeURIComponent(invite.headline);
    const body = encodeURIComponent(
      `${invite.body}\n\nEvent: ${plan.title}\nDate: ${plan.eventDate}\nTime: ${plan.startTime} to ${plan.endTime}\n\n${invite.callToAction}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const colors = [
    { label: 'Primary Accent', hex: plan.themePalette.primary },
    { label: 'Secondary Tone', hex: plan.themePalette.secondary },
    { label: 'Highlight Glow', hex: plan.themePalette.accent },
  ];

  return (
    <div className="section-card" aria-label="Theme, Styling and Invitation Studio">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Palette size={24} color="#ec4899" />
            AI Theme, Ambiance & Invitation Suite
          </h2>
          <p className="section-subtitle">
            Curated visual branding, sensory ambiance, and invitation copycraft
          </p>
        </div>
      </div>

      {/* Palette & Atmosphere Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        {/* Colors card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#ec4899" />
            Curated Color Palette
          </h3>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {colors.map((c) => (
              <div
                key={c.label}
                style={{
                  flex: '1 1 90px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 8px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: c.hex,
                    boxShadow: `0 0 16px ${c.hex}66`,
                    marginBottom: '8px',
                    border: '2px solid rgba(255,255,255,0.2)',
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {c.label}
                </span>
                <button
                  type="button"
                  onClick={() => copyHex(c.hex)}
                  style={{
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-main)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                  title="Click to copy Hex"
                >
                  {copiedHex === c.hex ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{c.hex}</span>
                </button>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>Theme Vibe:</strong> {plan.themePalette.vibeDescription}
          </div>
        </div>

        {/* Ambiance & Styling Details */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
              <Sun size={16} color="#fbbf24" />
              <span>Lighting & Atmosphere</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {plan.themePalette.lightingStyle}
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
              <Shirt size={16} color="#38bdf8" />
              <span>Dress Code Direction</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {plan.themePalette.recommendedDressCode}
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
              <Music size={16} color="#a855f7" />
              <span>Curated Audio Atmosphere</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {plan.themePalette.curatedMusicPlaylists.map((pl) => (
                <span key={pl} className="badge badge-info">
                  {pl}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invitations Section */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Mail size={20} color="#6366f1" />
        Multi-Tone Invitation Copycraft (Share Ready)
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {plan.invitations.map((inv) => (
          <div
            key={inv.id}
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  className="badge badge-warning"
                  style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                >
                  {inv.style} Style
                </span>
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                {inv.headline}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '12px' }}>
                {inv.body}
              </p>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontStyle: 'italic',
                  color: '#a5b4fc',
                  borderTop: '1px dashed var(--border)',
                  paddingTop: '8px',
                  marginBottom: '14px',
                }}
              >
                {inv.callToAction}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => copyInvite(inv)}
                style={{ flex: 1 }}
              >
                {copiedInviteId === inv.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedInviteId === inv.id ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => shareWhatsApp(inv)}
                title="Share via WhatsApp"
                aria-label="Share via WhatsApp"
              >
                <Share2 size={14} color="#25D366" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => shareEmail(inv)}
                title="Share via Email"
                aria-label="Share via Email"
              >
                <Mail size={14} color="#38bdf8" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
