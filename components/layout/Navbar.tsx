"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  ChevronDown,
  Video,
  CheckCircle2,
  ArrowRight,
  Zap,
  BarChart3,
  ShieldCheck,
  Plug2,
  Building2,
  KeyRound,
  LayoutTemplate,
  Database,
  ClipboardCheck,
} from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

const engageFeatures = [
  { icon: Building2,      text: "Enterprise-ready, built for scale" },
  { icon: KeyRound,       text: "SSO & advanced access controls" },
  { icon: LayoutTemplate, text: "Dedicated branded career page" },
  { icon: Database,       text: "Native HRIS & ATS integrations" },
  { icon: Video,          text: "AI-powered video interviews" },
  { icon: ClipboardCheck, text: "Structured scorecards & evaluation" },
];

export default function Navbar() {
  const [scrolled, setScrolled]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mega menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">i79</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">
            Intelligence, <span className="gradient-text">Engineered.</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Home
          </Link>

          {/* Products mega menu trigger */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setProductsOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors duration-200",
                productsOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Products
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform duration-200",
                  productsOpen && "rotate-180"
                )}
              />
            </button>

            {/* Mega Menu Panel */}
            {productsOpen && (
              <div
                className={cn(
                  "absolute top-[calc(100%+1.25rem)] left-1/2 -translate-x-1/2",
                  "w-[720px] rounded-2xl border border-border bg-card shadow-xl",
                  "animate-fade-up p-0 overflow-hidden"
                )}
              >
                {/* Panel header */}
                <div className="px-6 py-3 border-b border-border bg-muted/40">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Our Products
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_1.4fr]">
                  {/* ── Left column: Product card ── */}
                  <div className="p-6 border-r border-border flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Video size={18} className="text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-tight">i79 Engage</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      A full-cycle AI recruitment platform — from career page to offer letter — built for the enterprise.
                    </p>

                    <Link
                      href="/engage"
                      onClick={() => setProductsOpen(false)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all duration-200"
                    >
                      Explore Engage <ArrowRight size={14} />
                    </Link>

                    <div className="mt-auto pt-4 border-t border-border">
                      <a
                        href="https://vengage.i79.ai/register"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <CheckCircle2 size={12} className="text-success" />
                        Free trial available — no credit card
                      </a>
                    </div>
                  </div>

                  {/* ── Right column: Features + CTA ── */}
                  <div className="p-6 flex flex-col gap-5">
                    <ul className="space-y-3">
                      {engageFeatures.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon size={13} className="text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground">{text}</span>
                        </li>
                      ))}
                      <li>
                        <Link
                          href="/engage"
                          onClick={() => setProductsOpen(false)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:gap-2 transition-all duration-200 font-medium"
                        >
                          + many more capabilities <ArrowRight size={11} />
                        </Link>
                      </li>
                    </ul>

                    {/* Stat callout */}
                    <div className="rounded-xl bg-primary/8 border border-primary/15 px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">
                        End-to-end hiring —{" "}
                        <span className="gradient-text">one platform.</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cut time-to-hire by 80% while raising the bar on quality.
                      </p>
                    </div>

                    {/* CTAs */}
                    <div className="flex items-center gap-3 mt-auto">
                      <a
                        href="https://vengage.i79.ai/register"
                        className="flex-1 text-center text-sm font-medium px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        Get Started
                      </a>
                      <Link
                        href="/engage"
                        onClick={() => setProductsOpen(false)}
                        className="flex-1 text-center text-sm font-medium px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                      >
                        View Demo
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {navLinks.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button href="https://vengage.i79.ai" variant="ghost" size="sm">
            Sign In
          </Button>
          <Button href="https://vengage.i79.ai/register" variant="primary" size="sm">
            Get Started
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border px-6 pb-6">
          <nav className="flex flex-col gap-1 pt-4">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Home
            </Link>

            {/* Mobile Products accordion */}
            <div>
              <button
                onClick={() => setMobileProductsOpen((v) => !v)}
                className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Products
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform duration-200",
                    mobileProductsOpen && "rotate-180"
                  )}
                />
              </button>
              {mobileProductsOpen && (
                <div className="ml-3 mt-1 mb-2 border-l border-border pl-4 flex flex-col gap-3">
                  <Link
                    href="/engage"
                    onClick={() => { setMobileOpen(false); setMobileProductsOpen(false); }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <Video size={12} className="text-primary-foreground" />
                    </div>
                    <span>i79 Engage <span className="text-xs text-muted-foreground ml-1">— AI Recruitment Platform</span></span>
                  </Link>
                </div>
              )}
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3 mt-6">
            <Button
              href="https://vengage.i79.ai"
              variant="outline"
              size="md"
              className="w-full"
            >
              Sign In
            </Button>
            <Button
              href="https://vengage.i79.ai/register"
              variant="primary"
              size="md"
              className="w-full"
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
