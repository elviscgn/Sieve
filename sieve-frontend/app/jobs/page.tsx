"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faPlus,
  faSearch,
  faChevronRight,
  faEdit,
  faTrash,
  faSpinner,
  faFilter,
  faUsers,
  faCalendar,
  faCheckCircle,
  faClock,
  faFileContract,
  faLayerGroup,
  faLightbulb,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { dataService } from "@/lib/mockData";

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Contract" | "Part-time";
  status: "Active" | "Draft" | "Closed";
  applicants: number;
  createdAt: string;
  rubricConfirmed: boolean;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filtered, setFiltered] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        // Mock data matching Sieve style
        const mockJobs: Job[] = [
          {
            _id: "1",
            title: "Senior Full Stack Engineer",
            department: "Engineering",
            location: "Remote",
            type: "Full-time",
            status: "Active",
            applicants: 24,
            createdAt: "2026-04-10",
            rubricConfirmed: true,
          },
          {
            _id: "2",
            title: "Product Designer",
            department: "Design",
            location: "Hybrid • Cape Town",
            type: "Full-time",
            status: "Active",
            applicants: 18,
            createdAt: "2026-04-08",
            rubricConfirmed: true,
          },
          {
            _id: "3",
            title: "Backend Engineer",
            department: "Engineering",
            location: "Remote",
            type: "Full-time",
            status: "Active",
            applicants: 31,
            createdAt: "2026-04-05",
            rubricConfirmed: false,
          },
          {
            _id: "4",
            title: "DevOps Lead",
            department: "Infrastructure",
            location: "On-site • Johannesburg",
            type: "Full-time",
            status: "Draft",
            applicants: 0,
            createdAt: "2026-04-12",
            rubricConfirmed: false,
          },
          {
            _id: "5",
            title: "Frontend Developer (Contract)",
            department: "Engineering",
            location: "Remote",
            type: "Contract",
            status: "Closed",
            applicants: 42,
            createdAt: "2026-03-15",
            rubricConfirmed: true,
          },
        ];
        setJobs(mockJobs);
        setFiltered(mockJobs);
      } catch (error) {
        console.error("Failed to load jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadJobs();
  }, []);

  useEffect(() => {
    let result = jobs;
    if (searchTerm) {
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          j.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((j) => j.status === statusFilter);
    }
    setFiltered(result);
  }, [searchTerm, statusFilter, jobs]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Active: "bg-green-100 text-green-800 border-green-200",
      Draft: "bg-gray-100 text-gray-700 border-gray-200",
      Closed: "bg-red-100 text-red-800 border-red-200",
    };
    return styles[status] || "bg-gray-100";
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0f172a]">Jobs</h1>
          <p className="text-sm text-[#64748b] mt-1">Create and manage job postings for screening</p>
        </div>
        <Link
          href="/jobs/new"
          className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-primary-dark transition flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} /> New Job
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FontAwesomeIcon icon={faBriefcase} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0f172a]">{jobs.length}</div>
              <div className="text-xs text-[#64748b]">Total Jobs</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0f172a]">{jobs.filter(j => j.status === "Active").length}</div>
              <div className="text-xs text-[#64748b]">Active Jobs</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0f172a]">{jobs.reduce((sum, j) => sum + j.applicants, 0)}</div>
              <div className="text-xs text-[#64748b]">Total Applicants</div>
            </div>
          </div>
        </div>
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
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Closed">Closed</option>
        </select>
        <button className="ml-auto text-primary text-sm font-medium hover:underline">
          <FontAwesomeIcon icon={faFilter} className="mr-1" /> Advanced Filters
        </button>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faBriefcase} className="text-4xl text-[#cbd5e1] mb-3" />
            <p className="text-[#64748b]">No jobs found</p>
            <Link href="/jobs/new" className="inline-block mt-3 text-primary font-semibold hover:underline">
              Create your first job →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Job Title</th>
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Department</th>
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Location</th>
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Type</th>
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Status</th>
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Applicants</th>
                <th className="text-left py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Rubric</th>
                <th className="text-right py-4 px-5 text-[11px] font-semibold text-[#475569] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr key={job._id} className="border-b border-[#f1f5f9] hover:bg-[#fafbff] transition">
                 <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faBriefcase} className="text-sm" />
                      </div>
                      <span className="font-medium text-[#0f172a]">{job.title}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-[#475569]">{job.department}</td>
                  <td className="py-4 px-5 text-[#475569]">{job.location}</td>
                  <td className="py-4 px-5 text-[#475569]">{job.type}</td>
                  <td className="py-4 px-5">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusBadge(job.status)}`}>
                      {job.status === "Active" && <FontAwesomeIcon icon={faCheckCircle} className="mr-1 text-[10px]" />}
                      {job.status === "Draft" && <FontAwesomeIcon icon={faClock} className="mr-1 text-[10px]" />}
                      {job.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-[#475569]">
                    <FontAwesomeIcon icon={faUsers} className="text-xs mr-1 text-[#94a3b8]" />
                    {job.applicants}
                  </td>
                 <td className="py-4 px-5">
                {job.rubricConfirmed ? (
                      <span className="text-green-700 bg-green-50 px-2 py-1 rounded-full text-[10px] font-medium border border-green-200 inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faCircleCheck} className="text-[10px]" /> Confirmed
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-[10px] font-medium border border-amber-200 inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="text-[10px]" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={job.status === "Draft" ? `/jobs/${job._id}/rubric` : `/jobs/${job._id}/applicants`}
                        className="text-primary font-medium text-xs hover:underline inline-flex items-center gap-1"
                      >
                        {job.status === "Draft" ? "Continue" : "View"} <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                      </Link>
                      <button className="text-[#94a3b8] hover:text-primary p-1">
                        <FontAwesomeIcon icon={faEdit} className="text-xs" />
                      </button>
                      <button className="text-[#94a3b8] hover:text-red-500 p-1">
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Tip */}
      <div className="mt-6 p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faLightbulb} />

        </div>
        <div>
          <p className="text-sm text-green-800">
            <span className="font-bold">Pro tip:</span> Jobs with confirmed rubrics are ready for screening. Draft jobs need rubric setup first.
          </p>
        </div>
      </div>
    </div>
  );
}