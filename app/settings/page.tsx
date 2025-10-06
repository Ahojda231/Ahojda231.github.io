"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  useEffect(() => {
    setEmail((session as any)?.user?.email || "");
    setAvatar((session as any)?.user?.image || "");
  }, [session]);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, avatar }),
      });
      if (!res.ok) throw new Error("Save failed");
      setProfileMsg("Profil byl úspěšně uložen.");
    } catch (e: any) {
      setProfileMsg("Chyba při ukládání profilu.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (newPwd.length < 6)
      return setPwdMsg("Nové heslo musí mít alespoň 6 znaků.");
    if (newPwd !== newPwd2) return setPwdMsg("Hesla se neshodují.");
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: curPwd,
          newPassword: newPwd,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Change failed");
      }
      setCurPwd("");
      setNewPwd("");
      setNewPwd2("");
      setPwdMsg("Heslo bylo úspěšně změněno.");
    } catch (e: any) {
      setPwdMsg(e.message || "Chyba při změně hesla.");
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <h1>⚙️ Nastavení účtu</h1>
        <p>Upravte svůj profil a změňte heslo pro váš Legacy RP účet</p>
      </div>

      {/* Profile Settings */}
      <div className="card">
        <div className="section-header">
          <h2 className="section-title">👤 Profil</h2>
          <div className="section-subtitle">Upravte své základní informace</div>
        </div>

        <div className="settings-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">E-mailová adresa</span>
                <input
                  className="form-input"
                  type="email"
                  placeholder="vase-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Avatar URL</span>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              </label>
              {avatar && (
                <div className="avatar-preview">
                  <img
                    src={avatar}
                    alt="Avatar preview"
                    className="preview-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <div className="btn-loading">
                  <div className="loading-spinner"></div>
                  Ukládám...
                </div>
              ) : (
                "Uložit profil"
              )}
            </button>
            {profileMsg && (
              <div
                className={`form-message ${
                  profileMsg.includes("úspěšně") ? "success" : "error"
                }`}
              >
                {profileMsg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Settings */}
      <div className="card">
        <div className="section-header">
          <h2 className="section-title">🔐 Změna hesla</h2>
          <div className="section-subtitle">
            Změňte heslo pro lepší zabezpečení
          </div>
        </div>

        <div className="settings-form">
          <div className="form-group">
            <label className="form-label">
              <span className="label-text">Současné heslo</span>
              <input
                className="form-input"
                type="password"
                placeholder="Zadejte současné heslo"
                value={curPwd}
                onChange={(e) => setCurPwd(e.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Nové heslo</span>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Zadejte nové heslo"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Potvrzení nového hesla</span>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Potvrďte nové heslo"
                  value={newPwd2}
                  onChange={(e) => setNewPwd2(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="password-requirements">
            <h4>Požadavky na heslo:</h4>
            <ul>
              <li className={newPwd.length >= 6 ? "valid" : ""}>
                ✓ Minimálně 6 znaků
              </li>
              <li
                className={
                  newPwd === newPwd2 && newPwd2.length > 0 ? "valid" : ""
                }
              >
                ✓ Hesla se musí shodovat
              </li>
            </ul>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={changePassword}
              disabled={savingPwd || newPwd.length < 6 || newPwd !== newPwd2}
            >
              {savingPwd ? (
                <div className="btn-loading">
                  <div className="loading-spinner"></div>
                  Měním heslo...
                </div>
              ) : (
                "Změnit heslo"
              )}
            </button>
            {pwdMsg && (
              <div
                className={`form-message ${
                  pwdMsg.includes("úspěšně") ? "success" : "error"
                }`}
              >
                {pwdMsg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <div className="section-header">
          <h2 className="section-title">📊 Informace o účtu</h2>
          <div className="section-subtitle">Přehled vašeho Legacy RP účtu</div>
        </div>

        <div className="account-info">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Uživatelské jméno</div>
              <div className="info-value">{(session as any)?.user?.name}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Účet ID</div>
              <div className="info-value">#{(session as any)?.id}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Status</div>
              <div className="info-value">
                <span className="status-badge active">Aktivní</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card danger-zone">
        <div className="section-header">
          <h2 className="section-title">⚠️ Nebezpečná zóna</h2>
          <div className="section-subtitle">Tyto akce jsou nevratné</div>
        </div>

        <div className="danger-actions">
          <p className="danger-warning">
            Pokud máte problémy s účtem, kontaktujte administraci na Discordu
            nebo fóru místo použití těchto akcí.
          </p>
        </div>
      </div>
    </div>
  );
}
