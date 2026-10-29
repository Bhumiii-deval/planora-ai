import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI if key is present
const rawApiKey = process.env.GEMINI_API_KEY;
const isGeminiConfigured = Boolean(rawApiKey && rawApiKey.trim() !== '' && rawApiKey !== 'MY_GEMINI_API_KEY');

let ai: GoogleGenAI | null = null;
if (isGeminiConfigured && rawApiKey) {
  ai = new GoogleGenAI({
    apiKey: rawApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const configured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    aiEnabled: configured,
    message: configured
      ? 'Gemini 3.8 Flash is ready for celebration planning.'
      : 'Gemini API key is not configured. Planora will use its built-in celebration intelligence engine.',
  });
});

// Heuristic fallback generator for rich, localized celebration plans
function generateHeuristicPlan(input: any) {
  const {
    eventType = 'birthday',
    customEventType = '',
    eventTitle = 'Celebration',
    eventDate = '',
    budgetInr = 50000,
    guestCount = 30,
    city = 'Mumbai',
    venuePreference = 'indoor',
    themeStyle = 'Modern Chic',
    dietaryPreference = 'all',
    specialRequirements = '',
  } = input;

  const budget = Math.max(5000, Number(budgetInr) || 50000);
  const guests = Math.max(2, Number(guestCount) || 20);

  // Category percentage allocations tailored to event type
  let foodPct = 0.35;
  let venuePct = 0.20;
  let decorPct = 0.15;
  let photoPct = 0.10;
  let cakePct = 0.05;
  let musicPct = 0.08;
  let miscPct = 0.07;

  if (eventType === 'wedding') {
    foodPct = 0.38;
    venuePct = 0.25;
    decorPct = 0.15;
    photoPct = 0.12;
    cakePct = 0.02;
    musicPct = 0.05;
    miscPct = 0.03;
  } else if (eventType === 'birthday') {
    foodPct = 0.32;
    venuePct = 0.18;
    decorPct = 0.18;
    cakePct = 0.08;
    photoPct = 0.08;
    musicPct = 0.08;
    miscPct = 0.08;
  } else if (eventType === 'corporate') {
    foodPct = 0.40;
    venuePct = 0.30;
    decorPct = 0.08;
    photoPct = 0.08;
    cakePct = 0.02;
    musicPct = 0.07;
    miscPct = 0.05;
  }

  const items = [
    {
      id: 'cat-catering',
      category: 'Food & Beverage / Catering',
      title: `${dietaryPreference === 'jain' ? 'Strict Jain & Satvik' : dietaryPreference === 'veg' ? 'Pure Vegetarian Gourmet' : 'Multi-Cuisine Buffet & Mocktails'} for ${guests} guests`,
      percentage: Math.round(foodPct * 100),
      estimatedCost: Math.round(budget * foodPct),
      note: `Approx. ₹${Math.round((budget * foodPct) / guests).toLocaleString('en-IN')}/guest. Includes welcome drink, starters, main course & live counter.`,
    },
    {
      id: 'cat-venue',
      category: 'Venue & Space Hire',
      title: `${venuePreference === 'outdoor' ? 'Open-Air Lawn or Terrace' : venuePreference === 'home' ? 'Home/Clubhouse Decor Setup' : 'Boutique Banquet Hall or Rooftop'} in ${city}`,
      percentage: Math.round(venuePct * 100),
      estimatedCost: Math.round(budget * venuePct),
      note: 'Covers rental, air conditioning/lighting power backup, and basic service staffing.',
    },
    {
      id: 'cat-decor',
      category: 'Decor, Backdrop & Floral Styling',
      title: `${themeStyle || 'Curated'} Themed Photo Backdrop & Table Centerpieces`,
      percentage: Math.round(decorPct * 100),
      estimatedCost: Math.round(budget * decorPct),
      note: 'LED neon signage, ambient warm fairy lights, organic balloon arch or floral pedestals.',
    },
    {
      id: 'cat-photo',
      category: 'Photography & Videography',
      title: 'Candid Event Photographer (3-4 hours)',
      percentage: Math.round(photoPct * 100),
      estimatedCost: Math.round(budget * photoPct),
      note: 'Digital album delivery (50-100 retouched images) + fast social media highlight reel.',
    },
    {
      id: 'cat-cake',
      category: 'Celebration Cake & Dessert Table',
      title: `${eventType === 'wedding' ? 'Tiered Artisan Fondant Cake' : 'Signature Custom Theme Cake (2-3 kg)'} + Mini Sweet Bites`,
      percentage: Math.round(cakePct * 100),
      estimatedCost: Math.round(budget * cakePct),
      note: 'Customized topper, fresh flavor pairing, and matching pastry/cupcake platter.',
    },
    {
      id: 'cat-entertainment',
      category: 'Sound, DJ & Entertainment',
      title: 'Acoustic / DJ Sound System & Party Playlist Host',
      percentage: Math.round(musicPct * 100),
      estimatedCost: Math.round(budget * musicPct),
      note: 'PA sound box, wireless microphones for toasts/speeches, ambient background jazz/party tracks.',
    },
    {
      id: 'cat-misc',
      category: 'Emergency Buffer & Favors',
      title: 'Return Gifts / Favors & Contingency Reserve',
      percentage: Math.round(miscPct * 100),
      estimatedCost: Math.round(budget * miscPct),
      note: 'Keepsake thank-you gifts + a safety reserve for last-minute tips, ice, or guest additions.',
    },
  ];

  const totalAllocated = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const remaining = budget - totalAllocated;

  // Theming & Colors
  const palettesByTheme: Record<string, { name: string; hex: string }[]> = {
    royal: [
      { name: 'Royal Purple', hex: '#6B21A8' },
      { name: 'Deep Gold', hex: '#EAB308' },
      { name: 'Warm Cream', hex: '#FEF9C3' },
      { name: 'Rich Plum', hex: '#4C1D95' },
    ],
    lavender: [
      { name: 'Soft Lavender', hex: '#DDD6FE' },
      { name: 'Pastel Lilac', hex: '#C084FC' },
      { name: 'Pearl Cream', hex: '#FAF5FF' },
      { name: 'Amethyst Violet', hex: '#7E22CE' },
    ],
    boho: [
      { name: 'Terracotta Rust', hex: '#C2410C' },
      { name: 'Sage Green', hex: '#84CC16' },
      { name: 'Oatmeal Beige', hex: '#FDFBF7' },
      { name: 'Dusty Rose', hex: '#F472B6' },
    ],
  };

  const selectedPalette = themeStyle.toLowerCase().includes('royal')
    ? palettesByTheme.royal
    : themeStyle.toLowerCase().includes('boho')
    ? palettesByTheme.boho
    : palettesByTheme.lavender;

  // Checklist
  const checklist = [
    {
      id: 'chk-1',
      milestone: '6-8 Weeks Before' as const,
      task: `Finalize venue booking and lock date in ${city}`,
      details: `Confirm guest capacity (${guests} pax), parking, and air conditioning/weather backup.`,
      completed: false,
      category: 'Venue',
    },
    {
      id: 'chk-2',
      milestone: '6-8 Weeks Before' as const,
      task: `Send digital Save-the-Date invites`,
      details: 'Create a WhatsApp animated card or Google RSVP form to track confirmations early.',
      completed: false,
      category: 'Guest List',
    },
    {
      id: 'chk-3',
      milestone: '3-4 Weeks Before' as const,
      task: `Finalize catering menu & dietary preferences (${dietaryPreference})`,
      details: 'Confirm tasting session, starter count, live counter items, and ice/soft drink quantities.',
      completed: false,
      category: 'Catering',
    },
    {
      id: 'chk-4',
      milestone: '3-4 Weeks Before' as const,
      task: `Book photographer & discuss shot list`,
      details: 'Share must-have family portraits, cake cutting angles, and group candid requests.',
      completed: false,
      category: 'Media',
    },
    {
      id: 'chk-5',
      milestone: '1-2 Weeks Before' as const,
      task: `Order custom ${themeStyle} cake & dessert table`,
      details: 'Confirm delivery timing (2 hours before event start) and flavor specifications.',
      completed: false,
      category: 'Cake',
    },
    {
      id: 'chk-6',
      milestone: '1-2 Weeks Before' as const,
      task: 'Confirm final headcount with venue and caterer',
      details: 'Lock in plate counts with a ±10% buffer to avoid unexpected food shortages or surcharges.',
      completed: false,
      category: 'Catering',
    },
    {
      id: 'chk-7',
      milestone: '1-2 Days Before' as const,
      task: 'Assemble return gifts / favors and print guest seating/welcome signage',
      details: 'Pack thank-you favors and assign one person to manage the gift reception table.',
      completed: false,
      category: 'Logistics',
    },
    {
      id: 'chk-8',
      milestone: 'Day of Event' as const,
      task: 'Venue walkthrough 2 hours prior to start',
      details: 'Test sound system/mic, inspect cake delivery refrigeration, and verify floral freshness.',
      completed: false,
      category: 'Coordination',
    },
    {
      id: 'chk-9',
      milestone: 'Day of Event' as const,
      task: 'Relax, celebrate, and enjoy your memorable milestone!',
      details: 'Designate a trusted friend or sibling for vendor payouts so you remain stress-free.',
      completed: false,
      category: 'General',
    },
  ];

  // Personalized ideas
  const personalizedIdeas = [
    {
      category: 'Theme & Aesthetic' as const,
      title: `${themeStyle || 'Chic Celebration'} Visual Storyboard`,
      description: `Incorporate subtle lavender and warm gold uplighting with a photo wall displaying milestone memories. ${specialRequirements ? `Accommodating: "${specialRequirements}".` : ''}`,
      badge: 'Visual Anchor',
    },
    {
      category: 'Food & Beverage' as const,
      title: `Interactive Live Refreshment Bar`,
      description: `Feature signature welcome coolers (such as Sparkling Lychee Basil & Kokum Spritz) and a live chaat/tapas counter suited for ${guests} guests in ${city}.`,
      badge: 'Guest Favorite',
    },
    {
      category: 'Guest Experience' as const,
      title: 'Digital Polaroid Memory Wall & Audio Guestbook',
      description: 'Set up an instant camera station where guests clip polaroids with handwritten wishes on fairy-light strings.',
      badge: 'Interactive',
    },
    {
      category: 'Budget Hack' as const,
      title: `Smart Vendor Bundling in ${city}`,
      description: `Bundle venue lighting with DJ equipment from a single vendor to save approx. 12-18% on duplicate transit and coordination charges.`,
      badge: 'Save ₹3,000 - ₹8,000',
    },
    {
      category: 'Entertainment' as const,
      title: 'Curated 4-Hour Ambient & Party Playlist',
      description: 'Transition smoothly from mellow acoustic melodies during dinner to upbeat celebration tracks for toasts and dancing.',
      badge: 'Music Flow',
    },
  ];

  // Schedule highlights
  const scheduleHighlights = [
    { time: '05:30 PM', activity: 'Decor & Vendor Setup Inspection', notes: 'Sound check, lighting balance & cake arrival' },
    { time: '06:30 PM', activity: 'Guest Arrival & Welcome Mocktails', notes: 'Soft background music & photo backdrop' },
    { time: '07:30 PM', activity: 'Main Celebration Ceremony / Toasts', notes: 'Cake cutting, speech or celebration moment' },
    { time: '08:15 PM', activity: 'Dinner Buffet Opening & Mingling', notes: 'Warm ambient lighting & active live food stations' },
    { time: '09:45 PM', activity: 'Farewells & Return Favors', notes: 'Family photos and wrap-up' },
  ];

  return {
    planId: 'plan_' + Date.now().toString(36),
    createdAt: new Date().toISOString(),
    inputs: input,
    eventConcept: {
      themeName: `${themeStyle || 'Bespoke Modern'} ${eventType.toUpperCase()}`,
      tagline: `An unforgettable ${eventType} celebration for ${guests} loved ones in ${city}`,
      colorPalette: selectedPalette,
      vibeDescription: `A thoughtfully crafted celebration balancing elegance, joyful hospitality, and seamless guest comfort within your ₹${budget.toLocaleString('en-IN')} budget.`,
      venueSuggestion: `${venuePreference === 'outdoor' ? 'Lawn or Open Terrace Garden' : venuePreference === 'home' ? 'Intimate Private Residence / Society Hall' : 'Modern Boutique Banquet / Lounge'} in ${city}`,
      dressCodeSuggestion: 'Smart Casual / Semi-Formal with accents of lilac or pastels',
    },
    budgetBreakdown: {
      totalBudget: budget,
      allocatedBudget: totalAllocated,
      remainingBuffer: remaining,
      perGuestEstimate: Math.round(budget / guests),
      items,
      pricingDisclaimer:
        'IMPORTANT: Estimated costs are based on current market averages in India. Real vendor quotations vary according to exact seasonal demand, location accessibility, and specific menu choices. Never treat these as finalized binding quotations.',
    },
    checklist,
    personalizedIdeas,
    scheduleHighlights,
    generatedBy: 'heuristic' as const,
    aiModelUsed: 'Planora Intelligence Engine (Rule-based heuristics)',
    aiNote: isGeminiConfigured
      ? undefined
      : 'Note: Generated with Planora’s localized calculation engine. To enable real-time Gemini 3.8 Flash AI custom generation, ensure GEMINI_API_KEY is saved in Settings > Secrets.',
  };
}

