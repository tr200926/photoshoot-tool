# AI CREATIVE ENGINE
## Project Constitution
### Core Principles & Decision-Making Framework

**Document Version:** 1.0  
**Date:** March 1, 2026  
**Status:** Approved

---

## 1. MISSION STATEMENT

**Mission:** Democratize professional product photography for e-commerce brands by building an AI-powered platform that turns simple product images into high-converting lifestyle creatives in minutes, not weeks.

**Vision:** Become the standard infrastructure for creative automation in e-commerce, serving 150,000+ brands globally and enabling a new category of AI-driven marketing operations.

---

## 2. CORE VALUES

### 2.1 Speed & Efficiency
**Definition:** Deliver results faster than any existing alternative (traditional photography, competitors)

**Principle:**
- Time-to-delivery is a core metric; every feature prioritizes speed
- Processing time <90 seconds should be non-negotiable
- Favor real-time feedback over batch processing
- Eliminate unnecessary steps in user workflows

**Why it Matters:** Brands need results fast; slow tools get abandoned

---

### 2.2 Quality & Reliability
**Definition:** Output quality and system reliability are non-negotiable

**Principle:**
- Image quality score must be >4.2/5 (user ratings)
- Generation success rate ≥98% (failures logged for improvement)
- Uptime SLA 99.9% (max 43 min/month downtime)
- Better to say "no" than deliver poor-quality output

**Why it Matters:** Poor quality erodes trust; one bad experience = one lost customer

---

### 2.3 Simplicity First
**Definition:** Make complex AI technology feel simple and accessible

**Principle:**
- No machine learning jargon exposed to users
- Clear, action-oriented interface (not feature-rich, but intuitive)
- Onboarding should take <5 minutes
- Obvious error messages (not technical)
- "Make it simpler" is always a valid objection to new features

**Why it Matters:** Target users aren't AI experts; complexity is friction

---

### 2.4 Data-Driven Decision Making
**Definition:** All major decisions backed by data, experiments, or user research

**Principle:**
- Before launching a feature, validate it with customers (interviews, surveys, beta testing)
- A/B test pricing changes, UI changes, feature flags
- Track KPIs obsessively; let data guide roadmap priorities
- "I think so" is not sufficient; show the data

**Why it Matters:** Prevents building features users don't want; saves time and money

---

### 2.5 Agency-First, SaaS-Second
**Definition:** Optimize for agency use cases first; SaaS features follow

**Principle:**
- Agency features (white-label, APIs, bulk processing) are first-class
- Agency partnerships drive revenue reliability (sticky customers)
- Build moat through integrations agencies depend on
- SaaS volume is secondary revenue stream (higher churn, lower LTV)

**Why it Matters:** Agency customers have 5-10x higher LTV; fund growth better

---

### 2.6 Modularity & Extensibility
**Definition:** Build as microservices that can integrate with larger AI agents/systems

**Principle:**
- Loosely coupled architecture (swap AI providers, add new features without refactoring)
- API-first design (everything available to integrations, not just UI)
- Abstraction layers over external dependencies (not locked-in to one provider)
- Design for future integration with AI marketing OS

**Why it Matters:** Prevents vendor lock-in; future-proofs the platform

---

### 2.7 Transparency & Trust
**Definition:** Be honest about AI limitations; build trust through transparency

**Principle:**
- Never hide that images are AI-generated (FTC compliance + brand trust)
- Clear disclosure options for users
- Never use customer images for model training without explicit permission
- Privacy-first (GDPR/CCPA from day 1)
- Public roadmap, public status page, transparent pricing

**Why it Matters:** Regulatory compliance + brand reputation; users need to trust us

---

## 3. NON-NEGOTIABLES

### Technical Non-Negotiables

| Requirement | Why Non-Negotiable |
|---|---|
| **99.9% Uptime SLA** | One outage erodes trust; agencies depend on reliability |
| **TLS 1.3 Encryption (in transit)** | Customer data must be secure |
| **AES-256 Encryption (at rest)** | Prevent data breaches that destroy company |
| **GDPR/CCPA Compliance** | Legal requirement; regulatory fines catastrophic |
| **API Access** | Agencies demand programmatic workflows |
| **Shopify Integration** | E-commerce brands won't use tools outside their ecosystem |
| **Background Removal Accuracy >95%** | Core feature; poor quality = refunds + churn |
| **Generation Speed <90 seconds** | Slower = abandoned (users expect real-time) |

