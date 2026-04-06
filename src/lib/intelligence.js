/**
 * intelligence.js — Local "smart" logic for NetTrack.
 *
 * Everything here runs 100% offline with zero API keys.
 * Uses deterministic hashing so the same contact always
 * generates the same insight (no flickering on re-render).
 */

// ─── Deterministic helpers ────────────────────────────────────────────────────

/** djb2 hash — turns a string into a stable number */
function hash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i)
    h |= 0 // keep it 32-bit
  }
  return Math.abs(h)
}

/** Pick a stable item from an array using a numeric seed */
function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length]
}

// ─── Industry Detection ───────────────────────────────────────────────────────

const INDUSTRY_PATTERNS = [
  { re: /capital|invest|fund|equity|hedge|venture|vc|asset|banking|financ|trading|goldman|morgan|jp\s*morgan|citi|wall\s*street|analyst.*financ/i, label: 'Finance' },
  { re: /tech|software|engineer|developer|data\s*science|ai |machine\s*learn|cyber|cloud|saas|startup|labs?|systems/i, label: 'Technology' },
  { re: /consult|mckinsey|bain|bcg|deloitte|kpmg|pwc|accenture|advisory|strategy\s*&/i, label: 'Consulting' },
  { re: /law|legal|attorney|counsel|llp|litigation|corporate\s*law/i, label: 'Law' },
  { re: /medical|health|pharma|biotech|hospital|clinic|bio\s*med|research\s*sci|genomic|drug/i, label: 'Healthcare' },
  { re: /market|brand|advertis|media|pr\b|public\s*relation|communicat|content\s*strat/i, label: 'Marketing & Media' },
  { re: /real\s*estate|property|realty|mortgage|reit|commercial\s*real/i, label: 'Real Estate' },
  { re: /nonprofit|ngo|foundation|charity|social\s*impact|501c/i, label: 'Non-Profit' },
  { re: /education|school|university|college|teach|academ|tutor|curriculum/i, label: 'Education' },
  { re: /government|policy|public\s*sector|federal|municipal|congressional/i, label: 'Government' },
]

/**
 * Detect the industry of a connection.
 * Uses the explicit `industry` field first, then falls back to
 * keyword matching across company name, position, and tags.
 */
export function detectIndustry(conn) {
  if (conn.industry && conn.industry.trim()) return conn.industry.trim()
  const text = [conn.company, conn.position, ...(conn.tags ?? [])].join(' ')
  for (const { re, label } of INDUSTRY_PATTERNS) {
    if (re.test(text)) return label
  }
  return 'General Business'
}

// ─── Activity Insights ────────────────────────────────────────────────────────
// Curated, realistic-sounding sector activity blurbs.
// A deterministic hash of company+id selects one consistently.

