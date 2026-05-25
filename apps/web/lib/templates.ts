import {
  Scissors,
  Landmark,
  Heart,
  Home,
  Stethoscope,
  UtensilsCrossed,
  MessageCircle,
  Sparkles,
  Database,
  Wand2,
  CreditCard,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  Mail,
  FileText,
  Truck,
} from 'lucide-react';
import type { Template } from './types';

/**
 * The 6 launch templates for Prune AI.
 *
 * These are the *product* in the MVP. Each is a fully-specified AI assistant
 * ready to deploy in 5 minutes — pre-wired with WhatsApp, M-Pesa, and the
 * appropriate knowledge sources for its vertical.
 *
 * To add a template, append here AND add a corresponding workflow JSON in
 * packages/workflow-nodes/templates/.
 */
export const TEMPLATES: Template[] = [
  // ─── SALON BOOKING ────────────────────────────────────────────
  {
    slug: 'salon-booking',
    name: 'Salon Booking Assistant',
    icon: Scissors,
    tone: 'amber',
    vertical: 'Beauty & Salons',
    business: 'Asha Salon',
    avatar: 'A',
    description:
      "Customers WhatsApp your salon to book — and the assistant handles it end-to-end: shows your services, offers available slots, takes an M-Pesa deposit, and sends a confirmation.",
    shortDesc:
      'Books appointments via WhatsApp, takes M-Pesa deposits, sends reminders.',
    tags: ['bookings', 'payments', 'multilingual'],
    capabilities: [
      { title: 'Show services & pricing', desc: 'Pulls from your knowledge base' },
      { title: 'Check availability', desc: 'Real-time from your calendar' },
      { title: 'Take M-Pesa deposit', desc: 'STK push, confirmation, receipt' },
      { title: 'Send reminders', desc: '24h and 2h before appointment' },
      { title: 'Reschedule & cancel', desc: 'No call needed' },
      { title: 'Switch English/Swahili', desc: 'Auto-detect language' },
    ],
    workflow: [
      { type: 'trigger', icon: MessageCircle, label: 'WA message' },
      { type: 'ai',      icon: Sparkles,      label: 'Intent' },
      { type: 'data',    icon: Database,      label: 'Services KB' },
      { type: 'ai',      icon: Wand2,         label: 'Reply' },
      { type: 'payment', icon: CreditCard,    label: 'M-Pesa STK' },
      { type: 'data',    icon: CalendarDays,  label: 'Calendar' },
    ],
    suggestions: [
      'Naomba kubook braids weekend',
      'How much for cornrows?',
      'Can I cancel Saturday?',
    ],
    seedMessages: [
      { dir: 'in',  text: 'Hi! Looking to book braids this Saturday',           time: '10:42 AM' },
      { dir: 'out', text: 'Habari! 💇 Box braids on Saturday — we have 10am, 2pm, or 5pm available. Deposit is KES 500 via M-Pesa to confirm. Saa gani inakufaa?', time: '10:42 AM' },
    ],
    responses: {
      booking:
        'Sawa! Sending STK push for KES 500 deposit to your number now. Please enter your M-Pesa PIN to confirm. Your slot is held for 5 minutes.',
      pricing:
        "Here's our menu:\n• Box braids — KES 2,500\n• Cornrows — KES 1,200\n• Twist out — KES 1,800\n• Hair wash + style — KES 800\n\nWould you like to book any of these?",
      cancel:
        'No worries! Which booking would you like to cancel? Please share your name or the date/time of the appointment.',
      default:
        'I can help you with bookings, pricing, or rescheduling. What would you like to do today?',
    },
    integrations: ['whatsapp', 'mpesa', 'google-calendar'],
  },

  // ─── SACCO SUPPORT ────────────────────────────────────────────
  {
    slug: 'sacco-support',
    name: 'SACCO Support Bot',
    icon: Landmark,
    tone: 'green',
    vertical: 'Financial Services',
    business: 'Jenga SACCO',
    avatar: 'J',
    description:
      "Members WhatsApp your SACCO for loan inquiries, balance checks, contribution status, and FAQs — with secure verification and clean handoff to officers for sensitive cases.",
    shortDesc:
      'Handles loan inquiries, balance checks, and FAQs for SACCO members securely.',
    tags: ['support', 'multilingual'],
    capabilities: [
      { title: 'Loan eligibility check', desc: 'Based on contribution history' },
      { title: 'Member verification',    desc: 'Multi-factor, never asks for PIN' },
      { title: 'Balance & statements',   desc: 'On-demand mini-statements' },
      { title: 'Contribution reminders', desc: 'Scheduled by membership tier' },
      { title: 'Loan calculator',        desc: 'Interest, term, monthly repayment' },
      { title: 'Officer escalation',     desc: 'When sensitive or complex' },
    ],
    workflow: [
      { type: 'trigger', icon: MessageCircle, label: 'WA message' },
      { type: 'ai',      icon: ShieldCheck,   label: 'Verify member' },
      { type: 'data',    icon: Database,      label: 'CRM lookup' },
      { type: 'ai',      icon: Wand2,         label: 'Reply' },
      { type: 'logic',   icon: AlertTriangle, label: 'Escalate?' },
    ],
    suggestions: [
      "What's my loan balance?",
      'How do I apply for a loan?',
      'I want to speak to an officer',
    ],
    seedMessages: [
      { dir: 'in',  text: 'Habari, naomba kujua status ya loan yangu',         time: '09:15 AM' },
      { dir: 'out', text: "Habari! 🙏 To check your loan status securely, please share your member number (e.g. JNS-1234). I won't ever ask for your PIN or password.", time: '09:15 AM' },
    ],
    responses: {
      loan:
        'Based on your contribution record, you qualify for a loan up to KES 240,000 at 12% p.a. for up to 36 months. Would you like to start an application? An officer will be assigned to guide you.',
      balance:
        'Your current loan balance is KES 87,500 with KES 12,500 paid this month. Next installment of KES 8,200 is due on the 15th. Would you like a full statement?',
      pricing:
        'Our loan rates depend on type:\n• Personal — 12% p.a.\n• Emergency — 10% p.a.\n• School fees — 8% p.a.\n• Business — 14% p.a.\n\nAll for up to 36 months.',
      human:
        "I'll connect you with a loans officer. Your spot in queue is #3 — average wait is 4 minutes. Stay on this chat and they'll join shortly.",
      default:
        'I can help with: loan inquiries, balance checks, contribution status, or officer handoff. What do you need?',
    },
    integrations: ['whatsapp', 'openai'],
  },

  // ─── CHURCH FOLLOW-UP ─────────────────────────────────────────
  {
    slug: 'church-followup',
    name: 'Church Follow-Up Bot',
    icon: Heart,
    tone: 'violet',
    vertical: 'Faith Community',
    business: 'Mavuno Hill',
    avatar: 'M',
    description:
      'Warmly welcome first-time visitors, collect prayer requests, share service times, register people for events, and send weekly devotionals — without losing the personal touch.',
    shortDesc:
      'Welcomes visitors, collects prayer requests, registers for events, sends devotionals.',
    tags: ['lead-capture', 'multilingual'],
    capabilities: [
      { title: 'Welcome new visitors',  desc: 'Personalized after first service' },
      { title: 'Prayer request intake', desc: 'Routed to prayer team' },
      { title: 'Event registration',    desc: 'Service, conferences, retreats' },
      { title: 'Weekly devotional',     desc: 'Opt-in, sent Wednesday mornings' },
      { title: 'Service time queries',  desc: 'Locations, languages, kids' },
      { title: 'Pastoral handoff',      desc: 'For sensitive conversations' },
    ],
    workflow: [
      { type: 'trigger', icon: MessageCircle, label: 'WA message' },
      { type: 'ai',      icon: Sparkles,      label: 'Intent' },
      { type: 'data',    icon: CalendarDays,  label: 'Events' },
      { type: 'ai',      icon: Heart,         label: 'Pastoral reply' },
      { type: 'data',    icon: Mail,          label: 'Add to list' },
    ],
    suggestions: [
      'I visited last Sunday',
      "I'd like prayer for my family",
      'When is the next service?',
    ],
    seedMessages: [
      { dir: 'in',  text: 'Hi, I came to your service yesterday for the first time', time: '08:30 AM' },
      { dir: 'out', text: "Karibu sana! 🙏 We're so blessed you joined us. May I know your name? I'd love to make sure our team welcomes you properly next Sunday.", time: '08:30 AM' },
    ],
    responses: {
      visit:
        "That's wonderful! 🙏 Pastor James would love to greet you personally next Sunday. We have services at 8am (English), 10am (Swahili), and 4pm (Youth). Which time works for you? Also — would you like to receive our weekly devotional?",
      prayer:
        "Thank you for sharing this with us 💝 Your request is being sent to our prayer team, and we'll pray for you this week. Would you like a pastor to reach out personally? Everything you share is confidential.",
      service:
        'Our service times this Sunday:\n\n⛪ 8:00 AM — English\n⛪ 10:00 AM — Swahili\n⛪ 4:00 PM — Youth service\n\nLocation: Mavuno Hill, off Mombasa Rd. Kids ministry runs at all services. Karibu!',
      default:
        'Karibu! 🙏 I can help with: service times, prayer requests, event registration, or connecting you with a pastor. What can I help with today?',
    },
    integrations: ['whatsapp', 'gmail', 'google-calendar'],
  },

  // ─── REAL ESTATE INQUIRY ──────────────────────────────────────
  {
    slug: 'realestate-inquiry',
    name: 'Real Estate Inquiry Bot',
    icon: Home,
    tone: 'blue',
    vertical: 'Real Estate',
    business: 'Pacific Place',
    avatar: 'P',
    description:
      'Capture leads from your listings on Property24, Jumia, OLX. Qualify by budget, location, and intent. Schedule viewings, share floor plans, and hand warm leads to your agent.',
    shortDesc:
      'Qualifies leads, shares listings, books viewings, hands warm leads to agents.',
    tags: ['lead-capture', 'bookings'],
    capabilities: [
      { title: 'Qualify by budget',      desc: 'KES range, payment plan' },
      { title: 'Filter by location',     desc: 'Westlands, Karen, Kilimani' },
      { title: 'Send floor plans',       desc: 'Direct to WhatsApp' },
      { title: 'Schedule viewings',      desc: 'Synced to agent calendar' },
      { title: 'Financing pre-screen',   desc: 'Mortgage vs cash vs SACCO' },
      { title: 'Agent handoff',          desc: 'Only warm leads reach humans' },
    ],
    workflow: [
      { type: 'trigger', icon: MessageCircle, label: 'WA message' },
      { type: 'ai',      icon: Sparkles,      label: 'Qualify lead' },
      { type: 'data',    icon: Home,          label: 'Listings DB' },
      { type: 'ai',      icon: FileText,      label: 'Send brochure' },
      { type: 'data',    icon: CalendarDays,  label: 'Book viewing' },
    ],
    suggestions: [
      '2-bedroom in Westlands',
      "What's your payment plan?",
      'Can I view this weekend?',
    ],
    seedMessages: [
      { dir: 'in',  text: 'Looking for a 2 bedroom apartment in Westlands', time: '14:22 PM' },
      { dir: 'out', text: 'Great choice — Westlands is hot right now 🏘️ A few quick questions to find the right place:\n\n1️⃣ Budget range (KES/month or purchase)?\n2️⃣ Move-in / occupancy date?\n3️⃣ Any must-haves (parking, gym, balcony)?', time: '14:22 PM' },
    ],
    responses: {
      bedroom:
        'I have 4 properties matching your criteria in Westlands:\n\n🏘️ Westgate Apts — 2BR · KES 95k/mo\n🏘️ Riverside Sq — 2BR · KES 110k/mo\n🏘️ The Mirage — 2BR · KES 85k/mo\n🏘️ Le Mac Residences — 2BR · KES 125k/mo\n\nWant me to send brochures + viewing slots?',
      viewing:
        "Perfect! Available viewing slots this weekend:\n📅 Sat — 10am, 2pm\n📅 Sun — 11am, 3pm\n\nWhich works for you? I'll send the agent's details and Google Maps pin once confirmed.",
      payment:
        'We offer flexible payment plans:\n💳 12-month installments (10% deposit)\n💳 24-month installments (15% deposit, 4% premium)\n💳 Cash purchase — 8% discount\n🏦 KCB, NCBA, and Stanbic mortgages available\n\nWhich would you like to explore?',
      default:
        'I can help with: property search, viewings, payment plans, or connecting you to an agent. What are you looking for?',
    },
    integrations: ['whatsapp', 'google-calendar', 'google-drive'],
  },

  // ─── CLINIC BOOKING ───────────────────────────────────────────
  {
    slug: 'clinic-booking',
    name: 'Clinic Booking Assistant',
    icon: Stethoscope,
    tone: 'teal',
    vertical: 'Healthcare',
    business: 'Lifecare Clinic',
    avatar: 'L',
    description:
      'Patients book appointments, request prescription refills, and get reminders — with strict guardrails around medical advice and clear emergency escalation paths.',
    shortDesc:
      'Books appointments, sends reminders, never diagnoses, escalates emergencies.',
    tags: ['bookings', 'multilingual'],
    capabilities: [
      { title: 'Book appointments',    desc: 'GP, dental, optical, pediatric' },
      { title: 'Prescription refills', desc: 'For repeat patients only' },
      { title: 'Appointment reminders', desc: '24h before, with directions' },
      { title: 'Emergency escalation',  desc: 'Calls clinic immediately' },
      { title: 'Never diagnoses',       desc: 'Strict no-medical-advice policy' },
      { title: 'Insurance check',       desc: 'NHIF, AAR, Jubilee, etc.' },
    ],
    workflow: [
      { type: 'trigger', icon: MessageCircle, label: 'WA message' },
      { type: 'logic',   icon: AlertTriangle, label: 'Emergency?' },
      { type: 'ai',      icon: Sparkles,      label: 'Intent' },
      { type: 'data',    icon: CalendarDays,  label: 'Calendar' },
      { type: 'ai',      icon: Wand2,         label: 'Confirm' },
    ],
    suggestions: [
      'Need to see a doctor tomorrow',
      'I need a prescription refill',
      'My child has fever',
    ],
    seedMessages: [
      { dir: 'in',  text: 'Need to see a doctor tomorrow morning', time: '16:08 PM' },
      { dir: 'out', text: 'Of course 🏥 I can book you in. Quick check:\n\n1. Is this an emergency? (chest pain, severe bleeding, difficulty breathing)\n2. Which department — GP, dental, pediatric, optical?\n3. Do you have insurance (NHIF, AAR, Jubilee, etc.)?', time: '16:08 PM' },
    ],
    responses: {
      emergency:
        "🚨 This sounds urgent. Please call our emergency line immediately: 0700-123-456. Or go to the nearest hospital ER. I'm alerting our team now so they're ready when you arrive.",
      book:
        'I have these slots tomorrow with Dr. Mwangi (GP):\n📅 09:00, 10:30, 14:00, 16:00\n\nAll are 30-min slots. Walk-in fee is KES 1,500 or covered by NHIF/AAR. Which time works?',
      refill:
        "For prescription refills, I need to verify you're an existing patient. Please share your patient number (e.g. LC-12345) — never share details like your ID number.\n\nFor a new prescription, you'll need to see the doctor.",
      child:
        "I understand this is concerning. ⚠️ If your child has fever above 39°C, won't drink, is very sleepy, or has difficulty breathing — please go to ER immediately. For non-urgent, our pediatrician has slots at 9am, 11am, 3pm tomorrow.",
      default:
        'I can help with: booking appointments, prescription refills (existing patients), or directing emergencies. What do you need? In emergencies, call 0700-123-456.',
    },
    integrations: ['whatsapp', 'google-calendar', 'openai'],
  },

  // ─── RESTAURANT ORDERING ──────────────────────────────────────
  {
    slug: 'restaurant-ordering',
    name: 'Restaurant Ordering Assistant',
    icon: UtensilsCrossed,
    tone: 'rose',
    vertical: 'Food & Beverage',
    business: "Mama Oliech's",
    avatar: 'M',
    description:
      'Take orders directly on WhatsApp — menu, recommendations, dietary filters, M-Pesa payment, delivery coordination. Works for restaurants, dark kitchens, and bakeries.',
    shortDesc:
      'Takes orders on WhatsApp, calculates total, processes M-Pesa, coordinates delivery.',
    tags: ['bookings', 'payments'],
    capabilities: [
      { title: 'Show menu & specials',  desc: 'With prices & photos' },
      { title: 'Dietary filters',       desc: 'Vegetarian, halal, gluten-free' },
      { title: 'Recommend pairings',    desc: 'AI suggests based on order' },
      { title: 'M-Pesa payment',        desc: 'STK push at checkout' },
      { title: 'Delivery / pickup',     desc: 'Bolt Food, Glovo, or own rider' },
      { title: 'Order tracking',        desc: 'Live ETA updates' },
    ],
    workflow: [
      { type: 'trigger', icon: MessageCircle,  label: 'WA message' },
      { type: 'ai',      icon: Sparkles,        label: 'Build order' },
      { type: 'data',    icon: UtensilsCrossed, label: 'Menu KB' },
      { type: 'payment', icon: CreditCard,      label: 'M-Pesa' },
      { type: 'data',    icon: Truck,           label: 'Dispatch' },
    ],
    suggestions: [
      'Two chapati and beef stew',
      "What's today's special?",
      'Do you have vegetarian options?',
    ],
    seedMessages: [
      { dir: 'in',  text: 'Two chapatis and beef stew please', time: '12:34 PM' },
      { dir: 'out', text: 'Twende! Adding to your order 🍽️\n\n• 2 × Chapati — KES 60\n• 1 × Beef stew — KES 450\n\n*Subtotal: KES 510*\n\nAnything else? Tea, juice, dessert? Where are we delivering to today?', time: '12:34 PM' },
    ],
    responses: {
      order:
        "Order received! 🛵 Here's the breakdown:\n\n• 2 × Chapati — KES 60\n• 1 × Beef stew — KES 450\n• Delivery (Westlands) — KES 150\n\n*Total: KES 660*\n\nSending M-Pesa STK push now. ETA: 35 minutes after payment.",
      special:
        "Today's specials:\n\n🌟 Nyama choma platter — KES 1,200 (serves 2)\n🌟 Tilapia + ugali — KES 600\n🌟 Pilau ya nyama — KES 450\n🌟 Fresh dawa juice — KES 200\n\nDelivery is 30-45 min. What can I add to your order?",
      vegetarian:
        'Yes! Our vegetarian dishes:\n\n🌱 Veggie samosa (3 pcs) — KES 150\n🌱 Sukuma wiki & ugali — KES 280\n🌱 Maharage ya nazi — KES 320\n🌱 Veg pilau — KES 380\n🌱 Mango mtuzi — KES 350\n\nAll halal-friendly. What sounds good?',
      default:
        "Karibu Mama Oliech's! 🍽️ I can show you the menu, take your order, or update you on delivery. What's good with you today?",
    },
    integrations: ['whatsapp', 'mpesa', 'google-maps'],
  },
];

