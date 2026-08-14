"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../ui-components/Button";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Configurator", href: "/guild-builder" },
  { label: "Products", href: "/products" },
  { label: "Top Grossing", href: "/grossing" },
  { label: "Contact Us", href: "/contact" },
];

function parseRgbValues(color: string) {
  // Supports rgb(...) and rgba(...) strings from computed styles.
  const match = color.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;

  const values = match[1].split(",").map((value) => Number.parseFloat(value.trim()));
  if (values.length < 3 || values.some((value) => Number.isNaN(value))) return null;

  return {
    r: values[0],
    g: values[1],
    b: values[2],
    a: values[3] ?? 1,
  };
}

function isLightColor(color: string) {
  const parsed = parseRgbValues(color);
  if (!parsed) return true;
  if (parsed.a === 0) return true;

  // Relative luminance threshold for considering a background "light".
  const luminance = (0.2126 * parsed.r + 0.7152 * parsed.g + 0.0722 * parsed.b) / 255;
  return luminance >= 0.84;
}

function isBackgroundLightFromElement(element: Element | null) {
  if (!element) return true;

  if (element instanceof HTMLImageElement || element instanceof HTMLVideoElement || element instanceof HTMLCanvasElement) {
    return false;
  }

  let current: Element | null = element;

  while (current) {
    const styles = window.getComputedStyle(current);
    // If an image/gradient is present, treat it as dark for safer contrast.
    if (styles.backgroundImage && styles.backgroundImage !== "none") {
      return false;
    }

    if (styles.backgroundColor && !isLightColor(styles.backgroundColor)) {
      return false;
    }

    current = current.parentElement;
  }

  return true;
}

// ── Desktop pill nav (unchanged) ─────────────────────────────────────────────
function Navigation({ onDarkBackground }: { onDarkBackground: boolean }) {
  const router = useRouter();

  return (
    <nav
      aria-label="Main navigation"
      className={`flex items-center gap-1 rounded-4xl p-0 transition-colors duration-300 ${onDarkBackground ? "bg-background/45 backdrop-blur-md" : "bg-muted/95"}`}
    >
      {navItems.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          size="md"
          onClick={() => {
            if (item.href) router.push(item.href);
          }}
          className={`rounded-3xl! px-1 transition-all duration-250 ease-out will-change-transform hover:cursor-pointer hover:scale-[0.92] hover:translate-y-px hover:bg-background/90 hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] focus-visible:ring-accent/50 active:scale-[0.9] ${onDarkBackground ? "text-foreground" : "text-foreground"}`}
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
}

// ── Mobile hamburger menu ─────────────────────────────────────────────────────
function MobileMenu({ onDarkBackground }: { onDarkBackground: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on route change (ESC key)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      {/* Hamburger toggle button */}
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-full transition-colors duration-200 hover:cursor-pointer
          ${onDarkBackground ? "bg-background/45 backdrop-blur-md hover:bg-background/60" : "bg-muted/95 hover:bg-muted"}`}
      >
        <span
          className={`block h-[1.5px] w-5 rounded-full bg-foreground transition-all duration-300 origin-center ${open ? "translate-y-[6.5px] rotate-45" : ""}`}
        />
        <span
          className={`block h-[1.5px] w-5 rounded-full bg-foreground transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`}
        />
        <span
          className={`block h-[1.5px] w-5 rounded-full bg-foreground transition-all duration-300 origin-center ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[180px] overflow-hidden rounded-xl border border-border bg-background shadow-lg"
          style={{ animation: "mobile-menu-in 0.18s cubic-bezier(0.4,0,0.2,1) forwards" }}
        >
          <nav aria-label="Mobile navigation" className="flex flex-col py-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
                className="w-full px-5 py-3 text-left text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted hover:cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      <style>{`
        @keyframes mobile-menu-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
export default function Header() {
  const headerRef = useRef<HTMLElement | null>(null);
  const [onDarkBackground, setOnDarkBackground] = useState(false);

  useEffect(() => {
    const updateHeaderTheme = () => {
      if (window.scrollY <= 20) {
        setOnDarkBackground(false);
        return;
      }

      const header = headerRef.current;
      if (!header) {
        setOnDarkBackground(false);
        return;
      }

      const rect = header.getBoundingClientRect();
      // Probe just below the sticky header to inspect the content behind it.
      const probeX = Math.floor(window.innerWidth / 2);
      const probeY = Math.min(window.innerHeight - 1, Math.max(0, Math.floor(rect.bottom + 4)));
      const backgroundElement = document.elementFromPoint(probeX, probeY);

      setOnDarkBackground(!isBackgroundLightFromElement(backgroundElement));
    };

    let ticking = false;
    const scheduleThemeUpdate = () => {
      if (ticking) return;
      ticking = true;
      // Throttle updates to animation frames for smoother scrolling.
      window.requestAnimationFrame(() => {
        updateHeaderTheme();
        ticking = false;
      });
    };

    updateHeaderTheme();
    window.addEventListener("scroll", scheduleThemeUpdate, { passive: true });
    window.addEventListener("resize", scheduleThemeUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleThemeUpdate);
      window.removeEventListener("resize", scheduleThemeUpdate);
    };
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full pt-2 rounded-xl transition-colors duration-300">
      <div className="flex w-full flex-col items-center gap-3 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full items-center justify-between md:contents">
          {/* Logo */}
          <div className="title flex md:w-auto md:justify-start">
            <Link href="/" className="inline-flex items-center">
              <h3
                style={{ fontSize: "clamp(1.17em, 1.17em + 1vw, 2.5rem)" }}
                className={`font-bold tracking-wider transition-colors duration-300  ${onDarkBackground ? "text-foreground" : "text-foreground"}`}
              >
                AI RIGS
              </h3>
            </Link>
          </div>

          {/* Hamburger — mobile only */}
          <div className="md:hidden">
            <MobileMenu onDarkBackground={onDarkBackground} />
          </div>
        </div>

        {/* Desktop pill nav — hidden on mobile */}
        <div className="navigation hidden md:flex md:w-auto md:justify-end md:mr-20">
          <Navigation onDarkBackground={onDarkBackground} />
        </div>
      </div>
    </header>
  );
}