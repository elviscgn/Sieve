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
} from "@fortawesome/free-solid-svg-icons";
import { apiClient } from "@/lib/api";
import type { Job } from "@/types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await apiClient.get<Job[]>("/jobs");
        setJobs(data);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f7fe] items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h1 text-text-primary">Jobs</h1>
          <p className="text-body text-text-secondary mt-1">Manage your job postings</p>
        </div>
        <Link
          href="/jobs/new"
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-primary-dark transition"
        >
          <FontAwesomeIcon icon={faPlus} /> New Job
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center bg-white rounded-full pl-4 pr-1 py-1 border border-[#e2e8f0] max-w-md">
          <FontAwesomeIcon icon={faSearch} className="text-[#94a3b8] text-sm" />
          <input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent py-2 px-3 text-sm w-full outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faBriefcase} className="text-4xl text-[#cbd5e1] mb-3" />
            <p className="text-[#64748b]">No jobs found</p>
            <Link href="/jobs/new" className="inline-block mt-3 text-primary font-semibold">
              Create your first job →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-[#475569] uppercase">Job Title</th>
                <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-[#475569] uppercase">Rubric</th>
                <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-[#475569] uppercase">Created</th>
                <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-[#475569] uppercase">Candidates</th>
                <th className="text-right py-3.5 px-5 text-[11px] font-semibold text-[#475569] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job._id} className="border-b border-[#f1f5f9] hover:bg-[#fafbff]">
                  <td className="py-4 px-5 font-medium">{job.title}</td>
                  <td className="py-4 px-5">
                    {job.rubric ? (
                      <span className="text-[#10b981] text-xs font-semibold bg-[#ecfdf5] px-2.5 py-1 rounded-full">
                        ✓ Confirmed
                      </span>
                    ) : (
                      <span className="text-[#f59e0b] text-xs font-semibold bg-[#fef3c7] px-2.5 py-1 rounded-full">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-[#64748b]">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-5 text-[#64748b]">—</td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href={`/jobs/${job._id}/applicants`}
                      className="inline-flex items-center gap-1 text-primary font-medium text-xs hover:underline mr-3"
                    >
                      View <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                    </Link>
                    <button className="text-[#94a3b8] hover:text-primary mr-2">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className="text-[#94a3b8] hover:text-red-500">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
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