### Product Non-Negotiables

| Requirement | Why Non-Negotiable |
|---|---|
| **Free Tier** | Freemium is our primary acquisition channel |
| **White-Label Option** | Agency differentiation + stickiness |
| **Multi-Format Export (1:1, 4:5, 9:16)** | Ads requirement; not having formats = 0 value |
| **Manual Refinement Tools** | Users need to adjust AI outputs; perfection is enemy |
| **Asset Management/History** | Brands need to organize + reuse creatives |
| **Performance Metrics/Analytics** | Data-driven creative optimization is the moat |

### Organizational Non-Negotiables

| Requirement | Why Non-Negotiable |
|---|---|
| **Customer Interviews (Monthly)** | Stay grounded in real user problems |
| **Transparent Roadmap** | Customers need visibility; prevents feature waste |
| **Unit Economics Review (Monthly)** | CAC, LTV, churn tracking prevents burn-out |
| **Code Quality (80%+ test coverage)** | Sloppy code = technical debt = slow shipping |
| **Security Audits (Annual)** | Breach = company-ending event |

---

## 4. DECISION-MAKING FRAMEWORK

### 4.1 Feature Prioritization Matrix

**Evaluate new features using this framework:**

```
IMPACT vs. EFFORT

High Impact / Low Effort → DO FIRST (Quick wins)
High Impact / High Effort → PLAN (Major initiatives)
Low Impact / Low Effort  → DO LAST (Nice-to-haves)
Low Impact / High Effort → REJECT (Resource waste)

Example:
- "Bulk processing" = High Impact / Medium Effort → DO FIRST
- "Dark mode UI" = Low Impact / Low Effort → DO LAST
- "Multi-channel ad automation" = High Impact / High Effort → PLAN FOR V2
- "Advanced color calibration" = Low Impact / High Effort → REJECT
```

