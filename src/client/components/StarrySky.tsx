import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext.tsx';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

export const StarrySky: React.FC = () => {
  const { theme, bgImage, overlayOpacity } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Only render canvas stars if in dark theme and not completely covered by custom image without transparency
    if (theme !== 'dark') return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);

    // Number of stars scaled to viewport size (capped for performance)
    const starCount = Math.min(180, Math.floor((width * height) / 9000));
    let stars: Star[] = [];

    const initStars = () => {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.6 + 0.4,
          alpha: Math.random() * 0.7 + 0.3,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    initStars();

    // Shooting stars
    const shootingStars: ShootingStar[] = [];
    let lastShootingStarTime = Date.now();

    const spawnShootingStar = () => {
      if (prefersReducedMotion) return;
      shootingStars.push({
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.4,
        length: Math.random() * 80 + 50,
        speed: Math.random() * 6 + 5,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, // ~45 degrees
        opacity: 1,
        active: true,
      });
    };

    let lastTick = Date.now();

    const render = () => {
      const now = Date.now();
      const delta = (now - lastTick) / 1000;
      lastTick = now;

      ctx.clearRect(0, 0, width, height);

      // Deep realistic night sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#040814'); // Very deep midnight navy
      grad.addColorStop(0.5, '#070f26');
      grad.addColorStop(1, '#02040a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle celestial nebula tint
      const radGrad = ctx.createRadialGradient(
        width * 0.7,
        height * 0.2,
        50,
        width * 0.7,
        height * 0.2,
        width * 0.5
      );
      radGrad.addColorStop(0, 'rgba(79, 70, 229, 0.08)'); // Indigo
      radGrad.addColorStop(0.5, 'rgba(147, 51, 234, 0.04)'); // Purple
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);

      // Render twinkling stars
      for (const star of stars) {
        if (!prefersReducedMotion) {
          star.phase += star.twinkleSpeed;
        }
        const currentAlpha = star.alpha * (0.6 + 0.4 * Math.sin(star.phase));

        ctx.fillStyle = `rgba(240, 245, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra subtle glow for brighter stars
        if (star.size > 1.2) {
          ctx.fillStyle = `rgba(180, 210, 255, ${currentAlpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Check for spawning shooting star every ~7 to 14 seconds
      if (now - lastShootingStarTime > 8000 + Math.random() * 6000) {
        spawnShootingStar();
        lastShootingStarTime = now;
      }

      // Render & update shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        if (!ss.active) continue;

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const lineGrad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        lineGrad.addColorStop(0, 'transparent');
        lineGrad.addColorStop(0.8, `rgba(190, 220, 255, ${ss.opacity * 0.6})`);
        lineGrad.addColorStop(1, `rgba(255, 255, 255, ${ss.opacity})`);

        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        // Move
        ss.x += Math.cos(ss.angle) * ss.speed * 60 * delta;
        ss.y += Math.sin(ss.angle) * ss.speed * 60 * delta;
        ss.opacity -= 0.6 * delta;

        if (ss.opacity <= 0 || ss.x > width + 100 || ss.y > height + 100) {
          shootingStars.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none">
      {/* Light mode clean subtle mesh gradient */}
      {theme === 'light' && !bgImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-blue-50/50" />
      )}

      {/* Dark mode Canvas Starry Sky */}
      {theme === 'dark' && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />}

      {/* Custom background image if uploaded */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Dark overlay for maximum text legibility & contrast */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-slate-950 transition-opacity duration-200"
          style={{ opacity: overlayOpacity }}
        />
      )}
    </div>
  );
};
