"use client";

import { useEffect, useState } from "react";
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
  faArrowLeft,
  faClock,
  faTrophy,
  faCode,
  faCalendar,
  faTags,
  faWandMagicSparkles,
  faStar,
  faScaleBalanced,
  faTriangleExclamation,
  faCircleInfo,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { faBell as farBell, faCalendar as farCalendar } from "@fortawesome/free-regular-svg-icons";
import { apiClient } from "@/lib/api";

// Types
interface CompareCandidate {
  id: string;
  name: string;
  role: string;
  years: number;
  matchScore: number;
  summary: string;
  technicalProficiency: {
    score: number;
    description: string;
  };
  experience: {
    years: number;
    description: string;
  };
  competencies: string[];
  aiCommentary: string;
}

interface CompareResponse {
  candidates: CompareCandidate[];
  recommendation: {
    primary: {
      name: string;
      reason: string;
    };
    alternative: {
      name: string;
      reason: string;
    };
    riskFlag: {
      name: string;
      reason: string;
    };
  };
  rubricWeights: {
    tech: number;
    experience: number;
    culture: number;
    flags: number;
  };
}

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchComparison = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get selected candidate IDs from URL query params
        const searchParams = new URLSearchParams(window.location.search);
        const candidateIds = searchParams.get("ids")?.split(",") || [];
        
        if (candidateIds.length < 2 || candidateIds.length > 3) {
          throw new Error("Please select 2-3 candidates to compare");
        }

        const response = await apiClient.post<CompareResponse>(`/sessions/${sessionId}/compare`, {
          candidates: candidateIds,
        });
        setData(response);
      } catch (err) {
        console.error("Comparison failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load comparison");
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparison();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f7fe] items-center justify-center">
        <div className="text-center max-w-md">
          <FontAwesomeIcon icon={faSpinner} spin className="text-5xl text-primary mb-6" />
          <h2 className="text-xl font-bold text-[#0f172a] mb-2">Generating AI Comparison</h2>
          <p className="text-sm text-[#64748b] mb-4">
            Gemini is analyzing the selected candidates against the rubric. This may take up to a minute.
          </p>
          <div className="h-2 bg-[#e2e8f0] rounded-full overflow-hidden w-64 mx-auto">
            <div className="h-full bg-primary rounded-full animate-[progress_5s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
          <p className="text-xs text-[#94a3b8] mt-4 flex items-center justify-center gap-1">
            <FontAwesomeIcon icon={faClock} /> Please wait...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-[#f4f7fe] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#0f172a] mb-2">Could not load comparison</h2>
          <p className="text-sm text-[#64748b] mb-4">{error || "Something went wrong"}</p>
          <button
            onClick={() => router.back()}
            className="bg-primary text-white px-6 py-2 rounded-full font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const candidates = data.candidates;
  const recommendation = data.recommendation;
  const gridCols = candidates.length === 2 ? "grid-cols-2" : "grid-cols-3";

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
              <FontAwesomeIcon icon={faSearch} className="text-[#94a3b8] text-[13px]" />
              <input placeholder="Search jobs, candidates..." className="border-0 bg-transparent py-1.5 px-2.5 text-[13px] w-full outline-none" />
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
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-primary transition-colors">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Back to Shortlist
            </button>
            <span className="text-xs font-medium text-slate-400 bg-white/70 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <FontAwesomeIcon icon={farCalendar} className="mr-1" />Rubric confirmed Apr 14
            </span>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Comparison Matrix</h1>
            <p className="text-base text-slate-500 mt-1 font-medium">
              Side‑by‑side evaluation of the selected candidates for Senior Full Stack Engineer
            </p>
          </div>

          {/* Candidate Cards Grid */}
          <div className={`grid ${gridCols} gap-5 items-stretch`}>
            {candidates.map((candidate, index) => {
              const isTopMatch = candidate.matchScore === Math.max(...candidates.map(c => c.matchScore));
              return (
                <div
                  key={candidate.id}
                  className={`compare-card rounded-3xl p-6 flex flex-col h-full relative transition-all ${
                    isTopMatch
                      ? "bg-[#EFF6FF] border-2 border-[#2563eb] top-match-glow"
                      : "bg-white border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {isTopMatch && (
                    <div className="absolute -top-1 right-5 bg-[#2563eb] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm z-10">
                      <FontAwesomeIcon icon={faTrophy} className="mr-1" />Top Match
                    </div>
                  )}

                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 break-words">{candidate.name}</h2>
                      <p className="text-sm text-slate-600 mt-1 font-medium">{candidate.role} · {candidate.years} yrs</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Match</div>
                      <div className="text-4xl font-black text-[#2563eb] leading-none">{candidate.matchScore}%</div>
                    </div>
                  </div>

                  <div className="mb-5 text-base text-slate-700 leading-relaxed">{candidate.summary}</div>

                  {/* Technical Proficiency */}
                  <div className="mb-4">
                    <div className="section-title text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
                      <FontAwesomeIcon icon={faCode} className="mr-1.5 text-blue-600" />Technical Proficiency
                    </div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-bold text-slate-800 text-lg">{candidate.technicalProficiency.score}<span className="text-sm font-normal text-slate-400">/10</span></span>
                    </div>
                    <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden mb-2">
                      <div className="progress-fill bg-[#2563eb] h-full rounded-full" style={{ width: `${candidate.technicalProficiency.score * 10}%` }} />
                    </div>
                    <p className="text-sm text-slate-600 italic">{candidate.technicalProficiency.description}</p>
                  </div>

                  {/* Years of Experience */}
                  <div className="mb-4">
                    <div className="section-title text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
                      <FontAwesomeIcon icon={faCalendar} className="mr-1.5 text-emerald-600" />Years of Experience
                    </div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-bold text-slate-800 text-lg">{candidate.experience.years}<span className="text-sm font-normal text-slate-400"> yrs</span></span>
                    </div>
                    <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden mb-2">
                      <div className="progress-fill bg-[#059669] h-full rounded-full" style={{ width: `${Math.min(candidate.experience.years * 10, 100)}%` }} />
                    </div>
                    <p className="text-sm text-slate-600 italic">{candidate.experience.description}</p>
                  </div>

                  {/* Core Competencies */}
                  <div className="mb-5">
                    <div className="section-title text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
                      <FontAwesomeIcon icon={faTags} className="mr-1.5 text-amber-600" />Core Competencies
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {candidate.competencies.map((comp, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white/80 text-slate-700 text-sm rounded-full border border-slate-200 shadow-sm">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Commentary */}
                  <div className="mt-auto pt-4 border-t border-slate-200">
                    <p className="text-base text-slate-600 italic leading-relaxed">
                      <span className="text-purple-600 font-bold not-italic mr-2 text-sm tracking-wide">
                        <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-1" />AI
                      </span>
                      "{candidate.aiCommentary}"
                    </p>
                  </div>

                  <button className="mt-5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3.5 px-6 rounded-xl text-base shadow-md hover:shadow-lg transition-all w-full">
                    <FontAwesomeIcon icon={faFileContract} className="mr-2" />Select {candidate.name.split(" ")[0]}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Sieve AI Recommendation */}
          <div className="mt-8 rec-card rounded-3xl p-8 shadow-md bg-gradient-to-br from-white to-[#fafcff] border-2 border-[#e0e7ff]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                <FontAwesomeIcon icon={faStar} className="text-xl" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">Sieve AI Recommendation</h2>
            </div>
            <div className={`grid md:grid-cols-3 gap-6`}>
              <div className="bg-white/60 p-5 rounded-2xl border border-blue-100">
                <p className="font-bold text-slate-800 text-lg mb-3 flex items-center">
                  <FontAwesomeIcon icon={faTrophy} className="text-blue-600 mr-2" />
                  Primary choice: {recommendation.primary.name}
                </p>
                <p className="text-base text-slate-600 leading-relaxed">{recommendation.primary.reason}</p>
              </div>
              <div className="bg-white/60 p-5 rounded-2xl border border-emerald-200">
                <p className="font-bold text-slate-800 text-lg mb-3 flex items-center">
                  <FontAwesomeIcon icon={faScaleBalanced} className="text-emerald-600 mr-2" />
                  Balanced alternative: {recommendation.alternative.name}
                </p>
                <p className="text-base text-slate-600 leading-relaxed">{recommendation.alternative.reason}</p>
              </div>
              <div className="bg-white/60 p-5 rounded-2xl border border-amber-200">
                <p className="font-bold text-slate-800 text-lg mb-3 flex items-center">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-600 mr-2" />
                  Risk flag: {recommendation.riskFlag.name}
                </p>
                <p className="text-base text-slate-600 leading-relaxed">{recommendation.riskFlag.reason}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-8 rounded-xl text-base shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                <FontAwesomeIcon icon={faFileContract} className="mr-2" /> Confirm Selection & Generate Offer Letter
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-5 border-t border-slate-200 pt-5 flex items-center gap-2">
              <FontAwesomeIcon icon={faCircleInfo} className="text-blue-500" />
              Recommendation based on rubric weights (Tech {data.rubricWeights.tech}%, Experience {data.rubricWeights.experience}%, Culture {data.rubricWeights.culture}%, Flags {data.rubricWeights.flags}%).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}