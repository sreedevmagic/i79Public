# i79.ai – Premium Website Requirements + UI Specification

---

# 📌 Overview

The i79.ai website is a **premium AI consulting + product showcase platform**.

It represents:
- **i79 → AI Consulting Brand**
- **i79 Engage → AI Recruitment Platform (Product)**

This is a:
→ Marketing + Conversion Website  
→ Built using Next.js + Tailwind (HSL design system)

---


## 🎯 Objective

Design a **high-end, enterprise-grade UI system** for i79.ai that:

- Feels premium (Stripe / Linear / Vercel level)
- Communicates clarity in <5 seconds
- Maximizes conversion (consulting + product)
- Scales into future product UI

---

# 🧠 DESIGN PRINCIPLES

## 1. Clarity First
- One clear message per section
- No visual clutter
- Strong hierarchy

## 2. Depth Through Simplicity
- Minimal UI, but layered depth (spacing, shadows, gradients)

## 3. Motion = Meaning
- Subtle animations only
- Never decorative noise

## 4. Enterprise Feel
- Confident, calm, precise
- No flashy startup gimmicks

---

# 🏗️ Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS (HSL-based design system)
- Static Site (SSG)

---

# 🎨 DESIGN SYSTEM (HSL)

## 🔹 Color Usage Rules

Use ONLY Tailwind tokens mapped to your CSS variables:

| Purpose | Use |
|--------|-----|
| Background | `bg-background` |
| Text | `text-foreground` |
| Cards | `bg-card` |
| Borders | `border-border` |
| Primary Actions | `bg-primary text-primary-foreground` |
| Accent | `bg-accent` |
| Muted Text | `text-muted-foreground` |

---

## 🔹 Visual Style

- Clean, minimal, premium
- Soft shadows (use `shadow-lg`, `shadow-xl`)
- Rounded corners (`rounded-xl`, `rounded-2xl`)
- Smooth transitions (`transition-smooth`)

---

## 🔹 Typography

- Font: Inter / System font
- Use Tailwind scale:

| Element | Class |
|--------|------|
| H1 | `text-5xl md:text-6xl font-bold` |
| H2 | `text-3xl md:text-4xl font-semibold` |
| H3 | `text-xl font-semibold` |
| Body | `text-base text-muted-foreground` |

---

## 🔹 Layout Rules

- Max width: `max-w-6xl mx-auto`
- Section spacing: `py-24`
- Container padding: `px-6`

---

# 🧭 NAVIGATION

## Navbar

### Structure

- Left: Logo (i79)
- Center: Links
- Right: Actions

### Links

- Home
- Engage
- Services
- Contact

### Actions

- Sign In → `https://vengage.i79.ai`
- Get Started → `https://vengage.i79.ai/register`

---

# 🏠 HOMEPAGE

---

## 🔹 Hero Section

### Content

**Heading:**
AI Transformation. Built for Real Business Impact.

**Subtext:**
We design and deploy AI-powered enterprise systems and intelligent automation platforms that help organizations scale faster and make better decisions.

### CTA

- Talk to Us
- Explore Engage

### UI Spec

- Center aligned
- Large whitespace
- Gradient highlight using `--gradient-primary`

### Image Placeholder
[IMAGE: Abstract AI system dashboard / data visualization]


---

## 🔹 Services Section

### Layout

- Grid (md:grid-cols-4)
- Card-based

### Content

- AI Strategy & Advisory
- AI System Development
- Intelligent Automation
- Enterprise Integration

### UI Spec

- `bg-card`
- `rounded-xl`
- `shadow-md`
- Hover: `hover:shadow-lg transition-smooth`

### Image Placeholder
[IMAGE: System architecture / AI workflow diagram]


---

## 🔹 Platforms Section (Engage)

### Content

i79 Engage – AI-powered recruitment platform that automates interviews and hiring decisions.

### UI Spec

- Large centered card
- Gradient border (primary)
- CTA inside card

### Image Placeholder
[IMAGE: Candidate pipeline dashboard / hiring workflow UI]

---

## 🔹 Differentiator Section

**Heading:**
We don’t just advise. We build.

