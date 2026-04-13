"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/layout/ThemeToggle";
import {
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

const useCaseLinks = [
  { label: "Hiring Teams", desc: "Reduce screening time by 80%", href: "/use-cases#hiring-teams" },
  { label: "Recruiters", desc: "Handle high-volume hiring at scale", href: "/use-cases#recruiters" },
  { label: "Fast-Growing Companies", desc: "Scale hiring without slowing down", href: "/use-cases#fast-growing" },
  { label: "Distributed Teams", desc: "Run interviews anywhere, anytime", href: "/use-cases#distributed" },
];

export default function Navbar() {
  const [scrolled, setScrolled]             = useState(false);
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [useCasesOpen, setUseCasesOpen]     = useState(false);
  const [mobileUseCasesOpen, setMobileUseCasesOpen]   = useState(false);
  const useCasesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (useCasesRef.current && !useCasesRef.current.contains(e.target as Node)) {
        setUseCasesOpen(false);
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
        <Link href="/" className="flex items-center gap-2.5">
          <div className="inline-flex items-center justify-center w-9 h-9 bg-gradient-primary rounded">
            <span className="text-primary-foreground font-bold text-base tracking-tight">i79</span>
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

          <Link
            href="/engage"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Product
          </Link>

          {/* Use Cases dropdown */}
          <div ref={useCasesRef} className="relative">
            <button
              onClick={() => setUseCasesOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors duration-200",
                useCasesOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Use Cases
              <ChevronDown
                size={14}
                className={cn("transition-transform duration-200", useCasesOpen && "rotate-180")}
              />
            </button>
            {useCasesOpen && (
              <div className="absolute top-[calc(100%+1.25rem)] left-1/2 -translate-x-1/2 w-64 rounded-2xl border border-border bg-card shadow-xl animate-fade-up p-2 overflow-hidden">
                {useCaseLinks.map((uc) => (
                  <Link
                    key={uc.href}
                    href={uc.href}
                    onClick={() => setUseCasesOpen(false)}
                    className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{uc.label}</span>
                    <span className="text-xs text-muted-foreground">{uc.desc}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Pricing
          </Link>

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
            Start Free Trial
          </Button>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
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

            <Link
              href="/engage"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Product
            </Link>

            {/* Mobile Use Cases accordion */}
            <div>
              <button
                onClick={() => setMobileUseCasesOpen((v) => !v)}
                className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Use Cases
                <ChevronDown
                  size={14}
                  className={cn("transition-transform duration-200", mobileUseCasesOpen && "rotate-180")}
                />
              </button>
              {mobileUseCasesOpen && (
                <div className="ml-3 mt-1 mb-2 border-l border-border pl-4 flex flex-col gap-2">
                  {useCaseLinks.map((uc) => (
                    <Link
                      key={uc.href}
                      href={uc.href}
                      onClick={() => { setMobileOpen(false); setMobileUseCasesOpen(false); }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                    >
                      {uc.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing */}
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Pricing
            </Link>

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
              Start Free Trial
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
