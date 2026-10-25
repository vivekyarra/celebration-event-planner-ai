/**
 * CelebriteAI Core Event Planner Generator Engine
 * Algorithmic generator for event budgets, run-of-show schedules,
 * vendor rosters, catering menus, stationery copy, and curated aesthetics.
 *
 * @module services/plannerGenerator
 */

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

export { queryEventCopilot, copilotRateLimiter } from './aiCopilot';

/**
 * Calculates a balanced, industry-calibrated budget breakdown tailored to specific celebration types.
 *
 * @param eventType Type of event (e.g. 'wedding', 'corporate', 'birthday').
 * @param totalBudget Overall monetary budget available for the event.
 * @returns Array of BudgetCategory objects with allocated percentages and actionable recommendations.
 *
 * @example
 * ```ts
 * const breakdown = calculateBudgetBreakdown('wedding', 30000);
 * console.log(`Catering allocation: $${breakdown[1].allocatedAmount}`);
 * ```
 */
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
        { name: 'Venue & Staging', pct: 0.32, icon: 'Sparkles', recs: ['Grand foyer', 'Staging & podium', 'Atmospheric lighting'] },
        { name: 'Fine Dining & Wine Service', pct: 0.32, icon: 'Wine', recs: ['Plated 4-course banquet', 'Sommelier wine pairing', 'Late night dessert station'] },
        { name: 'Decor, Flora & Linens', pct: 0.15, icon: 'Palette', recs: ['Fresh floral centerpieces', 'Silk table linens', 'Custom printed menus'] },
        { name: 'Live Band & Production', pct: 0.11, icon: 'Music', recs: ['6-piece jazz ensemble', 'Wireless mics', 'Sound engineer'] },
        { name: 'Cinematography & Memory Reel', pct: 0.06, icon: 'Film', recs: ['Highlight reel', 'Executive portrait station'] },
        { name: 'Contingency & Hospitality', pct: 0.04, icon: 'HeartHandshake', recs: ['VIP room refreshments', 'Valet staffing buffer'] },
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

/**
 * Generates an end-to-end synchronized run-of-show schedule tailored to the event type and start time.
 *
 * @param eventType Celebration type governing phase sequencing.
 * @param startTime Desired start time formatted in 24-hour HH:MM (e.g. "17:00").
 * @returns Array of TimelineItem objects with phases, descriptions, and assigned leads.
 *
 * @example
 * ```ts
 * const runOfShow = generateRunOfShow('wedding', '16:00');
 * console.log(`First milestone: ${runOfShow[0].title} at ${runOfShow[0].time}`);
 * ```
 */
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

