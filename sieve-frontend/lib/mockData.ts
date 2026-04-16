// lib/mockData.ts
// Centralized mock data - easily swappable with real API calls later

export interface DashboardStats {
  activeJobs: number;
  totalCandidates: number;
  totalReviewed: number;
  matchRate: number;
  pendingReviews: number;
}

export interface RecentSession {
  _id: string;
  jobTitle: string;
  candidatesScreened: number;
  avgScore: number;
  topCandidate: string;
  status: "completed" | "running";
  createdAt: string;
}

export interface CandidateRow {
  id: string;
  name: string;
  role: string;
  level: string;
  aiScore: number;
  date: string;
  status: "Active" | "Pending" | "Rejected";
}

export interface ScheduleEvent {
  id: string;
  candidateName: string;
  time: string;
  type: string;
  date: string;
  status: "pending" | "completed";
  initials: string;
  avatarColor: string;
  textColor: string;
}

export interface IntelligencePreview {
  matchRateTrend: number;
  topSkillGaps: string[];
  insight: string;
}

// Mock API service
class MockDataService {
  private delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

  async getStats(): Promise<DashboardStats> {
    await this.delay();
    return {
      activeJobs: 352,
      totalCandidates: 18780,
      totalReviewed: 18780,
      matchRate: 68,
      pendingReviews: 24,
    };
  }

  async getRecentSessions(): Promise<RecentSession[]> {
    await this.delay();
    return [
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
    ];
  }

  async getCandidates(): Promise<CandidateRow[]> {
    await this.delay();
    return [
      { id: "CAND-101", name: "Thabo Ndlovu", role: "Frontend Lead", level: "Senior", aiScore: 92, date: "Mar 12", status: "Active" },
      { id: "CAND-102", name: "Lerato Khumalo", role: "Product Designer", level: "Mid", aiScore: 74, date: "Mar 14", status: "Pending" },
      { id: "CAND-103", name: "Sipho Mahlangu", role: "Backend Engineer", level: "Senior", aiScore: 88, date: "Mar 10", status: "Active" },
      { id: "CAND-104", name: "Naledi Molefe", role: "Data Analyst", level: "Junior", aiScore: 51, date: "Mar 16", status: "Rejected" },
      { id: "CAND-105", name: "Kagiso Modise", role: "DevOps", level: "Lead", aiScore: 95, date: "Mar 18", status: "Active" },
    ];
  }

  async getTodaySchedule(): Promise<{ pending: ScheduleEvent[]; completed: ScheduleEvent[] }> {
    await this.delay();
    return {
      pending: [
        {
          id: "s1",
          candidateName: "Thabo Ndlovu",
          time: "09:00 - 09:30",
          type: "30 min call meeting Peer & Leslie",
          date: "30 December 2025",
          status: "pending",
          initials: "TN",
          avatarColor: "bg-[#bfdbfe]",
          textColor: "text-[#1e3a8a]",
        },
      ],
      completed: [
        {
          id: "s2",
          candidateName: "Lerato Khumalo",
          time: "10:30 - 11:00",
          type: "Design review session",
          date: "30 December 2025",
          status: "completed",
          initials: "LK",
          avatarColor: "bg-[#fde68a]",
          textColor: "text-[#92400e]",
        },
        {
          id: "s3",
          candidateName: "Sipho Mahlangu",
          time: "13:00 - 13:45",
          type: "Technical interview",
          date: "30 December 2025",
          status: "completed",
          initials: "SM",
          avatarColor: "bg-[#bbf7d0]",
          textColor: "text-[#166534]",
        },
        {
          id: "s4",
          candidateName: "Naledi Molefe",
          time: "15:30 - 16:00",
          type: "Follow-up call",
          date: "30 December 2025",
          status: "completed",
          initials: "NM",
          avatarColor: "bg-[#fecaca]",
          textColor: "text-[#991b1b]",
        },
      ],
    };
  }

  async getTomorrowSchedule(): Promise<ScheduleEvent[]> {
    await this.delay();
    return [
      {
        id: "t1",
        candidateName: "Kagiso Modise",
        time: "11:00 - 12:00",
        type: "Product walkthrough",
        date: "31 December 2025",
        status: "pending",
        initials: "KM",
        avatarColor: "bg-[#bfdbfe]",
        textColor: "text-[#1e3a8a]",
      },
      {
        id: "t2",
        candidateName: "Amahle Dlamini",
        time: "14:00 - 14:45",
        type: "Initial screening",
        date: "31 December 2025",
        status: "pending",
        initials: "AD",
        avatarColor: "bg-[#fde68a]",
        textColor: "text-[#92400e]",
      },
    ];
  }

  async getIntelligencePreview(): Promise<IntelligencePreview> {
    await this.delay();
    return {
      matchRateTrend: 12,
      topSkillGaps: ["React", "Node.js", "AWS"],
      insight: "Full Stack roles show 34% lower match rates due to React experience gap",
    };
  }

  async getApplicantJobsTrend(): Promise<{ percentage: number; isUp: boolean }> {
    await this.delay();
    return { percentage: 9.42, isUp: true };
  }
}

// Export singleton instance
export const mockDataService = new MockDataService();

// Future real API service - same interface, different implementation
// export const realApiService = {
//   async getStats() { return apiClient.get('/intelligence/stats'); },
//   async getRecentSessions() { return apiClient.get('/sessions/recent'); },
//   // ... etc
// }

// Toggle this when ready to switch to real API
export const dataService = mockDataService;
// export const dataService = realApiService; // Switch later