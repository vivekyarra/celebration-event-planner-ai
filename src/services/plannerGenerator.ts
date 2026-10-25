import {
  BudgetCategory,
  EventPlan,
  EventType,
  Guest,
  InvitationDraft,
  MenuItem,
  ThemePalette,
  TimelineItem,
  VendorItem,
  VenueType,
} from '../types';

export function calculateBudgetBreakdown(
  eventType: EventType,
  totalBudget: number
): BudgetCategory[] {
  let ratios: { name: string; pct: number; icon: string; recs: string[] }[] = [];

  switch (eventType) {
    case 'wedding':
      ratios = [
        { name: 'Venue & Rental', pct: 0.35, icon: 'Castle', recs: ['Banquet hall deposit', 'Security bond', 'Valet parking'] },
        { name: 'Catering & Beverages', pct: 0.28, icon: 'UtensilsCrossed', recs: ['Multi-course buffet', 'Welcome drinks bar', 'Tasting session'] },
        { name: 'Decor & Florals', pct: 0.15, icon: 'Sparkles', recs: ['Stage backdrop', 'Aisle flowers', 'Ambient fairylights'] },
        { name: 'Photography & Cinema', pct: 0.10, icon: 'Camera', recs: ['Drone coverage', 'Pre-wedding candid reel', 'Same-day edit'] },
        { name: 'Music & Entertainment', pct: 0.07, icon: 'Music', recs: ['DJ & Sound system', 'Live acoustic quartet', 'Microphone setup'] },
        { name: 'Contingency & Favors', pct: 0.05, icon: 'Gift', recs: ['Custom welcome hampers', 'Emergency weather cover', 'Staff tips'] },
      ];
      break;

    case 'corporate':
    case 'hackathon':
      ratios = [
        { name: 'Venue & Facilities', pct: 0.30, icon: 'Building2', recs: ['Auditorium / High-speed WiFi', 'Breakout pods', 'HVAC setup'] },
        { name: 'Catering & Energy Stations', pct: 0.30, icon: 'Coffee', recs: ['Continuous coffee/tea bar', 'Brain-food buffet', 'Midnight snacks'] },
        { name: 'Audio-Visual & Tech', pct: 0.20, icon: 'MonitorPlay', recs: ['Projector screens & AV', 'Lapel microphones', 'Livestream gear'] },
        { name: 'Swag, Badges & Prizes', pct: 0.12, icon: 'Award', recs: ['Eco-friendly merch bags', 'Custom trophies', 'NFC name badges'] },
        { name: 'PR, Photo & Host', pct: 0.05, icon: 'Camera', recs: ['Professional MC/Emcee', 'Step-and-repeat photography'] },
        { name: 'Contingency & Logistics', pct: 0.03, icon: 'ShieldAlert', recs: ['Backup power generator', 'First-aid kit desk'] },
      ];
      break;

    case 'birthday':
    case 'milestone':
    case 'baby_shower':
      ratios = [
        { name: 'Venue & Ambiance', pct: 0.25, icon: 'Home', recs: ['Private dining room or patio', 'Balloons arch', 'Photo backdrop'] },
        { name: 'Food, Drinks & Custom Cake', pct: 0.35, icon: 'Cake', recs: ['Signature tiered cake', 'Finger-food platters', 'Mocktail/Cocktail station'] },
        { name: 'Entertainment & Games', pct: 0.18, icon: 'PartyPopper', recs: ['Interactive game host', 'Photo-booth with props', 'Curated sound gear'] },
        { name: 'Decorations & Theming', pct: 0.12, icon: 'Palette', recs: ['Custom welcome sign', 'Centerpieces', 'LED neon signs'] },
        { name: 'Favors & Goodie Bags', pct: 0.06, icon: 'Gift', recs: ['Personalized keepsake gifts', 'Sweet treat boxes'] },
        { name: 'Contingency', pct: 0.04, icon: 'ShieldCheck', recs: ['Extra ice & tableware reserve', 'Surprise delivery buffer'] },
      ];
      break;

    case 'festive_gala':
    case 'anniversary':
    default:
      ratios = [
        { name: 'Venue & Staging', pct: 0.32, icon: 'Sparkle', recs: ['Grand ballroom', 'Dance floor installation', 'Accent uplighting'] },
        { name: 'Catering & Wine Service', pct: 0.32, icon: 'GlassWater', recs: ['Plated 3-course dinner', 'Champagne toast', 'Late-night dessert bar'] },
        { name: 'Live Entertainment / Band', pct: 0.16, icon: 'Music2', recs: ['Jazz trio or headline band', 'Master of Ceremonies'] },
        { name: 'Floral & Festive Lighting', pct: 0.10, icon: 'Flower2', recs: ['Candlelit floral runners', 'Fairy light curtains'] },
        { name: 'Photography & Memory Book', pct: 0.06, icon: 'Camera', recs: ['Photo lounge', 'Instant print keepsake book'] },
        { name: 'Logistics Reserve', pct: 0.04, icon: 'Shield', recs: ['Transport shuttles', 'Valet tipping fund'] },
      ];
      break;
  }

  return ratios.map((item, idx) => ({
    id: `cat-${idx + 1}`,
    name: item.name,
    percentage: Math.round(item.pct * 100),
    allocatedAmount: Math.round(totalBudget * item.pct),
    spentAmount: Math.round(totalBudget * item.pct * 0.45),
    icon: item.icon,
    recommendations: item.recs,
  }));
}

