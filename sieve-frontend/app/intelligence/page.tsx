"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faBriefcase,
  faUsers,
  faListCheck,
  faBrain,
  faSlidersH,
  faKey,
  faCircleQuestion,
  faSearch,
  faDownload,
  faPlus,
  faBell,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faBars,
  faFileContract,
  faLayerGroup,
  faBullseye,
  faTrophy,
  faArrowTrendUp,
  faCode,
  faChartLine,
  faGraduationCap,
  faLightbulb,
  faCheckCircle,
  faRotate,
  faSpinner,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { faBell as farBell } from "@fortawesome/free-regular-svg-icons";
import { apiClient } from "@/lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Types based on backend API
interface IntelligenceData {
  totalSessions: number;
  totalCandidates: number;
  avgMatchRate: number;
  mostScreenedRole: string;
  matchRateTrend: {
    labels: string[];
    values: number[];
  };
  insights: {
    skillGap?: {
      title: string;
      description: string;
      affectedRoles: string[];
      recommendation: string;
    };
    matchRate?: {
      title: string;
      description: string;
      affectedRoles: string[];
      recommendation: string;
    };
    requirementMismatch?: {
      title: string;
      description: string;
      affectedRoles: string[];
      recommendation: string;
    };
  };
  topSkillGaps: {
    skill: string;
    count: number;
  }[];
  sessionHistory: {
    id: string;
    role: string;
    date: string;
    candidates: number;
    avgScore: number;
    matchRate: number;
    topFlag: string;
  }[];
}

