"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faWandMagicSparkles,
  faPenToSquare,
  faPencil,
  faCircleCheck,
  faIdBadge,
  faBuilding,
  faLocationDot,
  faChartSimple,
  faTags,
  faAlignLeft,
  faWifi,
  faCodeBranch,
  faSeedling,
  faBolt,
  faStar,
  faCrown,
  faSliders,
  faLock,
  faArrowLeft,
  faPlus,
  faTimes,
  faCheck,
  faSpinner,
  faChevronDown,
  faSearch,
  faBell,
  faFileExport,
  faLayerGroup,
  faHouse,
  faBriefcase,
  faUserGroup,
  faBrain,
  faBookOpen,
  faPlug,
  faBars,
  faCode,
  faGraduationCap,
  faCircleUser,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import {
  faBell as farBell,
  faBuilding as farBuilding,
  faStar as farStar,
  faFileLines as farFileLines,
  faPenToSquare as farPenToSquare,
  faIdBadge as farIdBadge,
} from "@fortawesome/free-regular-svg-icons";
import { apiClient } from "@/lib/api";
import type { Job, RubricDimension, Rubric } from "@/types";

// Types for the wizard
interface DimensionState {
  name: string;
  desc: string;
  tag: string;
  color: string;
  icon: any;
  bgColor: string;
  iconColor: string;
  points: number;
}

const DEFAULT_DIMENSIONS: DimensionState[] = [
  {
    name: "Technical Skills Match",
    desc: "Relevance of tech stack and tools",
    tag: "Technical Skills",
    color: "bg-[#eff6ff] text-[#2563eb]",
    icon: faCode,
    bgColor: "#eff6ff",
    iconColor: "#2563eb",
    points: 30,
  },
  {
    name: "Experience Relevance",
    desc: "Years and domain expertise",
    tag: "Experience",
    color: "bg-[#f0fdf4] text-[#16a34a]",
    icon: faBriefcase,
    bgColor: "#f0fdf4",
    iconColor: "#16a34a",
    points: 20,
  },
  {
    name: "Education Alignment",
    desc: "Degree/certification match",
    tag: "Education",
    color: "bg-[#fef9c3] text-[#92400e]",
    icon: faGraduationCap,
    bgColor: "#fef9c3",
    iconColor: "#92400e",
    points: 20,
  },
  {
    name: "Profile Completeness",
    desc: "Portfolio, links, activity",
    tag: "Profile",
    color: "bg-[#f5f3ff] text-[#7c3aed]",
    icon: faCircleUser,
    bgColor: "#f5f3ff",
    iconColor: "#7c3aed",
    points: 10,
  },
  {
    name: "Red Flag Indicators",
    desc: "Gaps, job hopping, etc",
    tag: "Red Flags",
    color: "bg-[#fee2e2] text-[#b91c1c]",
    icon: faTriangleExclamation,
    bgColor: "#fee2e2",
    iconColor: "#b91c1c",
    points: 20,
  },
];