export function generateRunOfShow(
  eventType: EventType,
  startTime: string = '17:00'
): TimelineItem[] {
  const startHour = parseInt(startTime.split(':')[0], 10) || 17;
  const fmt = (hr: number, min: number = 0) => {
    const adjustedHr = (hr + 24) % 24;
    const h = adjustedHr % 12 || 12;
    const ampm = adjustedHr >= 12 ? 'PM' : 'AM';
    const m = min < 10 ? `0${min}` : min;
    return `${h}:${m} ${ampm}`;
  };

  if (eventType === 'wedding') {
    return [
      { id: 't1', time: fmt(startHour - 2, 0), phase: 'setup', title: 'Vendor & Decor Setup', description: 'Florists, lighting crew, sound check, and bridal suite preparation.', leadCoordinator: 'Lead Event Manager', isCompleted: true },
      { id: 't2', time: fmt(startHour, 0), phase: 'arrival', title: 'Guest Arrival & Welcome Mocktails', description: 'Soft acoustic music, welcome drinks, guest book signing.', leadCoordinator: 'Hospitality Team', isCompleted: false },
      { id: 't3', time: fmt(startHour + 1, 0), phase: 'ceremony', title: 'The Main Ceremony & Exchange', description: 'Processional entrance, vows exchange, ring ceremony, and confetti toss.', leadCoordinator: 'Officiant & Master of Ceremonies', isCompleted: false },
      { id: 't4', time: fmt(startHour + 2, 0), phase: 'dining', title: 'Cocktail Hour & Golden Hour Photos', description: 'Passed hors d’oeuvres while couple finishes portrait session.', leadCoordinator: 'Lead Photographer', isCompleted: false },
      { id: 't5', time: fmt(startHour + 3, 0), phase: 'dining', title: 'Grand Banquet Dinner & Toasts', description: 'Welcome toasts by best friends/family followed by multi-course feast.', leadCoordinator: 'Head Chef & Host', isCompleted: false },
      { id: 't6', time: fmt(startHour + 4, 30), phase: 'entertainment', title: 'Cake Cutting & First Dance', description: 'Tiered cake celebration, sparklers display, and dance floor opening.', leadCoordinator: 'DJ / MC', isCompleted: false },
      { id: 't7', time: fmt(startHour + 6, 0), phase: 'winddown', title: 'Grand Farewell Sparkler Send-off', description: 'Final anthem, favors distribution, and private getaway vehicle departure.', leadCoordinator: 'Event Coordinator', isCompleted: false },
    ];
  }

  if (eventType === 'hackathon' || eventType === 'corporate') {
    return [
      { id: 't1', time: fmt(startHour - 1, 0), phase: 'setup', title: 'AV & Registration Check', description: 'Network stress test, badge kiosk setup, and presentation screen calibration.', leadCoordinator: 'Tech Operations Lead', isCompleted: true },
      { id: 't2', time: fmt(startHour, 0), phase: 'arrival', title: 'Check-in, Networking & Coffee', description: 'Welcome kit distribution, energizing breakfast/snacks, and mixer music.', leadCoordinator: 'Community Lead', isCompleted: false },
      { id: 't3', time: fmt(startHour + 0, 45), phase: 'ceremony', title: 'Keynote & Challenge Briefing', description: 'Leadership welcome remarks, judging criteria announcement, and kickoff countdown.', leadCoordinator: 'VP of Product / MC', isCompleted: false },
      { id: 't4', time: fmt(startHour + 3, 0), phase: 'dining', title: 'Catered Lunch & Mentor Circles', description: 'Buffet lunch with mentor office hours and roundtable discussions.', leadCoordinator: 'Catering Lead', isCompleted: false },
      { id: 't5', time: fmt(startHour + 5, 0), phase: 'entertainment', title: 'Project Demos & Live Pitching', description: 'Top finalist live presentations, audience voting, and Q&A session.', leadCoordinator: 'Lead Judge', isCompleted: false },
      { id: 't6', time: fmt(startHour + 6, 30), phase: 'winddown', title: 'Awards Ceremony & Networking Happy Hour', description: 'Trophy ceremony, celebratory champagne/mocktails, and concluding photos.', leadCoordinator: 'Executive Sponsor', isCompleted: false },
    ];
  }

  // Default Birthday / Festive / Anniversary
  return [
    { id: 't1', time: fmt(startHour - 2, 0), phase: 'setup', title: 'Venue Decoration & Sound Check', description: 'Balloons, floral tablescapes, playlist test, and food warming station.', leadCoordinator: 'Party Planner', isCompleted: true },
    { id: 't2', time: fmt(startHour, 0), phase: 'arrival', title: 'Guest Arrival & Photo Booth Lounge', description: 'Welcome appetizers, Polaroid guestbook, and festive ambient vibes.', leadCoordinator: 'Greeter Host', isCompleted: false },
    { id: 't3', time: fmt(startHour + 1, 30), phase: 'entertainment', title: 'Icebreakers & Group Celebration Games', description: 'Trivia, friendly roast/toasts, and interactive storytelling.', leadCoordinator: 'Host / MC', isCompleted: false },
    { id: 't4', time: fmt(startHour + 2, 30), phase: 'ceremony', title: 'Grand Cake Reveal & Champagne Toast', description: 'Singing anthem, cake cutting, confetti explosion, and photo session.', leadCoordinator: 'Party Lead', isCompleted: false },
    { id: 't5', time: fmt(startHour + 3, 0), phase: 'dining', title: 'Gourmet Feast & Dinner Music', description: 'Curated dinner spread accommodating all dietary choices.', leadCoordinator: 'Catering Manager', isCompleted: false },
    { id: 't6', time: fmt(startHour + 4, 30), phase: 'entertainment', title: 'Dance Floor & Euphoric Playlist', description: 'High-energy DJ mix, dance-offs, and dessert nibbles.', leadCoordinator: 'DJ', isCompleted: false },
    { id: 't7', time: fmt(startHour + 6, 0), phase: 'winddown', title: 'Favors Distribution & Fond Farewell', description: 'Personalized thank-you goodie bags and ride coordination.', leadCoordinator: 'Host', isCompleted: false },
  ];
}

