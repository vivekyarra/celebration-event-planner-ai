import React, { useState } from 'react';
import { Mic, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { EventPlan } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { sanitizeHtml } from '../services/security';

interface SpeechStudioProps {
  plan: EventPlan;
}

export const SpeechStudio: React.FC<SpeechStudioProps> = ({ plan }) => {
  const [role, setRole] = useState('Best Friend / Co-Host');
  const [tone, setTone] = useState<'humorous' | 'emotional' | 'motivational' | 'poetic'>('humorous');
  const [lengthMin, setLengthMin] = useState<number>(3);
  const [honoree, setHonoree] = useState('the Guest of Honor & everyone assembled');
  const [customPrompt, setCustomPrompt] = useState('');
  const [speed, setSpeed] = useState<number>(1.0);
  const [copied, setCopied] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const { speak, stop, isSpeaking, isSupported } = useSpeech();

  const handleCustomPromptChange = (val: string) => {
    setCustomPrompt(val);
    const trimmed = val.trim();
    if (trimmed.length > 0 && trimmed.length < 3) {
      setPromptError('Custom prompt must be at least 3 characters.');
    } else if (trimmed.length > 500) {
      setPromptError('Custom prompt cannot exceed 500 characters.');
    } else {
      setPromptError(null);
    }
  };

  const generateSpeech = () => {
    const safeRole = role;
    const safeTitle = plan.title;
    const safeVenue = plan.venueType;
    const safeHonoree = honoree;
    const safePrompt = customPrompt.trim();

    const promptInsertion = safePrompt ? `\n\nKey Message Focus: "${safePrompt}"\n` : '';

    let rawSpeech = '';

    if (tone === 'humorous') {
      rawSpeech = `Good evening everyone! For those who don't know me, I'm ${safeRole}. When I was asked to speak tonight at ${safeTitle}, I was told to keep it under ${lengthMin} minutes and to be on my best behavior. Naturally, I promised nothing.
${promptInsertion}
Looking around this incredible ${safeVenue} venue tonight, it’s impossible not to feel the warmth, laughter, and overwhelming energy in this room. We've gathered here not just to mark another date on the calendar, but to celebrate the unforgettable journey that brought us together.

To ${safeHonoree}: You bring a spirit of genuine generosity and relentless joy that inspires every single person in this room.

So, if everyone could take their glasses—fill them high—let us raise a heartfelt toast: To unforgettable moments, treasured friendships, and a future brighter than all the sparklers tonight. Cheers! 🥂`;
    } else if (tone === 'emotional') {
      rawSpeech = `Distinguished guests, family, and lifelong friends: Welcome to this extraordinary evening celebrating ${safeTitle}.
${promptInsertion}
There are moments in life that seem to suspend time—evenings where every handshake, every smile, and every shared laugh weaves a tapestry of memories we will hold close forever. 

Standing here tonight, looking at the love radiating across these tables, I am reminded of how rare it is to find someone like ${safeHonoree} who makes everyone around them feel valued, celebrated, and deeply appreciated.

May tonight remind us of the power of community, resilience, and genuine love. Let us raise our glasses: To lasting legacy, timeless memories, and the wonderful bond that binds us all together. To ${safeTitle}! 🥂`;
    } else if (tone === 'motivational') {
      rawSpeech = `Welcome innovators, leaders, and dreamers to ${safeTitle}!
${promptInsertion}
Great milestones aren’t merely reached; they are forged through relentless dedication, shared vision, and courage. What started as an ambitious idea has brought ${plan.guestCount} passionate individuals under this roof tonight.

Tonight is a testament that when extraordinary minds collaborate, the impossible becomes standard procedure. To ${safeHonoree} and every contributor who made this celebration a reality: We honor your passion, your grit, and your craft.

Here is to the next frontier, the bold chapters still unwritten, and the victories ahead. Raise your glasses! 🚀`;
    } else {
      // Poetic
      rawSpeech = `Beneath the gentle glow of ${plan.themePalette.lightingStyle.toLowerCase()}, we gather under a constellation of friendship for ${safeTitle}.
${promptInsertion}
Time moves in quiet whispers, but celebrations like this anchor us to the joy of the present. Tonight, laughter is our song, fellowship is our anchor, and celebration is our compass.

To ${safeHonoree}: May your journey continue to be blessed with abundance, laughter, and stars that guide your way. To life, to love, and to tonight. 🥂`;
    }

    return sanitizeHtml(rawSpeech);
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
      speak(currentSpeech, speed);
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
              aria-label={isSpeaking ? 'Stop speech preview' : 'Play speech preview'}
            >
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isSpeaking ? 'Stop Audio' : 'Listen Aloud (AI TTS)'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            aria-label="Copy speech script"
          >
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
            aria-label="Speaker persona select"
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
            aria-label="Tone of voice select"
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
            aria-label="Target duration select"
          >
            <option value={1}>1 Minute (Quick Toast)</option>
            <option value={3}>3 Minutes (Standard Speech)</option>
            <option value={5}>5 Minutes (Full Keynote Address)</option>
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="speech-speed">
            Speech Speed ({speed.toFixed(1)}x)
          </label>
          <input
            id="speech-speed"
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            aria-label="Speech playback speed slider"
            aria-valuemin={0.5}
            aria-valuemax={2.0}
            aria-valuenow={speed}
            className="form-range"
            style={{ width: '100%', marginTop: '6px' }}
          />
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
            aria-label="Honoree name or team"
          />
        </div>
      </div>

      {/* User Custom Prompt Input with Bounds Validation */}
      <div
        style={{
          background: 'var(--bg-surface)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          border: '1px solid var(--border)',
        }}
      >
        <label className="form-label" htmlFor="speech-custom-prompt">
          Custom Key Message / Theme Focus (3 - 500 characters)
        </label>
        <input
          id="speech-custom-prompt"
          type="text"
          className="form-input"
          placeholder="e.g. Celebrate 5 years of milestone growth, resilience during challenges, and bright horizons..."
          value={customPrompt}
          onChange={(e) => handleCustomPromptChange(e.target.value)}
          aria-label="Custom speech prompt input"
          aria-invalid={promptError !== null}
          aria-errormessage={promptError ? 'speech-prompt-error' : undefined}
          maxLength={500}
        />
        {promptError && (
          <div
            id="speech-prompt-error"
            role="alert"
            style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '6px', fontWeight: 500 }}
          >
            {promptError}
          </div>
        )}
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
                <span className="spin-slow">●</span> Playing Audio ({speed.toFixed(1)}x)...
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Rehearsal Teleprompter Ready
          </span>
        </div>

        <div
          role="region"
          aria-label="Speech rehearsal script text"
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