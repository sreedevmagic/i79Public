# GitHub Copilot Instructions – i79.ai Website

## Project Overview

This repository contains the **i79.ai public website**, built using:

- Next.js (App Router)
- React
- Tailwind CSS

This is a **marketing + consulting website**, NOT the product backend.

---

## Purpose

- Position i79 as an AI consulting company
- Showcase i79 Engage
- Drive conversions (demo, signup)

---

## Architecture

/app
  page.tsx
  /engage/page.tsx
  /services/page.tsx
  /contact/page.tsx

/components
  /layout
  /sections
  /engage

---

## General Principles

- Keep code simple and clean
- Follow component reuse
- Avoid unnecessary complexity
- Focus on UI and UX

---

## Design Standards

- Dark theme
- Premium enterprise look
- Large typography
- Clean spacing

Inspired by:
- Stripe
- Vercel
- Linear

---

## SEO Rules

- Add metadata per page
- Use semantic HTML (h1, h2, h3)
- Optimize for keywords:
  - AI consulting
  - AI recruitment platform
  - AI hiring software

---

## Navigation

Navbar must include:

- Home
- Engage
- Services
- Contact

Buttons:

- Sign In → https://vengage.i79.ai
- Get Started → https://vengage.i79.ai/register

---

## Component Rules

- Use small reusable components
- Keep JSX clean
- Use Tailwind only

---

## Performance

- Use static rendering (SSG)
- Avoid heavy libraries
- Optimize loading speed

---

## What NOT to do

- Do not add backend logic
- Do not add database code
- Do not use complex state management

---

## Expected Output

- Clean Next.js pages
- Reusable components
- SEO-optimized content
- Production-ready UI

---

## Priority

Clarity > Simplicity > Performance > Design

---

## Goal

Build a **high-converting, premium consulting website** for i79.ai