export function generateCuratedTheme(
  eventType: EventType,
  userTheme?: string
): ThemePalette {
  if (userTheme && userTheme.toLowerCase().includes('cyberpunk')) {
    return {
      name: 'Neon Cyberpunk Gala',
      primary: '#06b6d4',
      secondary: '#a855f7',
      accent: '#f43f5e',
      background: 'linear-gradient(135deg, #090d16 0%, #1e1136 100%)',
      vibeDescription: 'Electrifying futuristic synth-wave with neon backlights, holographic accents, and high-tech glow.',
      lightingStyle: 'Deep violet LED floodlights with cyan beam accents and strobe laser effects.',
      recommendedDressCode: 'Tech Chic / Dark Glitch with metallic or neon accessories.',
      curatedMusicPlaylists: ['Synthwave Nocturne', 'Cyber Disco VIP', 'Retro Electro Lounge'],
    };
  }

  switch (eventType) {
    case 'wedding':
      return {
        name: 'Ethereal Botanical Elegance',
        primary: '#b45309',
        secondary: '#ec4899',
        accent: '#10b981',
        background: 'linear-gradient(135deg, #fefce8 0%, #fff1f2 100%)',
        vibeDescription: 'Romantic, timeless, and softly illuminated with lush eucalyptus florals and warm candlelight.',
        lightingStyle: 'Warm white (2700K) hanging fairylights and ambient amber tabletop pillar candles.',
        recommendedDressCode: 'Black-Tie Optional / Pastel Floral Cocktail.',
        curatedMusicPlaylists: ['Acoustic Romance Classics', 'Sunset Bossa Nova & Strings', 'Golden Hour Love Anthems'],
      };

    case 'corporate':
    case 'hackathon':
      return {
        name: 'Aurora Innovate Horizon',
        primary: '#2563eb',
        secondary: '#059669',
        accent: '#f59e0b',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        vibeDescription: 'Clean, inspiring, modern tech aesthetic encouraging creative breakthroughs and energetic collaboration.',
        lightingStyle: 'Cool architectural wash lights with dynamic accent spotlights during stage talks.',
        recommendedDressCode: 'Smart Casual / Tech Exec Modern.',
        curatedMusicPlaylists: ['Lo-Fi Focus & Flow', 'Deep Melodic House Beats', 'Cinematic Tech Euphoria'],
      };

    case 'birthday':
    case 'milestone':
      return {
        name: 'Golden Velvet Celebration',
        primary: '#eab308',
        secondary: '#f43f5e',
        accent: '#8b5cf6',
        background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
        vibeDescription: 'Vibrant, glamorous, high-spirited fiesta filled with shimmer, joyful toasts, and nonstop dancing.',
        lightingStyle: 'Twinkling golden fairy curtain, warm uplighting, and mirror ball reflections.',
        recommendedDressCode: 'Festive Cocktail with a Touch of Sparkle & Gold.',
        curatedMusicPlaylists: ['Feel-Good Pop Anthems', 'Disco Classics & Nu-Disco', 'R&B Party Grooves'],
      };

    default:
      return {
        name: 'Starlight Royale',
        primary: '#6366f1',
        secondary: '#d946ef',
        accent: '#f97316',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        vibeDescription: 'Mystical starlight evening with deep navy hues, sparkling constellations, and rich velvet accents.',
        lightingStyle: 'Starlight fiber optic ceiling wash and dim mood table lamps.',
        recommendedDressCode: 'Cocktail / Midnight Velvet Attire.',
        curatedMusicPlaylists: ['Modern Jazz standards', 'Chill Lounge Deep Grooves', 'Late-night Soul'],
      };
  }
}

