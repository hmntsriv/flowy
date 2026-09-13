import {
  FileText,
  Plus,
  Star,
  Trash2,
  Cloud,
  Sun,
  Moon,
  User,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/useAuth";

function Sidebar({
  onNewNote,
  activeView,
  onSelectView,
}) {
  const { user, logout } = useAuth();
  console.log("Sidebar user:", user);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("flowy-theme") === "dark";
  });

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileClosing, setProfileClosing] = useState(false);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  console.log("accountDetailsOpen:", accountDetailsOpen);

  const profileButtonRef = useRef(null);

  const [profilePosition, setProfilePosition] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem("flowy-theme", theme);
  }, [darkMode]);

const openProfile = () => {
  const button = profileButtonRef.current;

  if (!button) return;

  const rect = button.getBoundingClientRect();

  const panelWidth = 260;
  const horizontalGap = 12;
  const viewportPadding = 16;

  const preferredLeft = rect.right + horizontalGap;

  const maxLeft =
    window.innerWidth - panelWidth - viewportPadding;

  const left = Math.min(
    preferredLeft,
    maxLeft
  );

  setProfilePosition({
    top: Math.max(16, rect.top - 150),
    left: Math.max(viewportPadding, left),
  });

  setProfileOpen(true);
};

const closeProfile = () => {
  setProfileClosing(true);

  setTimeout(() => {
    setProfileOpen(false);
    setProfileClosing(false);
  }, 160);
};

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="flowy-logo">
          <div className="flowy-logo-mark">~</div>
          <span>Flowy</span>
        </div>
      </div>

      <button
        className="new-note-button"
        type="button"
        onClick={onNewNote}
      >
        <Plus size={18} />
        <span>New note</span>
      </button>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${
            activeView === "notes" ? "active" : ""
          }`}
          type="button"
          onClick={() => onSelectView("notes")}
        >
          <FileText size={18} />
          <span>Notes</span>
        </button>

        <button
          className={`sidebar-nav-item ${
            activeView === "starred" ? "active" : ""
          }`}
          type="button"
          onClick={() => onSelectView("starred")}
        >
          <Star size={18} />
          <span>Starred</span>
        </button>

        <button
          className={`sidebar-nav-item ${
            activeView === "trash" ? "active" : ""
          }`}
          type="button"
          onClick={() => onSelectView("trash")}
        >
          <Trash2 size={18} />
          <span>Trash</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <button
          className="theme-toggle"
          type="button"
          onClick={() =>
            setDarkMode((current) => !current)
          }
        >
          {darkMode ? (
            <Sun size={17} />
          ) : (
            <Moon size={17} />
          )}

          <span>
            {darkMode ? "Light mode" : "Dark mode"}
          </span>
        </button>

        <button
          ref={profileButtonRef}
          className={`profile-button ${
            profileOpen ? "active" : ""
          }`}
          type="button"
          onClick={() => {
            if (profileOpen) {
              closeProfile();
            } else {
              openProfile();
            }
          }}
        >
          <User size={17} />
          <span>Account</span>
        </button>

        <div className="sync-status">
          <Cloud size={17} />
          <span>All changes synced</span>
          <span className="sync-dot" />
        </div>

        <p className="sidebar-tagline">
          Better thoughts.
          <br />
          A calmer you.
        </p>
      </div>

      {profileOpen &&
        createPortal(
          <div
  className={`profile-panel ${
    profileClosing ? "profile-panel-closing" : ""
  }`}
            style={{
              top: `${profilePosition.top}px`,
              left: `${profilePosition.left}px`,
            }}
          >
            <div className="profile-panel-header">
              <div>
                <h3>Account</h3>
                <p>Your Flowy account</p>
              </div>

              <button
                type="button"
                className="profile-panel-close"
                aria-label="Close account panel"
                onClick={closeProfile}
              >
                <X size={16} />
              </button>
            </div>

            <div className="profile-panel-user">
              <div className="profile-panel-avatar">
                <User size={22} />
              </div>

              <div>
                <strong>{user?.name || "Your account"}</strong>
<span>{user?.email || "Signed in to Flowy"}</span>
              </div>
            </div>

            <div className="profile-panel-divider" />

            <button
  type="button"
  className="profile-panel-action"
  onClick={() => {
    setAccountDetailsOpen(true);
    closeProfile();
  }}
>
  <User size={17} />
  <span>Account details</span>
</button>

            <button
  type="button"
  className="profile-panel-action"
  onClick={logout}
>
  <span>Log out</span>
</button>
          </div>,
          document.body
        )}
        {accountDetailsOpen &&
  createPortal(
    <>
      <div
        className="account-details-backdrop"
        onClick={() => setAccountDetailsOpen(false)}
      />

      <div className="account-details-panel">
        <div className="account-details-header">
          <h3>Account Details</h3>

          <button
            type="button"
            className="profile-panel-close"
            onClick={() => setAccountDetailsOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="account-details-avatar">
          <User size={28} />
        </div>

        <div className="account-details-info">
          <h4>{user?.name}</h4>
          <p>{user?.email}</p>
        </div>

        <div className="profile-panel-divider" />

        <div className="account-details-meta">
          <span>Signed in to Flowy</span>
        </div>
      </div>
    </>,
    document.body
  )}
    </aside>
  );
}

export default Sidebar;