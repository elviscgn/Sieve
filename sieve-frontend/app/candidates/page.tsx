"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faFilter,
  faEye,
  faSpinner,
  faUserGroup,
  faBriefcase,
  faMapPin,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import { dataService } from "@/lib/mockData";

interface Candidate {
  id: string;
  name: string;
  role: string;
  location: string;
  skills: string[];
  experience: string;
  education: string;
  status: "Active" | "Interviewing" | "Hired" | "Rejected";
  appliedDate: string;
  avatar: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filtered, setFiltered] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        // In real app, call API; for now use mock from dataService or generate
        const mockCandidates: Candidate[] = [
          {
            id: "1",
            name: "Thabo Ndlovu",
            role: "Frontend Lead",
            location: "Johannesburg, ZA",
            skills: ["React", "TypeScript", "Next.js"],
            experience: "4 years",
            education: "BSc Computer Science",
            status: "Active",
            appliedDate: "2026-04-10",
            avatar: "TN",
          },
          {
            id: "2",
            name: "Lerato Khumalo",
            role: "Product Designer",
            location: "Cape Town, ZA",
            skills: ["Figma", "UI/UX", "Design Systems"],
            experience: "6 years",
            education: "BA Design",
            status: "Interviewing",
            appliedDate: "2026-04-08",
            avatar: "LK",
          },
          {
            id: "3",
            name: "Sipho Mahlangu",
            role: "Backend Engineer",
            location: "Durban, ZA",
            skills: ["Node.js", "AWS", "PostgreSQL"],
            experience: "10 years",
            education: "BSc Information Systems",
            status: "Active",
            appliedDate: "2026-04-05",
            avatar: "SM",
          },
          {
            id: "4",
            name: "Naledi Molefe",
            role: "Data Analyst",
            location: "Pretoria, ZA",
            skills: ["SQL", "Python", "Tableau"],
            experience: "2 years",
            education: "BCom Statistics",
            status: "Rejected",
            appliedDate: "2026-03-28",
            avatar: "NM",
          },
          {
            id: "5",
            name: "Kagiso Modise",
            role: "DevOps Engineer",
            location: "Remote",
            skills: ["Docker", "Kubernetes", "CI/CD"],
            experience: "5 years",
            education: "BEng Software Engineering",
            status: "Hired",
            appliedDate: "2026-03-15",
            avatar: "KM",
          },
          {
            id: "6",
            name: "Amahle Dlamini",
            role: "Full Stack Developer",
            location: "Johannesburg, ZA",
            skills: ["React", "Node.js", "MongoDB"],
            experience: "3 years",
            education: "Diploma IT",
            status: "Active",
            appliedDate: "2026-04-12",
            avatar: "AD",
          },
        ];
        setCandidates(mockCandidates);
        setFiltered(mockCandidates);
      } catch (error) {
        console.error("Failed to load candidates:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCandidates();
  }, []);

  useEffect(() => {
    let result = candidates;
    if (searchTerm) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    setFiltered(result);
  }, [searchTerm, statusFilter, candidates]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Active: "bg-green-100 text-green-800 border-green-200",
      Interviewing: "bg-blue-100 text-blue-800 border-blue-200",
      Hired: "bg-purple-100 text-purple-800 border-purple-200",
      Rejected: "bg-red-100 text-red-800 border-red-200",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#0f172a]">Candidates</h1>
        <p className="text-sm text-[#64748b] mt-1">Manage and review all candidates in your talent pool</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex items-center bg-white rounded-full pl-4 pr-1 py-1 border border-[#e2e8f0] min-w-[300px]">
          <FontAwesomeIcon icon={faSearch} className="text-[#94a3b8] text-sm" />
          <input
            type="text"
            placeholder="Search by name, role, or skill..."
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
          <option value="Active">Active</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Hired">Hired</option>
          <option value="Rejected">Rejected</option>
        </select>
        <button className="ml-auto text-primary text-sm font-medium hover:underline">
          <FontAwesomeIcon icon={faFilter} className="mr-1" /> Advanced Filters
        </button>
      </div>

      {/* Candidates Grid/Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faUserGroup} className="text-4xl text-[#cbd5e1] mb-3" />
            <p className="text-[#64748b]">No candidates found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Candidate</th>
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Role</th>
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Location</th>
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Experience</th>
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Status</th>
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Applied</th>
                <th className="text-right py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((candidate) => (
                <tr key={candidate.id} className="border-b border-[#f1f5f9] hover:bg-[#fafbff] transition">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                        {candidate.avatar}
                      </div>
                      <span className="font-medium text-[#0f172a]">{candidate.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-[#475569]">{candidate.role}</td>
                  <td className="py-4 px-5 text-[#475569]">
                    <FontAwesomeIcon icon={faMapPin} className="text-[10px] mr-1 text-[#94a3b8]" />
                    {candidate.location}
                  </td>
                  <td className="py-4 px-5 text-[#475569]">{candidate.experience}</td>
                  <td className="py-4 px-5">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusBadge(candidate.status)}`}>
                      {candidate.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-[#475569]">{candidate.appliedDate}</td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="text-primary font-medium text-xs hover:underline inline-flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faEye} className="text-[10px]" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}