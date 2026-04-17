"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faBriefcase,
  faUsers,
  faListCheck,
  faChartLine,
  faSlidersH,
  faKey,
  faCircleQuestion,
  faChevronLeft,
  faChevronRight,
  faFileContract,
} from "@fortawesome/free-solid-svg-icons";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: faChartPie },
  { href: "/jobs", label: "Jobs", icon: faBriefcase, badge: "3" },
  { href: "/candidates", label: "Candidates", icon: faUsers },
  { href: "/sessions", label: "Sessions", icon: faListCheck, badge: "5" },
  { href: "/intelligence", label: "Intelligence", icon: faChartLine },
];

const settingsNavItems = [
  { href: "/preferences", label: "Preferences", icon: faSlidersH },
  { href: "/api-config", label: "API Config", icon: faKey },
  { href: "/help", label: "Help & Docs", icon: faCircleQuestion },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  return (
    <>
      <div className="sidebar-overlay" id="sidebarOverlay" />

      <aside
        className={`bg-[#2563eb] flex flex-col sticky top-0 h-screen flex-shrink-0 z-20 ${
          mounted ? "transition-all duration-300" : "transition-none"
        } ${collapsed ? "w-16" : "w-60"}`}
      >
        <button
          onClick={toggleCollapse}
          className="absolute top-[22px] -right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-[#e2e8f0] text-[#2563eb] cursor-pointer z-25 transition-all text-xs"
        >
          <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
        </button>

        <div className="px-4 pb-5 pt-5 flex items-center gap-2.5 border-b border-white/15 mb-2">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-base border border-white/25">
            <FontAwesomeIcon icon={faFileContract} />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-extrabold text-[17px] text-white tracking-tight">
                Sieve
              </h1>
              <span className="text-[10px] text-white/65 font-medium">
                AI-Assisted Screening
              </span>
            </div>
          )}
        </div>

        <div className="px-2.5 py-0.5">
          {!collapsed && (
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-white/60 py-3.5 px-2.5">
              Main Menu
            </div>
          )}

          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl font-medium text-[13px] transition-all ${
                  isActive
                    ? "bg-white text-[#2563eb] font-bold"
                    : "text-white hover:bg-white/15"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="w-4 h-4 flex-shrink-0"
                />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-xl font-bold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        <div className="px-2.5 py-0.5 mt-1">
          {!collapsed && (
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-white/60 py-3.5 px-2.5">
              Settings
            </div>
          )}

          {settingsNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl font-medium text-[13px] transition-all ${
                  isActive
                    ? "bg-white text-[#2563eb] font-bold"
                    : "text-white hover:bg-white/15"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="w-4 h-4 flex-shrink-0"
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto mx-2.5 mb-4">
          <div className="bg-white/15 rounded-xl p-3 border border-white/18 flex items-center gap-2.5 cursor-pointer hover:bg-white/20 transition-all">
            <div className="w-[34px] h-[34px] rounded-lg bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              <span className="text-white font-bold text-xs">WT</span>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1">
                  <h4 className="font-bold text-[13px] text-white">
                    WeThinkCode_
                  </h4>
                  <p className="text-[10px] text-white/75">Coding academy</p>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="w-3.5 h-3.5 text-white/70"
                />
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
