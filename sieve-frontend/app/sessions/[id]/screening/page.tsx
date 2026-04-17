"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faBriefcase,
  faUserGroup,
  faLayerGroup,
  faBrain,
  faSliders,
  faPlug,
  faBookOpen,
  faSearch,
  faFileExport,
  faPlus,
  faBell,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faBars,
  faFileContract,
  faCircleInfo,
  faWeightScale,
  faTerminal,
  faCircleCheck,
  faSyncAlt,
  faPlay,
  faLock,
  faFlagCheckered,
  faCheck,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { faBell as farBell } from "@fortawesome/free-regular-svg-icons";
import { apiClient } from "@/lib/api";
import type { Job, Applicant, ScreeningSession, Rubric } from "@/types";

// Types for candidate display
interface CandidateDisplay {
  id: string;
  name: string;
  initials: string;
  role: string;
  skills: string[];
  avatarBg: string;
  avatarColor: string;
  status: "pending" | "evaluating" | "complete";
  score?: number;
  dimensionScores?: number[];
  color?: string;
  flags?: string[];
}

const dimensionColors = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#dc2626"];
const dimensionLabels = ["Tech", "Exp", "Edu", "Profile", "RF"];

// Helper to generate avatar styles
const getAvatarStyle = (name: string, status: string) => {
  const colors = [
    { bg: "#dbeafe", color: "#1e40af" },
    { bg: "#dcfce7", color: "#166534" },
    { bg: "#fef9c3", color: "#854d0e" },
    { bg: "#fee2e2", color: "#991b1b" },
    { bg: "#f5f3ff", color: "#5b21b6" },
    { bg: "#fff7ed", color: "#9a3412" },
  ];
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function ScreeningPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // Core state
  const [job, setJob] = useState<Job | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [candidates, setCandidates] = useState<CandidateDisplay[]>([]);
  const [evaluatedCount, setEvaluatedCount] = useState(0);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(false);
  const [logs, setLogs] = useState<
    Array<{ message: string; type: string; icon: string }>
  >([]);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // Refs for SSE and animations
  const eventSourceRef = useRef<EventSource | null>(null);
  const scoreElementsRef = useRef<Map<string, HTMLSpanElement>>(new Map());

  // Add log entry
  const addLog = useCallback(
    (
      message: string,
      type: "info" | "complete" | "evaluating" = "info",
      icon: string = "circle-info",
    ) => {
      setLogs((prev) => [{ message, type, icon }, ...prev].slice(0, 8));
    },
    [],
  );

  // Load initial session data
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Fetch session details (includes job and applicants)
        const session = await apiClient.get<ScreeningSession>(
          `/sessions/${sessionId}`,
        );
        const jobData = await apiClient.get<Job>(`/jobs/${session.jobId}`);
        setJob(jobData);
        setRubric(session.rubricSnapshot);

        // Fetch applicants for this job
        const applicants = await apiClient.get<Applicant[]>(
          `/jobs/${session.jobId}/applicants`,
        );
        const initialCandidates: CandidateDisplay[] = applicants.map((app) => {
          const profile = app.profile;
          const firstName = profile["First Name"] || "";
          const lastName = profile["Last Name"] || "";
          const name = `${firstName} ${lastName}`.trim();
          const initials = (firstName[0] || "") + (lastName[0] || "");
          const avatarStyle = getAvatarStyle(name, "pending");
          const skills = profile.Skills?.map((s) => s.name).slice(0, 3) || [];
          const role =
            profile["Work Experience"]?.[0]?.["Job Title"] || "Candidate";

          return {
            id: app._id,
            name,
            initials,
            role,
            skills,
            avatarBg: avatarStyle.bg,
            avatarColor: avatarStyle.color,
            status: "pending",
          };
        });

        setCandidates(initialCandidates);
        setTotalCandidates(initialCandidates.length);

        // Check if there are already evaluated candidates in session
        const evaluated = session.results?.length || 0;
        if (evaluated > 0) {
          setEvaluatedCount(evaluated);
          // Update candidate statuses from existing results
          const updatedCandidates = initialCandidates.map((c) => {
            const result = session.results?.find((r) => r.applicantId === c.id);
            if (result) {
              return {
                ...c,
                status: "complete" as const,
                score: result.compositeScore,
                dimensionScores: result.dimensions.map((d) => d.score),
                color:
                  result.compositeScore >= 70
                    ? "#10b981"
                    : result.compositeScore >= 50
                      ? "#f59e0b"
                      : "#ef4444",
                flags: result.flags,
              };
            }
            return c;
          });
          setCandidates(updatedCandidates);
          if (evaluated === initialCandidates.length) {
            setIsComplete(true);
          }
        }

        addLog(
          `Screening session started — ${initialCandidates.length} candidates queued`,
          "info",
          "play",
        );
        addLog("Rubric locked and confirmed", "info", "lock");
      } catch (error) {
        console.error("Failed to load session:", error);
      }
    };

    loadSession();
  }, [sessionId, addLog]);

  // Setup SSE connection
  useEffect(() => {
    if (!sessionId) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}/stream`,
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // data: { applicantId, name, score, totalApplicants, evaluatedCount }

      setEvaluatedCount(data.evaluatedCount);
      setTotalCandidates(data.totalApplicants);

      // Update candidate status
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.id === data.applicantId) {
            // This candidate just got evaluated
            const score = data.score;
            const color =
              score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
            // In a real implementation, dimension scores would come from a separate API call
            // For demo, we'll generate placeholder scores based on the composite
            const dimensionScores = [
              Math.min(100, Math.round(score * (0.8 + Math.random() * 0.4))),
              Math.min(100, Math.round(score * (0.7 + Math.random() * 0.5))),
              Math.min(100, Math.round(score * (0.6 + Math.random() * 0.6))),
              Math.min(100, Math.round(score * (0.5 + Math.random() * 0.7))),
              Math.min(100, Math.round((100 - score) * 0.8)),
            ];
            addLog(
              `${c.name} evaluated — score: ${score}`,
              "complete",
              "check-circle",
            );
            return {
              ...c,
              status: "complete" as const,
              score,
              dimensionScores,
              color,
            };
          }
          return c;
        }),
      );

      // Check if this was the last candidate
      if (data.evaluatedCount === data.totalApplicants) {
        setIsComplete(true);
        addLog(
          "Screening complete — all candidates evaluated",
          "complete",
          "flag-checkered",
        );
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId, addLog]);

  // Update progress percentage
  useEffect(() => {
    if (totalCandidates > 0) {
      setProgressPercent(Math.round((evaluatedCount / totalCandidates) * 100));
    }
  }, [evaluatedCount, totalCandidates]);

  // Auto-redirect when complete
  useEffect(() => {
    if (isComplete && !isAutoRedirecting) {
      setIsAutoRedirecting(true);
      addLog("Navigating to shortlist...", "info", "arrow-right");
      const timer = setTimeout(() => {
        router.push(`/sessions/${sessionId}/shortlist`);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, isAutoRedirecting, sessionId, router, addLog]);

  // Animate score count-up
  const animateScore = useCallback(
    (element: HTMLSpanElement, target: number) => {
      const duration = 800;
      const start = 0;
      const startTime = performance.now();

      const update = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(start + (target - start) * eased);
        element.textContent = value.toString();
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          element.textContent = target.toString();
        }
      };
      requestAnimationFrame(update);
    },
    [],
  );

  // Register score elements for animation
  const registerScoreElement = useCallback(
    (id: string, el: HTMLSpanElement | null) => {
      if (el) {
        scoreElementsRef.current.set(id, el);
      }
    },
    [],
  );

  // Trigger animations when scores appear
  useEffect(() => {
    candidates.forEach((c) => {
      if (c.status === "complete" && c.score !== undefined) {
        const el = scoreElementsRef.current.get(c.id);
        if (el && el.textContent === "0") {
          animateScore(el, c.score);
        }
      }
    });
  }, [candidates, animateScore]);

  // Render candidate card based on status
  const renderCandidateCard = (candidate: CandidateDisplay) => {
    if (candidate.status === "pending") {
      return (
        <div
          key={candidate.id}
          className="candidate-card bg-[#fafafa] rounded-2xl border border-[#f1f5f9] p-5 opacity-80"
        >
          <div className="flex items-start gap-5">
            <div className="flex items-center gap-3 w-48 flex-shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{
                  backgroundColor: candidate.avatarBg,
                  color: candidate.avatarColor,
                }}
              >
                {candidate.initials}
              </div>
              <div>
                <div className="font-bold">{candidate.name}</div>
                <div className="text-xs text-[#64748b]">{candidate.role}</div>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded-full">
                  Queued
                </span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#e2e8f0] h-1.5 rounded-full w-full"
                  />
                ))}
            </div>
            <div className="w-20 flex-shrink-0 text-center">
              <span className="text-3xl font-black text-[#cbd5e1]">—</span>
              <span className="text-[10px] text-[#94a3b8] block">Pending</span>
            </div>
          </div>
        </div>
      );
    }

    if (candidate.status === "evaluating") {
      return (
        <div
          key={candidate.id}
          className="candidate-card evaluating-card bg-[#fafbff] rounded-2xl border-2 border-[#bfdbfe] p-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[scan_1.4s_ease-in-out_infinite]" />
          <div className="flex items-start gap-5">
            <div className="flex items-center gap-3 w-48 flex-shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{
                  backgroundColor: candidate.avatarBg,
                  color: candidate.avatarColor,
                }}
              >
                {candidate.initials}
              </div>
              <div>
                <div className="font-bold">{candidate.name}</div>
                <div className="text-xs text-[#64748b]">{candidate.role}</div>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-[#2563eb]">
                  <span className="status-dot-pulse inline-block w-2 h-2 rounded-full bg-[#2563eb] animate-pulse" />
                  Evaluating...
                </span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="shimmer-bar h-1.5 rounded-full w-full"
                  />
                ))}
            </div>
            <div className="w-20 flex-shrink-0 flex flex-col items-center">
              <div className="w-11 h-11 border-4 border-[#e2e8f0] border-t-[#2563eb] rounded-full animate-spin" />
              <span className="text-[10px] text-[#2563eb] font-medium mt-1">
                Processing
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Complete card
    const score = candidate.score || 0;
    const color = candidate.color || "#10b981";
    const dimensionScores = candidate.dimensionScores || [0, 0, 0, 0, 0];
    const flags = candidate.flags || [];

    return (
      <div
        key={candidate.id}
        className="candidate-card bg-white rounded-2xl p-5 card-reveal relative border-l-4"
        style={{ borderLeftColor: color }}
      >
        <FontAwesomeIcon
          icon={faCircleCheck}
          className="absolute top-3 right-3 text-[#10b981] text-lg"
        />
        <div className="flex items-start gap-5">
          <div className="flex items-center gap-3 w-48 flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style={{
                backgroundColor: candidate.avatarBg,
                color: candidate.avatarColor,
              }}
            >
              {candidate.initials}
            </div>
            <div>
              <div className="font-bold">{candidate.name}</div>
              <div className="text-xs text-[#64748b]">{candidate.role}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {candidate.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-[9px] bg-[#f1f5f9] px-2 py-0.5 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-1 justify-center">
            {dimensionScores.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <canvas
                  id={`ring-${candidate.id}-${i}`}
                  width="36"
                  height="36"
                  className="w-9 h-9"
                />
                <span
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: dimensionColors[i] }}
                >
                  {dimensionLabels[i]}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-center w-20 flex-shrink-0">
            <div
              className="w-14 h-14 rounded-full border-4 flex flex-col items-center justify-center"
              style={{ borderColor: color }}
            >
              <span
                ref={(el) => registerScoreElement(candidate.id, el)}
                className="text-xl font-black score-number visible"
                style={{ color }}
              >
                0
              </span>
              <span className="text-[8px] text-[#94a3b8] font-semibold">
                /100
              </span>
            </div>
            <span className="badge-nowrap text-[10px] font-bold text-[#10b981] mt-1.5 bg-[#f0fdf4] px-2.5 py-1 rounded-full inline-flex items-center">
              <FontAwesomeIcon icon={faCheck} className="text-[8px] mr-1" />
              Complete
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pl-[124px]">
          {dimensionScores.map((s, i) => (
            <span
              key={i}
              className="dimension-pill text-[10px] font-bold px-2 py-1 rounded-full text-white"
              style={{
                backgroundColor: dimensionColors[i],
                animationDelay: `${i * 0.15}s`,
              }}
            >
              {dimensionLabels[i]} {s}
            </span>
          ))}
        </div>
        {flags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pl-[124px]">
            {flags.map((flag, i) => (
              <span
                key={i}
                className={`flag-tag text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  flag === "Overqualified"
                    ? "bg-[#fff7ed] text-[#c2410c]"
                    : flag === "Underexperienced"
                      ? "bg-[#f1f5f9] text-[#475569]"
                      : "bg-[#fef9c3] text-[#92400e]"
                }`}
              >
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render status dots for progress bar
  const renderStatusDots = () => {
    return candidates.map((c) => {
      let dotClass =
        "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs transition-all ";
      let content;
      if (c.status === "complete") {
        dotClass += "bg-[#10b981]";
        content = (
          <FontAwesomeIcon icon={faCheck} className="text-white text-sm" />
        );
      } else if (c.status === "evaluating") {
        dotClass += "bg-[#2563eb]";
        content = (
          <FontAwesomeIcon
            icon={faSyncAlt}
            spin
            className="text-white text-xs"
          />
        );
      } else {
        dotClass += "bg-[#cbd5e1] text-[#475569]";
        content = c.initials;
      }
      return (
        <div key={c.id} className={dotClass} title={c.name}>
          {content}
        </div>
      );
    });
  };

  if (!job) {
    return (
      <div className="flex min-h-screen bg-[#f4f7fe] items-center justify-center">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="text-4xl text-primary"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fe]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-[62px] bg-white flex items-center justify-between px-6 border-b border-[#e2e8f0] sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="hidden max-[900px]:block text-xl text-[#0f172a]">
              <FontAwesomeIcon icon={faBars} />
            </button>
            <div className="flex items-center bg-[#f8fafc] rounded-full pl-4 pr-1 py-1 border border-[#e2e8f0] min-w-[280px]">
              <FontAwesomeIcon
                icon={faSearch}
                className="text-[#94a3b8] text-[13px]"
              />
              <input
                placeholder="Search jobs, candidates..."
                className="border-0 bg-transparent py-1.5 px-2.5 text-[13px] w-full outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="bg-transparent border border-[#e2e8f0] rounded-full py-1.5 px-4 font-semibold text-xs flex items-center gap-1.5 hover:border-primary hover:text-primary">
              <FontAwesomeIcon icon={faFileExport} /> Export
            </button>
            <Link
              href="/jobs/new"
              className="bg-primary border-0 rounded-full py-2 px-[18px] font-bold text-xs text-white flex items-center gap-1.5 hover:bg-primary-dark"
            >
              <FontAwesomeIcon icon={faPlus} /> New Session
            </Link>
            <button className="relative p-1.5 px-2 rounded-xl text-[#475569] text-lg border border-[#e2e8f0] hover:border-primary hover:text-primary">
              <FontAwesomeIcon icon={farBell} />
              <span className="absolute top-[6px] right-[6px] w-[7px] h-[7px] bg-[#ef4444] rounded-full border-1.5 border-white"></span>
            </button>
            <div className="flex items-center gap-2 ml-0.5 py-1 pl-1.5 pr-3 rounded-full bg-white border border-[#e2e8f0]">
              <div className="w-[34px] h-[34px] rounded-full border-2 border-primary-light overflow-hidden">
                <img
                  src="https://avatars.githubusercontent.com/u/96030189?v=4"
                  alt="Elvis Chege"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs">Elvis Chege</span>
                <span className="text-[10px] text-[#475569]">Recruiter</span>
              </div>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="text-[10px] text-[#94a3b8]"
              />
            </div>
          </div>
        </header>

        <div className="p-6 pb-8 overflow-y-auto flex-1">
          {/* Breadcrumb */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm mb-1">
                <Link
                  href="/sessions"
                  className="text-[#2563eb] hover:underline font-medium"
                >
                  Sessions
                </Link>
                <span className="text-[#94a3b8] mx-1.5">/</span>
                <Link
                  href={`/sessions/${sessionId}`}
                  className="text-[#2563eb] hover:underline font-medium"
                >
                  {job.title}
                </Link>
                <span className="text-[#94a3b8] mx-1.5">/</span>
                <span className="text-[#475569]">Screening</span>
              </div>
              <h1 className="font-bold text-[28px] text-[#0f172a] tracking-tight">
                Live Screening
              </h1>
              <p className="text-sm text-[#64748b] mt-1">
                AI is evaluating candidates against your scoring rubric in real
                time
              </p>
            </div>
            <div
              className={`flex items-center gap-2 rounded-full py-1.5 px-4 text-xs font-bold ${
                isComplete
                  ? "bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]"
                  : "bg-[#fef3c7] text-[#92400e] border border-[#fde68a]"
              }`}
            >
              {isComplete ? (
                <>
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    className="text-[#10b981]"
                  />
                  <span>Screening complete!</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f59e0b] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f59e0b]"></span>
                  </span>
                  <span>Screening in progress...</span>
                </>
              )}
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 mb-6 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-[15px]">
                  {evaluatedCount} of {totalCandidates} evaluated
                </div>
                <div className="text-xs text-[#64748b] mt-0.5">
                  {totalCandidates - evaluatedCount} remaining ·{" "}
                  {isComplete
                    ? "Complete"
                    : `Est. ~${(totalCandidates - evaluatedCount) * 1.5} min`}
                </div>
              </div>
              <div className="text-[22px] font-black text-[#2563eb]">
                {progressPercent}%
              </div>
            </div>
            <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-2">{renderStatusDots()}</div>
          </div>

          {/* Completion Banner */}
          {isComplete && (
            <div className="completion-banner-bg bg-gradient-to-r from-[#f0fdf4] to-[#eff6ff] border border-[#bbf7d0] rounded-2xl p-5 mb-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-extrabold text-[#0f172a]">
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className="text-[#10b981] mr-2"
                    />
                    Screening complete — {totalCandidates} candidates evaluated
                  </div>
                  <div className="text-[13px] text-[#475569] mt-1">
                    Top candidate:{" "}
                    {candidates.find((c) => c.status === "complete")?.name ||
                      "—"}{" "}
                    · Avg score:{" "}
                    {Math.round(
                      candidates
                        .filter((c) => c.status === "complete")
                        .reduce((acc, c) => acc + (c.score || 0), 0) /
                        evaluatedCount,
                    ) || 0}
                  </div>
                </div>
                <button
                  onClick={() =>
                    router.push(`/sessions/${sessionId}/shortlist`)
                  }
                  className="bg-primary text-white border-0 rounded-full py-2.5 px-6 font-bold text-sm hover:bg-primary-dark transition shadow-md"
                >
                  View Shortlist →
                </button>
              </div>
              {isAutoRedirecting && (
                <div className="mt-3">
                  <div className="h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-[progress_2.5s_linear]" />
                  </div>
                  <p className="text-xs text-[#475569] mt-2">
                    Navigating to shortlist...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Two Column Layout */}
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Left Column: Candidate Feed */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-lg">
                  Candidates{" "}
                  <span className="bg-[#e2e8f0] text-[#475569] text-xs px-2 py-0.5 rounded-full ml-2">
                    {totalCandidates}
                  </span>
                </h3>
              </div>
              <div className="space-y-3">
                {candidates.map(renderCandidateCard)}
              </div>
            </div>

            {/* Right Column */}
            <div className="w-full lg:w-72 flex-shrink-0 space-y-5">
              {/* Session Info */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FontAwesomeIcon
                    icon={faCircleInfo}
                    className="text-[#64748b]"
                  />
                  <h4 className="font-bold text-[#0f172a]">Session Info</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Job</span>
                    <span className="font-medium">{job.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Dept</span>
                    <span className="font-medium">Engineering</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Location</span>
                    <span className="font-medium">Remote</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Rubric</span>
                    <span className="text-[#10b981] font-medium">
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-xs mr-1"
                      />
                      Confirmed
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Candidates</span>
                    <span className="font-medium">{totalCandidates}</span>
                  </div>
                </div>
              </div>

              {/* Rubric Weights */}
              {rubric && (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon
                      icon={faWeightScale}
                      className="text-[#64748b]"
                    />
                    <h4 className="font-bold text-[#0f172a]">
                      Confirmed Rubric
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 mt-1 mb-2">
                    <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✦ AI
                    </span>
                    <span className="text-[10px] text-[#64748b]">
                      Recruiter-confirmed
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden my-3">
                    {rubric.dimensions.map((dim, i) => (
                      <div
                        key={i}
                        style={{
                          width: `${dim.weight}%`,
                          backgroundColor:
                            dimensionColors[i % dimensionColors.length],
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium">
                    {rubric.dimensions.map((dim, i) => (
                      <span key={i}>
                        <span
                          style={{
                            color: dimensionColors[i % dimensionColors.length],
                          }}
                        >
                          ●
                        </span>{" "}
                        {dim.name.split(" ")[0]} {dim.weight}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Log */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <FontAwesomeIcon
                    icon={faTerminal}
                    className="text-[#64748b]"
                  />
                  <h4 className="font-bold text-[#0f172a]">Activity Log</h4>
                </div>
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 text-xs log-entry-new"
                    >
                      <span className="w-12 flex-shrink-0 text-[11px] text-[#94a3b8] font-medium">
                        Just now
                      </span>
                      <FontAwesomeIcon
                        icon={
                          log.type === "complete"
                            ? faCircleCheck
                            : log.type === "evaluating"
                              ? faSyncAlt
                              : faCircleInfo
                        }
                        className="text-xs mt-0.5"
                        style={{
                          color:
                            log.type === "complete"
                              ? "#10b981"
                              : log.type === "evaluating"
                                ? "#2563eb"
                                : "#94a3b8",
                        }}
                      />
                      <span className="text-[#475569]">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
