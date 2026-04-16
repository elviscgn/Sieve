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
  faChevronUp,
  faBars,
  faFileContract,
  faPen,
  faPlay,
  faClock,
  faDatabase,
  faUserPlus,
  faCloudUploadAlt,
  faArrowRight,
  faTimes,
  faCheck,
  faCircleInfo,
  faLock,
  faCode,
  faGraduationCap,
  faUser,
  faFlag,
  faSpinner,
  faCircleCheck,
  faTriangleExclamation,
  faCommentDots,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { faBell as farBell, faBuilding as farBuilding } from "@fortawesome/free-regular-svg-icons";
import { apiClient } from "@/lib/api";
import type { Job, Applicant, UmuravaProfile } from "@/types";
import Chart from "chart.js/auto";

// Types for the page
interface CandidateDisplay {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  role: string;
  skills: string[];
  years: string;
  status: "evaluated" | "pending" | "evaluating";
  rank?: number;
  compositeScore?: number;
  scoreColor?: string;
  confidence?: "High Confidence" | "Medium Confidence" | "Low Confidence";
  confidenceBg?: string;
  confidenceText?: string;
  redFlag?: string | null;
  dimensionScores?: {
    tech: number;
    exp: number;
    edu: number;
    profile: number;
    rf: number;
  };
  strengths?: string[];
  gaps?: string[];
  aiRec?: string;
  rationales?: string[];
  qaQ?: string;
  qaA?: string;
}

// Mock pool candidates for the "Add Candidates" modal
const POOL_CANDIDATES = [
  { id: "pool1", name: "Chidi Okonkwo", role: "Backend", years: "7yrs", match: "Strong match" },
  { id: "pool2", name: "Zanele Dlamini", role: "Frontend", years: "5yrs", match: "Adjacent" },
  { id: "pool3", name: "Tendai Mutasa", role: "Full Stack", years: "9yrs", match: "Potential" },
];

