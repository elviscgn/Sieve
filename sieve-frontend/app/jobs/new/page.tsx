"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  faChevronUp,
  faBars,
  faFileContract,
  faPen,
  faUndoAlt,
  faColumns,
  faDownload,
  faFilePdf,
  faGripVertical,
  faPencilAlt,
  faCheckCircle,
  faExclamationCircle,
  faArrowRight,
  faTimes,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { faBell as farBell } from "@fortawesome/free-regular-svg-icons";
import { apiClient } from "@/lib/api";
import type { ScreeningSession, ScreeningResult, Applicant, Job } from "@/types";
import Sortable from "sortablejs";
import CandidateDetailPanel from "@/app/sessions/[id]/shortlist/_components/CandidateDetailPanel";
// import CandidateDetailPanel from "./_components/CandidateDetailPanel";

// Types for display
interface CandidateDisplay {
  id: string;
  name: string;
  role: string;
  exp: string;
  skills: string[];
  location?: string;
  composite: number;
  confidence: "High" | "Medium" | "Low";
  flags: string[];
  dimensionScores: {
    tech: number;
    exp: number;
    edu: number;
    prof: number;
    flags: number;
  };
  rationales: string[];
  strengths: string[];
  gaps: string[];
  aiRec: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  aiRank: number;
  category: "high" | "flagged" | "low";
}

