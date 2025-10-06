"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Wheel segments with improved contrast
const SEGMENTS = [
  { key: "none", label: "NIC", color: "#2a2a2a", textColor: "#ffffff" },
  { key: "lc5", label: "+5 LC", color: "#333333", textColor: "#ffffff" },
  { key: "lc10", label: "+10 LC", color: "#2a2a2a", textColor: "#ffffff" },
  { key: "code50", label: "SLEVA 50%", color: "#333333", textColor: "#ffffff" },
  { key: "lc100", label: "+100 LC", color: "#2a2a2a", textColor: "#ffffff" },
  { key: "none2", label: "NIC", color: "#333333", textColor: "#ffffff" },
];

export default function WheelOfFortune() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [nextAt, setNextAt] = useState<number | null>(null);
  const anglePer = 360 / SEGMENTS.length;

  // Measure wheel container to keep labels inside at smaller sizes
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [wheelSize, setWheelSize] = useState<number>(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) setWheelSize(rect.width);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  async function loadStatus() {
    try {
      const res = await fetch("/api/wheel/status", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNextAt(data.nextAvailableAt ? new Date(data.nextAvailableAt).getTime() : null);
      }
    } catch {}
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const cooldownMs = useMemo(() => {
    if (!nextAt) return 0;
    const now = Date.now();
    return Math.max(0, nextAt - now);
  }, [nextAt]);

  const disabled = spinning || cooldownMs > 0;

  function segmentIndexByKey(key: string): number {
    const idx = SEGMENTS.findIndex((s) => s.key === key || (key === "none" && s.key.startsWith("none")));
    return Math.max(0, idx);
  }

  async function spin() {
    if (disabled) return;
    setMessage(null);
    setResult(null);
    setSpinning(true);
    try {
      const res = await fetch("/api/wheel/spin", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(String(data?.error || "Nelze točit."));
        setSpinning(false);
        await loadStatus();
        return;
      }

      const outcomeKey: string = String(data.outcome);
      const idx = segmentIndexByKey(outcomeKey);

      const spins = 6 + Math.floor(Math.random() * 4); // 6-9 full spins
      const anglePer = 360 / SEGMENTS.length;
      const targetAngle = 360 - (idx * anglePer + anglePer / 2); // pointer at top
      const finalRotation = spins * 360 + targetAngle;
      setRotation((prev) => prev + finalRotation);

      // Wait for CSS transition to end
      setTimeout(() => {
        setSpinning(false);
        setResult(outcomeKey);
        if (data.rewardMessage) setMessage(data.rewardMessage);
        // Balance might have changed
        router.refresh();
        // set next cooldown
        setNextAt(data.nextAvailableAt ? new Date(data.nextAvailableAt).getTime() : Date.now() + 24 * 60 * 60 * 1000);
      }, 3500);
    } catch (e) {
      setMessage("Chyba spojení.");
      setSpinning(false);
    }
  }

  return (
    <>
      <button
        className={`shop-wheel-tab ${open ? "hidden" : ""}`}
        onClick={() => setOpen(true)}
        title="Kolo štěstí"
      >
        ◀
      </button>

      <div className={`shop-wheel-panel ${open ? "open" : ""}`}>
        <div className="shop-wheel-header">
          <h3>Kolo štěstí</h3>
          <button className="panel-close" onClick={() => setOpen(false)} title="Zavřít">✕</button>
        </div>

        <div className="wheel-container" ref={containerRef}>
          <div
            className={`fortune-wheel ${spinning ? "spinning" : ""}`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {SEGMENTS.map((seg, i) => (
              <div
                key={`seg-${i}`}
                className="wheel-segment"
                style={{
                  transform: `rotate(${anglePer * i}deg) skewY(${90 - anglePer}deg)`,
                  background: seg.color,
                }}
              />
            ))}

            {/* Labels overlay - always on top of segments */}
            {SEGMENTS.map((seg, i) => {
              const a = i * anglePer + anglePer / 2; // center of slice
              const radius = wheelSize / 2;
              const labelDistance = Math.max(0, radius * 0.72); // ~115px at 320px
              const labelFont = Math.round(Math.max(10, Math.min(14, wheelSize * 0.04375)));
              return (
                <div
                  key={`label-${i}`}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${a}deg) translateY(-${labelDistance}px) rotate(-${a}deg)`,
                    color: seg.textColor || '#fff',
                    fontSize: labelFont,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 8px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                    zIndex: 4,
                    pointerEvents: 'none',
                  }}
                >
                  {seg.label}
                </div>
              );
            })}
          </div>
          <div className="wheel-pointer" />
          <button
            className="wheel-center"
            disabled={disabled}
            onClick={spin}
            title={disabled ? (cooldownMs > 0 ? "Další točení za 24 hodin" : "Probíhá točení") : "Točit"}
          >
            {disabled && cooldownMs > 0 ? "Za 24h" : spinning ? "…" : "TOČ"}
          </button>
        </div>

        {message && <div className="card success" style={{ marginTop: 12 }}>{message}</div>}
        {result && <div className="wheel-result">Výsledek: {result}</div>}

        <div className="wheel-note">Můžeš točit jednou za 24 hodin.</div>
      </div>
    </>
  );
}