const ACTIVITIES = {
  Finance: [
    'Active M&A deal flow in the sector this quarter.',
    'Firms expanding analyst and associate hiring pipelines.',
    'Private equity dry powder at record highs — deal flow picking up.',
    'ESG-focused funds reshaping portfolio construction strategies.',
    'Increased IPO activity creating new career opportunities.',
    'Restructuring mandates up as interest rates stabilize.',
    'Credit markets showing increased activity after a quiet period.',
    'Alternative asset managers growing AUM faster than traditional firms.',
  ],
  Technology: [
    'AI adoption accelerating across enterprise clients.',
    'Surge in hiring for software engineers and product managers.',
    'VC funding rebounding in B2B SaaS and infrastructure.',
    'Major cloud providers announcing expanded partnership programs.',
    'Cybersecurity spending at record highs as threats increase.',
    'Generative AI tools reshaping team workflows and hiring.',
    'Developer tools and infrastructure seeing renewed investment.',
    'Platform consolidation creating new leadership opportunities.',
  ],
  Consulting: [
    'Digital transformation projects driving new client mandates.',
    'Firms expanding strategy and operations practices.',
    'Post-merger integration work picking up this quarter.',
    'Demand for data analytics talent commanding a premium.',
    'New practice areas forming around AI strategy and deployment.',
    'Lateral hiring across top firms creating significant movement.',
    'Clients investing heavily in supply chain and risk resilience.',
    'Sustainability and ESG consulting in high demand.',
  ],
  Law: [
    'Regulatory shifts driving increased advisory demand.',
    'M&A transaction volume picking up in key sectors.',
    'IP and data privacy practices growing at a rapid pace.',
    'Firms expanding associate classes in corporate practices.',
    'Cross-border deal complexity increasing year-over-year.',
    'Litigation activity up in financial and technology industries.',
    'Employment law and executive compensation practices busy.',
    'Antitrust scrutiny intensifying across major industries.',
  ],
  Healthcare: [
    'Biotech sector seeing renewed investor and deal interest.',
    'Hospital networks investing in digital health platforms.',
    'Drug approval pipeline busier than prior quarters.',
    'Healthcare AI startups attracting significant funding.',
    'Value-based care models reshaping provider strategies.',
    'Genomics and personalized medicine gaining commercial traction.',
    'Remote patient monitoring becoming a standard of care.',
    'Medtech companies partnering with software firms at record pace.',
  ],
  'Marketing & Media': [
    'Brands shifting budgets heavily toward digital channels.',
    'Agency consolidation creating new senior opportunities.',
    'Short-form video content dominating engagement benchmarks.',
    'First-party data strategy becoming a core competitive differentiator.',
    'AI tools transforming content production workflows.',
    'Streaming and podcast ad spend growing at double-digit rates.',
    'Influencer marketing maturing into a structured industry.',
    'Brand purpose and authenticity driving consumer preference.',
  ],
  'Real Estate': [
    'Commercial real estate adapting to hybrid work patterns.',
    'Industrial and logistics properties in exceptionally high demand.',
    'Interest rate stabilization creating new buyer windows.',
    'PropTech investment picking up after a consolidation period.',
    'Data center demand surging due to AI infrastructure buildout.',
    'Multifamily residential resilient despite broader market softness.',
    'Mixed-use development emerging as a key urban strategy.',
    'Institutional investors rotating into alternative property types.',
  ],
  'Non-Profit': [
    'Foundation grant cycles opening for the upcoming fiscal year.',
    'Social impact investing gaining mainstream institutional attention.',
    'Corporate partnerships with non-profits accelerating.',
    'Federal funding shifts creating new programmatic opportunities.',
    'Community-focused organizations scaling their programs nationally.',
    'Donor engagement platforms enabling new fundraising strategies.',
    'Capacity-building grants prioritized by major foundations.',
    'Advocacy organizations seeing renewed public engagement.',
  ],
  Education: [
    'Online learning platforms continuing to expand global enrollment.',
    'Universities investing in alumni network and career services.',
    'EdTech funding recovering after a 2-year consolidation period.',
    'AI policy discussions reshaping curriculum across institutions.',
    'International student enrollment reaching near-record highs.',
    'Credential programs and bootcamps growing in employer recognition.',
    'Student mental health and support services expanding.',
    'Research funding for STEM disciplines at a 10-year high.',
  ],
  Government: [
    'New infrastructure and clean energy funding creating opportunities.',
    'Public sector digital transformation underway across agencies.',
    'Government contracting activity at elevated levels.',
    'Fellowship and internship programs opening for applications.',
    'Inter-agency collaboration on AI and technology initiatives.',
    'Policy changes in key sectors affecting regulated industries.',
    'National security and defense investment increasing.',
    'State and local governments hiring for technology and policy roles.',
  ],
  'General Business': [
    'Business activity and hiring picking up across the sector.',
    'Networking events and industry conferences returning to capacity.',
    'Cross-industry collaborations creating new opportunities.',
    'Leadership transitions at many firms opening new paths.',
    'Strong labor market driving career mobility.',
    'Professional development programs in high demand.',
    'Industry associations hosting key events this season.',
    'Mentorship and sponsorship conversations gaining momentum.',
  ],
}

/**
 * Generate a realistic, consistent industry activity insight for a connection.
 */
export function getActivityInsight(conn) {
  const industry = detectIndustry(conn)
  const templates = ACTIVITIES[industry] ?? ACTIVITIES['General Business']
  const seed = hash(`${conn.company ?? ''}::${conn.id}`)
  return pick(templates, seed)
}

// ─── Opportunity Scoring ──────────────────────────────────────────────────────

