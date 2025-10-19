'use client';

// 🌌 THREE.JS ORBITAL BACKGROUND - Animated particle system
// Features: Smooth orbit animation, responsive, low performance impact

import { useEffect, useRef } from 'react';

interface OrbitalBackgroundProps {
  particleCount?: number;
  orbitRadius?: number;
  particleSize?: number;
  speed?: number;
  className?: string;
}

export default function OrbitalBackground({
  particleCount = 100,
  orbitRadius = 200,
  particleSize = 2,
  speed = 0.001,
  className = '',
}: OrbitalBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    interface Particle {
      angle: number;
      radius: number;
      speed: number;
      size: number;
      alpha: number;
    }

    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * orbitRadius + 50,
        speed: speed + Math.random() * speed,
        size: particleSize + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.4,
      });
    }

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update center position (in case of resize)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw and update particles
      particles.forEach(particle => {
        // Calculate position
        const x = centerX + Math.cos(particle.angle) * particle.radius;
        const y = centerY + Math.sin(particle.angle) * particle.radius;

        // Create gradient for particle
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size);
        gradient.addColorStop(0, `rgba(139, 92, 246, ${particle.alpha})`); // Violet
        gradient.addColorStop(0.5, `rgba(99, 102, 241, ${particle.alpha * 0.5})`); // Indigo
        gradient.addColorStop(1, `rgba(139, 92, 246, 0)`);

        // Draw particle
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Update angle for orbit
        particle.angle += particle.speed;
      });

      // Draw connection lines (optional - for premium effect)
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
      ctx.lineWidth = 0.5;

      particles.forEach((particle, i) => {
        const x1 = centerX + Math.cos(particle.angle) * particle.radius;
        const y1 = centerY + Math.sin(particle.angle) * particle.radius;

        // Connect to next 2 particles
        for (let j = i + 1; j < Math.min(i + 3, particles.length); j++) {
          const particle2 = particles[j];
          const x2 = centerX + Math.cos(particle2.angle) * particle2.radius;
          const y2 = centerY + Math.sin(particle2.angle) * particle2.radius;

          const distance = Math.hypot(x2 - x1, y2 - y1);

          // Only connect close particles
          if (distance < 150) {
            const alpha = (1 - distance / 150) * 0.1;
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, orbitRadius, particleSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{
        background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
      }}
    />
  );
}

/**
 * Dark mode variant
 */
export function DarkOrbitalBackground(props: OrbitalBackgroundProps) {
  return (
    <OrbitalBackground
      {...props}
      className={`dark:block hidden ${props.className || ''}`}
    />
  );
}

/**
 * Light mode variant
 */
export function LightOrbitalBackground(props: OrbitalBackgroundProps) {
  return (
    <OrbitalBackground
      {...props}
      className={`dark:hidden block ${props.className || ''}`}
    />
  );
}
