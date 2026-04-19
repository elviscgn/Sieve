"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faEye,
  faEyeSlash,
  faSave,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function APIConfigPage() {
  const [apiKey, setApiKey] = useState(
    process.env.NEXT_PUBLIC_SIEVE_API_KEY || "",
  );
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("sieve_api_key", apiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#0f172a] flex items-center gap-3">
          <FontAwesomeIcon icon={faKey} className="text-primary" />
          API Configuration
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Manage your Sieve API credentials
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
        <h2 className="text-lg font-bold text-[#0f172a] mb-4">API Key</h2>
        <p className="text-sm text-[#64748b] mb-4">
          This key is used to authenticate requests to the Sieve backend.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-primary"
            >
              <FontAwesomeIcon icon={showKey ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-primary-dark transition flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faSave} /> Save API Key
          </button>
          {isSaved && (
            <span className="text-green-600 text-sm flex items-center gap-1">
              <FontAwesomeIcon icon={faCheckCircle} /> Saved
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] p-6">
        <h3 className="font-bold text-[#0f172a] mb-2">API Endpoints</h3>
        <p className="text-sm text-[#64748b] mb-4">
          Your backend is expected at:
        </p>
        <code className="block bg-white p-3 rounded-lg text-sm font-mono border">
          {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}
        </code>
      </div>
    </div>
  );
}