/**
 * Score a connection from 0–100 based on:
 *   - Days since last contact (longer = higher priority)
 *   - Follow-up date proximity (overdue or soon = boost)
 *   - Connection strength (strong connections worth maintaining)
 */
export function getOpportunityScore(conn) {
  let score = 25 // base

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // ── Days since last contact ──
  if (conn.last_contact) {
    const [y, m, d] = conn.last_contact.split('-').map(Number)
    const last = new Date(y, m - 1, d)
    const daysSince = Math.floor((today - last) / 86_400_000)
    if      (daysSince > 120) score += 32
    else if (daysSince > 90)  score += 26
    else if (daysSince > 60)  score += 20
    else if (daysSince > 30)  score += 13
    else if (daysSince > 14)  score += 7
    else                      score += 2
  } else {
    score += 22 // never reached out — high priority to make first contact
  }

  // ── Follow-up date ──
  if (conn.follow_up_date) {
    const [y, m, d] = conn.follow_up_date.split('-').map(Number)
    const fu = new Date(y, m - 1, d)
    const daysTo = Math.floor((fu - today) / 86_400_000)
    if      (daysTo < 0)   score += 32 // overdue
    else if (daysTo <= 1)  score += 28
    else if (daysTo <= 3)  score += 22
    else if (daysTo <= 7)  score += 15
    else if (daysTo <= 14) score += 8
  }

  // ── Connection strength ──
  if      (conn.strength === 'strong') score += 14
  else if (conn.strength === 'medium') score += 7

  return Math.min(score, 100)
}

/** Return "Hot", "Warm", or "Cold" based on score */
export function getOpportunityLabel(score) {
  if (score >= 72) return 'Hot'
  if (score >= 45) return 'Warm'
  return 'Cold'
}

// ─── Why Reach Out Now ────────────────────────────────────────────────────────

/**
 * Generate the most relevant single reason to reach out to a contact right now.
 * Returns a plain string suitable for display.
 */
export function getReachOutReason(conn) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const candidates = []

  // Follow-up date logic
  if (conn.follow_up_date) {
    const [y, m, d] = conn.follow_up_date.split('-').map(Number)
    const fu = new Date(y, m - 1, d)
    const daysTo = Math.floor((fu - today) / 86_400_000)
    if (daysTo < 0)
      candidates.push({ p: 100, text: `Your follow-up was due ${Math.abs(daysTo)} day${Math.abs(daysTo) !== 1 ? 's' : ''} ago — reach out before it slips further.` })
    else if (daysTo === 0)
      candidates.push({ p: 99, text: 'Your follow-up is scheduled for today.' })
    else if (daysTo <= 2)
      candidates.push({ p: 95, text: `Follow-up in ${daysTo} day${daysTo !== 1 ? 's' : ''} — time to prepare your message.` })
    else if (daysTo <= 7)
      candidates.push({ p: 85, text: `Follow-up due in ${daysTo} days — a good time to get ahead of it.` })
  }

  // Last contact recency
  if (conn.last_contact) {
    const [y, m, d] = conn.last_contact.split('-').map(Number)
    const last = new Date(y, m - 1, d)
    const days = Math.floor((today - last) / 86_400_000)
    if (days > 120)
      candidates.push({ p: 80, text: `It's been ${days} days — relationships cool off without contact. A quick note re-opens the door.` })
    else if (days > 90)
      candidates.push({ p: 72, text: `Over 3 months since your last conversation. A timely check-in keeps the connection alive.` })
    else if (days > 60)
      candidates.push({ p: 60, text: `It's been about 2 months — a brief update shows you value the relationship.` })
    else if (days > 30)
      candidates.push({ p: 45, text: `About a month since last contact — a natural cadence for a quick check-in.` })
  } else {
    candidates.push({ p: 62, text: `You haven't reached out to ${conn.full_name.split(' ')[0]} yet — an introduction email is the highest-leverage first step.` })
  }

  // Strength-based tips
  if (conn.strength === 'strong')
    candidates.push({ p: 38, text: 'Strong connections benefit most from consistent, proactive check-ins — don\'t let this one go cold.' })
  if (conn.strength === 'weak')
    candidates.push({ p: 35, text: 'Nurturing this connection now, before you need it, is the most effective strategy.' })
  if (conn.strength === 'medium')
    candidates.push({ p: 30, text: 'Medium-strength connections can become strong ones with just a little consistent attention.' })

  candidates.sort((a, b) => b.p - a.p)
  return candidates[0]?.text ?? 'Staying consistently in touch keeps your network warm and accessible.'
}

