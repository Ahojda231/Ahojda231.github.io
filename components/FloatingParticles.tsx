"use client";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  shape: "dot" | "line" | "cross";
}

export default function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = (): Particle[] => {
      return Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 20 + Math.random() * 15,
        size: 1 + Math.random() * 2,
        opacity: 0.1 + Math.random() * 0.3,
        shape: ["dot", "line", "cross"][Math.floor(Math.random() * 3)] as
          | "dot"
          | "line"
          | "cross",
      }));
    };

    setParticles(generateParticles());
  }, []);

  return (
    <div className="space-particles">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`space-particle ${particle.shape}`}
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            width:
              particle.shape === "line"
                ? `${particle.size * 8}px`
                : `${particle.size}px`,
            height:
              particle.shape === "cross"
                ? `${particle.size * 6}px`
                : `${particle.size}px`,
            opacity: particle.opacity,
          }}
        />
      ))}

      {/* Subtle grid overlay */}
      <div className="space-grid"></div>

      {/* Occasional scanning line */}
      <div className="scan-line"></div>
    </div>
  );
}