export default function ShortlistPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // Data states
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<CandidateDisplay[]>([]);
  const [recruiterRanks, setRecruiterRanks] = useState<number[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateDisplay[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // UI states
  const [detailPanelCandidate, setDetailPanelCandidate] = useState<CandidateDisplay | null>(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareCandidates, setCompareCandidates] = useState<CandidateDisplay[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs
  const tableBodyRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);

  // Load session data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch session results
        const session = await apiClient.get<ScreeningSession>(`/sessions/${sessionId}/results`);
        const jobData = await apiClient.get<Job>(`/jobs/${session.jobId}`);
        setJob(jobData);

        // Transform results to display format
        const displayCandidates: CandidateDisplay[] = await Promise.all(
          session.results.map(async (result, idx) => {
            const applicant = await apiClient.get<Applicant>(`/applicants/${result.applicantId}`);
            const profile = applicant.profile;
            const firstName = profile["First Name"] || "";
            const lastName = profile["Last Name"] || "";
            const name = `${firstName} ${lastName}`.trim();
            const role = profile["Work Experience"]?.[0]?.["Job Title"] || "Candidate";
            const exp = profile["Work Experience"]?.[0]?.["Start Date"]
              ? `${new Date().getFullYear() - new Date(profile["Work Experience"][0]["Start Date"]).getFullYear()}yrs`
              : "N/A";
            const skills = profile.Skills?.map((s: any) => s.name) || [];
            const location = profile.Location || "Johannesburg, ZA";
            const initials = (firstName[0] || "") + (lastName[0] || "");

            // Dimension scores
            const dimScores = {
              tech: result.dimensions.find(d => d.name.includes("Technical"))?.score || 0,
              exp: result.dimensions.find(d => d.name.includes("Experience"))?.score || 0,
              edu: result.dimensions.find(d => d.name.includes("Education"))?.score || 0,
              prof: result.dimensions.find(d => d.name.includes("Profile"))?.score || 0,
              flags: result.dimensions.find(d => d.name.includes("Red Flag"))?.score || 0,
            };

            // Category
            let category: "high" | "flagged" | "low" = "high";
            if (result.flags.length > 0) category = "flagged";
            else if (result.confidence === "low") category = "low";

            // Confidence
            let confidence: "High" | "Medium" | "Low" = "Medium";
            if (result.confidence === "high") confidence = "High";
            else if (result.confidence === "low") confidence = "Low";

            // Avatar styling
            const composite = result.compositeScore;
            const avatarBg = composite >= 80 ? "#dcfce7" : composite >= 60 ? "#fef3c7" : "#fee2e2";
            const avatarColor = composite >= 80 ? "#166534" : composite >= 60 ? "#92400e" : "#991b1b";

            return {
              id: result.applicantId,
              name,
              role,
              exp,
              skills,
              location,
              composite,
              confidence,
              flags: result.flags,
              dimensionScores: dimScores,
              rationales: result.dimensions.map(d => d.rationale),
              strengths: result.strengths,
              gaps: result.gaps,
              aiRec: result.recommendation,
              initials,
              avatarBg,
              avatarColor,
              aiRank: result.aiRank || idx + 1,
              category,
            };
          })
        );

        // Sort by AI rank initially
        displayCandidates.sort((a, b) => a.aiRank - b.aiRank);
        setCandidates(displayCandidates);
        setRecruiterRanks(displayCandidates.map((_, i) => i + 1));
        setFilteredCandidates(displayCandidates);
      } catch (error) {
        console.error("Failed to load shortlist:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [sessionId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...candidates];
    if (currentFilter === "high") {
      filtered = candidates.filter(c => c.category === "high");
    } else if (currentFilter === "flagged") {
      filtered = candidates.filter(c => c.flags.length > 0);
    } else if (currentFilter === "low") {
      filtered = candidates.filter(c => c.category === "low");
    }

    // Sort by current recruiter ranks
    const candidateIndexMap = new Map(candidates.map((c, i) => [c.id, i]));
    filtered.sort((a, b) => {
      const idxA = candidateIndexMap.get(a.id)!;
      const idxB = candidateIndexMap.get(b.id)!;
      return recruiterRanks[idxA] - recruiterRanks[idxB];
    });

    setFilteredCandidates(filtered);
  }, [candidates, recruiterRanks, currentFilter]);

  // Initialize Sortable after render
  useEffect(() => {
    if (tableBodyRef.current && !isLoading) {
      if (sortableRef.current) sortableRef.current.destroy();
      sortableRef.current = new Sortable(tableBodyRef.current, {
        handle: ".drag-handle",
        animation: 200,
        ghostClass: "opacity-40",
        onEnd: (evt) => {
          const rows = Array.from(tableBodyRef.current?.querySelectorAll(".shortlist-row") || []);
          const newRanks = [...recruiterRanks];
          rows.forEach((row, newIndex) => {
            const candidateId = row.getAttribute("data-id");
            const candidateIdx = candidates.findIndex(c => c.id === candidateId);
            if (candidateIdx !== -1) {
              newRanks[candidateIdx] = newIndex + 1;
            }
          });
          setRecruiterRanks(newRanks);
          showToast("Recruiter ranks updated");
          // Call override API
          saveRecruiterRanks(newRanks);
        },
      });
    }
    return () => {
      if (sortableRef.current) sortableRef.current.destroy();
    };
  }, [filteredCandidates, isLoading, candidates, recruiterRanks]);

  const saveRecruiterRanks = async (ranks: number[]) => {
    setIsSaving(true);
    try {
      const overrides = candidates.map((c, i) => ({
        applicantId: c.id,
        recruiterRank: ranks[i],
      }));
      await apiClient.put(`/sessions/${sessionId}/override`, { overrides });
    } catch (error) {
      console.error("Failed to save recruiter ranks:", error);
      showToast("Failed to save ranks");
    } finally {
      setIsSaving(false);
    }
  };

  const resetToAIRanks = () => {
    const aiRanks = candidates.map(c => c.aiRank);
    setRecruiterRanks(aiRanks);
    saveRecruiterRanks(aiRanks);
    showToast("Reset to AI ranks");
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCompare = () => {
    const selected = candidates.filter(c => selectedIds.has(c.id));
    setCompareCandidates(selected);
    setCompareModalOpen(true);
  };

  const toggleCandidateSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f7fe] items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-primary" />
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
            <FontAwesomeIcon icon={faHouse} className="w-4" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </Link>
          <Link href="/jobs" className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faBriefcase} className="w-4" />
            {!sidebarCollapsed && <span>Jobs</span>}
            {!sidebarCollapsed && <span className="ml-auto bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-xl font-bold">3</span>}
          </Link>
          <Link href="/candidates" className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faUserGroup} className="w-4" />
            {!sidebarCollapsed && <span>Candidates</span>}
          </Link>
          <div className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl bg-white text-[#2563eb] font-bold">
            <FontAwesomeIcon icon={faLayerGroup} className="w-4" />
            {!sidebarCollapsed && <span>Sessions</span>}
            {!sidebarCollapsed && <span className="ml-auto bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-xl font-bold">5</span>}
          </div>
          <Link href="/intelligence" className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faBrain} className="w-4" />
            {!sidebarCollapsed && <span>Intelligence</span>}
          </Link>
        </div>
        <div className="px-2.5 py-0.5 mt-1">
          {!sidebarCollapsed && <div className="text-[9.5px] font-bold uppercase tracking-wider text-white/60 py-3.5 px-2.5">Settings</div>}
          <div className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faSliders} className="w-4" />
            {!sidebarCollapsed && <span>Preferences</span>}
          </div>
          <div className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faPlug} className="w-4" />
            {!sidebarCollapsed && <span>API Config</span>}
          </div>
          <div className="flex items-center gap-2.5 px-3.5 py-2 my-0.5 rounded-xl text-white hover:bg-white/15 font-medium text-[13px]">
            <FontAwesomeIcon icon={faBookOpen} className="w-4" />
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
              <input placeholder="Search candidates..." className="border-0 bg-transparent py-1.5 px-2.5 text-[13px] w-full outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-transparent border border-[#e2e8f0] rounded-full py-1.5 px-4 font-semibold text-xs flex items-center gap-1.5 hover:border-primary hover:text-primary">
              <FontAwesomeIcon icon={faFileExport} /> Export
            </button>
            <Link href="/jobs/new" className="bg-primary border-0 rounded-full py-2 px-[18px] font-bold text-xs text-white flex items-center gap-1.5 hover:bg-primary-dark">
              <FontAwesomeIcon icon={faPlus} /> New Session
            </Link>
            <button className="relative p-1.5 px-2 rounded-xl text-[#475569] text-lg border border-[#e2e8f0] hover:border-primary hover:text-primary">
              <FontAwesomeIcon icon={farBell} />
              <span className="absolute top-[6px] right-[6px] w-[7px] h-[7px] bg-[#ef4444] rounded-full border-1.5 border-white"></span>
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
          {/* Breadcrumb & Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm mb-1">
                <Link href="/sessions" className="text-[#2563eb] hover:underline font-medium">Sessions</Link>
                <span className="text-[#94a3b8] mx-1.5">/</span>
                <span className="text-[#475569]">{job?.title || "Loading..."}</span>
                <span className="text-[#94a3b8] mx-1.5">/</span>
                <span className="font-semibold text-[#0f172a]">Shortlist</span>
              </div>
              <h1 className="font-bold text-[28px] text-[#0f172a] tracking-tight">Ranked Shortlist</h1>
              <p className="text-sm text-[#64748b] mt-1">
                {candidates.length} candidates · Screened {new Date().toLocaleDateString()} · Rubric confirmed before screening
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-transparent border border-[#e2e8f0] rounded-full py-2 px-4 font-semibold text-sm flex items-center gap-2 hover:border-primary hover:text-primary">
                <FontAwesomeIcon icon={faPen} className="text-xs" /> Edit Rubric
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              {["all", "high", "flagged", "low"].map(filter => (
                <button
                  key={filter}
                  onClick={() => setCurrentFilter(filter)}
                  className={`pb-1.5 text-sm font-medium transition-all ${
                    currentFilter === filter
                      ? "text-[#2563eb] border-b-2 border-[#2563eb] font-semibold"
                      : "text-[#64748b] hover:text-[#0f172a]"
                  }`}
                >
                  {filter === "all" && "All"}
                  {filter === "high" && "High Match"}
                  {filter === "flagged" && "Flagged"}
                  {filter === "low" && "Low Confidence"}
                  {filter === "all" && ` (${candidates.length})`}
                  {filter === "high" && ` (${candidates.filter(c => c.category === "high").length})`}
                  {filter === "flagged" && ` (${candidates.filter(c => c.flags.length > 0).length})`}
                  {filter === "low" && ` (${candidates.filter(c => c.category === "low").length})`}
                </button>
              ))}
              <div className="h-6 w-px bg-[#e2e8f0] mx-1"></div>
              <button onClick={resetToAIRanks} className="text-xs font-medium text-[#64748b] hover:text-[#2563eb] flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUndoAlt} /> Reset to AI Ranks
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCompare}
                disabled={selectedIds.size < 2 || selectedIds.size > 3}
                className={`rounded-full py-2 px-5 font-semibold text-sm flex items-center gap-2 transition ${
                  selectedIds.size >= 2 && selectedIds.size <= 3
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : "bg-[#e2e8f0] text-[#64748b] cursor-not-allowed"
                }`}
              >
                <FontAwesomeIcon icon={faColumns} /> Compare Selected
              </button>
              <button className="bg-transparent border border-[#e2e8f0] rounded-full py-2 px-4 text-sm flex items-center gap-1.5 hover:border-primary">
                <FontAwesomeIcon icon={faDownload} /> CSV
              </button>
              <button className="bg-transparent border border-[#e2e8f0] rounded-full py-2 px-4 text-sm flex items-center gap-1.5 hover:border-primary">
                <FontAwesomeIcon icon={faFilePdf} /> PDF
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="grid grid-cols-[auto_auto_auto_1fr_auto] gap-3 px-5 py-3 border-b border-[#e2e8f0] text-xs font-bold text-[#64748b] uppercase tracking-wide">
              <div className="w-10"></div>
              <div className="w-8 text-center">AI</div>
              <div className="w-8 text-center">Rec.</div>
              <div>Candidate</div>
              <div className="text-right pr-4">Score</div>
            </div>

            <div ref={tableBodyRef} className="divide-y divide-[#f1f5f9]">
              {filteredCandidates.map(cand => {
                const candidateIdx = candidates.findIndex(c => c.id === cand.id);
                const aiRank = cand.aiRank;
                const recRank = recruiterRanks[candidateIdx];
                const isEdited = aiRank !== recRank;
                const scoreColor = cand.composite >= 80 ? "#10b981" : cand.composite >= 60 ? "#f59e0b" : "#ef4444";
                const initials = cand.name.split(" ").map(n => n[0]).join("");

                return (
                  <div key={cand.id}>
                    <div className="shortlist-row grid grid-cols-[auto_auto_auto_1fr_auto] gap-3 px-5 py-4 items-center" data-id={cand.id}>
                      <div className="drag-handle w-10 flex justify-center cursor-grab text-[#94a3b8]">
                        <FontAwesomeIcon icon={faGripVertical} />
                      </div>
                      <div className="w-8 text-center font-bold text-sm text-[#475569]">{aiRank}</div>
                      <div className={`w-8 text-center font-bold text-sm ${isEdited ? "text-[#2563eb]" : ""}`}>
                        {recRank}
                        {isEdited && <FontAwesomeIcon icon={faPencilAlt} className="ml-1 text-[10px] text-[#2563eb] opacity-70" />}
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          className="candidate-checkbox rounded"
                          checked={selectedIds.has(cand.id)}
                          onChange={() => toggleCandidateSelection(cand.id)}
                        />
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: cand.avatarBg, color: cand.avatarColor }}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-[#0f172a]">
                            {cand.name} <span className="text-[#64748b] text-xs font-normal ml-1">{cand.role}</span>
                          </div>
                          <div className="text-xs text-[#64748b]">{cand.exp} · {cand.skills.slice(0, 2).join("/")}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cand.flags.map(flag => {
                              let colorClass = "bg-red-100 text-red-800";
                              if (flag === "Overqualified") colorClass = "bg-orange-100 text-orange-800";
                              if (flag === "SkillMismatch") colorClass = "bg-amber-100 text-amber-800";
                              if (flag === "Underexperienced") colorClass = "bg-gray-100 text-gray-800";
                              if (flag === "Low Confidence") colorClass = "bg-yellow-50 text-yellow-700";
                              return (
                                <span key={flag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
                                  {flag}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pr-4">
                        <div className="flex-1 min-w-[120px]">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-[#64748b] uppercase tracking-wider mb-0.5">
                            <span className="w-6">T</span><span className="w-6">E</span><span className="w-6">Ed</span><span className="w-6">P</span><span className="w-6">F</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {(["tech", "exp", "edu", "prof", "flags"] as const).map(dim => {
                              const val = cand.dimensionScores[dim];
                              let bgClass = "";
                              if (dim === "tech") bgClass = "bg-[#2563eb]";
                              else if (dim === "exp") bgClass = "bg-[#16a34a]";
                              else if (dim === "edu") bgClass = "bg-[#d97706]";
                              else if (dim === "prof") bgClass = "bg-[#7c3aed]";
                              else bgClass = "bg-[#dc2626]";
                              return (
                                <div key={dim} className="w-6 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                                  <div className={`h-full ${bgClass}`} style={{ width: `${val}%` }}></div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <span className="text-2xl font-black" style={{ color: scoreColor }}>{cand.composite}</span>
                          <span className="text-[10px] text-[#94a3b8] block">/100</span>
                        </div>
                        <button
                          className="expand-row-btn ml-2 text-[#94a3b8] hover:text-[#2563eb]"
                          onClick={(e) => {
                            const row = e.currentTarget.closest(".shortlist-row");
                            const next = row?.nextElementSibling;
                            if (next?.classList.contains("expanded-content")) {
                              next.classList.toggle("hidden");
                            }
                          }}
                        >
                          <FontAwesomeIcon icon={faChevronDown} />
                        </button>
                      </div>
                    </div>
                    {/* Expanded Content */}
                    <div className="expanded-content hidden bg-[#fafbff] px-5 py-4 border-t border-[#e2e8f0] text-sm">
                      <div className="grid grid-cols-5 gap-4 mb-4">
                        {["Technical", "Experience", "Education", "Profile", "Red Flags"].map((dimName, i) => {
                          const dimKey = ["tech", "exp", "edu", "prof", "flags"][i] as keyof typeof cand.dimensionScores;
                          const score = cand.dimensionScores[dimKey];
                          return (
                            <div key={dimName}>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xl">{score}</span>
                                <span className="text-xs text-[#64748b]">{dimName}</span>
                              </div>
                              <p className="text-xs text-[#475569] mt-1">
                                <span className="inline-flex items-center bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full mr-1">✦ AI</span>
                                {cand.rationales[i]}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="font-bold text-green-700 text-xs mb-1">Strengths</div>
                          {cand.strengths.map((s, i) => (
                            <div key={i} className="text-xs flex gap-2 items-start">
                              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xs mt-0.5" />
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="font-bold text-red-600 text-xs mb-1">Gaps/Risks</div>
                          {cand.gaps.map((g, i) => (
                            <div key={i} className="text-xs flex gap-2 items-start">
                              <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 text-xs mt-0.5" />
                              <span>{g}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 bg-white p-3 rounded-xl border flex items-start gap-2">
                        <span className="inline-flex items-center bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full">✦ AI</span>
                        <span className="text-sm">{cand.aiRec}</span>
                      </div>
                      <button
                        onClick={() => setDetailPanelCandidate(cand)}
                        className="mt-3 text-primary font-medium text-sm flex items-center gap-1"
                      >
                        <FontAwesomeIcon icon={faArrowRight} /> Open full detail panel →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Detail Panel */}
      {detailPanelCandidate && (
        <CandidateDetailPanel
          isOpen={!!detailPanelCandidate}
          onClose={() => setDetailPanelCandidate(null)}
          candidate={detailPanelCandidate}
          jobId={job?._id || ""}
          sessionId={sessionId}
        />
      )}

      {/* Compare Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setCompareModalOpen(false)}>
          <div className="bg-white rounded-2xl w-[95%] max-w-6xl max-h-[90vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl">Compare Candidates</h3>
              <button onClick={() => setCompareModalOpen(false)} className="text-[#94a3b8] hover:text-black">
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>
            <CompareContent candidates={compareCandidates} />
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#1e293b] text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg z-[100]">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// Compare Modal Content
function CompareContent({ candidates }: { candidates: CandidateDisplay[] }) {
  const dims = ["Technical", "Experience", "Education", "Profile", "Red Flags"];
  const keys = ["tech", "exp", "edu", "prof", "flags"] as const;

  return (
    <>
      <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${candidates.length + 1}, 1fr)` }}>
        <div className="font-bold"></div>
        {candidates.map(c => (
          <div key={c.id} className="font-bold text-lg">
            {c.name}<br />
            <span className="text-sm font-normal">{c.composite}/100</span>
          </div>
        ))}
        {keys.map((key, idx) => {
          const scores = candidates.map(c => c.dimensionScores[key]);
          const maxScore = Math.max(...scores);
          return (
            <>
              <div key={`dim-${idx}`} className="font-medium py-2">{dims[idx]}</div>
              {candidates.map(c => {
                const isWinner = c.dimensionScores[key] === maxScore;
                return (
                  <div key={`${c.id}-${idx}`} className={`py-2 ${isWinner ? "bg-[#f0fdf4]" : ""} px-2 rounded`}>
                    {c.dimensionScores[key]}
                    <span className="text-xs text-[#64748b] block">{c.rationales[idx]}</span>
                  </div>
                );
              })}
            </>
          );
        })}
      </div>
      <div className="mt-6 p-4 bg-[#f8fafc] rounded-xl">
        <span className="inline-flex items-center bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">✦ AI</span>
        <p className="text-sm">
          Head-to-head: {candidates.map(c => c.name).join(" vs ")}. {candidates[0].name} leads in technical depth, while {candidates.length > 1 ? candidates[1].name : ""} shows broader experience. Overall, {candidates[0].name} is the stronger match.
        </p>
      </div>
      <div className="mt-4 p-4 border border-green-200 bg-green-50/30 rounded-xl">
        <span className="inline-flex items-center bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full">✦ AI</span>
        <span className="font-bold"> Recommendation:</span> Prioritize {candidates[0].name}. {candidates[0].aiRec}
      </div>
      <button className="mt-4 bg-primary text-white py-2 px-5 rounded-full text-sm">
        <FontAwesomeIcon icon={faFileExport} className="mr-1" /> Add to session notes
      </button>
    </>
  );
}