// ─── Suggested Outreach Messages ──────────────────────────────────────────────

const OPENERS = {
  'School/Class':        n => `Hi ${n}, hope your semester is going well!`,
  'Internship':          n => `Hi ${n}, hope things have been great since we worked together!`,
  'Networking Event':    n => `Hi ${n}, it was great connecting at the networking event!`,
  'Conference':          n => `Hi ${n}, I really enjoyed our conversation at the conference!`,
  'Cold Email':          n => `Hi ${n}, I wanted to follow up on my earlier note —`,
  'LinkedIn':            n => `Hi ${n}, we connected on LinkedIn and I wanted to reach out properly.`,
  'Club/Activity':       n => `Hi ${n}, great working alongside you through our shared activities!`,
  'Family/Friend Intro': n => `Hi ${n}, I think it's been a little while since we were first introduced!`,
  'Job Fair':            n => `Hi ${n}, I really enjoyed speaking with you at the job fair!`,
  'Social Media':        n => `Hi ${n}, I came across your work online and have been meaning to reach out.`,
  default:               n => `Hi ${n}, I hope you've been doing well!`,
}

const MIDDLES = {
  Finance:           (c) => `I've been following some interesting developments in investment and finance, and${c ? ` your work at ${c}` : ' your background'} came to mind.`,
  Technology:        (c) => `I've been working on some projects in the tech space, and the things happening at ${c || 'your company'} are genuinely exciting.`,
  Consulting:        (c) => `I've been thinking a lot about strategy and problem-solving careers, and${c ? ` the work at ${c}` : ' your experience'} is exactly the direction I'm interested in.`,
  Law:               (c) => `I've been exploring legal career paths, and the practice at ${c || 'your firm'} is one I've had on my radar.`,
  Healthcare:        (c) => `I've been reading a lot about healthcare and life sciences, and the work at ${c || 'your organization'} is genuinely impressive.`,
  'Marketing & Media':(c) => `I've been following some exciting shifts in media and marketing, and your perspective from ${c || 'your role'} would be invaluable.`,
  'Non-Profit':      (c) => `The work that ${c || 'your organization'} is doing has really stood out to me, and I'd love to learn more.`,
  Education:         (c) => `I've been thinking about the future of education, and your experience at ${c || 'your institution'} is something I'd love to hear more about.`,
  Government:        (c) => `I've been increasingly interested in public policy, and your experience in the sector is very relevant to questions I've been exploring.`,
  default:           (c) => `I've been reflecting on my career direction, and${c ? ` your experience at ${c}` : ' your background'} is something I'd love to learn more about.`,
}

const CTAS = [
  'Would you have 15–20 minutes for a quick call sometime soon? I\'d really value your perspective.',
  'I\'d love to catch up — would you be open to a brief call or coffee chat?',
  'Any chance you\'d be open to a short conversation? I have a few questions I think you\'d have great insight on.',
  'I\'d love to hear what you\'ve been working on. Would you be up for a quick call?',
  'If you have 15 minutes, I\'d love the chance to connect — even a short conversation would be really meaningful.',
]

/**
 * Generate a professional, personalized outreach message for a connection.
 * The message is stable for the same contact (same seed = same CTA).
 */
export function getSuggestedMessage(conn) {
  const firstName = conn.full_name?.split(' ')[0] ?? conn.full_name
  const industry = detectIndustry(conn)

  const openerFn = OPENERS[conn.where_met] ?? OPENERS.default
  const middleFn = MIDDLES[industry] ?? MIDDLES.default

  const opener = openerFn(firstName)
  const middle = middleFn(conn.company)
  const cta = pick(CTAS, hash(`${conn.id}::${conn.full_name ?? ''}`))

  return `${opener}\n\n${middle}\n\n${cta}\n\nBest,\n[Your Name]`
}
