import { Request, Response } from "express";
import Job from "../models/Job";
import Applicant from "../models/Applicant";
import { generateIntelligenceInsights } from "../services/aiService";

// Aggregates job sessions and evaluated applicant data to generate AI-driven talent pool insights.
export const getTalentPoolIntelligence = async (
  req: Request,
  res: Response,
) => {
  try {
    // Using lean() to return plain JSON objects instead of heavy Mongoose documents for performance
    const jobs = await Job.find({}).lean();
    const evaluatedApplicants = await Applicant.find({
      "evaluation.score": { $exists: true },
    }).lean();

    if (!jobs.length || !evaluatedApplicants.length) {
      return res
        .status(404)
        .json({ message: "Not enough session data to generate intelligence." });
    }

    const sessionsSummary = jobs.map((job) => {
      const jobApplicants = evaluatedApplicants.filter(
        (app) => app.jobId.toString() === job._id.toString(),
      );

      // Using reduce to accumulate a total score sum before dividing by length to find the average
      const averageScore =
        jobApplicants.length > 0
          ? Math.round(
              jobApplicants.reduce(
                (sum, app) => sum + (app.evaluation?.score || 0),
                0,
              ) / jobApplicants.length,
            )
          : 0;

      // Using flatMap to extract and combine nested arrays of skill gaps into a single, flat array
      const allGaps = jobApplicants.flatMap(
        (app) => app.evaluation?.gaps || [],
      );

      const evaluationDates = jobApplicants
        .map((app) => app.evaluation?.evaluatedAt)
        .filter(Boolean);

      return {
        sessionId: job._id,
        roleTitle: job.title || "Unknown Role",
        createdAt: job.createdAt,
        evaluationDates: evaluationDates,
        totalApplicants: jobApplicants.length,
        averageCompositeScore: averageScore,
        notableObservations: allGaps.slice(0, 10),
      };
    });

    const intelligenceData =
      await generateIntelligenceInsights(sessionsSummary);

    res.status(200).json({
      message: "Intelligence generated successfully",
      data: intelligenceData,
    });
  } catch (error) {
    console.error("Error fetching intelligence:", error);
    res
      .status(500)
      .json({ message: "Server error generating intelligence dashboard" });
  }
};