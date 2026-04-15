import { Request, Response } from 'express';
import Job from '../models/Job';
import Applicant from '../models/Applicant';
import { generateIntelligenceInsights } from '../services/aiService';

export const getTalentPoolIntelligence = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find({}).lean();
    const evaluatedApplicants = await Applicant.find({ 'evaluation.score': { $exists: true } }).lean();

    if (!jobs.length || !evaluatedApplicants.length) {
      return res.status(404).json({ message: 'Not enough session data to generate intelligence.' });
    }

    const sessionsSummary = jobs.map(job => {
      const jobApplicants = evaluatedApplicants.filter(
        app => app.jobId.toString() === job._id.toString()
      );

      const averageScore = jobApplicants.length > 0 
        ? Math.round(jobApplicants.reduce((sum, app) => sum + (app.evaluation?.score || 0), 0) / jobApplicants.length)
        : 0;

      const allGaps = jobApplicants.flatMap(app => app.evaluation?.gaps || []);
      
      // Extract dates so the AI can build the trend line over time
      const evaluationDates = jobApplicants
        .map(app => app.evaluation?.evaluatedAt)
        .filter(Boolean);

      return {
        sessionId: job._id, // Allows AI to count affected sessions
        roleTitle: job.title || 'Unknown Role',
        createdAt: job.createdAt, // Job creation timeline
        evaluationDates: evaluationDates, // When the screening actually ran
        totalApplicants: jobApplicants.length,
        averageCompositeScore: averageScore,
        notableObservations: allGaps.slice(0, 10) // Upped to 10 for better data
      };
    });

    const intelligenceData = await generateIntelligenceInsights(sessionsSummary);

    res.status(200).json({
      message: 'Intelligence generated successfully',
      data: intelligenceData
    });

  } catch (error) {
    console.error('Error fetching intelligence:', error);
    res.status(500).json({ message: 'Server error generating intelligence dashboard' });
  }
};