/**
 * Curates a cohesive aesthetic palette, lighting configuration, dress code, and musical soundtrack.
 *
 * @param eventType Event type classifying the design language.
 * @param userTheme Optional bespoke prompt or override keyword (e.g. 'cyberpunk').
 * @returns Complete ThemePalette configuration.
 *
 * @example
 * ```ts
 * const palette = generateCuratedTheme('wedding', 'bohemian rustic');
 * console.log(`Lighting recommendation: ${palette.lightingStyle}`);
 * ```
 */
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
      vibeDescription: 'Electrifying neon hues, holographic accents, laser mapping, and futuristic synths.',
      lightingStyle: 'Ultraviolet blacklights, dynamic LED tube batons, and cyan laser ceiling canopy',
      recommendedDressCode: 'Futuristic Chic / Metallic accents & LED accessories',
      curatedMusicPlaylists: ['Synthwave Dreams', 'Cyberpunk 2077 Night Mix', 'Future Electro House'],
    };
  }

  switch (eventType) {
    case 'wedding':
      return {
        name: 'Romantic Botanical Elegance',
        primary: '#be185d',
        secondary: '#f59e0b',
        accent: '#10b981',
        background: 'linear-gradient(135deg, #1c1326 0%, #2b1834 100%)',
        vibeDescription: 'Lush English garden florals, floating candlelight cloches, and timeless champagne accents.',
        lightingStyle: 'Dimmable warm amber Edison filaments, pin-spots on floral centerpieces, fairy light ceiling',
        recommendedDressCode: 'Black-Tie Optional / Floor-length gowns & sharp midnight-blue tuxedos',
        curatedMusicPlaylists: ['Classical String Quartet arrangements of pop hits', 'Bossa Nova Sunset Lounge', 'Upbeat Brass Funk Celebration'],
      };

    case 'corporate':
    case 'hackathon':
      return {
        name: 'Silicon Summit Horizon',
        primary: '#2563eb',
        secondary: '#06b6d4',
        accent: '#10b981',
        background: 'linear-gradient(135deg, #0b132b 0%, #1c2541 100%)',
        vibeDescription: 'Sleek geometric stage portals, dynamic LED column tickers, and energetic modern innovation.',
        lightingStyle: 'Clean cool white key-lights, energetic moving-head spot beams, illuminated branding wash',
        recommendedDressCode: 'Business Elevated / Smart tailoring with tech-inspired sneakers',
        curatedMusicPlaylists: ['Deep Minimal Tech Focus', 'Lo-Fi Coding Beats', 'Modern Indie Electro Uplift'],
      };

    case 'birthday':
    case 'milestone':
      return {
        name: 'Golden Hour Sunset Glamour',
        primary: '#f59e0b',
        secondary: '#ec4899',
        accent: '#8b5cf6',
        background: 'linear-gradient(135deg, #24142e 0%, #3a1c3a 100%)',
        vibeDescription: 'Warm sunset gradients, mirrored discoball reflections, and opulent velvet lounge styling.',
        lightingStyle: 'Warm amber uplighting, moving kaleidoscope discoballs, custom neon script monograms',
        recommendedDressCode: 'Festive Cocktail Glam / Bold jewel tones and shimmering party silhouettes',
        curatedMusicPlaylists: ['Nu-Disco Euphoria', 'Top 40 Remixes', 'Classic 80s & 90s Anthems'],
      };

    case 'baby_shower':
      return {
        name: 'Whimsical Cloud Meadow',
        primary: '#06b6d4',
        secondary: '#f472b6',
        accent: '#34d399',
        background: 'linear-gradient(135deg, #16243b 0%, #24294d 100%)',
        vibeDescription: 'Soft pastel pampas grass clouds, macrame arches, and gentle comforting morning ambiance.',
        lightingStyle: 'Diffused daylight mimicry, delicate fairy curtain backdrops, soft lantern glow',
        recommendedDressCode: 'Garden Casual / Pastel linen suits, floral tea dresses, and neutral knits',
        curatedMusicPlaylists: ['Acoustic Folk Coffeehouse', 'Gentle Indie Chillout', 'Soft Instrumental Piano'],
      };

    default:
      return {
        name: 'Starlight Midnight Gala',
        primary: '#6366f1',
        secondary: '#f59e0b',
        accent: '#ec4899',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1e38 100%)',
        vibeDescription: 'Starry night canopy, rich navy velour drapery, and polished brass sculptural pieces.',
        lightingStyle: 'Gobo projection starry starfield, low-fog haze with violet-blue wash',
        recommendedDressCode: 'Formal Eveningwear / Sharp dinner jackets and couture gowns',
        curatedMusicPlaylists: ['Modern Jazz standards', 'Chill Lounge Deep Grooves', 'Late-night Soul'],
      };
  }
}

/**
 * Generates an initial roster of top-tier vendor partners with realistic costs and initial statuses.
 *
 * @param eventType The celebration category.
 * @param totalBudget The overall event budget used to apportion vendor fee allocations.
 * @returns Array of VendorItem objects.
 *
 * @example
 * ```ts
 * const vendors = generateVendors('corporate', 50000);
 * console.log(`Lead venue partner: ${vendors[0].companyName}`);
 * ```
 */
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