export default function NewJobPage() {
  const router = useRouter();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<"paste" | "manual">("paste");

  // Step 1 state
  const [jdText, setJdText] = useState("");
  const [jobTitle, setJobTitle] = useState("Senior Full Stack Engineer");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("Remote");
  const [experienceLevel, setExperienceLevel] = useState("Senior");
  const [tags, setTags] = useState<string[]>([
    "React",
    "Node.js",
    "TypeScript",
    "AWS",
  ]);
  const [manualDesc, setManualDesc] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Step 2 state
  const [dimensions, setDimensions] =
    useState<DimensionState[]>(DEFAULT_DIMENSIONS);
  const [dealbreakers, setDealbreakers] = useState<string[]>([
    "5+ years experience",
    "Full stack (React + Node.js)",
    "Must be eligible to work remotely",
  ]);
  const [niceToHaves, setNiceToHaves] = useState<string[]>([
    "GraphQL experience",
    "Open source contributions",
  ]);
  const [editingDimensionIdx, setEditingDimensionIdx] = useState<number | null>(
    null,
  );
  const [showDealbreakerInput, setShowDealbreakerInput] = useState(false);
  const [showNiceToHaveInput, setShowNiceToHaveInput] = useState(false);
  const [newDealbreaker, setNewDealbreaker] = useState("");
  const [newNiceToHave, setNewNiceToHave] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [extractionBannerVisible, setExtractionBannerVisible] = useState(false);
  const [greeting, setGreeting] = useState("Good morning");

  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Calculate total points
  const totalPoints = dimensions.reduce((sum, d) => sum + d.points, 0);
  const remainingPoints = 100 - totalPoints;
  const isBalanced = totalPoints === 100;

  // Validate step 1
  const isStep1Valid =
    mode === "paste"
      ? jdText.trim().length > 0
      : jobTitle.trim().length > 0 && tags.length >= 2;

  // Create job (Step 1 completion)
  const handleCreateJob = async () => {
    setIsLoading(true);
    try {
      const payload = {
        title: jobTitle,
        rawJD:
          mode === "paste"
            ? jdText
            : `Title: ${jobTitle}\nDepartment: ${department}\nLocation: ${location}\nLevel: ${experienceLevel}\nRequirements: ${tags.join(", ")}\n\n${manualDesc}`,
      };

      const job = await apiClient.post<Job>("/jobs", payload);
      setCreatedJobId(job._id);

      // Move to step 2 and generate rubric
      setCurrentStep(2);
      await generateRubric(job._id);
    } catch (error) {
      console.error("Failed to create job:", error);
      alert("Failed to create job. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI rubric
  const generateRubric = async (jobId: string) => {
    setIsGeneratingRubric(true);
    try {
      const response = await apiClient.post<{ job: Job }>(
        `/jobs/${jobId}/parse-rubric`,
      );

      if (response.job.rubric) {
        // Update dimensions from AI response
        const aiRubric = response.job.rubric;
        const newDimensions = dimensions.map((dim, idx) => {
          const aiDim = aiRubric.dimensions[idx];
          return {
            ...dim,
            name: aiDim?.name || dim.name,
            desc: aiDim?.description || dim.desc,
            points: aiDim?.weight || dim.points,
          };
        });
        setDimensions(newDimensions);
        setDealbreakers(aiRubric.dealbreakers || dealbreakers);
        setNiceToHaves(aiRubric.niceToHave || niceToHaves);
        setExtractionBannerVisible(true);
      }
    } catch (error) {
      console.error("Failed to generate rubric:", error);
      // Keep default dimensions if AI fails
    } finally {
      setIsGeneratingRubric(false);
    }
  };

  // Handle paste JD analysis
  const handleAnalyzePaste = async () => {
    if (!jdText.trim()) return;

    // Prefill with demo data (in production, this would call AI)
    setIsLoading(true);
    setTimeout(() => {
      setJobTitle("Senior Full Stack Engineer");
      setDepartment("Engineering");
      setLocation("Remote");
      setExperienceLevel("Senior");
      setTags(["React", "Node.js", "TypeScript", "PostgreSQL"]);
      setExtractionBannerVisible(true);
      setMode("manual");
      setIsLoading(false);
    }, 2000);
  };

  // Confirm rubric and navigate to applicants
  const handleConfirmRubric = async () => {
    if (!isBalanced || !createdJobId) return;

    setIsLoading(true);
    try {
      const rubric: Rubric = {
        dimensions: dimensions.map((d) => ({
          name: d.name,
          weight: d.points,
          keywords: [],
        })),
        dealbreakers,
        niceToHave: niceToHaves,
      };

      await apiClient.put(`/jobs/${createdJobId}/rubric`, { rubric });

      // Navigate to applicant ingestion
      router.push(`/jobs/${createdJobId}/applicants`);
    } catch (error) {
      console.error("Failed to save rubric:", error);
      alert("Failed to save rubric. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dimension point handlers
  const updateDimensionPoints = (idx: number, delta: number) => {
    const newDimensions = [...dimensions];
    const newPoints = newDimensions[idx].points + delta;
    if (newPoints >= 0 && newPoints <= 60) {
      newDimensions[idx].points = newPoints;
      setDimensions(newDimensions);
    }
  };

  // Tag handlers
  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val) && tags.length < 10) {
      setTags([...tags, val]);
      setTagInput("");
    }
  };

  const removeTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  // Dealbreaker handlers
  const addDealbreaker = () => {
    if (newDealbreaker.trim()) {
      setDealbreakers([...dealbreakers, newDealbreaker.trim()]);
      setNewDealbreaker("");
      setShowDealbreakerInput(false);
    }
  };

  const removeDealbreaker = (idx: number) => {
    setDealbreakers(dealbreakers.filter((_, i) => i !== idx));
  };

  // Nice to have handlers
  const addNiceToHave = () => {
    if (newNiceToHave.trim()) {
      setNiceToHaves([...niceToHaves, newNiceToHave.trim()]);
      setNewNiceToHave("");
      setShowNiceToHaveInput(false);
    }
  };

  const removeNiceToHave = (idx: number) => {
    setNiceToHaves(niceToHaves.filter((_, i) => i !== idx));
  };

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
              className="bg-primary border-0 rounded-full py-2 px-[18px] font-bold text-xs text-white flex items-center gap-1.5 shadow-[0_4px_14px_-4px_rgba(37,99,235,0.45)] hover:bg-primary-dark"
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
          <div className="text-[13px] text-[#475569] font-medium mb-1">
            {greeting}, Elvis · New Session
          </div>

          <div className="mb-[18px]">
            <h2 className="font-bold text-[26px] text-[#0f172a]">
              Create Session
            </h2>
            <p className="text-[#475569] text-[13px]">
              Define the job brief and set scoring weights.
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center max-w-[400px] mx-auto mb-6">
            <div className="flex items-center w-full">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${currentStep === 1 ? "bg-primary text-white border-2 border-primary" : "bg-[#10b981] text-white border-2 border-[#10b981]"}`}
                >
                  {currentStep === 1 ? "1" : <FontAwesomeIcon icon={faCheck} />}
                </div>
                <span
                  className={`text-xs font-bold mt-1.5 ${currentStep === 1 ? "text-[#0f172a]" : "text-[#0f172a]"}`}
                >
                  Job Brief
                </span>
              </div>
              <div
                className={`flex-1 h-0.5 mx-1 ${currentStep === 2 ? "bg-[#10b981]" : "bg-[#e2e8f0]"}`}
              />
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${currentStep === 2 ? "bg-primary text-white border-2 border-primary" : "bg-white border-2 border-[#e2e8f0] text-[#94a3b8]"}`}
                >
                  2
                </div>
                <span
                  className={`text-xs font-medium mt-1.5 ${currentStep === 2 ? "text-[#0f172a] font-bold" : "text-[#94a3b8]"}`}
                >
                  Scoring Rubric
                </span>
              </div>
            </div>
          </div>

          {/* Step 1: Job Brief */}
          {currentStep === 1 && (
            <div className="w-full max-w-[720px] mx-auto">
              {/* Mode toggle */}
              <div className="flex justify-end mb-3">
                <div className="inline-flex bg-[#f1f5f9] rounded-full p-0.5">
                  <button
                    onClick={() => setMode("paste")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold ${mode === "paste" ? "bg-primary text-white" : "bg-transparent text-[#475569]"}`}
                  >
                    Paste JD
                  </button>
                  <button
                    onClick={() => setMode("manual")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold ${mode === "manual" ? "bg-primary text-white" : "bg-transparent text-[#475569]"}`}
                  >
                    Manual Form
                  </button>
                </div>
              </div>

              {/* Paste JD Card */}
              {mode === "paste" && (
                <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-5 relative">
                  <h3 className="text-[22px] font-extrabold text-[#0f172a] mb-1 flex items-center">
                    <FontAwesomeIcon
                      icon={farFileLines}
                      className="text-[#2563eb] text-lg mr-2.5"
                    />
                    Paste Job Description
                  </h3>
                  <p className="text-[13px] text-[#475569] mb-4 flex items-center">
                    <FontAwesomeIcon
                      icon={faWandMagicSparkles}
                      className="text-[#2563eb] text-[10px] mr-1.5"
                    />
                    Gemini will extract role details and build a scoring rubric
                    automatically.
                  </p>

                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    className="w-full min-h-[220px] border border-[#e2e8f0] rounded-xl p-4 text-sm resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Paste your full job description here..."
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-[#94a3b8]">
                      {jdText.length} characters
                    </span>
                    <button
                      onClick={handleAnalyzePaste}
                      disabled={!jdText.trim() || isLoading}
                      className="bg-primary text-white font-bold py-2.5 px-6 rounded-full text-sm flex items-center gap-1.5 shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="mr-1"
                          />{" "}
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Extract with Gemini{" "}
                          <span className="inline-block animate-pulse">✦</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Form Card */}
              {mode === "manual" && (
                <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-5 pb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-[22px] font-extrabold text-[#0f172a] mb-0.5 flex items-center">
                        <FontAwesomeIcon
                          icon={farPenToSquare}
                          className="text-[#2563eb] text-lg mr-2.5"
                        />
                        Manual Job Details
                      </h3>
                      <p className="text-[13px] text-[#475569] flex items-center">
                        <FontAwesomeIcon
                          icon={faPencil}
                          className="text-[#2563eb] text-[10px] mr-1.5"
                        />
                        Fill in the role information manually.
                      </p>
                    </div>
                  </div>

                  {extractionBannerVisible && (
                    <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-2.5 mb-4 text-[13px] text-[#166534] flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faCircleCheck}
                        className="text-[#10b981]"
                      />
                      Gemini extracted the role details below.
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1">
                        <FontAwesomeIcon
                          icon={farIdBadge}
                          className="text-primary text-[11px] mr-1.5"
                        />
                        Job Title *
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="e.g. Senior Frontend Developer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1">
                        <FontAwesomeIcon
                          icon={farBuilding}
                          className="text-primary text-[11px] mr-1.5"
                        />
                        Department
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Engineering"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1">
                        <FontAwesomeIcon
                          icon={faLocationDot}
                          className="text-primary text-[11px] mr-1.5"
                        />
                        Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="e.g. Remote"
                      />
                      <div className="flex gap-2 mt-2">
                        {["Remote", "Hybrid", "On-site"].map((loc) => (
                          <button
                            key={loc}
                            onClick={() => setLocation(loc)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${location === loc ? "bg-primary text-white" : "bg-[#f1f5f9] text-[#475569]"}`}
                          >
                            {loc === "Remote" && (
                              <FontAwesomeIcon
                                icon={faWifi}
                                className="text-[10px] mr-1"
                              />
                            )}
                            {loc === "Hybrid" && (
                              <FontAwesomeIcon
                                icon={faCodeBranch}
                                className="text-[10px] mr-1"
                              />
                            )}
                            {loc === "On-site" && (
                              <FontAwesomeIcon
                                icon={farBuilding}
                                className="text-[10px] mr-1"
                              />
                            )}
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1">
                        <FontAwesomeIcon
                          icon={faChartSimple}
                          className="text-primary text-[11px] mr-1.5"
                        />
                        Experience Level
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {["Junior", "Mid", "Senior", "Lead"].map((exp) => (
                          <button
                            key={exp}
                            onClick={() => setExperienceLevel(exp)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${experienceLevel === exp ? "bg-primary text-white" : "bg-[#f1f5f9] text-[#475569]"}`}
                          >
                            {exp === "Junior" && (
                              <FontAwesomeIcon
                                icon={faSeedling}
                                className="text-[10px] mr-1"
                              />
                            )}
                            {exp === "Mid" && (
                              <FontAwesomeIcon
                                icon={faBolt}
                                className="text-[10px] mr-1"
                              />
                            )}
                            {exp === "Senior" && (
                              <FontAwesomeIcon
                                icon={farStar}
                                className="text-[10px] mr-1"
                              />
                            )}
                            {exp === "Lead" && (
                              <FontAwesomeIcon
                                icon={faCrown}
                                className="text-[10px] mr-1"
                              />
                            )}
                            {exp}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1">
                        <FontAwesomeIcon
                          icon={faTags}
                          className="text-primary text-[11px] mr-1.5"
                        />
                        Key Requirements * (min 2)
                      </label>
                      <div className="border border-[#e2e8f0] rounded-xl p-2 flex flex-wrap gap-2 items-center">
                        {tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-[#eff6ff] text-[#2563eb] text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
                          >
                            {tag}
                            <FontAwesomeIcon
                              icon={faTimes}
                              className="cursor-pointer hover:text-red-500"
                              onClick={() => removeTag(idx)}
                            />
                          </span>
                        ))}
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addTag())
                          }
                          className="flex-1 min-w-[120px] text-sm py-1 outline-none"
                          placeholder="Type skill and press Enter"
                        />
                      </div>
                      <p className="text-[10px] text-[#94a3b8] mt-1">
                        Max 10 tags
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1">
                        <FontAwesomeIcon
                          icon={faAlignLeft}
                          className="text-primary text-[11px] mr-1.5"
                        />
                        Job Description (optional)
                      </label>
                      <textarea
                        value={manualDesc}
                        onChange={(e) => setManualDesc(e.target.value)}
                        className="w-full border border-[#e2e8f0] rounded-xl p-3 text-sm min-h-[80px] resize-y"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleCreateJob}
                      disabled={!isStep1Valid || isLoading}
                      className="bg-primary text-white font-bold py-2.5 px-6 rounded-full text-sm flex items-center gap-1.5 shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className="mr-1"
                          />{" "}
                          Creating...
                        </>
                      ) : (
                        <>
                          Continue to Scoring Rubric <span>✦</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Scoring Rubric */}
          {currentStep === 2 && (
            <div className="w-full max-w-[800px] mx-auto space-y-4">
              {/* Summary Card */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-[#0f172a]">
                      {jobTitle}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2.5 py-1 bg-[#f1f5f9] text-[#475569] text-xs font-medium rounded-full">
                        <FontAwesomeIcon
                          icon={farBuilding}
                          className="text-[10px] mr-1"
                        />
                        {department}
                      </span>
                      <span className="px-2.5 py-1 bg-[#f1f5f9] text-[#475569] text-xs font-medium rounded-full">
                        <FontAwesomeIcon
                          icon={faLocationDot}
                          className="text-[10px] mr-1"
                        />
                        {location}
                      </span>
                      <span className="px-2.5 py-1 bg-[#f1f5f9] text-[#475569] text-xs font-medium rounded-full">
                        <FontAwesomeIcon
                          icon={faChartSimple}
                          className="text-[10px] mr-1"
                        />
                        {experienceLevel}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#f5f3ff] text-[#7c3aed] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#e9d5ff]">
                      <FontAwesomeIcon
                        icon={faWandMagicSparkles}
                        className="text-[8px] mr-1"
                      />
                      AI
                    </span>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faPencil} /> Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Scoring Weights Card */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
                <h3 className="text-lg font-extrabold text-[#0f172a] flex items-center">
                  <FontAwesomeIcon
                    icon={faSliders}
                    className="text-primary mr-2"
                  />
                  Scoring Weights
                </h3>
                <p className="text-[13px] text-[#475569] mb-3">
                  Allocate 100 points across the five dimensions.
                </p>

                <div className="flex justify-center mb-4">
                  <div
                    className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${
                      isBalanced
                        ? "bg-[#ecfdf5] text-[#10b981]"
                        : remainingPoints < 0
                          ? "bg-[#fee2e2] text-[#b91c1c]"
                          : "bg-[#f1f5f9] text-[#475569]"
                    }`}
                  >
                    {isBalanced ? (
                      <>
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className="mr-1.5"
                        />{" "}
                        Balanced — ready to confirm
                      </>
                    ) : remainingPoints < 0 ? (
                      `Over by ${-remainingPoints} pts`
                    ) : (
                      `${remainingPoints} pts remaining`
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {dimensions.map((dim, idx) => {
                    const segments = dim.points / 10;
                    const isMax = dim.points >= 60;
                    const isMin = dim.points <= 0;
                    const plusDisabled = isMax || remainingPoints <= 0;
                    const minusDisabled = isMin;

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              marginRight: 12,
                              background: dim.bgColor,
                              color: dim.iconColor,
                            }}
                          >
                            <FontAwesomeIcon icon={dim.icon} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[15px] text-[#0f172a]">
                              {dim.name}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {editingDimensionIdx === idx ? (
                                <input
                                  type="text"
                                  defaultValue={dim.desc}
                                  onBlur={(e) => {
                                    const newDimensions = [...dimensions];
                                    newDimensions[idx].desc = e.target.value;
                                    setDimensions(newDimensions);
                                    setEditingDimensionIdx(null);
                                  }}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    (e.currentTarget as HTMLInputElement).blur()
                                  }
                                  className="text-xs border border-[#e2e8f0] rounded px-2 py-1"
                                  autoFocus
                                />
                              ) : (
                                <>
                                  <span className="text-xs text-[#475569]">
                                    {dim.desc}
                                  </span>
                                  <FontAwesomeIcon
                                    icon={faPencil}
                                    className="text-[10px] text-[#94a3b8] cursor-pointer hover:text-primary"
                                    onClick={() => setEditingDimensionIdx(idx)}
                                  />
                                </>
                              )}
                            </div>
                            <span
                              className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${dim.color}`}
                            >
                              {dim.tag}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => updateDimensionPoints(idx, -10)}
                            disabled={minusDisabled}
                            className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-lg hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            −
                          </button>
                          <div className="flex gap-[3px] mx-1">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-7 h-7 rounded-md ${i < segments ? "bg-primary" : "bg-[#f1f5f9]"}`}
                              />
                            ))}
                          </div>
                          <button
                            onClick={() => updateDimensionPoints(idx, 10)}
                            disabled={plusDisabled}
                            className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-lg hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                          <span className="font-bold text-[15px] text-[#0f172a] min-w-[50px] text-right">
                            {dim.points} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dealbreakers */}
                <div className="mt-5 bg-white rounded-2xl border border-[#e2e8f0] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-extrabold text-[#0f172a]">
                      Dealbreakers
                    </h3>
                    <span className="bg-[#f5f3ff] text-[#7c3aed] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#e9d5ff]">
                      <FontAwesomeIcon
                        icon={faWandMagicSparkles}
                        className="text-[8px] mr-1"
                      />
                      AI
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mb-3">
                    Requirements that automatically disqualify a candidate.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {dealbreakers.map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] text-xs font-semibold px-3 py-1.5 rounded-full"
                      >
                        {item}
                        <FontAwesomeIcon
                          icon={faTimes}
                          className="ml-2 cursor-pointer hover:text-red-700"
                          onClick={() => removeDealbreaker(i)}
                        />
                      </span>
                    ))}
                  </div>

                  {showDealbreakerInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newDealbreaker}
                        onChange={(e) => setNewDealbreaker(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addDealbreaker()}
                        placeholder="e.g. 5+ years experience"
                        className="flex-1 border border-[#e2e8f0] rounded-full px-4 py-1.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={addDealbreaker}
                        className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDealbreakerInput(true)}
                      className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-[10px]" />{" "}
                      Add dealbreaker
                    </button>
                  )}
                </div>

                {/* Nice to Have */}
                <div className="mt-4 bg-white rounded-2xl border border-[#e2e8f0] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-extrabold text-[#0f172a]">
                      Nice to Have
                    </h3>
                    <span className="bg-[#f5f3ff] text-[#7c3aed] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#e9d5ff]">
                      <FontAwesomeIcon
                        icon={faWandMagicSparkles}
                        className="text-[8px] mr-1"
                      />
                      AI
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mb-3">
                    Skills that strengthen a candidate's profile.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {niceToHaves.map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] text-xs font-semibold px-3 py-1.5 rounded-full"
                      >
                        {item}
                        <FontAwesomeIcon
                          icon={faTimes}
                          className="ml-2 cursor-pointer hover:text-blue-800"
                          onClick={() => removeNiceToHave(i)}
                        />
                      </span>
                    ))}
                  </div>

                  {showNiceToHaveInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newNiceToHave}
                        onChange={(e) => setNewNiceToHave(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addNiceToHave()}
                        placeholder="e.g. GraphQL experience"
                        className="flex-1 border border-[#e2e8f0] rounded-full px-4 py-1.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={addNiceToHave}
                        className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNiceToHaveInput(true)}
                      className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-[10px]" />{" "}
                      Add nice to have
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-5 pt-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-sm font-semibold text-[#475569] hover:text-primary"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-1.5" />{" "}
                    Back to Job Brief
                  </button>
                  <button
                    onClick={handleConfirmRubric}
                    disabled={!isBalanced || isLoading || isGeneratingRubric}
                    className="bg-primary text-white font-bold py-2.5 px-6 rounded-full text-sm shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          className="mr-1.5"
                        />{" "}
                        Saving...
                      </>
                    ) : isGeneratingRubric ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          className="mr-1.5"
                        />{" "}
                        Generating AI Rubric...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faLock} className="mr-1.5" />{" "}
                        Confirm Rubric & Start Session
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
