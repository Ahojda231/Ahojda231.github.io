"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const authed = status === "authenticated";
  const roles = ((session as any)?.roles ?? {}) as { [k: string]: number };
  const roleLabels = [
    { key: "admin", label: "Admin", icon: "👑" },
    { key: "scripter", label: "Scripter", icon: "💻" },
    { key: "mapper", label: "Mapper", icon: "🗺️" },
    { key: "supporter", label: "Support", icon: "🛠️" },
    { key: "vct", label: "VCT", icon: "🚗" },
    { key: "fmt", label: "FMT", icon: "🎯" },
  ];
  const activeRoles = roleLabels.filter((r) => (roles[r.key] ?? 0) > 0);

  const navigationItems = [
    {
      href: "/",
      label: "Domů",
      icon: "🏠",
      requireAuth: false,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: "📊",
      requireAuth: false,
    },
    {
      href: "/shop",
      label: "Shop",
      icon: "🛒",
      requireAuth: true,
    },
    {
      href: "/stats",
      label: "Statistiky",
      icon: "📈",
      requireAuth: false,
    },
    {
      href: "/settings",
      label: "Nastavení",
      icon: "⚙️",
      requireAuth: true,
    },
    {
      href: "/admin",
      label: "Admin",
      icon: "🛡️",
      requireAuth: true,
      requireRole: "admin",
    },
  ];

  // Detect mobile to switch between overlay drawer vs. collapsible sidebar
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false); // reset overlay when leaving mobile
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const canAccess = (item: any) => {
    if (item.requireAuth && !authed) return false;
    if (item.requireRole && (roles[item.requireRole] ?? 0) === 0) return false;
    return true;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={`sidebar ${
          isMobile ? (isOpen ? "show" : "") : isCollapsed ? "collapsed" : ""
        }`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Image
              src="/icon.png"
              alt="Legacy RP"
              width={40}
              height={40}
              className="brand-logo"
            />
            {!isCollapsed && (
              <div className="brand-info">
                <span className="brand-name">Legacy RP</span>
                <span className="brand-tagline">Roleplay Server</span>
              </div>
            )}
          </div>
          {(isMobile || !isCollapsed) && (
            <button
              className="sidebar-toggle"
              onClick={() =>
                isMobile ? setIsOpen((v) => !v) : setIsCollapsed((v) => !v)
              }
              title={isMobile ? (isOpen ? "Zavřít menu" : "Otevřít menu") : "Sbalit postranní panel"}
            >
              {isMobile ? (isOpen ? "✕" : "☰") : "←"}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigationItems.filter(canAccess).map((item) => (
              <li key={item.href} className="nav-item">
                <Link
                  href={item.href}
                  className={`nav-link ${isActive(item.href) ? "active" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => {
                    if (isMobile) setIsOpen(false);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="nav-label">{item.label}</span>
                  )}
                  {isActive(item.href) && <span className="nav-indicator" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="sidebar-user">
          {authed ? (
            <div className="user-info">
              <div className="user-avatar-section">
                {session?.user?.image && !avatarError ? (
                  <img
                    src={session.user.image}
                    alt="Avatar"
                    width={40}
                    height={40}
                    className="user-avatar"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="user-avatar-placeholder">
                    {(session?.user?.name || "?").slice(0, 1)}
                  </div>
                )}
                {!isCollapsed && (
                  <div className="user-details">
                    <span className="user-name">{session?.user?.name}</span>
                    <span className="user-status">Online</span>
                  </div>
                )}
              </div>

              {!isCollapsed && activeRoles.length > 0 && (
                <div className="user-roles">
                  {activeRoles.slice(0, 2).map((role) => (
                    <span key={role.key} className="role-badge">
                      <span className="role-icon">{role.icon}</span>
                      {role.label}
                      {(roles[role.key] ?? 0) > 1 && (
                        <span className="role-level">{roles[role.key]}</span>
                      )}
                    </span>
                  ))}
                  {activeRoles.length > 2 && (
                    <span className="role-badge role-more">
                      +{activeRoles.length - 2}
                    </span>
                  )}
                </div>
              )}

              <button
                className="logout-btn"
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Odhlásit se"
              >
                {isCollapsed ? "↩" : "Odhlásit se"}
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => signIn()}>
              {isCollapsed ? "→" : "Přihlásit se"}
            </button>
          )}
        </div>

        {/* Server Status */}
        {!isCollapsed && (
          <div className="server-status">
            <div className="status-indicator">
              <span className="status-dot online"></span>
              <span className="status-text">Server Online</span>
            </div>
            <div className="server-info">
              <span className="players-count">150+ hráčů</span>
            </div>
          </div>
        )}
      </aside>
      {/* Floating dock toggle for desktop-collapsed state */}
      {!isMobile && isCollapsed && (
        <button
          className="sidebar-dock-toggle"
          onClick={() => setIsCollapsed(false)}
          title="Rozbalit postranní panel"
        >
          →
        </button>
      )}
    </>
  );
}