**Additionally, ask:**
1. **Does it solve a customer problem?** (No = don't build)
2. **Is there evidence of demand?** (Multiple customers requesting? = yes)
3. **Does it align with roadmap?** (Strategic priority = yes)
4. **Can we ship it in <2 weeks?** (If no, break it down smaller)

---

### 4.2 Trade-Off Guidelines

**When trade-offs arise, prioritize in this order:**

1. **Customer Outcomes > Internal Efficiency**
   - Spend extra engineering time if it makes users happier
   - Example: Manual image refinement (complex) > no refinement (easy but unhappy users)

2. **Quality > Speed**
   - Don't ship broken features to hit deadlines
   - Better to delay 1 week than ship and refund

3. **Retention > Growth**
   - Keeping existing customers > acquiring new ones
   - Fix churn issues before building new features

4. **Revenue Reliability > Revenue Growth**
   - Predictable agency revenue > volatile consumer volume
   - Long-term partnerships > flash sales

5. **Foundation > Flashy Features**
   - Stable infrastructure > new features
   - Example: Invest in scalability before "creative testing automation"

---

### 4.3 Saying No

**Default answer is "no"** unless it meets these criteria:

- ✅ Solves core customer problem (not nice-to-have)
- ✅ Aligned with current roadmap phase
- ✅ Evidence of customer demand (not speculation)
- ✅ Fits within current engineering capacity
- ✅ Doesn't distract from higher-priority work

**Common "no" scenarios:**
- "Can we add feature X?" → No, unless top 3 customer ask
- "Can we support 10 image formats?" → No, 3 formats are enough
- "Can we white-label for this small customer?" → No, focus on tier 1 agencies
- "Can we build a mobile app?" → No, web-responsive is sufficient for V1-V2

---

## 5. GUARDRAILS & CONSTRAINTS

### What We Will NOT Do

1. **Use customer images for model training** without explicit opt-in
2. **Build generic AI image generation tool** (we are specialist, not competitor to DALL-E)
3. **Support 50+ environments** (5 presets is sweet spot for quality + simplicity)
4. **Ship features without user validation** (no building in vacuum)
5. **Sacrifice uptime for feature launches** (reliability > new features)
6. **Enter unproven verticals** (focus on e-commerce initially)
7. **Build features for <5% of user base** (avoid feature sprawl)

### What We WILL Prioritize

1. **Agency partnerships** as primary growth lever
2. **Integration with Shopify, Meta, Google Ads** (where our users live)
3. **Performance metrics & analytics** (data-driven creative = moat)
4. **White-label options** (sticky, high-margin revenue)
5. **API-first architecture** (future-proof, agency-friendly)
6. **Speed & reliability** (non-negotiables above all)

---

## 6. SUCCESS CRITERIA BY PHASE

### Phase 1: MVP (Q2 2026) - Product-Market Fit
**Success Defined By:**
- ✅ 500+ users sign up (demand proof)
- ✅ 10%+ free-to-paid conversion (willingness to pay)
- ✅ 4.2+/5 quality rating (core product works)
- ✅ <1% 30-day active churn (users stick around)
- ✅ $30K MRR (sustainable unit economics)

**Definition of Success:** Users rave about the tool; they tell others without asking

---

### Phase 2: Scale (Q3-Q4 2026) - Agency Dominance
**Success Defined By:**
- ✅ 5,000+ MAU
- ✅ 5-10 white-label agency customers ($5K+ MRR each)
- ✅ $150K MRR
- ✅ Agency NPS >50 (strong satisfaction)
- ✅ Agency churn <2% monthly (sticky)

**Definition of Success:** Agencies recommend us to peers; word-of-mouth referrals

---

### Phase 3: Expansion (2027+) - Platform Play
**Success Defined By:**
- ✅ 25,000+ MAU
- ✅ Become default tool for e-commerce creative production
- ✅ $1M+ MRR
- ✅ $15+ LTV:CAC ratio
- ✅ 20%+ net dollar retention (upsells working)

**Definition of Success:** Investors pursue us; acquisition interest from platforms (Shopify, Meta)

---

## 7. OPERATING PRINCIPLES

### 7.1 Speed & Iteration
- **2-week sprints** with real deployment cadence
- **Friday releases** to users (small batches, not big bang)
- **Fail fast:** Kill experiments quickly if not working
- **No roadmap carved in stone:** Adapt based on customer feedback

### 7.2 Ownership & Accountability
- **One owner per feature** (clear decision-maker, not design-by-committee)
- **Transparent OKRs** (quarterly goals, shared visibility)
- **Blameless post-mortems** on failures (focus on systems, not individuals)
- **Decision logs** for major decisions (why we chose X over Y)

### 7.3 Communication
- **Async-first:** Written docs over meetings
- **Weekly standups** (15 min max) for synchronization
- **Public roadmap + status updates** (transparency builds trust)
- **No surprises:** Escalate issues early, not late

### 7.4 Customer Obsession
- **Every team member talks to customers monthly** (sales, ops, engineering)
- **Customer advisory board** (top 5-10 accounts provide feedback)
- **NPS tracking** (target >50, investigate <0)
- **Closed loop feedback:** All feature ideas from customers tracked + fed back

### 7.5 Data-Driven Culture
- **Metrics dashboard** (real-time KPIs visible to all)
- **Product analytics instrumentation** on day 1 (not bolted on later)
- **A/B testing as default** (test pricing, copy, UI changes)
- **Confidence thresholds** (don't act on noise, require statistical significance)

---

## 8. CONTINGENCY PRINCIPLES

### If We're Wrong About Market Demand

**Action:**
1. Kill MVP early (don't keep burning cash on dead product)
2. Pivot to adjacent opportunity (same tech, different market)
3. Focus on highest-revenue vertical (narrow, not broaden)
4. Talk to customers obsessively (why didn't you use it?)

**Timeline:** Decide by Q3 2026 (6 months in)

---

### If Competitors Out-Execute Us

**Action:**
1. Lock in users with integrations (Shopify, APIs, white-label)
2. Focus on vertical specialization (own one category vs. generic)
3. Double down on speed + reliability (our moat)
4. Acquire customer data (build performance prediction model)

**Timeline:** Continuous monitoring; response within 1 month

---

### If AI Model Quality Deteriorates

**Action:**
1. Immediately switch to backup provider (DALL-E, Midjourney)
2. Increase manual QA (flag low-quality outputs)
3. Refund unhappy customers (protect brand trust)
4. Invest in own fine-tuned model (long-term independence)

**Timeline:** Contingency plan in place before launch

---

### If We Run Out of Runway

**Action:**
1. Cut to 5 core features (ruthless prioritization)
2. Focus on highest-monetizing segment (enterprise/agencies first)
3. Reduce headcount to 3-4 core engineers (lean execution)
4. Seek acquirer (if not on path to profitability)

**Timeline:** Monitor cash runway monthly; trigger if <12 months

---

## 9. TEAM PRINCIPLES

### Who We Hire
- **Problem solvers over resume builders** (can they ship?)
- **Generalists over specialists** (wear many hats in startup)
- **Customer-obsessed** (care about user outcomes, not just code)
- **Bias toward action** (make decisions with incomplete info)

### How We Work
- **Radical transparency** (no hidden information; everyone knows financials, metrics, priorities)
- **Flat hierarchy** (ideas win on merit, not seniority)
- **Ownership mindset** (treated like founder, even as employee)
- **Continuous learning** (invest in growth; $1K/person/year learning budget)

### What We Celebrate
- **Customer wins** (users succeeding with our tool)
- **Learning from failures** (shared openly, not hidden)
- **Speed to execution** (shipping fast beats planning perfectly)
- **Feedback loops** (pushing back on bad ideas is valued)

---

## 10. EVOLUTION OF CONSTITUTION

**This document is NOT frozen.** It can be updated when:
- **Quarterly reviews** (Jan, Apr, Jul, Oct)
- **After major learning** (new customer insights, market shift)
- **By team consensus** (not unilateral change)

**Process:**
1. Propose change with rationale
2. Discuss with team (async-first)
3. Document decision + reasoning
4. Update constitution + commit to git

**Supersede previous version by:**
- Dating new version
- Summarizing what changed + why
- Archiving old version (keep history)

---

## APPENDIX A: QUICK REFERENCE

**When in doubt, ask:**

1. **Does this solve a real customer problem?** → If no, don't do it
2. **Is there evidence of demand?** → If no, validate first
3. **Can we ship in 2 weeks?** → If no, break it down
4. **Does it align with Phase N roadmap?** → If no, defer
5. **Does it protect/improve our moat?** → If no, lower priority
6. **Is it good for retention?** → If yes, prioritize
7. **Would we refund a customer if it failed?** → If yes, ensure quality

---

## APPENDIX B: CORE METRICS DASHBOARD

**These are the metrics we watch obsessively:**

```
ACQUISITION:
├─ Monthly signups
├─ Free-to-paid conversion rate
└─ CAC (cost per acquisition)

ENGAGEMENT:
├─ Monthly Active Users (MAU)
├─ Weekly Active Users (WAU)
├─ Avg creatives generated per user/month
└─ Asset library growth

RETENTION:
├─ 30-day churn rate
├─ NPS (Net Promoter Score)
└─ LTV (lifetime value)

REVENUE:
├─ MRR (monthly recurring revenue)
├─ ARPU (average revenue per user)
├─ Gross margin
└─ LTV:CAC ratio (target >5:1)

PRODUCT:
├─ Generation success rate (target >98%)
├─ Average generation time (target <90s)
├─ Image quality score (target >4.2/5)
└─ Support ticket volume

OPERATIONS:
├─ Uptime % (target 99.9%)
├─ API response time p95 (target <500ms)
└─ Error rate (target <0.1%)
```

---

**Constitution Approved By:**  
Founder & Product Lead  

**Last Updated:** March 1, 2026

**Next Review:** June 1, 2026 (after MVP launch)
