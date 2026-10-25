/**
 * CelebriteAI Intelligent Event Copilot & Assistant Engine
 * Hybrid AI Director providing offline heuristic advice and live Gemini 1.5 Flash generation.
 *
 * @module services/aiCopilot
 */

import { EventPlan } from '../types';
import { ClientRateLimiter } from './security';

/**
 * Global rate limiter for copilot queries to prevent request flooding.
 * Default: 15 queries per minute.
 */
export const copilotRateLimiter = new ClientRateLimiter({
  maxTokens: 15,
  refillRate: 15,
  refillIntervalMs: 60000,
});

/**
 * Contextual query engine for CelebriteAI Director.
 * Answers user inquiries regarding budget reductions, vendor coordination,
 * run-of-show timing, dietary options, speeches, and weather contingency.
 *
 * Automatically attempts live Gemini 1.5 Flash query if a valid Google Gemini API key
 * is supplied, gracefully falling back to the expert offline heuristic system.
 *
 * @param userQuery The natural language question or request from the user.
 * @param currentPlan The complete EventPlan context used to synthesize answers.
 * @param apiKey Optional Google Gemini API Key for online multimodal LLM inference.
 * @returns Promise resolving to formatted markdown recommendations.
 *
 * @example
 * ```ts
 * const advice = await queryEventCopilot(
 *   'How do I trim 15% from catering costs?',
 *   currentPlan,
 *   userApiKey
 * );
 * console.log(advice);
 * ```
 */
