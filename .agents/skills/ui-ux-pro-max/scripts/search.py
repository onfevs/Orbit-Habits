#!/usr/bin/env python3
"""
UI/UX Pro Max - Design System Search Script
Generates design recommendations for Orbit Habits
"""
import sys
import argparse

DESIGN_SYSTEMS = {
    "productivity_habit_tracker": {
        "pattern": "Personal Dashboard / Productivity App",
        "style": "Dark Luxury Minimal + Glassmorphism accents",
        "dfii_reasoning": "High aesthetic impact + excellent fit for productivity tools",
        "colors": {
            "primary": "#c9a24d (Gold — motivation, achievement)",
            "background_dark": "#0b0d10 (Near-black — focus, depth)",
            "surface_dark": "#151922 (Dark slate — cards)",
            "background_light": "#f0f2f7 (Warm off-white — calm)",
            "surface_light": "#ffffff (Pure white — clarity)",
            "success": "#10b981 (Emerald — completion, growth)",
            "danger": "#ef4444 (Red — urgency, missed)",
            "rest": "#14b8a6 (Teal — planned rest, balance)",
            "accent_text": "#e1c878 (Soft gold — highlights)",
        },
        "typography": {
            "display": "Playfair Display (serif) — prestige, motivation",
            "body": "Inter (sans-serif) — legibility, modern",
            "pairing_rationale": "Serif display creates emotional weight; Inter ensures readability at small sizes",
        },
        "spacing_rhythm": "4px base (0.25rem) — 8px unit steps",
        "motion_philosophy": "Purposeful micro-interactions; GSAP for entries; CSS transitions for state changes",
        "effects": [
            "Glassmorphism on nav and modals (backdrop-blur)",
            "Gold glow shadow on achievement elements",
            "Neon green flash on habit completion",
            "Teal ambient glow on rest days",
            "Smooth theme transition (0.3s ease on body)",
        ],
        "anti_patterns": [
            "No pure black backgrounds (use #0b0d10)",
            "No flat/muted colors for completion states",
            "No layout shift on hover",
            "No system fonts (Inter must be loaded from Google Fonts)",
            "No emojis as UI icons (use Lucide SVG icons)",
            "No walls of red for rest days on weekly habits",
        ],
        "ux_guidelines": [
            "Minimum 44x44px touch targets on all buttons",
            "Progress bars: animated, colored by completion state",
            "Calendar colors: semantic traffic-light system with teal rest tier",
            "Weekly goal progress always visible in habit list",
            "risk badge on stats nav when habits are behind",
            "Weekly summary modal: auto-trigger Sundays, manual trigger in Settings",
            "Theme switch: instant HTML class toggle, smooth CSS transitions",
        ],
    }
}

UX_RULES = [
    {"priority": 1, "domain": "ux", "rule": "touch-target-size", "detail": "All buttons minimum 44x44px — current check buttons are 36px, upgrade to 44px"},
    {"priority": 1, "domain": "color", "rule": "color-contrast", "detail": "Light mode: text-text (#1e293b) on bg-background (#f0f2f7) = 12.1:1 ✓"},
    {"priority": 2, "domain": "ux", "rule": "focus-states", "detail": "Add focus-visible:ring-2 ring-primary to all interactive elements"},
    {"priority": 2, "domain": "ux", "rule": "loading-states", "detail": "Add skeleton loading for stats dashboard charts"},
    {"priority": 3, "domain": "typography", "rule": "font-loading", "detail": "Preload Playfair Display and Inter via <link rel=preload>"},
    {"priority": 3, "domain": "ux", "rule": "reduced-motion", "detail": "Wrap GSAP animations in prefers-reduced-motion check"},
    {"priority": 4, "domain": "style", "rule": "rest-day-color", "detail": "Teal gradient for rest days = high memorability anchor ✓"},
    {"priority": 4, "domain": "ux", "rule": "weekly-progress", "detail": "Progress bar in Today Summary = critical UX improvement ✓"},
    {"priority": 5, "domain": "chart", "rule": "pie-chart", "detail": "Add 'Descanso programado' violet/teal category to pie ✓"},
    {"priority": 5, "domain": "ux", "rule": "empty-states", "detail": "All empty states have icon + message + CTA (check stats sections)"},
]

