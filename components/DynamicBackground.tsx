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

  useEffect(() => {
    // Generate random icons only on mount (client-side) to match hydration
    // Significantly increased count for density ("más juntos y más cantidad")
    const count = 80; 
    const newIcons: IconData[] = [];
    
    for (let i = 0; i < count; i++) {
      newIcons.push({
        id: i,
        Icon: ICONS[Math.floor(Math.random() * ICONS.length)],
        x: Math.random() * 100, // %
        y: Math.random() * 100, // %
        // Slightly smaller range to accommodate higher density (15px to 35px)
        size: Math.random() * 20 + 15, 
        rotation: Math.random() * 360,
        // Keep opacity low to prevent visual clutter with high density
        opacity: Math.random() * 0.05 + 0.02, 
        duration: Math.random() * 15 + 10, // 10s to 25s
        delay: Math.random() * 5
      });
    }
    setIcons(newIcons);
  }, []);

  useEffect(() => {
    if (icons.length === 0 || !containerRef.current) return;

    const ctx = gsap.context(() => {
      icons.forEach((icon) => {
        const el = document.getElementById(`bg-icon-${icon.id}`);
        if (!el) return;

        // Floating animation
        gsap.to(el, {
          y: `random(-30, 30)`, // Reduced movement range slightly to keep them "closer" visually
          x: `random(-15, 15)`,
          rotation: `random(-45, 45)`,
          duration: icon.duration,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: icon.delay
        });

        // Pulse animation (breathing)
        gsap.to(el, {
          opacity: icon.opacity * 1.8, // Slightly higher peak opacity
          scale: 1.15,
          duration: icon.duration * 0.7,
          ease: "power1.inOut",
          repeat: -1,
          yoyo: true,
          delay: icon.delay
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [icons]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none bg-[#0b0d10]"
      aria-hidden="true"
    >
        {/* Deep Background Gradient Spotlights */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s'}} />
        
        {/* Removed the previous additional larger, subtle circles (blurred color spots) */}

        {/* Floating Icons */}
        {icons.map((icon) => (
            <div
                key={icon.id}
                id={`bg-icon-${icon.id}`}
                className="absolute text-slate-400 dark:text-slate-300"
                style={{
                    left: `${icon.x}%`,
                    top: `${icon.y}%`,
                    width: icon.size,
                    height: icon.size,
                    transform: `rotate(${icon.rotation}deg)`,
                    opacity: icon.opacity
                }}
            >
                <icon.Icon size="100%" strokeWidth={1.5} />
            </div>
        ))}
        
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0d10]/0 via-[#0b0d10]/10 to-[#0b0d10]/50" />
    </div>
  );
};

export default DynamicBackground;