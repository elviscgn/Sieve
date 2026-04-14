import { Request, Response } from 'express';
import Job from '../models/Job';
import Applicant from '../models/Applicant';
import { generateIntelligenceInsights } from '../services/aiService';

export const getTalentPoolIntelligence = async (req: Request, res: Response) => {
  try {
    // 1. Fetch lightweight aggregated data
    const jobs = await Job.find({}).lean();
    const evaluatedApplicants = await Applicant.find({ evaluation: { $exists: true } }).lean();

    if (!jobs.length || !evaluatedApplicants.length) {
      return res.status(404).json({ message: 'Not enough session data to generate intelligence.' });
    }

    // 2. Map the data into a condensed summary format for the AI context window
    const sessionsSummary = jobs.map(job => {
      const jobApplicants = evaluatedApplicants.filter(
        app => app.jobId.toString() === job._id.toString()
      );

      const averageScore = jobApplicants.length > 0 
        ? Math.round(jobApplicants.reduce((sum, app) => sum + (app.evaluation?.score || 0), 0) / jobApplicants.length)
        : 0;

      // Extract all AI-identified gaps to find patterns
      const allGaps = jobApplicants.flatMap(app => 
        // Assuming your evaluateCandidate returns gaps, if not, we extract from justification
        app.evaluation?.justification || ""
      );

      return {
        roleTitle: job.title || 'Unknown Role',
        totalApplicants: jobApplicants.length,
        averageCompositeScore: averageScore,
        notableObservations: allGaps.slice(0, 5) // Send a sample to the AI
      };
    });

    // 3. Fire the intelligence prompt
    const intelligenceData = await generateIntelligenceInsights(sessionsSummary);

    // 4. Return the structured dashboard data
    res.status(200).json({
      message: 'Intelligence generated successfully',
      data: intelligenceData
    });

  } catch (error) {
    console.error('Error fetching intelligence:', error);
    res.status(500).json({ message: 'Server error generating intelligence dashboard' });
  }
};