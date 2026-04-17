"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faEye,
  faSpinner,
  faLayerGroup,
  faCheckCircle,
  faClock,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

interface Session {
  id: string;
  jobTitle: string;
  department: string;
  candidates: number;
  screened: number;
  status: "Draft" | "Screening" | "Completed";
  createdAt: string;
  avgScore?: number;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filtered, setFiltered] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const mockSessions: Session[] = [
          {
            id: "1",
            jobTitle: "Senior Full Stack Engineer",
            department: "Engineering",
            candidates: 6,
            screened: 6,
            status: "Completed",
            createdAt: "2026-04-14",
            avgScore: 72,
          },
          {
            id: "2",
            jobTitle: "Product Designer",
            department: "Design",
            candidates: 5,
            screened: 3,
            status: "Screening",
            createdAt: "2026-04-10",
            avgScore: 68,
          },
          {
            id: "3",
            jobTitle: "Backend Engineer",
            department: "Engineering",
            candidates: 8,
            screened: 0,
            status: "Draft",
            createdAt: "2026-04-08",
          },
          {
            id: "4",
            jobTitle: "Frontend Lead",
            department: "Engineering",
            candidates: 4,
            screened: 4,
            status: "Completed",
            createdAt: "2026-04-01",
            avgScore: 79,
          },
          {
            id: "5",
            jobTitle: "DevOps Lead",
            department: "Infrastructure",
            candidates: 7,
            screened: 7,
            status: "Completed",
            createdAt: "2026-03-28",
            avgScore: 74,
          },
        ];
        setSessions(mockSessions);
        setFiltered(mockSessions);
      } catch (error) {
        console.error("Failed to load sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSessions();
  }, []);

  useEffect(() => {
    let result = sessions;
    if (searchTerm) {
      result = result.filter(
        (s) =>
          s.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.department.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }
    setFiltered(result);
  }, [searchTerm, statusFilter, sessions]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Draft: "bg-gray-100 text-gray-700 border-gray-200",
      Screening: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Completed: "bg-green-100 text-green-800 border-green-200",
    };
    return styles[status] || "bg-gray-100";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="text-4xl text-primary"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0f172a]">
            Screening Sessions
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Track and manage all your screening sessions
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-primary-dark transition flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} /> New Session
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex items-center bg-white rounded-full pl-4 pr-1 py-1 border border-[#e2e8f0] min-w-[300px]">
          <FontAwesomeIcon icon={faSearch} className="text-[#94a3b8] text-sm" />
          <input
            type="text"
            placeholder="Search by job title or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent py-2 px-3 text-sm w-full outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-[#e2e8f0] rounded-full px-4 py-2 text-sm text-[#475569] outline-none focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Screening">Screening</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((session) => (
          <Link
            key={session.id}
            href={
              session.status === "Draft"
                ? `/jobs/${session.id}/applicants`
                : `/sessions/${session.id}/shortlist`
            }
            className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FontAwesomeIcon icon={faLayerGroup} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0f172a] group-hover:text-primary transition">
                    {session.jobTitle}
                  </h3>
                  <p className="text-xs text-[#64748b]">{session.department}</p>
                </div>
              </div>
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusBadge(session.status)}`}
              >
                {session.status === "Screening" && (
                  <FontAwesomeIcon
                    icon={faClock}
                    className="mr-1 text-[10px]"
                  />
                )}
                {session.status === "Completed" && (
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="mr-1 text-[10px]"
                  />
                )}
                {session.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-[#475569] mb-3">
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faUsers} className="text-xs" />
                {session.candidates} candidates
              </span>
              {session.avgScore && (
                <span className="font-medium">
                  Avg Score:{" "}
                  <span className="text-[#0f172a]">{session.avgScore}%</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94a3b8]">
                Created {session.createdAt}
              </span>
              <span className="text-primary font-medium group-hover:underline">
                {session.status === "Draft" ? "Continue Setup" : "View Results"}{" "}
                →
              </span>
            </div>

            {session.status === "Screening" && (
              <div className="mt-3 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${(session.screened / session.candidates) * 100}%`,
                  }}
                />
              </div>
            )}
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FontAwesomeIcon
              icon={faLayerGroup}
              className="text-4xl text-[#cbd5e1] mb-3"
            />
            <p className="text-[#64748b]">No sessions found</p>
            <Link
              href="/jobs/new"
              className="inline-block mt-3 text-primary font-semibold"
            >
              Create your first session →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
