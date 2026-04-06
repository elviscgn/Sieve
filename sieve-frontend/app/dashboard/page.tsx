"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Eye,
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Calendar,
  ChevronRight,
  BarChart3,
} from "lucide-react";

// Types
interface DashboardStats {
  activeJobs: number;
  totalCandidates: number;
  screenedThisMonth: number;
  matchRate: number;
  pendingReviews: number;
}

interface RecentSession {
  _id: string;
  jobTitle: string;
  candidatesScreened: number;
  avgScore: number;
  topCandidate: string;
  status: "completed" | "running";
  createdAt: string;
}

interface IntelligencePreview {
  matchRateTrend: number;
  topSkillGaps: string[];
  insight: string;
}

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Good morning");
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 3,
    totalCandidates: 18780,
    screenedThisMonth: 1243,
    matchRate: 68,
    pendingReviews: 24,
  });

  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([
    {
      _id: "1",
      jobTitle: "Senior Full Stack Engineer",
      candidatesScreened: 156,
      avgScore: 72,
      topCandidate: "Thabo Ndlovu",
      status: "completed",
      createdAt: "2026-04-15T10:30:00Z",
    },
    {
      _id: "2",
      jobTitle: "Product Designer",
      candidatesScreened: 89,
      avgScore: 68,
      topCandidate: "Lerato Khumalo",
      status: "running",
      createdAt: "2026-04-14T14:20:00Z",
    },
    {
      _id: "3",
      jobTitle: "Backend Engineer",
      candidatesScreened: 203,
      avgScore: 75,
      topCandidate: "Sipho Mahlangu",
      status: "completed",
      createdAt: "2026-04-12T09:15:00Z",
    },
  ]);

  const [intelligence, setIntelligence] = useState<IntelligencePreview>({
    matchRateTrend: 12,
    topSkillGaps: ["React", "Node.js", "AWS"],
    insight: "Full Stack roles show 34% lower match rates due to React experience gap",
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-body text-text-secondary mb-1">
          {greeting}, Elvis 👋
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 text-text-primary">Dashboard</h1>
            <p className="text-body text-text-secondary mt-1">
              Overview of your recruitment pipeline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-full text-sm font-semibold text-text-primary hover:border-primary hover:text-primary transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
            <Link
              href="/jobs/new"
              className="flex items-center gap-1.5 px-5 py-2 bg-primary text-surface rounded-full text-sm font-bold shadow-[0_4px_14px_-4px_rgba(43,113,240,0.45)] hover:bg-primary-dark hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Job
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface p-5 rounded-card shadow-card border border-border hover:shadow-panel transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center text-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
              <TrendingUp className="w-3 h-3 inline mr-0.5" />
              +12%
            </span>
          </div>
          <div className="text-h1 text-text-primary mb-1">{stats.activeJobs}</div>
          <div className="text-body text-text-secondary">Active Jobs</div>
        </div>

        <div className="bg-surface p-5 rounded-card shadow-card border border-border hover:shadow-panel transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
              <TrendingUp className="w-3 h-3 inline mr-0.5" />
              +9.4%
            </span>
          </div>
          <div className="text-h1 text-text-primary mb-1">
            {stats.totalCandidates.toLocaleString()}
          </div>
          <div className="text-body text-text-secondary">Total Candidates</div>
        </div>

        <div className="bg-surface p-5 rounded-card shadow-card border border-border hover:shadow-panel transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center text-primary">
              <Eye className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
              <TrendingDown className="w-3 h-3 inline mr-0.5" />
              -2.1%
            </span>
          </div>
          <div className="text-h1 text-text-primary mb-1">
            {stats.screenedThisMonth.toLocaleString()}
          </div>
          <div className="text-body text-text-secondary">Screened This Month</div>
        </div>

        <div className="bg-surface p-5 rounded-card shadow-card border border-border hover:shadow-panel transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center text-primary">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-h1 text-text-primary mb-1">{stats.matchRate}%</div>
          <div className="text-body text-text-secondary">Average Match Rate</div>
          <div className="text-xs text-text-secondary mt-2">
            {stats.pendingReviews} pending review
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Sessions - Takes 2 columns */}
        <div className="col-span-2">
          <div className="bg-surface rounded-card shadow-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h3 text-text-primary">Recent Screening Sessions</h2>
              <Link
                href="/sessions"
                className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentSessions.map((session) => (
                <Link
                  key={session._id}
                  href={`/sessions/${session._id}`}
                  className="block p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-text-primary">
                          {session.jobTitle}
                        </h3>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            session.status === "completed"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {session.status === "completed" ? (
                            <>
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 inline mr-1 animate-pulse" />
                              Running
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {session.candidatesScreened} candidates
                        </span>
                        <span>
                          Avg Score:{" "}
                          <span className="font-semibold text-text-primary">
                            {session.avgScore}%
                          </span>
                        </span>
                        <span>
                          Top:{" "}
                          <span className="font-semibold text-text-primary">
                            {session.topCandidate}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {recentSessions.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
                <p className="text-text-secondary">No screening sessions yet</p>
                <Link
                  href="/jobs/new"
                  className="inline-block mt-3 text-primary font-semibold hover:underline"
                >
                  Create your first job →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Intelligence Preview - Takes 1 column */}
        <div className="col-span-1">
          <div className="bg-surface rounded-card shadow-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h3 text-text-primary flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-ai-accent" />
                Talent Intelligence
              </h2>
              <span className="text-[10px] font-bold bg-ai-accent/10 text-ai-accent px-2 py-0.5 rounded-full">
                AI-Powered
              </span>
            </div>

            {/* Match Rate Trend */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Match Rate Trend</span>
                <span className="text-sm font-semibold text-success flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +{intelligence.matchRateTrend}%
                </span>
              </div>
              <div className="text-h2 text-text-primary mb-1">{stats.matchRate}%</div>
              <p className="text-xs text-text-secondary">
                Overall candidate-to-role alignment
              </p>
            </div>

            {/* Top Skill Gaps */}
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-text-primary mb-2">
                Top Skill Gaps
              </h4>
              <div className="flex flex-wrap gap-2">
                {intelligence.topSkillGaps.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-warning/10 text-warning text-sm font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Insight Card */}
            <div className="bg-primary-light/50 rounded-xl p-4 border border-primary/10">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-ai-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-ai-accent text-xs">💡</span>
                </div>
                <p className="text-sm text-text-primary">{intelligence.insight}</p>
              </div>
            </div>

            <Link
              href="/intelligence"
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-primary text-primary rounded-full text-sm font-semibold hover:bg-primary hover:text-surface transition-all"
            >
              View Full Intelligence Dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}