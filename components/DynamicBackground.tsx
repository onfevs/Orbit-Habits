import React, { useEffect, useRef, useState } from 'react';
import {
  Activity, Book, Briefcase, Coffee, Droplets,
  Dumbbell, Heart, Moon, Music, Sun, Zap, Utensils,
  Footprints, Globe, Shield, Snowflake, Brain,
  Sparkles, Flame, Trophy
} from 'lucide-react';
import gsap from 'gsap';

const ICONS = [
  Activity, Book, Briefcase, Coffee, Droplets,
  Dumbbell, Heart, Moon, Music, Sun, Zap, Utensils,
  Footprints, Globe, Shield, Snowflake, Brain,
  Sparkles, Flame, Trophy
];

interface IconData {
  id: number;
  Icon: React.ElementType;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  duration: number;
  delay: number;
}

const DynamicBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [icons, setIcons] = useState<IconData[]>([]);
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    // Reduced from 80 → 30 icons to prevent animation thread saturation
    const count = 30;
    const newIcons: IconData[] = [];
    for (let i = 0; i < count; i++) {
      newIcons.push({
        id: i,
        Icon: ICONS[i % ICONS.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 18 + 14,
        rotation: Math.random() * 360,
        opacity: Math.random() * 0.05 + 0.02,
        duration: Math.random() * 18 + 12, // 12s–30s (slower = less CPU)
        delay: Math.random() * 8            // spread out starts
      });
    }
    setIcons(newIcons);
    // Cleanup previous ctx if any (hot-reload safety)
    return () => {
      ctxRef.current?.revert();
    };
  }, []);

  useEffect(() => {
    if (icons.length === 0 || !containerRef.current) return;

    // Respect reduced-motion preference (CRITICAL a11y)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Delay animation start by one frame so first render is never blocked
    const rafId = requestAnimationFrame(() => {
      // Kill previous context before creating a new one
      ctxRef.current?.revert();

      const ctx = gsap.context(() => {
        icons.forEach((icon) => {
          const el = document.getElementById(`bg-icon-${icon.id}`);
          if (!el) return;

          // Float animation — lighter than before
          gsap.to(el, {
            y: `random(-25, 25)`,
            x: `random(-12, 12)`,
            rotation: `random(-30, 30)`,
            duration: icon.duration,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: icon.delay,
            // Lazy animation: lower priority
            lazy: true,
          });

          // Pulse opacity — merged into one tween to halve tween count
          gsap.to(el, {
            opacity: icon.opacity * 2,
            duration: icon.duration * 0.6,
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true,
            delay: icon.delay + 1,
            lazy: true,
          });
        });
      }, containerRef);

      ctxRef.current = ctx;
    });

    return () => {
      cancelAnimationFrame(rafId);
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, [icons]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none dark:bg-[#0b0d10] bg-[#f0f2f7] transition-colors duration-300"
      aria-hidden="true"
    >
      {/* Background gradient spotlights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] dark:bg-indigo-900/10 bg-indigo-200/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Floating icons */}
      {icons.map((icon) => (
        <div
          key={icon.id}
          id={`bg-icon-${icon.id}`}
          className="absolute dark:text-slate-500 text-slate-300"
          style={{
            left: `${icon.x}%`,
            top: `${icon.y}%`,
            width: icon.size,
            height: icon.size,
            transform: `rotate(${icon.rotation}deg)`,
            opacity: icon.opacity,
            willChange: 'transform, opacity', // GPU hint
          }}
        >
          <icon.Icon size="100%" strokeWidth={1.5} />
        </div>
      ))}

      {/* Readability overlay */}
      <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-[#0b0d10]/0 dark:via-[#0b0d10]/10 dark:to-[#0b0d10]/50 bg-gradient-to-b from-[#f0f2f7]/0 via-[#f0f2f7]/10 to-[#f0f2f7]/50" />
    </div>
  );
};

export default DynamicBackground;