**Content:**
i79 delivers real AI systems in production — not just strategy decks.

### UI Spec

- Center text
- Large spacing
- Minimal design

---

## 🔹 CTA Section

**Heading:**
Let’s Build Your AI System

### UI Spec

- High contrast section
- Primary button

---

# 🤖 ENGAGE PAGE

---

## 🔹 Hero

### Layout

Split layout:

- Left: Text
- Right: Product UI

### Content

Transform Hiring with AI

i79 Engage is an AI-powered recruitment platform (ATS with AI interview automation).

### CTA

- Get Started
- Sign In

### Image Placeholder

---

## 🔹 Differentiator Section

**Heading:**
We don’t just advise. We build.

**Content:**
i79 delivers real AI systems in production — not just strategy decks.

### UI Spec

- Center text
- Large spacing
- Minimal design

---

## 🔹 CTA Section

**Heading:**
Let’s Build Your AI System

### UI Spec

- High contrast section
- Primary button

---

# 🤖 ENGAGE PAGE

---

## 🔹 Hero

### Layout

Split layout:

- Left: Text
- Right: Product UI

### Content

Transform Hiring with AI

i79 Engage is an AI-powered recruitment platform (ATS with AI interview automation).

### CTA

- Get Started
- Sign In

### Image Placeholder
[IMAGE: AI interview avatar + scoring dashboard]

---

## 🔹 Features

### Layout

- 2x2 grid

### Features

- ATS & Pipeline
- AI Interview Automation
- Candidate Scoring
- Analytics

### UI Spec

- Card layout
- Icons required

---

## 🔹 AI Interview Section (USP)

### Layout

Split:

- Left: Text
- Right: Visual

### Content

- Voice + video interviews
- Behavioral analysis
- Real-time scoring
- Fraud detection

### Image Placeholder
[IMAGE: AI avatar interview + transcript UI]

---

## 🔹 How It Works

### Layout

Horizontal steps:

1 → 2 → 3 → 4

---

## 🔹 CTA

Ready to Transform Hiring?

---

# 🧠 SERVICES PAGE

---

## 🔹 Hero

AI Consulting & System Development

---

## 🔹 Services Grid

- AI Strategy
- AI System Development
- Intelligent Automation
- AI for Hiring
- Enterprise Integration
- Custom AI Solutions

---

## 🔹 Process

### Steps

01 Discover  
02 Design  
03 Build  
04 Scale  

### UI Spec

- Numbered cards
- Minimal text

---

# 📞 CONTACT PAGE

---

## 🔹 Layout

Split:

- Left: Contact Info
- Right: Form

---

## 🔹 Contact Info

i79.ai 
Abu Dhabi, UAE  

Email: contact@i79.ai  
Phone: +971 56 970 8658
---

## 🔹 Form

Fields:
- Name
- Email
- Company
- Message

### UI Spec

- `bg-card`
- Rounded inputs
- Focus ring: `ring-primary`

---

# 🔍 SEO REQUIREMENTS

---

## Metadata

Title:
i79.ai | AI Consulting & Intelligent Systems  

Description:
AI consulting company building enterprise AI platforms and recruitment systems.

---

## Keywords

- AI consulting UAE
- AI recruitment platform
- AI ATS
- AI hiring software

---

## Technical SEO

- Sitemap
- OpenGraph
- Fast loading

---

# 🎥 ANIMATION RULES

---

## Use

- Fade-in sections
- Card hover lift
- Button hover scale

---

## Avoid

- Heavy animations
- Distractions

---

# ⚡ PERFORMANCE

---

- Lighthouse > 90
- Load < 2s
- Optimize images

---

# 🚀 CONVERSION RULES

---

- CTA every 2–3 sections
- Clear action hierarchy
- Minimal friction

---

# 🧭 SUCCESS CRITERIA

---

- Clear messaging in <5 seconds  
- Strong enterprise feel  
- Easy navigation  
- High conversion  

---

# 🔚 SUMMARY

i79 = AI Consulting Company  
i79 Engage = AI Recruitment Platform  

Website must:
→ Build trust  
→ Showcase capability  
→ Drive conversion  