/**
 * Synthesizes realistic initial guest records populated with dietary requirements and table assignments.
 *
 * @param guestCount Total target attendee count.
 * @returns Array of Guest objects ready for seating and RSVP management.
 *
 * @example
 * ```ts
 * const guests = generateInitialGuests(80);
 * console.log(`Seeded guest count: ${guests.length}`);
 * ```
 */
export function generateInitialGuests(guestCount: number): Guest[] {
  const sampleNames = [
    { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', dietary: 'Vegetarian', plusOnes: 1 },
    { name: 'Ananya Patel', email: 'ananya.p@example.com', dietary: 'Gluten-Free', plusOnes: 1 },
    { name: 'Marcus Sterling', email: 'marcus.s@example.com', dietary: 'Standard', plusOnes: 0 },
    { name: 'Elena Rostova', email: 'elena.rostova@example.com', dietary: 'Vegan', plusOnes: 1 },
    { name: 'David Kim', email: 'david.k@example.com', dietary: 'Nut Allergy', plusOnes: 0 },
    { name: 'Priya Iyer', email: 'priya.iyer@example.com', dietary: 'Vegetarian', plusOnes: 2 },
    { name: 'Carlos Mendez', email: 'carlos.m@example.com', dietary: 'Standard', plusOnes: 1 },
    { name: 'Chloe Dubois', email: 'chloe.d@example.com', dietary: 'Pescatarian', plusOnes: 0 },
    { name: 'Liam O’Connor', email: 'liam.oc@example.com', dietary: 'Standard', plusOnes: 1 },
    { name: 'Fatima Al-Mansoor', email: 'fatima.m@example.com', dietary: 'Halal', plusOnes: 1 },
    { name: 'Zackary Vance', email: 'zack.v@example.com', dietary: 'Keto / Low Carb', plusOnes: 0 },
    { name: 'Maya Lin', email: 'maya.lin@example.com', dietary: 'Vegan', plusOnes: 1 },
  ];

  const totalToSeed = Math.min(guestCount, 8);
  const statuses: Guest['rsvpStatus'][] = ['confirmed', 'confirmed', 'pending', 'confirmed', 'declined', 'confirmed'];

  return sampleNames.slice(0, totalToSeed).map((person, idx) => ({
    id: `guest-${idx + 1}`,
    name: person.name,
    email: person.email,
    dietary: person.dietary,
    tableNumber: Math.floor(idx / 4) + 1,
    rsvpStatus: statuses[idx % statuses.length],
    plusOnes: person.plusOnes,
    notes: idx === 0 ? 'VIP - Keynote speaker / close relative' : undefined,
  }));
}

/**
 * Creates a curated multi-course culinary menu addressing all declared dietary restrictions.
 *
 * @param eventType Celebration type.
 * @param dietary Array of active dietary restriction tags (e.g. ['Vegetarian', 'Vegan', 'Gluten-Free']).
 * @returns Array of MenuItem objects covering starters, mains, desserts, and beverages.
 *
 * @example
 * ```ts
 * const menu = generateMenu('wedding', ['Vegetarian', 'Gluten-Free']);
 * console.log(`First course: ${menu[0].name}`);
 * ```
 */
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

/**
 * Drafts 4 distinct stylistic variations of stationery and digital invitations (Elegant, Playful, Formal, Poetic).
 *
 * @param title Event title.
 * @param eventType Celebration type.
 * @param date ISO date or formatted date of the gathering.
 * @param venueType Type of venue setting (e.g. 'indoor', 'rooftop', 'outdoor').
 * @returns Array of InvitationDraft objects.
 *
 * @example
 * ```ts
 * const drafts = generateInvitations('Summit 2026', 'corporate', '2026-11-20', 'indoor');
 * console.log(`Headline: ${drafts[0].headline}`);
 * ```
 */
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

/**
 * Instantiates a rich, production-ready default EventPlan showcasing all system capabilities.
 *
 * @returns Fully populated EventPlan instance.
 *
 * @example
 * ```ts
 * const defaultPlan = createDefaultEventPlan();
 * console.log(`Default event: ${defaultPlan.title}`);
 * ```
 */
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