export function getTemplate(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

// Simple keyword router used by the mock chat API and inline chat preview.
// In production this is replaced by the workflow engine + Claude API.
export function pickResponse(template: Pick<Template, 'slug' | 'responses'>, input: string): string {
  const low = input.toLowerCase();
  const r = template.responses;

  switch (template.slug) {
    case 'salon-booking':
      if (/book|braid|saturday|sunday|appointment|slot/.test(low)) return r.booking;
      if (/price|cost|how much|charge|menu/.test(low)) return r.pricing;
      if (/cancel|reschedule/.test(low)) return r.cancel;
      break;
    case 'sacco-support':
      if (/loan/.test(low) && /balance|status/.test(low)) return r.balance;
      if (/loan|borrow/.test(low)) return r.loan;
      if (/rate|interest|price/.test(low)) return r.pricing;
      if (/officer|human|person|speak/.test(low)) return r.human;
      break;
    case 'church-followup':
      if (/visit|came|first|new/.test(low)) return r.visit;
      if (/pray|prayer/.test(low)) return r.prayer;
      if (/service|time|when|sunday/.test(low)) return r.service;
      break;
    case 'realestate-inquiry':
      if (/2\s*bed|2br|2 bedroom|3\s*bed|apartment|house/.test(low)) return r.bedroom;
      if (/view|visit|see/.test(low)) return r.viewing;
      if (/payment|mortgage|finance|deposit|installment/.test(low)) return r.payment;
      break;
    case 'clinic-booking':
      if (/emergency|chest pain|bleed|can.?t breathe|severe/.test(low)) return r.emergency;
      if (/child|fever|baby|kid/.test(low)) return r.child;
      if (/prescription|refill|medicine|drug/.test(low)) return r.refill;
      if (/book|doctor|appointment|tomorrow|see/.test(low)) return r.book;
      break;
    case 'restaurant-ordering':
      if (/chapati|stew|beef|ugali|order|deliver/.test(low)) return r.order;
      if (/special|today/.test(low)) return r.special;
      if (/veg|vegetar|halal|vegan/.test(low)) return r.vegetarian;
      break;
  }
  return r.default;
}