export async function queryEventCopilot(
  userQuery: string,
  currentPlan: EventPlan,
  apiKey?: string
): Promise<string> {
  const query = (userQuery || '').toLowerCase().trim();

  // Rate limiting safeguard
  if (!copilotRateLimiter.tryConsume(1)) {
    const waitSec = Math.max(1, Math.ceil((copilotRateLimiter.getResetTime() - Date.now()) / 1000));
    return `⚠️ **Rate Limit Exceeded**: You've asked several questions in quick succession. Please pause for ${waitSec}s to allow the director engine to reset.`;
  }

  // If user has provided a Gemini API Key, attempt to call Gemini 1.5 Flash
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const prompt = `You are CelebriteAI, an expert Master Event Planner and Celebrations Concierge.
Current Event Context:
- Title: ${currentPlan.title}
- Type: ${currentPlan.eventType}
- Date: ${currentPlan.eventDate} (${currentPlan.startTime} to ${currentPlan.endTime})
- Guests: ${currentPlan.guestCount}
- Total Budget: ${currentPlan.currency} ${currentPlan.totalBudget.toLocaleString()}
- Venue Type: ${currentPlan.venueType}
- Theme: ${currentPlan.themePalette.name}
- Dietary Tags: ${currentPlan.dietaryPreferences.join(', ')}

User Question: "${userQuery}"

Provide a highly actionable, structured, empathetic, and innovative response tailored specifically to this event's budget, timeline, and vibe. Use bullet points and practical tips.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          return candidate;
        }
      }
    } catch (err) {
      console.warn('Gemini live API call failed, falling back to heuristic engine:', err);
    }
  }

  // Robust Contextual Heuristic AI Engine
  if (
    query.includes('entertainment') ||
    query.includes('game') ||
    query.includes('music') ||
    query.includes('entertain') ||
    query.includes('activity')
  ) {
    return `🎉 **Entertainment & Engagement Blueprint**:
- **Interactive Icebreaker**: Place personalized trivia cards at each dining table ("How well do you know the story?").
- **Live Atmosphere**: Kick off cocktail hour with ${currentPlan.themePalette.curatedMusicPlaylists[0] || 'Acoustic Bossa Nova'}, then ramp up energy with ${currentPlan.themePalette.curatedMusicPlaylists[1] || 'Nu-Disco Funky Grooves'}.
- **Memorable Highlight**: Create a 60-second synchronized toast with personalized sparklers or glow wands for an unforgettable photo climax!`;
  }

  if (query.includes('theme') || query.includes('decor') || query.includes('color') || query.includes('vibe')) {
    return `🎨 **Theme & Styling Guide for ${currentPlan.themePalette.name}**:
- **Palette**: Primary (${currentPlan.themePalette.primary}), Secondary (${currentPlan.themePalette.secondary}), Accent (${currentPlan.themePalette.accent}).
- **Lighting Direction**: ${currentPlan.themePalette.lightingStyle}
- **Vibe Suggestion**: Incorporate tactile elements like textured velvet table runners, warm amber candle cloches, and customized signature stationery.
- **Photo Opportunity**: Create an interactive photowall with a neon monogram slogan and floral foliage to drive social media sharing.`;
  }

  if (query.includes('venue') || query.includes('location') || query.includes('site')) {
    return `🏛️ **Venue Selection & Layout Guidance for ${currentPlan.venueType} Venue**:
- **Capacity & Flow**: Verify comfortable circulation for ${currentPlan.guestCount} guests (minimum 15-20 sq ft per guest for dining and dancing).
- **Load-in & Curfew Rules**: Confirm vendor setup window (ideally 3 hours before guest arrival) and municipal sound curfew.
- **Acoustic & Power Checks**: Ensure dedicated 20-amp circuits for the sound system and food warming stations to prevent breaker trips.
- **Accessibility Check**: Ensure barrier-free ramp access, well-lit parking, and ADA-compliant restrooms.`;
  }

  if (query.includes('speech') || query.includes('toast') || query.includes('talk') || query.includes('teleprompter')) {
    return `🎙️ **Master Speech & Toast Delivery Blueprint**:
- **The Golden 3-Minute Rule**: Speeches peak in emotional resonance between 2.5 and 4 minutes (approximately 350-500 words spoken at a relaxed cadence).
- **Narrative Arc**: Start with a warm hook/greeting, share one vivid heartfelt or humorous anecdote, articulate genuine appreciation, and finish with a resounding glass-raising toast.
- **Delivery Tip**: Maintain eye contact with the honoree for 70% of the speech, and pause for 2 full beats after punchlines for natural laughter.
- **Microphone Etiquette**: Hold the microphone 2 inches below the chin at a 45-degree angle; do not tap or shout into the grille.`;
  }

  if (query.includes('invitation') || query.includes('invite') || query.includes('card')) {
    return `💌 **Invitation & Stationery Strategy**:
- **Dispatch Timeline**: Digital save-the-dates should go out 8-12 weeks in advance; formal invitations with RSVP deadlines 4-6 weeks before ${currentPlan.eventDate}.
- **Essential Inclusions**: Clear dress code/palette inspiration (${currentPlan.themePalette.name}), parking instructions, dietary RSVP deadline, and gifting preferences.
- **Tone Alignment**: Use CelebriteAI's 4 distinct tones—Elegant for formal galas, Playful for celebratory gatherings, Formal for executive galas, or Poetic for romantic milestone celebrations!`;
  }

  if (query.includes('vendor') || query.includes('supplier') || query.includes('photographer') || query.includes('caterer')) {
    return `🤝 **Vendor Contracting & Negotiation Masterclass**:
- **Package Bundling**: Negotiate bundled packages (e.g. DJ + ambient uplighting, or Lead Photographer + drone footage) to capture 10-15% margin discounts.
- **Contract Clauses**: Always include a service replacement guarantee clause in case of primary artist illness, and define overtime rates in advance.
- **Meals & Hospitality**: Vendor meals should be provided during guest dinner so staff are refreshed and ready for high-energy post-dinner program milestones.
- **Payment Schedule**: Maintain standard milestones—30% deposit upon booking, 40% midway, and the final 30% after successful milestone completion.`;
  }

  if (query.includes('budget') || query.includes('cost') || query.includes('money') || query.includes('cut')) {
    const perGuest = Math.round(currentPlan.totalBudget / (currentPlan.guestCount || 1));
    return `💡 **Budget Optimization Strategy for ${currentPlan.title}**:
- **Current Spend**: ${currentPlan.currency} ${currentPlan.totalBudget.toLocaleString()} (~${currentPlan.currency} ${perGuest} per guest across ${currentPlan.guestCount} attendees).
- **Top Savings Lever**: Food & Beverage typically consumes 28-35% of total spend. Shifting from a plated sit-down dinner to elevated grazing stations or gourmet family-style platters can immediately trim 12-18% of catering labor costs.
- **Floral & Decor Optimization**: Repurpose ceremony florals (arches & aisle arrangements) as head table centerpieces during dinner to save $600-$1,200.
- **Vendor Negotiation Tip**: Bundle photography and drone videography with one single boutique studio for a 15% combined package discount.`;
  }

  if (query.includes('timeline') || query.includes('schedule') || query.includes('run of show') || query.includes('late')) {
    return `⏱️ **Run-of-Show Advice for ${currentPlan.startTime} Start**:
- **Buffer Rule**: Always include a 15-minute buffer between guest arrival and formal commencement to accommodate transit delays.
- **Key Milestones**: Ensure all formal speeches/toasts occur *before* the main course is served while guests are seated and attentively engaged.
- **Energy Curve**: Keep speeches under 4 minutes each. Transition to the main dance floor by ${currentPlan.timeline[currentPlan.timeline.length - 2]?.time || '9:00 PM'} right after the cake cutting.
- **Vendor Briefing**: Schedule a 5-minute huddle with the MC and Head Waiter 30 minutes prior to doors opening.`;
  }

  if (query.includes('rsvp') || query.includes('guest') || query.includes('dietary')) {
    const confirmedCount = currentPlan.guests.filter((g) => g.rsvpStatus === 'confirmed').length;
    const pendingCount = currentPlan.guests.filter((g) => g.rsvpStatus === 'pending').length;
    return `📋 **Guest & RSVP Management Summary**:
- **RSVP Health**: ${confirmedCount} confirmed, ${pendingCount} pending confirmation out of ${currentPlan.guests.length} tracked records.
- **Dietary Safeguards**: Detected tags: ${currentPlan.dietaryPreferences.join(', ')}. Ensure catering cards clearly label vegan, gluten-free, and nut-free items at the buffet.
- **Follow-up Protocol**: Send a warm WhatsApp/Email reminder 14 days before ${currentPlan.eventDate} using our pre-formatted Playful or Elegant invitation copy.`;
  }

  if (query.includes('rain') || query.includes('weather') || query.includes('emergency') || query.includes('contingency')) {
    return `☔ **Contingency & Weather Defense Plan**:
- **Indoor Pivot**: For your ${currentPlan.venueType} setup, maintain a firm "Plan B" decision deadline 36 hours prior with the venue manager.
- **Supply Kit**: Keep a stash of 20 clear umbrellas for photographers, extra power banks, stain remover pens, and an emergency sewing/first-aid kit in the coordinator suite.
- **Temperature Control**: For outdoor evenings, rent standing patio infrared heaters or offer customized lightweight pashminas/blankets as guest keepsakes.`;
  }

  return `✨ **CelebriteAI Recommendation for "${userQuery}"**:
Based on your **${currentPlan.title}** (${currentPlan.guestCount} guests, budget ${currentPlan.currency} ${currentPlan.totalBudget.toLocaleString()}):
1. **Focus on Guest Experience**: Small touches like signature welcome drinks and handwritten welcome notes create a 10x greater memory than expensive single-use props.
2. **Synchronize Vendors**: Share our PDF/Printable Event Run of Show with your Photographer, DJ, and Caterer at least 5 days prior to align cue points.
3. **Explore Modules**: You can adjust your budget allocations dynamically in the Budget tab, add custom Run-of-Show timeline markers in the Timeline tab, or track dietary RSVPs in the Guests tab!`;
}
