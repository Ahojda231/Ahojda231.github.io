import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Authentication - Legacy RP" };

export default function LoginPage() {
  return (
    <div className="auth-zone">
      {/* Terminal Header */}
      <div className="auth-terminal">
        <div className="terminal-header">
          <div className="terminal-line">
            <span className="terminal-prompt">LEGACY_RP@AUTH:~$</span>
            <span className="terminal-command">authenticate_user</span>
            <span className="terminal-cursor">_</span>
          </div>
        </div>
      </div>

      {/* Authentication Container */}
      <div className="auth-container">
        <div className="auth-panel">
          {/* System Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <img
                src="/icon.png"
                alt="Legacy RP System"
                width={64}
                height={64}
                className="logo-badge"
              />
            </div>
            <div className="auth-title">
              <div className="system-name">LEGACY RP</div>
              <div className="auth-subtitle">AUTHENTICATION REQUIRED</div>
            </div>
          </div>

          {/* Authentication Form */}
          <div className="auth-form-container">
            <div className="auth-status">
              <div className="status-indicator">
                <div className="status-light standby"></div>
                <div className="status-text">AWAITING CREDENTIALS</div>
              </div>
            </div>

            <LoginForm />
          </div>

          {/* System Notice */}
          <div className="auth-notice">
            <div className="notice-header">SYSTEM NOTICE</div>
            <div className="notice-content">
              Account registration available in-game only. Use your MTA server
              credentials to access this system.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