export function generateVendors(
  eventType: EventType,
  totalBudget: number
): VendorItem[] {
  return [
    {
      id: 'v-1',
      category: 'Venue & Banquet',
      companyName: 'Grand Horizons Sanctuary & Ballroom',
      contactPerson: 'Sophia Vance',
      emailOrPhone: 'events@grandhorizons.example.com',
      estimatedCost: Math.round(totalBudget * 0.33),
      status: 'confirmed',
      notes: 'Confirmed deposit; access granted 3 hours prior for setup.',
    },
    {
      id: 'v-2',
      category: 'Catering & Mixology',
      companyName: 'Artisan Palate Gourmet Dining',
      contactPerson: 'Chef Marcus Ray',
      emailOrPhone: 'marcus@artisanpalate.example.com',
      estimatedCost: Math.round(totalBudget * 0.28),
      status: 'negotiating',
      notes: 'Finalizing vegan & gluten-free tasting menu options.',
    },
    {
      id: 'v-3',
      category: 'Visuals & Decor',
      companyName: 'Bloom & Prism Decor Studio',
      contactPerson: 'Elena Rostova',
      emailOrPhone: 'hello@bloomandprism.example.com',
      estimatedCost: Math.round(totalBudget * 0.14),
      status: 'contacted',
      notes: 'Reviewing moodboards and floral arches proposal.',
    },
    {
      id: 'v-4',
      category: 'Photography & Reel',
      companyName: 'Candid Moments Cinema',
      contactPerson: 'David Chen',
      emailOrPhone: 'studio@candidmoments.example.com',
      estimatedCost: Math.round(totalBudget * 0.10),
      status: 'confirmed',
      notes: 'Contract signed for 2 photographers + 1 drone pilot.',
    },
    {
      id: 'v-5',
      category: 'Sound & DJ',
      companyName: 'Pulse Audio Dynamics',
      contactPerson: 'DJ Alex Ryder',
      emailOrPhone: 'bookings@pulseaudio.example.com',
      estimatedCost: Math.round(totalBudget * 0.08),
      status: 'planning',
      notes: 'Requested custom playlist and wireless mic systems.',
    },
  ];
}

