"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../ui components/Button";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Configurator", href: "/guild-builder" },
  { label: "Categories" },
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
          className={`!rounded-3xl px-1 transition-all duration-250 ease-out will-change-transform hover:cursor-pointer hover:scale-[0.92] hover:translate-y-px hover:bg-background/90 hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] focus-visible:ring-accent/50 active:scale-[0.9] ${onDarkBackground ? "text-foreground" : "text-foreground"}`}
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
}

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
      <div className="flex w-full items-center justify-between px-6">
        <div className="title">
          <Link href="/" className="inline-flex items-center">
            <h3 className={`font-bold ttracking-wider transition-colors duration-300 ${onDarkBackground ? "text-foreground" : "text-foreground"}`}>
              AI RIGS
            </h3>
          </Link>
        </div>
        <div className="navigation mr-20">
          <Navigation onDarkBackground={onDarkBackground} />
        </div>
      </div>
    </header>
  );
}