SEO_RECOMMENDATIONS = {
    "feasibility_score": 42,
    "verdict": "Do Not Proceed with programmatic SEO",
    "rationale": "Orbit Habits is a client-side SPA with localStorage data. No server-rendered pages, no crawlable content beyond index.html.",
    "alternatives": [
        "Add <title> and <meta description> to index.html with rich keywords",
        "Add Open Graph tags for social sharing",
        "Add structured data (WebApplication schema) to index.html",
        "Consider a public landing page (separate from the app) for SEO",
        "Add manifest.json for PWA discoverability",
    ],
    "immediate_wins": [
        "Title: 'Orbit Habits — Track Weekly Goals & Build Lasting Habits'",
        "Description: 'Beautiful habit tracker with weekly goals, streak tracking, and personalized insights. Build routines that actually stick.'",
        "Keywords: habit tracker, weekly habits, goal tracking, daily routine, productivity app",
        "OG image: App screenshot or generated preview",
        "canonical: https://orbit-habits.app (or actual domain)",
        "theme-color: #c9a24d (gold — shows in mobile browser chrome)",
    ]
}

def print_design_system(project_name="Orbit Habits"):
    ds = DESIGN_SYSTEMS["productivity_habit_tracker"]
    print(f"""
╔══════════════════════════════════════════════════════════════════════╗
║          UI/UX PRO MAX — DESIGN SYSTEM: {project_name:<26} ║
╠══════════════════════════════════════════════════════════════════════╣
║  Pattern : {ds['pattern']:<58} ║
║  Style   : {ds['style']:<58} ║
╠══════════════════════════════════════════════════════════════════════╣
║  COLORS                                                              ║""")
    for name, val in ds["colors"].items():
        print(f"║    {name:<20}: {val:<43} ║")
    print(f"""╠══════════════════════════════════════════════════════════════════════╣
║  TYPOGRAPHY                                                          ║
║    Display : {ds['typography']['display']:<55} ║
║    Body    : {ds['typography']['body']:<55} ║
╠══════════════════════════════════════════════════════════════════════╣
║  MOTION: {ds['motion_philosophy']:<59} ║
╠══════════════════════════════════════════════════════════════════════╣
║  EFFECTS                                                             ║""")
    for e in ds["effects"]:
        print(f"║    • {e:<63} ║")
    print(f"""╠══════════════════════════════════════════════════════════════════════╣
║  ANTI-PATTERNS (DO NOT USE)                                          ║""")
    for ap in ds["anti_patterns"]:
        print(f"║    ✗ {ap:<63} ║")
    print("╚══════════════════════════════════════════════════════════════════════╝")

def print_ux_rules(domain=None):
    rules = UX_RULES if not domain else [r for r in UX_RULES if r["domain"] == domain]
    print(f"\n{'─'*70}")
    print(f"  UX RULES{(' — domain: ' + domain) if domain else ''}")
    print(f"{'─'*70}")
    for r in sorted(rules, key=lambda x: x["priority"]):
        print(f"  [P{r['priority']}] {r['rule']:<25} {r['detail']}")

def print_seo():
    s = SEO_RECOMMENDATIONS
    print(f"\n{'─'*70}")
    print(f"  PROGRAMMATIC SEO FEASIBILITY")
    print(f"{'─'*70}")
    print(f"  Score  : {s['feasibility_score']}/100")
    print(f"  Verdict: {s['verdict']}")
    print(f"  Reason : {s['rationale']}")
    print(f"\n  IMMEDIATE SEO WINS:")
    for w in s["immediate_wins"]: print(f"    • {w}")
    print(f"\n  ALTERNATIVES TO PROGRAMMATIC SEO:")
    for a in s["alternatives"]: print(f"    → {a}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("query", nargs="?", default="")
    parser.add_argument("--design-system", action="store_true")
    parser.add_argument("--domain", default=None)
    parser.add_argument("--seo", action="store_true")
    parser.add_argument("-p", "--project", default="Orbit Habits")
    parser.add_argument("-f", "--format", default="ascii")
    args = parser.parse_args()

    if args.design_system:
        print_design_system(args.project)
    if args.domain or (not args.design_system and not args.seo):
        print_ux_rules(args.domain)
    if args.seo:
        print_seo()
