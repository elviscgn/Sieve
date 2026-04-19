"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSlidersH,
  faMoon,
  faSun,
  faBell,
  faSave,
} from "@fortawesome/free-solid-svg-icons";

export default function PreferencesPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [compactView, setCompactView] = useState(false);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#0f172a] flex items-center gap-3">
          <FontAwesomeIcon icon={faSlidersH} className="text-primary" />
          Preferences
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Customize your Sieve experience
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faBell} className="text-primary" />
            Notifications
          </h2>
          <label className="flex items-center justify-between py-2">
            <span className="text-sm text-[#475569]">
              Email notifications for completed screenings
            </span>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-4">Appearance</h2>
          <label className="flex items-center justify-between py-2">
            <span className="text-sm text-[#475569] flex items-center gap-2">
              <FontAwesomeIcon icon={darkMode ? faMoon : faSun} />
              Dark mode
            </span>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
          <label className="flex items-center justify-between py-2">
            <span className="text-sm text-[#475569]">
              Compact candidate view
            </span>
            <input
              type="checkbox"
              checked={compactView}
              onChange={(e) => setCompactView(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
        </div>

        <button className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-primary-dark transition flex items-center gap-2">
          <FontAwesomeIcon icon={faSave} /> Save Preferences
        </button>
      </div>
    </div>
  );
}