export default function JobApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // State
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<CandidateDisplay[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateDisplay[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "evaluated" | "pending">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isScreening, setIsScreening] = useState(false);
  const [screeningProgress, setScreeningProgress] = useState({ evaluated: 0, total: 0 });
  
  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rubricExpanded, setRubricExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalTab, setAddModalTab] = useState<"pool" | "upload">("pool");
  const [selectedPoolCandidates, setSelectedPoolCandidates] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Candidate panel state
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDisplay | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const radarChartRef = useRef<Chart | null>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);

  // Greeting
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Load job and candidates
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load job
        const jobData = await apiClient.get<Job>(`/jobs/${jobId}`);
        setJob(jobData);

        // Load applicants
        const applicants = await apiClient.get<Applicant[]>(`/jobs/${jobId}/applicants`);
        
        // Transform to display format
        const displayCandidates: CandidateDisplay[] = applicants.map((app, idx) => {
          const profile = app.profile;
          const evalData = app.evaluation;
          const isEvaluated = !!evalData;
          
          const firstName = profile["First Name"] || "";
          const lastName = profile["Last Name"] || "";
          const name = `${firstName} ${lastName}`.trim();
          const initials = (firstName[0] || "") + (lastName[0] || "");
          
          const skills = profile.Skills?.map(s => s.name).slice(0, 3) || [];
          const years = profile["Work Experience"]?.[0]?.["Start Date"] 
            ? `${new Date().getFullYear() - new Date(profile["Work Experience"][0]["Start Date"]).getFullYear()}yrs`
            : "N/A";
          
          const role = profile["Work Experience"]?.[0]?.["Job Title"] || "Candidate";
          
          // Determine score color
          let scoreColor = "#10b981";
          if (evalData) {
            if (evalData.compositeScore >= 70) scoreColor = "#10b981";
            else if (evalData.compositeScore >= 50) scoreColor = "#f59e0b";
            else scoreColor = "#ef4444";
          }
          
          return {
            id: app._id,
            name,
            initials,
            avatarBg: isEvaluated ? "#dbeafe" : "#f1f5f9",
            avatarColor: isEvaluated ? "#1e40af" : "#64748b",
            role,
            skills,
            years,
            status: isEvaluated ? "evaluated" : "pending",
            rank: isEvaluated ? idx + 1 : undefined,
            compositeScore: evalData?.compositeScore,
            scoreColor,
            confidence: evalData?.confidence === "high" ? "High Confidence" 
              : evalData?.confidence === "medium" ? "Medium Confidence" 
              : evalData?.confidence === "low" ? "Low Confidence" 
              : undefined,
            confidenceBg: evalData?.confidence === "high" ? "#dcfce7" 
              : evalData?.confidence === "medium" ? "#fef3c7" 
              : "#fee2e2",
            confidenceText: evalData?.confidence === "high" ? "#166534" 
              : evalData?.confidence === "medium" ? "#92400e" 
              : "#991b1b",
            redFlag: evalData?.flags?.[0] || null,
            dimensionScores: evalData ? {
              tech: evalData.dimensions.find(d => d.name.includes("Technical"))?.score || 0,
              exp: evalData.dimensions.find(d => d.name.includes("Experience"))?.score || 0,
              edu: evalData.dimensions.find(d => d.name.includes("Education"))?.score || 0,
              profile: evalData.dimensions.find(d => d.name.includes("Profile"))?.score || 0,
              rf: evalData.dimensions.find(d => d.name.includes("Red Flag"))?.score || 0,
            } : undefined,
            strengths: evalData?.strengths || [],
            gaps: evalData?.gaps || [],
            aiRec: evalData?.recommendation || "",
            rationales: evalData?.dimensions.map(d => d.rationale) || [],
          };
        });

        setCandidates(displayCandidates);
        setFilteredCandidates(displayCandidates);
        
        // Update screening progress
        const evaluated = displayCandidates.filter(c => c.status === "evaluated").length;
        setScreeningProgress({ evaluated, total: displayCandidates.length });
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [jobId]);

  // Filter candidates
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredCandidates(candidates);
    } else {
      setFilteredCandidates(candidates.filter(c => c.status === activeFilter));
    }
  }, [activeFilter, candidates]);

  // Animate score rings (would be done with canvas in real implementation)
  useEffect(() => {
    // This would animate the score rings - simplified for now
  }, [filteredCandidates]);

  // Run screening
  const handleRunScreening = async () => {
    if (!jobId) return;
    
    setIsScreening(true);
    try {
      await apiClient.post(`/sessions`, { jobId });
      
      // Start SSE connection for progress
      const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${jobId}/stream`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setScreeningProgress({
          evaluated: data.evaluatedCount,
          total: data.totalApplicants,
        });
        
        // Update candidate status
        setCandidates(prev => prev.map(c => 
          c.id === data.applicantId 
            ? { ...c, status: "evaluated", compositeScore: data.score }
            : c
        ));
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        setIsScreening(false);
      };
      
      // Navigate to screening page after starting
      setTimeout(() => {
        router.push(`/sessions/${jobId}/screening`);
      }, 500);
    } catch (error) {
      console.error("Failed to start screening:", error);
      setIsScreening(false);
    }
  };

  // Add candidates from pool
  const handleAddFromPool = async () => {
    if (selectedPoolCandidates.length === 0) return;
    
    setIsLoading(true);
    try {
      // In production, this would fetch the actual profiles
      const profiles: UmuravaProfile[] = selectedPoolCandidates.map(id => ({
        "First Name": "Pool",
        "Last Name": "Candidate",
        "Email": "candidate@example.com",
        "Phone": "",
        "Location": "",
        "Summary": "",
        "Skills": [],
        "Work Experience": [],
        "Education": [],
        "Languages": [],
        "Certifications": [],
        "Projects": [],
      }));
      
      await apiClient.post(`/jobs/${jobId}/applicants`, {
        source: "umurava_pool",
        applicants: profiles,
      });
      
      setShowAddModal(false);
      setSelectedPoolCandidates([]);
      
      // Reload candidates
      window.location.reload();
    } catch (error) {
      console.error("Failed to add candidates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PDF upload
  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== "application/pdf") return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      
      await apiClient.post(`/jobs/${jobId}/upload-resume`, formData, {
        headers: {}, // Let browser set Content-Type
      });
      
      setShowAddModal(false);
      
      // Reload candidates
      window.location.reload();
    } catch (error) {
      console.error("Failed to upload PDF:", error);
    } finally {
      setIsUploading(false);
      setDragActive(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  // Open candidate panel
  const openCandidatePanel = (candidate: CandidateDisplay) => {
    if (candidate.status !== "evaluated") return;
    setSelectedCandidate(candidate);
    setChatMessages([
      { role: "user", content: candidate.qaQ || `What is ${candidate.name}'s biggest strength?` },
      { role: "ai", content: candidate.qaA || "Based on the evaluation, this candidate shows strong technical aptitude." },
    ]);
    setPanelOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedCandidate(null);
    document.body.style.overflow = "";
    if (radarChartRef.current) {
      radarChartRef.current.destroy();
      radarChartRef.current = null;
    }
  };

  // Render radar chart when panel opens
  useEffect(() => {
    if (panelOpen && selectedCandidate?.dimensionScores && radarCanvasRef.current) {
      const ctx = radarCanvasRef.current.getContext("2d");
      if (ctx) {
        if (radarChartRef.current) radarChartRef.current.destroy();
        
        radarChartRef.current = new Chart(ctx, {
          type: "radar",
          data: {
            labels: ["Technical", "Experience", "Education", "Profile", "Red Flags"],
            datasets: [{
              data: [
                selectedCandidate.dimensionScores.tech,
                selectedCandidate.dimensionScores.exp,
                selectedCandidate.dimensionScores.edu,
                selectedCandidate.dimensionScores.profile,
                selectedCandidate.dimensionScores.rf,
              ],
              backgroundColor: "rgba(37,99,235,0.08)",
              borderColor: "#2563eb",
              borderWidth: 2.5,
              pointBackgroundColor: ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#dc2626"],
              pointBorderColor: "white",
              pointBorderWidth: 2,
              pointRadius: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              r: {
                min: 0,
                max: 100,
                ticks: { stepSize: 25 },
                grid: { color: "#f1f5f9" },
              },
            },
            plugins: { legend: { display: false } },
          },
        });
      }
    }
  }, [panelOpen, selectedCandidate]);

  // Send chat message
  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedCandidate) return;
    
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsStreaming(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applicants/${selectedCandidate.id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, question: userMessage }),
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";
      
      setChatMessages(prev => [...prev, { role: "ai", content: "" }]);
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              if (data.text) {
                aiResponse += data.text;
                setChatMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = aiResponse;
                  return newMessages;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { role: "ai", content: "Sorry, I couldn't process that question." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f7fe] items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-primary mb-4" />
          <p className="text-text-secondary">Loading session...</p>
        </div>
      </div>
    );
  }

  const dimensionColors = {
    tech: "#2563eb",
    exp: "#16a34a",
    edu: "#d97706",
    profile: "#7c3aed",
    rf: "#dc2626",
  };

  const dimensionBgs = {
    tech: "#eff6ff",
    exp: "#f0fdf4",
    edu: "#fef9c3",
    profile: "#f5f3ff",
    rf: "#fee2e2",
  };

  const dimensionIcons = {
    tech: faCode,
    exp: faBriefcase,
    edu: faGraduationCap,
    profile: faUser,
    rf: faFlag,
  };

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
          {/* Breadcrumb & Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm mb-1">
                <Link href="/sessions" className="text-[#2563eb] hover:underline font-medium">Sessions</Link>
                <span className="text-[#94a3b8] mx-1.5">/</span>
                <span className="text-[#475569]">{job?.title || "Loading..."}</span>
              </div>
              <h1 className="font-bold text-[28px] text-[#0f172a] tracking-tight">{job?.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-[#f1f5f9] text-[#334155] text-xs font-medium px-3 py-1 rounded-full">Engineering</span>
                <span className="bg-[#f1f5f9] text-[#334155] text-xs font-medium px-3 py-1 rounded-full">Remote</span>
                <span className="bg-[#f1f5f9] text-[#334155] text-xs font-medium px-3 py-1 rounded-full">Senior</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-transparent border border-[#e2e8f0] rounded-full py-2 px-4 font-semibold text-sm text-[#0f172a] flex items-center gap-2 hover:border-primary hover:text-primary">
                <FontAwesomeIcon icon={faPen} className="text-xs" /> Edit Rubric
              </button>
              <button 
                onClick={handleRunScreening}
                disabled={candidates.length === 0 || isScreening}
                className="bg-primary text-white font-bold py-2 px-6 rounded-full text-sm flex items-center gap-2 hover:bg-primary-dark disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPlay} className="text-xs" />
                {isScreening ? "Starting..." : "Run Screening →"}
              </button>
            </div>
          </div>

          {/* Status Banner */}
          {screeningProgress.evaluated > 0 && screeningProgress.evaluated < screeningProgress.total && (
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#92400e] font-medium">
                  <FontAwesomeIcon icon={faClock} className="text-[#f59e0b]" />
                  <span>Screening in progress — {screeningProgress.evaluated} of {screeningProgress.total} candidates evaluated</span>
                </div>
                <p className="text-xs text-[#b45309] mt-1">Started recently · Est. completion soon</p>
              </div>
              <div className="w-48 mt-2 sm:mt-0">
                <div className="h-2 bg-[#fef3c7] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#f59e0b] rounded-full transition-all duration-500" 
                    style={{ width: `${(screeningProgress.evaluated / screeningProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Candidates */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
                  <h3 className="font-extrabold text-lg text-[#0f172a]">Candidates</h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="text-[#2563eb] text-sm font-medium flex items-center gap-1.5 hover:text-[#1d4ed8]"
                    >
                      <FontAwesomeIcon icon={faUserPlus} /> Add Candidates
                    </button>
                    <span className="bg-[#e0f2fe] text-[#0369a1] text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <FontAwesomeIcon icon={faDatabase} className="text-[10px]" /> Umurava Pool
                    </span>
                  </div>
                </div>
                
                {/* Tab Switcher */}
                <div className="px-5 pt-3 pb-1 flex items-center gap-6 border-b border-[#f1f5f9]">
                  <button 
                    onClick={() => setActiveFilter("all")}
                    className={`pb-1.5 text-sm font-medium transition-all ${activeFilter === "all" ? "text-[#2563eb] border-b-2 border-[#2563eb] font-semibold" : "text-[#64748b] hover:text-[#0f172a]"}`}
                  >
                    All ({candidates.length})
                  </button>
                  <button 
                    onClick={() => setActiveFilter("evaluated")}
                    className={`pb-1.5 text-sm font-medium transition-all ${activeFilter === "evaluated" ? "text-[#2563eb] border-b-2 border-[#2563eb] font-semibold" : "text-[#64748b] hover:text-[#0f172a]"}`}
                  >
                    Evaluated ({candidates.filter(c => c.status === "evaluated").length})
                  </button>
                  <button 
                    onClick={() => setActiveFilter("pending")}
                    className={`pb-1.5 text-sm font-medium transition-all ${activeFilter === "pending" ? "text-[#2563eb] border-b-2 border-[#2563eb] font-semibold" : "text-[#64748b] hover:text-[#0f172a]"}`}
                  >
                    Pending ({candidates.filter(c => c.status === "pending").length})
                  </button>
                </div>
                
                {/* Candidates List */}
                <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-center py-12">
                      <FontAwesomeIcon icon={faUserGroup} className="text-4xl text-[#94a3b8] mb-3" />
                      <p className="text-[#64748b]">No candidates yet</p>
                      <button 
                        onClick={() => setShowAddModal(true)}
                        className="mt-3 text-[#2563eb] font-medium hover:underline"
                      >
                        Add your first candidate →
                      </button>
                    </div>
                  ) : (
                    filteredCandidates.map((candidate, idx) => (
                      <div 
                        key={candidate.id}
                        onClick={() => openCandidatePanel(candidate)}
                        className={`candidate-row p-4 rounded-xl border bg-white transition-all cursor-pointer ${
                          candidate.status === "evaluated" 
                            ? `border-l-4 ${candidate.compositeScore && candidate.compositeScore >= 70 ? "border-l-[#10b981] bg-gradient-to-r from-[#f0fdf4] to-white" : candidate.compositeScore && candidate.compositeScore >= 50 ? "border-l-[#f59e0b] bg-gradient-to-r from-[#fffbeb] to-white" : "border-l-[#ef4444] bg-gradient-to-r from-[#fef2f2] to-white"}`
                            : "border border-dashed border-[#bfdbfe] bg-[#fafbff]"
                        } hover:shadow-md`}
                      >
                        {candidate.rank && (
                          <span className="absolute -top-2 left-4 bg-[#10b981] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            #{candidate.rank}
                          </span>
                        )}
                        
                        <div className="flex items-center gap-4 flex-1">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: candidate.avatarBg, color: candidate.avatarColor }}
                          >
                            {candidate.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[#0f172a]">{candidate.name}</div>
                            <div className="text-xs text-[#64748b]">{candidate.role} · {candidate.years} · {candidate.skills.join(", ")}</div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                              candidate.role.toLowerCase().includes("frontend") ? "bg-[#eff6ff] text-[#2563eb]" :
                              candidate.role.toLowerCase().includes("backend") ? "bg-[#fef9c3] text-[#92400e]" :
                              candidate.role.toLowerCase().includes("full") ? "bg-[#f0fdf4] text-[#16a34a]" :
                              "bg-[#fee2e2] text-[#b91c1c]"
                            }`}>
                              {candidate.role.split(" ")[0]}
                            </span>
                          </div>
                        </div>
                        
                        {candidate.status === "pending" ? (
                          <div className="flex-1 px-4 flex flex-col gap-1.5">
                            <div className="shimmer-bar w-full h-1.5 rounded"></div>
                            <div className="shimmer-bar w-5/6 h-1.5 rounded"></div>
                            <div className="shimmer-bar w-4/6 h-1.5 rounded"></div>
                          </div>
                        ) : candidate.status === "evaluating" ? (
                          <div className="flex-1 px-4 text-center">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb]">
                              <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse"></span>
                              Evaluating...
                            </span>
                          </div>
                        ) : null}
                        
                        <div className="w-16 h-16 rounded-full border-3 flex flex-col items-center justify-center flex-shrink-0"
                          style={{ borderColor: candidate.scoreColor }}
                        >
                          {candidate.compositeScore ? (
                            <>
                              <span className="text-xl font-black" style={{ color: candidate.scoreColor }}>
                                {candidate.compositeScore}
                              </span>
                              <span className="text-[8px] text-[#94a3b8] font-semibold">/ 100</span>
                            </>
                          ) : (
                            <span className="text-2xl font-black text-[#94a3b8]">—</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-5">
              {/* Session Info */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FontAwesomeIcon icon={faCircleInfo} className="text-[#64748b]" />
                  <h4 className="font-bold text-[#0f172a]">Session Info</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Created</span>
                    <span className="font-medium">{job?.createdAt ? new Date(job.createdAt).toLocaleDateString() : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Status</span>
                    <span className="bg-[#eff6ff] text-[#2563eb] px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {screeningProgress.evaluated > 0 ? "Screening" : "Ready"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Rubric confirmed</span>
                    <span className="text-[#10b981] font-medium">{job?.rubric ? "Yes ✓" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Candidates</span>
                    <span className="font-medium">{candidates.length}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setRubricExpanded(!rubricExpanded)}
                  className="mt-4 w-full border border-[#e2e8f0] rounded-full py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={rubricExpanded ? faChevronUp : faChevronDown} className="text-xs" />
                  View Full Rubric
                </button>
                
                {rubricExpanded && job?.rubric && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-[#f1f5f9]">
                    <div className="text-xs font-semibold text-[#475569] mb-1">Dimension weights</div>
                    {job.rubric.dimensions.map((dim, i) => {
                      const colors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
                      return (
                        <div key={i} className="flex items-center text-xs">
                          <span className="w-20 text-[#64748b] truncate">{dim.name.split(" ")[0]}</span>
                          <div className="flex-1 h-1.5 bg-[#e2e8f0] rounded-full mx-2">
                            <div className="h-full rounded-full" style={{ width: `${dim.weight}%`, backgroundColor: colors[i % colors.length] }} />
                          </div>
                          <span>{dim.weight}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Scoring Weights */}
              {job?.rubric && (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faSliders} className="text-[#64748b]" />
                      <h4 className="font-bold text-[#0f172a]">Scoring Weights</h4>
                    </div>
                    <span className="bg-[#f1f5f9] text-[#475569] text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                      <FontAwesomeIcon icon={faLock} className="text-[10px]" /> Locked
                    </span>
                  </div>
                  <div className="space-y-3">
                    {job.rubric.dimensions.map((dim, i) => {
                      const icons = [faCode, faBriefcase, faGraduationCap, faUser, faFlag];
                      const colors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
                      const bgs = ["#eff6ff", "#ecfdf5", "#fffbeb", "#f5f3ff", "#fef2f2"];
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            style={{ backgroundColor: bgs[i % bgs.length], color: colors[i % colors.length] }}>
                            <FontAwesomeIcon icon={icons[i % icons.length]} />
                          </div>
                          <span className="text-sm flex-1">{dim.name.split(" ")[0]}</span>
                          <div className="w-20 h-1.5 bg-[#e2e8f0] rounded-full">
                            <div className="h-full rounded-full" style={{ width: `${dim.weight}%`, backgroundColor: colors[i % colors.length] }} />
                          </div>
                          <span className="text-xs font-medium w-10">{dim.weight}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Candidates Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-[550px] w-[90%] max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Add Candidates</h3>
              <button onClick={() => setShowAddModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="flex border-b border-[#e2e8f0] mb-4">
              <button 
                onClick={() => setAddModalTab("pool")}
                className={`px-4 py-2 text-sm font-medium transition-all ${addModalTab === "pool" ? "text-[#2563eb] border-b-2 border-[#2563eb]" : "text-[#64748b]"}`}
              >
                Umurava Pool
              </button>
              <button 
                onClick={() => setAddModalTab("upload")}
                className={`px-4 py-2 text-sm font-medium transition-all ${addModalTab === "upload" ? "text-[#2563eb] border-b-2 border-[#2563eb]" : "text-[#64748b]"}`}
              >
                Upload CSV/PDF
              </button>
            </div>
            
            {addModalTab === "pool" ? (
              <div className="space-y-3">
                {POOL_CANDIDATES.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 border rounded-xl">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={selectedPoolCandidates.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPoolCandidates([...selectedPoolCandidates, c.id]);
                        } else {
                          setSelectedPoolCandidates(selectedPoolCandidates.filter(id => id !== c.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-[#64748b] ml-2">{c.role} · {c.years}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      c.match === "Strong match" ? "bg-green-100 text-green-800" :
                      c.match === "Adjacent" ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>{c.match}</span>
                  </div>
                ))}
                <button 
                  onClick={handleAddFromPool}
                  disabled={selectedPoolCandidates.length === 0}
                  className="bg-primary text-white w-full py-2.5 rounded-xl font-medium mt-3 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faArrowRight} className="mr-2" />
                  Add Selected →
                </button>
              </div>
            ) : (
              <div 
                className={`text-center py-8 border-2 border-dashed rounded-xl transition-all ${dragActive ? "border-primary bg-primary-light/20" : "border-[#e2e8f0]"}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-3xl text-[#94a3b8] mb-2" />
                <p className="text-sm">
                  Drag & drop or{" "}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[#2563eb] hover:underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-[#94a3b8] mt-1">PDF up to 10MB</p>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".pdf" 
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                {isUploading && (
                  <div className="mt-4">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-primary mr-2" />
                    Uploading...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidate Detail Panel */}
      {panelOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f172a]/50 backdrop-blur-sm" onClick={closePanel}>
          <div 
            className="bg-white rounded-t-[28px] w-full max-w-full h-[92vh] flex flex-col overflow-hidden transform transition-transform duration-300"
            style={{ transform: panelOpen ? "translateY(0)" : "translateY(100%)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-[#e2e8f0] rounded-full" />
            </div>
            
            {/* Close button */}
            <div className="flex justify-end px-5 pb-2 flex-shrink-0">
              <button onClick={closePanel} className="w-8 h-8 rounded-full border border-[#e2e8f0] bg-white text-[#475569] flex items-center justify-center">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            {/* Panel Content */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left Column - Candidate Info */}
              <div className="w-[260px] flex-shrink-0 border-r border-[#f1f5f9] p-6 flex flex-col items-center bg-[#fafbff] overflow-y-auto custom-scrollbar">
                <div 
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center font-black text-2xl"
                  style={{ backgroundColor: selectedCandidate.avatarBg, color: selectedCandidate.avatarColor }}
                >
                  {selectedCandidate.initials}
                </div>
                <h2 className="text-lg font-black tracking-tight text-[#0f172a] mt-3 text-center">{selectedCandidate.name}</h2>
                <p className="text-xs text-[#94a3b8] mt-0.5 text-center">{selectedCandidate.role}</p>
                
                <div className="flex flex-wrap gap-1.5 mt-2.5 justify-center">
                  {selectedCandidate.skills.map((skill, i) => (
                    <span key={i} className="border border-[#e2e8f0] bg-white text-[#475569] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="w-full h-px bg-[#f1f5f9] my-4" />
                
                <div className="text-center">
                  <span className="text-5xl font-black tracking-tight" style={{ color: selectedCandidate.scoreColor }}>
                    {selectedCandidate.compositeScore}
                  </span>
                  <span className="text-base text-[#94a3b8] font-normal align-super">/100</span>
                </div>
                
                <div 
                  className="mt-2 inline-block px-3.5 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: selectedCandidate.confidenceBg, color: selectedCandidate.confidenceText }}
                >
                  {selectedCandidate.confidence}
                </div>
                
                {selectedCandidate.redFlag && (
                  <div className="mt-2">
                    <span className="bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] text-[11px] px-2.5 py-1 rounded-full">
                      {selectedCandidate.redFlag}
                    </span>
                  </div>
                )}
                
                <div className="w-full h-px bg-[#f1f5f9] my-4" />
                
                <div className="mt-auto pt-4 text-[10px] text-[#94a3b8] text-center">
                  Powered by Gemini ✦
                </div>
              </div>
              
              {/* Middle Column - Radar Chart */}
              <div className="w-[360px] flex-shrink-0 border-r border-[#f1f5f9] flex flex-col">
                <div className="px-5 pt-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  Skill Radar
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                  <canvas ref={radarCanvasRef} className="w-full max-w-[280px] h-auto" />
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center px-4 pb-5">
                  {selectedCandidate.dimensionScores && (
                    <>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#eff6ff] text-[#2563eb]">
                        Tech · {selectedCandidate.dimensionScores.tech}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#f0fdf4] text-[#16a34a]">
                        Exp · {selectedCandidate.dimensionScores.exp}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#fef9c3] text-[#d97706]">
                        Edu · {selectedCandidate.dimensionScores.edu}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#f5f3ff] text-[#7c3aed]">
                        Profile · {selectedCandidate.dimensionScores.profile}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#fee2e2] text-[#dc2626]">
                        R.Flags · {selectedCandidate.dimensionScores.rf}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Right Column - Scrollable Content */}
              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
                {/* Dimension Breakdown */}
                <div className="p-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-3">
                    Dimension Breakdown
                  </div>
                  
                  {selectedCandidate.dimensionScores && (() => {
                    const dims = [
                      { name: "Technical", score: selectedCandidate.dimensionScores.tech, color: "#2563eb", bg: "#eff6ff", icon: faCode },
                      { name: "Experience", score: selectedCandidate.dimensionScores.exp, color: "#16a34a", bg: "#f0fdf4", icon: faBriefcase },
                      { name: "Education", score: selectedCandidate.dimensionScores.edu, color: "#d97706", bg: "#fef9c3", icon: faGraduationCap },
                      { name: "Profile Fit", score: selectedCandidate.dimensionScores.profile, color: "#7c3aed", bg: "#f5f3ff", icon: faUser },
                      { name: "Red Flags", score: selectedCandidate.dimensionScores.rf, color: "#dc2626", bg: "#fee2e2", icon: faFlag },
                    ];
                    
                    return dims.map((dim, i) => (
                      <div key={i} className="border border-[#f1f5f9] rounded-xl p-3 mb-2 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: dim.bg, color: dim.color }}>
                              <FontAwesomeIcon icon={dim.icon} />
                            </span>
                            <span className="font-bold text-sm text-[#0f172a]">{dim.name}</span>
                          </div>
                          <span className="font-black text-sm" style={{ color: dim.color }}>{dim.score}</span>
                        </div>
                        <div className="h-1.5 bg-[#f1f5f9] rounded-full mb-1">
                          <div className="h-full rounded-full" style={{ width: `${dim.score}%`, backgroundColor: dim.color }} />
                        </div>
                        <p className="text-[11px] text-[#94a3b8] italic">
                          {selectedCandidate.rationales?.[i] || "—"}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
                
                <div className="h-px bg-[#f1f5f9] mx-6" />
                
                {/* Strengths & Gaps */}
                <div className="p-6 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#10b981] mb-2">Strengths</div>
                    {selectedCandidate.strengths?.map((s, i) => (
                      <div key={i} className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-2.5 mb-1.5 text-xs text-[#166534] flex items-center gap-2">
                        <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                        {s}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b] mb-2">Gaps</div>
                    {selectedCandidate.gaps?.map((g, i) => (
                      <div key={i} className="bg-[#fffbeb] border border-[#fde68a] rounded-lg p-2.5 mb-1.5 text-xs text-[#92400e] flex items-center gap-2">
                        <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="h-px bg-[#f1f5f9] mx-6" />
                
                {/* AI Recommendation */}
                <div className="p-6">
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-[#eff6ff] text-[#2563eb] text-[10px] font-bold px-2 py-0.5 rounded-full">✦ AI</span>
                      <span className="text-xs font-bold text-[#0f172a]">Recommendation</span>
                    </div>
                    <p className="text-sm text-[#475569] leading-relaxed">
                      {selectedCandidate.aiRec || "No recommendation available."}
                    </p>
                  </div>
                </div>
                
                <div className="h-px bg-[#f1f5f9] mx-6" />
                
                {/* Chat Section */}
                <div className="p-6">
                  <div className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5 mb-3">
                    <FontAwesomeIcon icon={faCommentDots} className="text-[#2563eb]" />
                    Ask Gemini
                  </div>
                  
                  <div className="flex flex-col gap-2 mb-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {chatMessages.map((msg, i) => (
                      <div 
                        key={i}
                        className={`max-w-[82%] p-2.5 rounded-2xl text-sm ${
                          msg.role === "user" 
                            ? "self-end bg-[#2563eb] text-white rounded-br" 
                            : "self-start bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] rounded-bl"
                        }`}
                      >
                        {msg.role === "ai" && <span className="text-[#2563eb] mr-1">✦</span>}
                        {msg.content}
                      </div>
                    ))}
                    {isStreaming && (
                      <div className="self-start bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl rounded-bl p-3">
                        <div className="typing-dots flex gap-1">
                          <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce delay-100" />
                          <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Sticky Chat Input */}
                <div className="sticky bottom-0 bg-white p-4 border-t border-[#f1f5f9] flex gap-2 mt-auto">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask about this candidate..."
                    className="flex-1 border border-[#e2e8f0] rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <button 
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() || isStreaming}
                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}