// Plan Event Endpoint
app.post('/api/plan-event', async (req, res) => {
  try {
    const input = req.body;
    if (!input || !input.eventType || !input.budgetInr || !input.guestCount) {
      return res.status(400).json({ error: 'Missing required fields: eventType, budgetInr, guestCount' });
    }

    // If Gemini is available, attempt real generation with Gemini 3.8 Flash
    if (ai) {
      try {
        const prompt = `
You are Planora AI, an elite, highly knowledgeable Indian event planner.
Generate a deeply tailored, comprehensive celebration and event plan based on these user specifications:

- Event Type: ${input.eventType} (${input.customEventType || ''})
- Event Title: ${input.eventTitle || 'Celebration'}
- Event Date: ${input.eventDate || 'Upcoming'}
- Total Budget: INR ₹${Number(input.budgetInr).toLocaleString('en-IN')}
- Number of Guests: ${input.guestCount}
- City / Location: ${input.city || 'India'}
- Venue Preference: ${input.venuePreference || 'indoor'}
- Preferred Theme / Style: ${input.themeStyle || 'Modern Festive'}
- Dietary Preference: ${input.dietaryPreference || 'all'}
- Special Requirements & Notes: ${input.specialRequirements || 'None'}

Provide a realistic INR budget breakdown where the sum of allocated items matches or is comfortably within the total budget.
Ensure realistic per-person catering rates for India (e.g., ₹400-₹1800/plate depending on budget tier and city).
All costs MUST be explicitly marked as estimates.
Return a structured JSON following the exact schema.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are a professional luxury and budget-conscious event planner specializing in Indian and global celebrations. You produce precise, realistic budget allocations in INR, actionable checklists with deadlines, and creative event concepts. Always emphasize that costs are unverified estimates.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                eventConcept: {
                  type: Type.OBJECT,
                  properties: {
                    themeName: { type: Type.STRING },
                    tagline: { type: Type.STRING },
                    colorPalette: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          hex: { type: Type.STRING },
                        },
                        required: ['name', 'hex'],
                      },
                    },
                    vibeDescription: { type: Type.STRING },
                    venueSuggestion: { type: Type.STRING },
                    dressCodeSuggestion: { type: Type.STRING },
                  },
                  required: ['themeName', 'tagline', 'colorPalette', 'vibeDescription', 'venueSuggestion'],
                },
                budgetBreakdown: {
                  type: Type.OBJECT,
                  properties: {
                    totalBudget: { type: Type.NUMBER },
                    allocatedBudget: { type: Type.NUMBER },
                    remainingBuffer: { type: Type.NUMBER },
                    perGuestEstimate: { type: Type.NUMBER },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          category: { type: Type.STRING },
                          title: { type: Type.STRING },
                          percentage: { type: Type.NUMBER },
                          estimatedCost: { type: Type.NUMBER },
                          note: { type: Type.STRING },
                        },
                        required: ['id', 'category', 'title', 'percentage', 'estimatedCost', 'note'],
                      },
                    },
                    pricingDisclaimer: { type: Type.STRING },
                  },
                  required: ['totalBudget', 'allocatedBudget', 'remainingBuffer', 'perGuestEstimate', 'items', 'pricingDisclaimer'],
                },
                checklist: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      milestone: { type: Type.STRING },
                      task: { type: Type.STRING },
                      details: { type: Type.STRING },
                      category: { type: Type.STRING },
                    },
                    required: ['id', 'milestone', 'task'],
                  },
                },
                personalizedIdeas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      badge: { type: Type.STRING },
                    },
                    required: ['category', 'title', 'description'],
                  },
                },
                scheduleHighlights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      activity: { type: Type.STRING },
                      notes: { type: Type.STRING },
                    },
                    required: ['time', 'activity', 'notes'],
                  },
                },
              },
              required: ['eventConcept', 'budgetBreakdown', 'checklist', 'personalizedIdeas', 'scheduleHighlights'],
            },
          },
        });

        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          const fullPlan = {
            planId: 'plan_' + Date.now().toString(36),
            createdAt: new Date().toISOString(),
            inputs: input,
            eventConcept: parsed.eventConcept,
            budgetBreakdown: {
              ...parsed.budgetBreakdown,
              pricingDisclaimer:
                parsed.budgetBreakdown?.pricingDisclaimer ||
                'DISCLAIMER: All amounts are unverified market estimates in INR. Actual vendor quotations vary by availability, season, and contract terms.',
            },
            checklist: (parsed.checklist || []).map((c: any, index: number) => ({
              ...c,
              id: c.id || `chk-${index + 1}`,
              completed: false,
            })),
            personalizedIdeas: parsed.personalizedIdeas || [],
            scheduleHighlights: parsed.scheduleHighlights || [],
            generatedBy: 'gemini' as const,
            aiModelUsed: 'gemini-3.8-flash',
          };
          return res.json(fullPlan);
        }
      } catch (geminiError: any) {
        console.warn('Gemini generation error, falling back to heuristic engine:', geminiError?.message);
        // Fall through to heuristic fallback
      }
    }

    // Heuristic fallback if Gemini not configured or experienced an issue
    const heuristicPlan = generateHeuristicPlan(input);
    return res.json(heuristicPlan);
  } catch (error: any) {
    console.error('API Error in /api/plan-event:', error);
    res.status(500).json({ error: error.message || 'Internal server error while planning event' });
  }
});

// Setup Vite Dev or Production Static Handler
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Planora AI Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
