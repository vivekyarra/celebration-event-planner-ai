import React, { useState } from 'react';
import { Mic, Volume2, VolumeX, Copy, Check, Sparkles, Sliders } from 'lucide-react';
import { EventPlan } from '../types';
import { useSpeech } from '../hooks/useSpeech';

interface SpeechStudioProps {
  plan: EventPlan;
}

export const SpeechStudio: React.FC<SpeechStudioProps> = ({ plan }) => {
  const [role, setRole] = useState('Best Friend / Co-Host');
  const [tone, setTone] = useState<'humorous' | 'emotional' | 'motivational' | 'poetic'>('humorous');
  const [lengthMin, setLengthMin] = useState<number>(3);
  const [honoree, setHonoree] = useState('the Guest of Honor & everyone assembled');
  const [copied, setCopied] = useState(false);

  const { speak, stop, isSpeaking, isSupported } = useSpeech();

  const generateSpeech = () => {
    if (tone === 'humorous') {
      return `Good evening everyone! For those who don't know me, I'm ${role}. When I was asked to speak tonight at ${plan.title}, I was told to keep it under ${lengthMin} minutes and to be on my best behavior. Naturally, I promised nothing.
      
Looking around this incredible ${plan.venueType} venue tonight, it’s impossible not to feel the warmth, laughter, and overwhelming energy in this room. We've gathered here not just to mark another date on the calendar, but to celebrate the unforgettable journey that brought us together.
      
To ${honoree}: You bring a spirit of genuine generosity and relentless joy that inspires every single person in this room.
      
So, if everyone could take their glasses—fill them high—let us raise a heartfelt toast: To unforgettable moments, treasured friendships, and a future brighter than all the sparklers tonight. Cheers! 🥂`;
    }

    if (tone === 'emotional') {
      return `Distinguished guests, family, and lifelong friends: Welcome to this extraordinary evening celebrating ${plan.title}.
      
There are moments in life that seem to suspend time—evenings where every handshake, every smile, and every shared laugh weaves a tapestry of memories we will hold close forever. 
      
Standing here tonight, looking at the love radiating across these tables, I am reminded of how rare it is to find someone like ${honoree} who makes everyone around them feel valued, celebrated, and deeply appreciated.
      
May tonight remind us of the power of community, resilience, and genuine love. Let us raise our glasses: To lasting legacy, timeless memories, and the wonderful bond that binds us all together. To ${plan.title}! 🥂`;
    }

    if (tone === 'motivational') {
      return `Welcome innovators, leaders, and dreamers to ${plan.title}!
      
Great milestones aren’t merely reached; they are forged through relentless dedication, shared vision, and courage. What started as an ambitious idea has brought ${plan.guestCount} passionate individuals under this roof tonight.
      
Tonight is a testament that when extraordinary minds collaborate, the impossible becomes standard procedure. To ${honoree} and every contributor who made this celebration a reality: We honor your passion, your grit, and your craft.
      
Here is to the next frontier, the bold chapters still unwritten, and the victories ahead. Raise your glasses! 🚀`;
    }

    // Poetic
    return `Beneath the gentle glow of ${plan.themePalette.lightingStyle.toLowerCase()}, we gather under a constellation of friendship for ${plan.title}.
    
Time moves in quiet whispers, but celebrations like this anchor us to the joy of the present. Tonight, laughter is our song, fellowship is our anchor, and celebration is our compass.
    
To ${honoree}: May your journey continue to be blessed with abundance, laughter, and stars that guide your way. To life, to love, and to tonight. 🥂`;
  };

  const currentSpeech = generateSpeech();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSpeech);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAudio = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(currentSpeech);
    }
  };

  return (
    <div className="section-card" aria-label="Speech and Toast Rehearsal Studio">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Mic size={24} color="#f43f5e" />
            AI Speech & Toast Studio (Rehearsal Teleprompter)
          </h2>
          <p className="section-subtitle">
            Craft, rehearse, and listen to customized keynote speeches, toasts, and roasts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isSupported && (
            <button
              type="button"
              className={`btn ${isSpeaking ? 'btn-festive' : 'btn-secondary'} btn-sm`}
              onClick={handleToggleAudio}
              aria-label={isSpeaking ? 'Stop speech preview' : 'Listen to speech preview'}
            >
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isSpeaking ? 'Stop Audio' : 'Listen Aloud (AI TTS)'}</span>
            </button>
          )}

          <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Script'}</span>
          </button>
        </div>
      </div>

      {/* Control row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          background: 'var(--bg-surface)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <label className="form-label" htmlFor="speech-role">
            Speaker Identity
          </label>
          <select
            id="speech-role"
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Best Friend / Co-Host">Best Friend / Co-Host</option>
            <option value="Host / Master of Ceremonies">Host / Master of Ceremonies</option>
            <option value="Bride / Groom / Celebrant">Bride / Groom / Celebrant</option>
            <option value="Executive Sponsor / Boss">Executive Sponsor / Boss</option>
            <option value="Sibling / Family Member">Sibling / Family Member</option>
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="speech-tone">
            Tone of Voice
          </label>
          <select
            id="speech-tone"
            className="form-select"
            value={tone}
            onChange={(e) => setTone(e.target.value as 'humorous' | 'emotional' | 'motivational' | 'poetic')}
          >
            <option value="humorous">😄 Witty & Humorous</option>
            <option value="emotional">❤️ Heartfelt & Emotional</option>
            <option value="motivational">🔥 Inspirational & Bold</option>
            <option value="poetic">✨ Elegant & Poetic</option>
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="speech-len">
            Target Duration ({lengthMin} mins)
          </label>
          <select
            id="speech-len"
            className="form-select"
            value={lengthMin}
            onChange={(e) => setLengthMin(parseInt(e.target.value, 10))}
          >
            <option value={1}>1 Minute (Quick Toast)</option>
            <option value={3}>3 Minutes (Standard Speech)</option>
            <option value={5}>5 Minutes (Full Keynote Address)</option>
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="speech-honoree">
            Honoree Name / Team
          </label>
          <input
            id="speech-honoree"
            type="text"
            className="form-input"
            value={honoree}
            onChange={(e) => setHonoree(e.target.value)}
          />
        </div>
      </div>

      {/* Teleprompter Card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
              {tone} Tone
            </span>
            <span className="badge badge-success">~{lengthMin} min read</span>
            {isSpeaking && (
              <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="spin-slow">●</span> Playing Audio...
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Rehearsal Teleprompter Ready
          </span>
        </div>

        <div
          style={{
            fontSize: '1rem',
            lineHeight: '1.8',
            color: 'var(--text-main)',
            whiteSpace: 'pre-line',
            fontFamily: 'var(--font-sans)',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '10px',
          }}
        >
          {currentSpeech}
        </div>
      </div>
    </div>
  );
};