export default function IntelligencePage() {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [refreshTimestamp, setRefreshTimestamp] = useState("today");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<IntelligenceData>("/intelligence");
      setData(response);
      setRefreshTimestamp("Just now");
    } catch (err) {
      console.error("Failed to fetch intelligence:", err);
      setError("Could not load intelligence data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // Determine if we should show empty state (less than 3 sessions)
  const shouldShowEmptyState = showEmptyState || (data && data.totalSessions < 3);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f7fe] items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-primary mb-4" />
          <p className="text-text-secondary">Loading intelligence data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-[#f4f7fe] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#0f172a] mb-2">Could not load intelligence</h2>
          <p className="text-sm text-[#64748b] mb-4">{error || "Something went wrong"}</p>
          <button onClick={fetchData} className="bg-primary text-white px-6 py-2 rounded-full font-semibold">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fe]">
      {/* Sidebar */}
      <aside className={`bg-[#2563eb] flex flex-col sticky top-0 h-screen flex-shrink-0 transition-all duration-300 z-20 ${sidebarCollapsed ? "w-16" : "w-60"}`}>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="absolute top-[22px] -right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-[#e2e8f0] text-[#2563eb] cursor-pointer text-xs">
          <FontAwesomeIcon icon={sidebarCollapsed ? faChevronRight : faChevronLeft} />
        </button>
        <div className="px-4 pb-5 pt-5 flex items-center gap-2.5 border-b border-white/15 mb-2">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-base border border-white/25">
            <FontAwesomeIcon icon={faFileContract} />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="font-extrabold text-[17px] text-white tracking-tight">Sieve</h1>
              <span className="text-[10px] text-white/65 font-medium">AI-Assisted Screening</span>
            </div>
          )}
        </div>
        <div className="px-2.5 py-0.5">
          {!sidebarCollapsed && <div className="text-[9.5px] font-bold uppercase tracking-wider text-white/60 py-3.5 px-2.5">Main Menu</div>}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faChartPie} className="w-4" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </Link>
          <Link href="/jobs" className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faBriefcase} className="w-4" />
            {!sidebarCollapsed && <span>Jobs</span>}
            {!sidebarCollapsed && <span className="ml-auto bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-xl font-bold">3</span>}
          </Link>
          <Link href="/candidates" className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faUsers} className="w-4" />
            {!sidebarCollapsed && <span>Candidates</span>}
          </Link>
          <Link href="/sessions" className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faListCheck} className="w-4" />
            {!sidebarCollapsed && <span>Sessions</span>}
            {!sidebarCollapsed && <span className="ml-auto bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-xl font-bold">5</span>}
          </Link>
          <div className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl bg-white text-[#2563eb] font-bold">
            <FontAwesomeIcon icon={faBrain} className="w-4" />
            {!sidebarCollapsed && <span>Intelligence</span>}
          </div>
        </div>
        <div className="px-2.5 py-0.5 mt-1">
          {!sidebarCollapsed && <div className="text-[9.5px] font-bold uppercase tracking-wider text-white/60 py-3.5 px-2.5">Settings</div>}
          <div className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faSlidersH} className="w-4" />
            {!sidebarCollapsed && <span>Preferences</span>}
          </div>
          <div className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faKey} className="w-4" />
            {!sidebarCollapsed && <span>API Config</span>}
          </div>
          <div className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faCircleQuestion} className="w-4" />
            {!sidebarCollapsed && <span>Help & Docs</span>}
          </div>
        </div>
        <div className="mt-auto mx-2.5 mb-2 bg-white/15 rounded-xl p-3 border border-white/18 flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-xs">WT</span>
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="flex-1">
                <h4 className="font-bold text-[13px] text-white">WeThinkCode_</h4>
                <p className="text-[10px] text-white/75">Coding academy</p>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-white/70 text-[11px]" />
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-[62px] bg-white flex items-center justify-between px-6 border-b border-[#e2e8f0] sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="hidden max-[900px]:block text-xl text-[#0f172a]">
              <FontAwesomeIcon icon={faBars} />
            </button>
            <div className="flex items-center bg-[#f8fafc] rounded-full pl-4 pr-1 py-1 border border-[#e2e8f0] min-w-[280px]">
              <FontAwesomeIcon icon={faSearch} className="text-[#94a3b8] text-[13px]" />
              <input placeholder="Search jobs, candidates..." className="border-0 bg-transparent py-1.5 px-2.5 text-[13px] w-full outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-transparent border border-[#e2e8f0] rounded-full py-1.5 px-4 font-semibold text-xs flex items-center gap-1.5 hover:border-primary hover:text-primary">
              <FontAwesomeIcon icon={faDownload} /> Export
            </button>
            <Link href="/jobs/new" className="bg-primary border-0 rounded-full py-2 px-[18px] font-bold text-xs text-white flex items-center gap-1.5 hover:bg-primary-dark">
              <FontAwesomeIcon icon={faPlus} /> New Session
            </Link>
            <button className="relative p-1.5 px-2 rounded-xl text-[#475569] text-lg border border-[#e2e8f0] hover:border-primary hover:text-primary">
              <FontAwesomeIcon icon={farBell} />
            </button>
            <div className="flex items-center gap-2 ml-0.5 py-1 pl-1.5 pr-3 rounded-full bg-white border border-[#e2e8f0]">
              <div className="w-[34px] h-[34px] rounded-full border-2 border-primary-light overflow-hidden">
                <img src="https://avatars.githubusercontent.com/u/96030189?v=4" alt="Elvis Chege" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs">Elvis Chege</span>
                <span className="text-[10px] text-[#475569]">Recruiter</span>
              </div>
              <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-[#94a3b8]" />
            </div>
          </div>
        </header>

        <div className="p-6 pb-8 overflow-y-auto flex-1">
          {shouldShowEmptyState ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-sm border border-[#e2e8f0]">
                <div className="w-20 h-20 mx-auto rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#e2e8f0] text-5xl mb-4">
                  <FontAwesomeIcon icon={faBrain} />
                </div>
                <h2 className="text-2xl font-bold text-[#0f172a] mb-2">Intelligence unlocks after 3 sessions</h2>
                <p className="text-[#475569] text-sm mb-6">Run your first few screenings and patterns will appear here automatically.</p>
                <Link href="/jobs/new" className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold text-sm shadow-sm hover:bg-primary-dark transition">
                  Start first session →
                </Link>
                <div className="mt-5">
                  <button onClick={() => setShowEmptyState(false)} className="text-primary text-xs font-medium underline hover:no-underline">
                    Preview with demo data
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between mb-2">
                <div>
                  <h2 className="font-bold text-[26px] text-[#0f172a]">Talent Pool Intelligence</h2>
                  <p className="text-[#475569] text-[13px] flex items-center gap-2 flex-wrap">
                    <span>Patterns synthesised across {data.totalSessions} screening sessions · Last refreshed <span id="refreshTimestamp">{refreshTimestamp}</span></span>
                    <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faWandMagicSparkles} className="text-[8px]" /> AI
                    </span>
                  </p>
                </div>
                <button onClick={handleRefresh} disabled={isRefreshing} className="bg-transparent border border-[#e2e8f0] rounded-full py-1.5 px-5 font-semibold text-xs text-[#0f172a] flex items-center gap-2 cursor-pointer hover:border-primary hover:text-primary transition-all">
                  <FontAwesomeIcon icon={faRotate} className={isRefreshing ? "fa-spin" : ""} /> Refresh Insights
                </button>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm animate-fadeUp">
                  <div className="w-10 h-10 rounded-full bg-[#eff6ff] text-[#2563eb] flex items-center justify-center text-xl mb-3">
                    <FontAwesomeIcon icon={faLayerGroup} />
                  </div>
                  <div className="text-[28px] font-extrabold text-[#0f172a] leading-tight">{data.totalSessions}</div>
                  <div className="text-xs text-[#475569]">Total Sessions</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm animate-fadeUp [animation-delay:50ms]">
                  <div className="w-10 h-10 rounded-full bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center text-xl mb-3">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <div className="text-[28px] font-extrabold text-[#0f172a] leading-tight">{data.totalCandidates}</div>
                  <div className="text-xs text-[#475569]">Candidates Screened</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm animate-fadeUp [animation-delay:100ms]">
                  <div className="w-10 h-10 rounded-full bg-[#ecfdf5] text-[#10b981] flex items-center justify-center text-xl mb-3">
                    <FontAwesomeIcon icon={faBullseye} />
                  </div>
                  <div className="text-[28px] font-extrabold text-[#0f172a] leading-tight">{data.avgMatchRate}%</div>
                  <div className="text-xs text-[#475569]">Avg Match Rate</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm animate-fadeUp [animation-delay:150ms]">
                  <div className="w-10 h-10 rounded-full bg-[#fffbeb] text-[#f59e0b] flex items-center justify-center text-xl mb-3">
                    <FontAwesomeIcon icon={faTrophy} />
                  </div>
                  <div className="text-[20px] font-extrabold text-[#0f172a] leading-tight">{data.mostScreenedRole}</div>
                  <div className="text-xs text-[#475569]">Most Screened Role</div>
                </div>
              </div>

              {/* Match Rate Trend Chart */}
              <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm mb-6">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-base">Match Rate Over Time</h3>
                  <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faWandMagicSparkles} /> AI
                  </span>
                </div>
                <p className="text-xs text-[#475569] mb-3">Match rate = candidates scoring above 65 composite ÷ total candidates per session</p>
                <div style={{ height: "220px" }}>
                  <Line
                    data={{
                      labels: data.matchRateTrend.labels,
                      datasets: [
                        {
                          data: data.matchRateTrend.values,
                          borderColor: "#2563eb",
                          borderWidth: 2.5,
                          pointBackgroundColor: "#2563eb",
                          pointBorderColor: "#ffffff",
                          pointBorderWidth: 2,
                          pointRadius: 5,
                          tension: 0.4,
                          fill: true,
                          backgroundColor: "rgba(37,99,235,0.07)",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => `${ctx.raw}%`,
                          },
                        },
                      },
                      scales: {
                        y: { min: 0, max: 100, grid: { color: "#f1f5f9" } },
                        x: { grid: { display: false } },
                      },
                    }}
                  />
                </div>
                <div className="mt-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-3 flex items-start gap-3">
                  <FontAwesomeIcon icon={faArrowTrendUp} className="text-[#2563eb] text-lg mt-0.5" />
                  <div className="text-[13px] text-[#0f172a] flex-1">
                    Match rate improved over time as rubrics were refined.
                    <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ml-2">
                      <FontAwesomeIcon icon={faWandMagicSparkles} /> AI
                    </span>
                  </div>
                </div>
              </div>

              {/* Insight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                {/* Skill Gap Card */}
                {data.insights.skillGap && (
                  <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#eff6ff] text-[#2563eb] flex items-center justify-center text-lg">
                        <FontAwesomeIcon icon={faCode} />
                      </div>
                      <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faWandMagicSparkles} /> AI
                      </span>
                    </div>
                    <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-[#eff6ff] text-[#1d4ed8] w-fit mb-2">Skill Gap</span>
                    <h4 className="font-bold text-base mb-1">{data.insights.skillGap.title}</h4>
                    <p className="text-[13px] text-[#475569] leading-relaxed mb-3">{data.insights.skillGap.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {data.insights.skillGap.affectedRoles.map((role, i) => (
                        <span key={i} className="bg-[#f1f5f9] text-[#475569] text-[11px] px-2.5 py-1 rounded-full">{role}</span>
                      ))}
                    </div>
                    <div className="bg-[#f8fafc] rounded-xl p-3 border-l-[3px] border-l-[#2563eb] text-[13px] text-[#475569] italic flex gap-2">
                      <FontAwesomeIcon icon={faLightbulb} className="text-[#2563eb] mt-0.5" />
                      <span>{data.insights.skillGap.recommendation}</span>
                    </div>
                  </div>
                )}

                {/* Match Rate Card */}
                {data.insights.matchRate && (
                  <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#fffbeb] text-[#f59e0b] flex items-center justify-center text-lg">
                        <FontAwesomeIcon icon={faChartLine} />
                      </div>
                      <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faWandMagicSparkles} /> AI
                      </span>
                    </div>
                    <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-[#fef9c3] text-[#854d0e] w-fit mb-2">Match Rate</span>
                    <h4 className="font-bold text-base mb-1">{data.insights.matchRate.title}</h4>
                    <p className="text-[13px] text-[#475569] leading-relaxed mb-3">{data.insights.matchRate.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {data.insights.matchRate.affectedRoles.map((role, i) => (
                        <span key={i} className="bg-[#f1f5f9] text-[#475569] text-[11px] px-2.5 py-1 rounded-full">{role}</span>
                      ))}
                    </div>
                    <div className="bg-[#f8fafc] rounded-xl p-3 border-l-[3px] border-l-[#f59e0b] text-[13px] text-[#475569] italic flex gap-2">
                      <FontAwesomeIcon icon={faLightbulb} className="text-[#f59e0b] mt-0.5" />
                      <span>{data.insights.matchRate.recommendation}</span>
                    </div>
                  </div>
                )}

                {/* Requirement Mismatch Card */}
                {data.insights.requirementMismatch && (
                  <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center text-lg">
                        <FontAwesomeIcon icon={faGraduationCap} />
                      </div>
                      <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faWandMagicSparkles} /> AI
                      </span>
                    </div>
                    <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-[#f5f3ff] text-[#6d28d9] w-fit mb-2">Requirement Mismatch</span>
                    <h4 className="font-bold text-base mb-1">{data.insights.requirementMismatch.title}</h4>
                    <p className="text-[13px] text-[#475569] leading-relaxed mb-3">{data.insights.requirementMismatch.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {data.insights.requirementMismatch.affectedRoles.map((role, i) => (
                        <span key={i} className="bg-[#f1f5f9] text-[#475569] text-[11px] px-2.5 py-1 rounded-full">{role}</span>
                      ))}
                    </div>
                    <div className="bg-[#f8fafc] rounded-xl p-3 border-l-[3px] border-l-[#7c3aed] text-[13px] text-[#475569] italic flex gap-2">
                      <FontAwesomeIcon icon={faLightbulb} className="text-[#7c3aed] mt-0.5" />
                      <span>{data.insights.requirementMismatch.recommendation}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Missing Skills Chart */}
              <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm mb-6">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-base">Most Common Missing Skills</h3>
                  <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faWandMagicSparkles} /> AI
                  </span>
                </div>
                <p className="text-xs text-[#475569] mb-3">Skills most frequently absent across all screened candidates</p>
                <div style={{ height: "240px" }}>
                  <Bar
                    data={{
                      labels: data.topSkillGaps.map((g) => g.skill),
                      datasets: [
                        {
                          data: data.topSkillGaps.map((g) => g.count),
                          backgroundColor: "#2563eb",
                          borderRadius: 8,
                          barThickness: 18,
                        },
                      ],
                    }}
                    options={{
                      indexAxis: "y",
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => `${ctx.raw} candidates missing this skill`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          min: 0,
                          max: Math.max(...data.topSkillGaps.map((g) => g.count)) + 2,
                          grid: { color: "#f1f5f9" },
                        },
                        y: { grid: { display: false } },
                      },
                    }}
                  />
                </div>
                <p className="text-xs text-[#94a3b8] mt-3">
                  Based on {data.totalCandidates} candidates across {data.totalSessions} sessions. Missing = scored below 50 on the relevant dimension keyword.
                </p>
              </div>

              {/* Session History Table */}
              <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm mb-6 overflow-x-auto">
                <h3 className="font-bold text-base mb-1">Session History</h3>
                <p className="text-xs text-[#475569] mb-4">All screening sessions run through Sieve</p>
                <table className="w-full text-[13px] border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] text-left text-[#475569] font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-2">#</th>
                      <th className="py-3 px-2">Role</th>
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Candidates</th>
                      <th className="py-3 px-2">Avg Score</th>
                      <th className="py-3 px-2">Match Rate</th>
                      <th className="py-3 px-2">Top Flag</th>
                      <th className="py-3 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sessionHistory.map((session, idx) => (
                      <tr key={session.id} className={`border-b border-[#f1f5f9] ${idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"} hover:bg-[#f1f5f9]`}>
                        <td className="py-3 px-2">{idx + 1}</td>
                        <td className="py-3 px-2 font-medium">{session.role}</td>
                        <td className="py-3 px-2">{session.date}</td>
                        <td className="py-3 px-2">{session.candidates}</td>
                        <td className={`py-3 px-2 font-semibold ${session.avgScore >= 70 ? "text-[#10b981]" : "text-[#f59e0b]"}`}>{session.avgScore}</td>
                        <td className="py-3 px-2">{session.matchRate}%</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            session.topFlag === "Overqualified" ? "bg-[#fff7ed] text-[#c2410c]" :
                            session.topFlag === "SkillMismatch" ? "bg-[#fef9c3] text-[#854d0e]" :
                            "bg-[#fee2e2] text-[#b91c1c]"
                          }`}>
                            {session.topFlag}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <Link href={`/sessions/${session.id}`} className="bg-[#eff6ff] text-[#2563eb] rounded-full px-3 py-1 text-xs font-semibold hover:bg-[#2563eb] hover:text-white transition">
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Umurava Integration Pitch */}
              <div className="rounded-2xl p-6 md:p-8 border border-[#bfdbfe] shadow-sm flex flex-col md:flex-row gap-6 items-center bg-gradient-to-br from-[#eff6ff] to-[#f5f3ff]">
                <div className="flex-1">
                  <span className="bg-[#2563eb] text-white text-[11px] font-bold px-4 py-1 rounded-full inline-block mb-3">Built for Umurava</span>
                  <h3 className="font-bold text-xl md:text-2xl mb-2">Intelligence grows with every session</h3>
                  <p className="text-[#475569] text-sm leading-relaxed mb-4">
                    Every screening session Sieve runs adds to a growing dataset of talent patterns specific to your Umurava pool. Over time, Sieve learns which roles attract the strongest matches, which skills are chronically missing, and which rubric configurations produce the best hires.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-[#10b981]" /> Patterns are private to your organisation
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-[#10b981]" /> Intelligence improves automatically — no manual input needed
                    </div>
                  </div>
                </div>
                <div className="text-[#2563eb] opacity-20 text-7xl md:text-8xl">
                  <FontAwesomeIcon icon={faBrain} />
                </div>
              </div>

              {/* Demo toggle for empty state */}
              <div className="mt-4 text-right">
                <button onClick={() => setShowEmptyState(true)} className="text-xs text-[#94a3b8] underline hover:text-[#2563eb]">
                  Preview empty state (demo)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}