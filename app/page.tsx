import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions as any);
  const authed = !!session;

  return (
    <div className="landing-zone">
      {/* Main Landing Content */}
      <div className="landing-content">
        <div className="system-logo">
          <Image
            src="/icon.png"
            alt="Legacy RP System Logo"
            width={100}
            height={100}
            className="logo-hex"
          />
        </div>

        <h1 className="system-title">
          <span className="title-primary">LEGACY</span>
          <span className="title-separator">:</span>
          <span className="title-secondary">RP</span>
        </h1>

        <div className="system-subtitle">ČESKÝ ROLEPLAY SERVER</div>

        <div className="system-description">
          Kvalitní roleplay prostředí s profesionální administrací.
          Vlastní systémy vozidel, nemovitostí a ekonomiky pro maximální zážitek.
        </div>

        <div className="access-panel">
          {!authed && (
            <Link href="/login" className="access-btn primary">
              → PŘIHLÁŠENÍ
            </Link>
          )}
          <Link href="/dashboard" className="access-btn secondary">
            → DASHBOARD
          </Link>
        </div>

        {/* Minimal Metrics */}
        <div className="system-metrics">
          <div className="metric-pod">
            <div className="metric-value">24/7</div>
            <div className="metric-label">V PROVOZU</div>
          </div>
          <div className="metric-pod">
            <div className="metric-value">5 LET</div>
            <div className="metric-label">ZKUŠENOSTÍ</div>
          </div>
        </div>
      </div>
    </div>
  );
}