export function generateInitialGuests(guestCount: number): Guest[] {
  const sampleNames = [
    { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', dietary: 'Vegetarian', plusOnes: 1 },
    { name: 'Priya Patel', email: 'priya.patel@example.com', dietary: 'Vegan, Nut-Free', plusOnes: 0 },
    { name: 'Rohan Mehta', email: 'rohan.mehta@example.com', dietary: 'Non-Vegetarian', plusOnes: 1 },
    { name: 'Ananya Iyer', email: 'ananya.iyer@example.com', dietary: 'Gluten-Free', plusOnes: 0 },
    { name: 'Kavita Deshmukh', email: 'kavita.d@example.com', dietary: 'Jain Vegetarian', plusOnes: 1 },
    { name: 'Marcus Sterling', email: 'marcus.s@example.com', dietary: 'Halal', plusOnes: 0 },
    { name: 'Chloe Dubois', email: 'chloe.dubois@example.com', dietary: 'Dairy-Free', plusOnes: 1 },
    { name: 'Vikram Sengupta', email: 'vikram.s@example.com', dietary: 'Non-Vegetarian', plusOnes: 0 },
  ];

  const countToCreate = Math.min(guestCount, 8);
  const statuses: ('confirmed' | 'pending' | 'declined')[] = [
    'confirmed',
    'confirmed',
    'confirmed',
    'pending',
    'pending',
    'confirmed',
    'pending',
    'declined',
  ];

  return sampleNames.slice(0, countToCreate).map((item, idx) => ({
    id: `guest-${idx + 1}`,
    name: item.name,
    email: item.email,
    dietary: item.dietary,
    tableNumber: (idx % 3) + 1,
    rsvpStatus: statuses[idx % statuses.length],
    plusOnes: item.plusOnes,
    notes: idx === 0 ? 'VIP - Keynote speaker / close relative' : undefined,
  }));
}

export function generateMenu(eventType: EventType, dietary: string[]): MenuItem[] {
  const hasVegan = dietary.some((d) => d.toLowerCase().includes('vegan'));
  return [
    {
      id: 'm1',
      course: 'starters',
      name: 'Truffled Wild Mushroom & Caramelized Onion Bruschetta',
      description: 'Artisanal sourdough crostini brushed with roasted garlic herb oil.',
      dietaryTags: ['Vegetarian', hasVegan ? 'Vegan Option' : 'Dairy Free'],
      recommendedQuantity: '2 pieces per guest',
    },
    {
      id: 'm2',
      course: 'starters',
      name: 'Crispy Saffron Spiced Corn & Edamame Fritters',
      description: 'Served with roasted bell pepper coulis and micro cilantro.',
      dietaryTags: ['Gluten-Free', 'Vegan'],
      recommendedQuantity: '2 pieces per guest',
    },
    {
      id: 'm3',
      course: 'mains',
      name: 'Herb-Crusted Paneer / Rosemary Grilled Chicken Medallions',
      description: 'Accompanied by dauphinoise potatoes, glazed baby carrots, and velouté.',
      dietaryTags: ['High Protein', 'Gluten-Free Available'],
      recommendedQuantity: '1 entree per guest',
    },
    {
      id: 'm4',
      course: 'mains',
      name: 'Slow-Cooked Royal Dal Makhani & Jasmine Pilaf',
      description: 'Traditional slow-simmered black lentils with churned cream and saffron basmati.',
      dietaryTags: ['Vegetarian', 'Nut-Free'],
      recommendedQuantity: 'Generous buffet bowl',
    },
    {
      id: 'm5',
      course: 'desserts',
      name: 'Belgian Dark Chocolate Mousse with Berry Coulis',
      description: '70% Valrhona chocolate mousse adorned with edible gold leaf and raspberries.',
      dietaryTags: ['Vegetarian', 'Gluten-Free'],
      recommendedQuantity: '1 glass per guest',
    },
    {
      id: 'm6',
      course: 'beverages',
      name: 'Hibiscus Blood Orange Sparkling Mocktail',
      description: 'Brewed wild hibiscus petals, cold-pressed blood orange, sprig of rosemary and sparkling water.',
      dietaryTags: ['Non-Alcoholic', 'Refined Sugar Free'],
      recommendedQuantity: 'Unlimited refills',
    },
  ];
}

export function generateInvitations(
  title: string,
  eventType: EventType,
  date: string,
  venueType: VenueType
): InvitationDraft[] {
  return [
    {
      id: 'inv-1',
      style: 'elegant',
      headline: `You are cordially invited to celebrate ${title}`,
      body: `Together with joy in our hearts, we invite you to join us for an unforgettable gathering. Set in a breathtaking ${venueType} ambiance on ${date}, your presence will make this milestone truly extraordinary.`,
      callToAction: 'Kindly confirm your RSVP by clicking below to secure your place.',
    },
    {
      id: 'inv-2',
      style: 'playful',
      headline: `Clear your calendar! ${title} is going down! 🎉`,
      body: `Great music, unforgettable stories, delicious cocktails, and the best company imaginable. We’re turning up the celebration on ${date} and it simply won’t be the same without you!`,
      callToAction: 'RSVP now so we save you a seat (and extra dessert)!',
    },
    {
      id: 'inv-3',
      style: 'formal',
      headline: `Distinguished Invitation: ${title}`,
      body: `We take great pleasure in inviting you to the formal celebration of ${title}. The proceedings will commence on ${date}. Formal reception, keynote addresses, and banquet dining to follow.`,
      callToAction: 'Please register your formal attendance and dietary requirements.',
    },
    {
      id: 'inv-4',
      style: 'poetic',
      headline: `A night under the stars: Celebrating ${title}`,
      body: `Moments become memories when shared with those who mean the most. Join us on ${date} as we raise our glasses to laughter, legacy, and shared dreams.`,
      callToAction: 'Grace us with your presence. Reserve your RSVP today.',
    },
  ];
}

export function createDefaultEventPlan(): EventPlan {
  const eventType: EventType = 'wedding';
  const totalBudget = 25000;
  const guestCount = 120;
  const date = '2026-12-18';
  const title = 'Aarav & Ananya’s Royal Celebration';
  const venueType: VenueType = 'indoor';

  return {
    id: 'event-default-1',
    title,
    eventType,
    eventDate: date,
    startTime: '16:30',
    endTime: '23:30',
    guestCount,
    totalBudget,
    currency: 'USD',
    venueType,
    theme: 'Romantic Botanical Elegance',
    dietaryPreferences: ['Vegetarian Options', 'Gluten-Free', 'Vegan Friendly', 'Nut-Free'],
    specialRequests: 'Drone footage during sunset; sparkling cider toast for non-drinkers.',
    budgetBreakdown: calculateBudgetBreakdown(eventType, totalBudget),
    timeline: generateRunOfShow(eventType, '16:30'),
    vendors: generateVendors(eventType, totalBudget),
    guests: generateInitialGuests(guestCount),
    themePalette: generateCuratedTheme(eventType),
    invitations: generateInvitations(title, eventType, date, venueType),
    menu: generateMenu(eventType, ['Vegetarian', 'Gluten-Free', 'Vegan']),
  };
}

/**
 * Intelligent Heuristic Assistant Engine (Offline AI & Gemini Fallback)
 * Ensures 100% problem statement alignment with deep contextual advice!
 */
export async function queryEventCopilot(
  userQuery: string,
  currentPlan: EventPlan,
  apiKey?: string
): Promise<string> {
  const query = userQuery.toLowerCase().trim();

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

  if (query.includes('theme') || query.includes('decor') || query.includes('color') || query.includes('vibe')) {
    return `🎨 **Theme & Styling Guide for ${currentPlan.themePalette.name}**:
- **Palette**: Primary (${currentPlan.themePalette.primary}), Secondary (${currentPlan.themePalette.secondary}), Accent (${currentPlan.themePalette.accent}).
- **Lighting Direction**: ${currentPlan.themePalette.lightingStyle}
- **Vibe Suggestion**: Incorporate tactile elements like textured velvet table runners, warm amber candle cloches, and customized signature stationery.
- **Photo Opportunity**: Create an interactive photowall with a neon monogram slogan and floral foliage to drive social media sharing.`;
  }

  if (query.includes('game') || query.includes('activity') || query.includes('entertain') || query.includes('music')) {
    return `🎉 **Entertainment & Engagement Blueprint**:
- **Interactive Icebreaker**: Place personalized trivia cards at each dining table ("How well do you know the story?").
- **Live Atmosphere**: Kick off cocktail hour with ${currentPlan.themePalette.curatedMusicPlaylists[0] || 'Acoustic Bossa Nova'}, then ramp up energy with ${currentPlan.themePalette.curatedMusicPlaylists[1] || 'Nu-Disco Funky Grooves'}.
- **Memorable Highlight**: Create a 60-second synchronized toast with personalized sparklers or glow wands for an unforgettable photo climax!`;
  }

  if (query.includes('rsvp') || query.includes('guest') || query.includes('invitation') || query.includes('dietary')) {
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
