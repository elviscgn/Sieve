"use client";

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faDatabase,
  faLocationDot,
  faChartSimple,
  faTriangleExclamation,
  faArrowLeft,
  faDownload,
  faCode,
  faBriefcase,
  faGraduationCap,
  faUserCheck,
  faFlag,
  faCircleCheck,
  faCheck,
  faXmark,
  faPaperPlane,
  faWandMagicSparkles,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

interface CandidateDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateDisplay;
  jobId: string;
  sessionId: string;
}

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
}

export default function CandidateDetailPanel({
  isOpen,
  onClose,
  candidate,
  jobId,
  sessionId,
}: CandidateDetailPanelProps) {
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "ai"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Predefined responses for demo (in production, these come from API)
  const getCannedResponse = (question: string): string => {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes("risk")) {
      return `The primary risk is retention. ${candidate.name}'s trajectory suggests they may not stay in an IC role long-term without a promotion path. Consider discussing career goals directly.`;
    }
    if (lowerQ.includes("rank")) {
      return `${candidate.name} ranks #${candidate.composite >= 80 ? "1" : "3"} due to composite score and dimension alignment. The ${candidate.flags[0] || "profile"} affects the ranking.`;
    }
    if (lowerQ.includes("sentence") || lowerQ.includes("summary")) {
      return `${candidate.name} is a ${candidate.composite >= 75 ? "strong" : "potential"} match with ${candidate.strengths[0]?.toLowerCase()}, but ${candidate.gaps[0]?.toLowerCase()}.`;
    }
    return `Based on the screening data, ${candidate.name} demonstrates ${candidate.strengths[0]?.toLowerCase() || "relevant skills"} but carries ${candidate.flags[0] ? `the ${candidate.flags[0]} flag` : "some concerns"} that warrant discussion.`;
  };

  const handleSendMessage = async (question: string) => {
    if (!question.trim() || isStreaming) return;

    setShowSuggestions(false);
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatInput("");
    setIsStreaming(true);

    // Add placeholder for AI response
    setChatMessages((prev) => [...prev, { role: "ai", content: "" }]);

    try {
      // Call backend streaming endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/applicants/${candidate.id}/ask`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, question }),
        },
      );

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                accumulated += data.text;
                // Update the last message (AI response)
                setChatMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "ai",
                    content: accumulated,
                  };
                  return newMessages;
                });
              }
              if (data.done) break;
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Fallback to canned response if API fails
      const fallback = getCannedResponse(question);
      let streamed = "";
      const streamInterval = setInterval(() => {
        if (streamed.length < fallback.length) {
          streamed += fallback[streamed.length];
          setChatMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: "ai",
              content: streamed,
            };
            return newMessages;
          });
        } else {
          clearInterval(streamInterval);
        }
      }, 20);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    handleSendMessage(question);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  if (!isOpen) return null;

  const dimensionLabels = [
    "Technical Skills Match",
    "Experience Relevance",
    "Education Alignment",
    "Profile Completeness",
    "Red Flag Indicators",
  ];
  const dimensionKeys = ["tech", "exp", "edu", "prof", "flags"] as const;
  const dimensionIcons = [
    faCode,
    faBriefcase,
    faGraduationCap,
    faUserCheck,
    faFlag,
  ];
  const dimensionColors = [
    "#2563eb",
    "#f59e0b",
    "#8b5cf6",
    "#f97316",
    "#ef4444",
  ];
  const scoreColors = ["#10b981", "#f59e0b", "#10b981", "#f97316", "#ef4444"];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-[900px] bg-[#f4f7fe] shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">
        {/* Header */}
        <div className="h-[62px] bg-white flex items-center justify-between px-6 border-b border-[#e2e8f0] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center hover:border-primary hover:text-primary transition"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div className="text-sm">
              <span className="text-[#475569]">Candidate Details</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center hover:border-primary"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="flex gap-5 items-stretch max-w-6xl mx-auto">
            {/* Left Column - Fixed width */}
            <div className="w-[320px] flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-[#f1f5f9] p-5 sticky top-6 flex flex-col gap-5">
                {/* Candidate identity */}
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3"
                    style={{
                      background: candidate.avatarBg,
                      color: candidate.avatarColor,
                    }}
                  >
                    {candidate.initials}
                  </div>
                  <h2 className="font-bold text-[22px] text-[#0f172a]">
                    {candidate.name}
                  </h2>
                  <p className="text-sm text-[#475569]">
                    {candidate.role} · {candidate.exp}
                  </p>

                  <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                    {candidate.skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="bg-[#eff6ff] text-[#2563eb] text-[11px] font-medium px-2.5 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <span className="bg-[#eff6ff] text-[#2563eb] px-3 py-1 rounded-full flex items-center gap-1">
                      <FontAwesomeIcon icon={faDatabase} /> Umurava Profile
                    </span>
                    <span className="text-[#475569] flex items-center gap-1">
                      <FontAwesomeIcon icon={faLocationDot} />{" "}
                      {candidate.location || "Johannesburg, ZA"}
                    </span>
                  </div>
                </div>

                {/* Composite score */}
                <div className="flex flex-col items-center border-t border-b border-[#f1f5f9] py-5">
                  <div
                    className="w-24 h-24 rounded-full border-4 flex items-center justify-center mb-2"
                    style={{
                      borderColor:
                        candidate.composite >= 80
                          ? "#10b981"
                          : candidate.composite >= 60
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  >
                    <span
                      className="text-4xl font-extrabold"
                      style={{
                        color:
                          candidate.composite >= 80
                            ? "#10b981"
                            : candidate.composite >= 60
                              ? "#f59e0b"
                              : "#ef4444",
                      }}
                    >
                      {candidate.composite}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#475569] uppercase tracking-wider">
                    Composite Score
                  </span>
                  <div className="flex gap-2 mt-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                      style={{
                        background:
                          candidate.confidence === "High"
                            ? "#dcfce7"
                            : "#fef9c3",
                        color:
                          candidate.confidence === "High"
                            ? "#166534"
                            : "#92400e",
                        border: `1px solid ${candidate.confidence === "High" ? "#bbf7d0" : "#fde68a"}`,
                      }}
                    >
                      <FontAwesomeIcon icon={faChartSimple} />{" "}
                      {candidate.confidence} Confidence
                    </span>
                    {candidate.flags.length > 0 && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                        style={{
                          background: "#fff7ed",
                          color: "#c2410c",
                          border: "1px solid #fed7aa",
                        }}
                      >
                        <FontAwesomeIcon icon={faTriangleExclamation} />{" "}
                        {candidate.flags[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 border border-[#e2e8f0] rounded-xl font-semibold text-sm text-[#0f172a] hover:border-primary hover:text-primary transition"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-1" /> Back
                    to Shortlist
                  </button>
                  <button className="w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition">
                    Compare with another →
                  </button>
                  <button className="w-full py-2 text-[#475569] text-sm hover:text-primary transition">
                    <FontAwesomeIcon icon={faDownload} className="mr-1" />{" "}
                    Export profile
                  </button>
                </div>

                {/* Session context */}
                <div className="bg-[#f8fafc] rounded-xl p-4 text-xs border border-[#e2e8f0]">
                  <p className="font-bold text-[#0f172a]">
                    This session: Senior Full Stack Engineer
                  </p>
                  <p className="text-[#475569] mt-1">
                    Rubric confirmed Apr 14 2026
                  </p>
                  <p className="text-[#475569]">
                    Screened against 5 other candidates
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Scrollable */}
            <div className="flex-1 flex flex-col gap-5 min-w-0">
              {/* Dimension Breakdown */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#f1f5f9]">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-bold text-base">Scoring Breakdown</h3>
                  <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <FontAwesomeIcon
                      icon={faWandMagicSparkles}
                      className="text-[8px]"
                    />{" "}
                    AI
                  </span>
                </div>

                <div className="space-y-5">
                  {dimensionKeys.map((key, idx) => {
                    const score = candidate.dimensionScores[key];
                    const isRedFlag = key === "flags";
                    return (
                      <div
                        key={key}
                        className={
                          isRedFlag ? "p-3 rounded-xl bg-[#fff1f2]" : ""
                        }
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <FontAwesomeIcon
                            icon={dimensionIcons[idx]}
                            style={{ color: dimensionColors[idx] }}
                          />
                          <span className="font-bold text-sm">
                            {dimensionLabels[idx]}
                          </span>
                          <span
                            className="ml-auto font-bold text-lg"
                            style={{ color: scoreColors[idx] }}
                          >
                            {score}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${score}%`,
                              backgroundColor: dimensionColors[idx],
                            }}
                          />
                        </div>
                        <p className="text-[13px] text-[#475569] italic mt-1">
                          {candidate.rationales[idx]}
                          <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ml-1">
                            <FontAwesomeIcon
                              icon={faWandMagicSparkles}
                              className="text-[8px]"
                            />{" "}
                            AI
                          </span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#f1f5f9]">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FontAwesomeIcon
                        icon={faCircleCheck}
                        className="text-[#10b981]"
                      />
                      <h4 className="font-bold text-sm">Strengths</h4>
                      <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <FontAwesomeIcon
                          icon={faWandMagicSparkles}
                          className="text-[8px]"
                        />{" "}
                        AI
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {candidate.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-[13px]">
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="text-[#10b981] mt-1"
                          />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FontAwesomeIcon
                        icon={faTriangleExclamation}
                        className="text-[#ef4444]"
                      />
                      <h4 className="font-bold text-sm">Gaps & Risks</h4>
                      <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <FontAwesomeIcon
                          icon={faWandMagicSparkles}
                          className="text-[8px]"
                        />{" "}
                        AI
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {candidate.gaps.map((g, i) => (
                        <li key={i} className="flex gap-2 text-[13px]">
                          <FontAwesomeIcon
                            icon={faXmark}
                            className="text-[#ef4444] mt-1"
                          />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="rounded-2xl p-5 border bg-[#f5f3ff] border-[#e9d5ff]">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-bold text-base text-[#3b0764]">
                    Recommendation
                  </h4>
                  <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <FontAwesomeIcon
                      icon={faWandMagicSparkles}
                      className="text-[8px]"
                    />{" "}
                    AI
                  </span>
                </div>
                <p className="text-[14px] text-[#3b0764] mb-5">
                  {candidate.aiRec}
                </p>
                <div className="flex gap-3">
                  <button className="px-5 py-2.5 bg-[#10b981] text-white rounded-xl font-semibold text-sm hover:bg-[#059669] transition">
                    <FontAwesomeIcon icon={faCheck} className="mr-1" /> Advance
                    to interview
                  </button>
                  <button className="px-5 py-2.5 border border-[#ef4444] text-[#ef4444] rounded-xl font-semibold text-sm hover:bg-[#fef2f2] transition">
                    <FontAwesomeIcon icon={faXmark} className="mr-1" /> Pass on
                    candidate
                  </button>
                </div>
              </div>

              {/* Flag Explanation (if flags exist) */}
              {candidate.flags.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#f1f5f9]">
                  <div className="flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faFlag} className="text-[#ef4444]" />
                    <h4 className="font-bold text-base">Flag Details</h4>
                  </div>
                  <div className="space-y-4">
                    {candidate.flags.map((flag) => (
                      <div key={flag}>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]">
                          {flag}
                        </span>
                        <p className="text-sm text-[#0f172a]">
                          {flag === "Overqualified" &&
                            "This candidate's experience significantly exceeds the target profile. Research suggests overqualified candidates have higher attrition risk."}
                          {flag === "Underexperienced" &&
                            "This candidate has less experience than the target range. They may require additional mentorship."}
                          {flag === "SkillMismatch" &&
                            "The candidate's primary skill set doesn't fully align with the job requirements."}
                          {flag === "Low Confidence" &&
                            "The AI has lower confidence in this evaluation due to incomplete or ambiguous profile data."}
                        </p>
                        <div className="mt-3 p-3 bg-[#f8fafc] rounded-lg italic text-sm text-[#475569]">
                          <FontAwesomeIcon
                            icon={faCircleCheck}
                            className="mr-1 text-primary"
                          />
                          <strong>What to ask in interview:</strong> "Tell me
                          about your long-term career goals."
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Q&A Chat */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#f1f5f9]">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-bold text-base">
                    Ask about this candidate
                  </h4>
                  <span className="bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <FontAwesomeIcon
                      icon={faWandMagicSparkles}
                      className="text-[8px]"
                    />{" "}
                    AI
                  </span>
                </div>

                <div
                  ref={chatContainerRef}
                  className="flex flex-col gap-3 mb-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-1"
                  style={{ minHeight: "120px" }}
                >
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`px-4 py-2.5 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-2xl rounded-br self-end max-w-[75%]"
                          : "bg-white border border-[#e2e8f0] rounded-2xl rounded-bl self-start max-w-[85%] relative"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <span className="absolute -top-2 right-2 bg-[#f5f3ff] text-[#7c3aed] border border-[#e9d5ff] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          <FontAwesomeIcon
                            icon={faWandMagicSparkles}
                            className="text-[8px]"
                          />{" "}
                          AI
                        </span>
                      )}
                      {msg.content ||
                        (msg.role === "ai" && isStreaming && (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ))}
                    </div>
                  ))}
                </div>

                {showSuggestions && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() =>
                        handleSuggestionClick("What is the biggest hire risk?")
                      }
                      className="px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-full text-xs font-medium transition"
                    >
                      What is the biggest hire risk?
                    </button>
                    <button
                      onClick={() =>
                        handleSuggestionClick("Why ranked 3rd and not higher?")
                      }
                      className="px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-full text-xs font-medium transition"
                    >
                      Why ranked 3rd and not higher?
                    </button>
                    <button
                      onClick={() =>
                        handleSuggestionClick(
                          "One sentence summary for the hiring manager",
                        )
                      }
                      className="px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-full text-xs font-medium transition"
                    >
                      One sentence summary for the hiring manager
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendMessage(chatInput)
                    }
                    placeholder="Ask anything about this candidate..."
                    className="flex-1 border border-[#e2e8f0] rounded-full py-2.5 px-5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    disabled={isStreaming}
                  />
                  <button
                    onClick={() => handleSendMessage(chatInput)}
                    disabled={isStreaming || !chatInput.trim()}
                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
