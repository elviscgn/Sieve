import { Request, Response } from 'express';
import Applicant from '../models/Applicant';
import Job from '../models/Job';
import { evaluateCandidate } from '../services/aiService';

export const ingestApplicants = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    const { source, applicants } = req.body;

    if (!source || !applicants || !Array.isArray(applicants)) {
      return res.status(400).json({ message: 'Valid source and applicants array required' });
    }

    const jobExists = await Job.findById(jobId);
    if (!jobExists) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const formattedApplicants = applicants.map((profile: any) => ({
      jobId: jobId,
      source: source,
      profile: profile
    }));

    const savedApplicants = await Applicant.insertMany(formattedApplicants);

    res.status(201).json({ 
      message: `Successfully ingested ${savedApplicants.length} applicants`, 
      insertedCount: savedApplicants.length 
    });

  } catch (error) {
    console.error('Error ingesting applicants:', error);
    res.status(500).json({ message: 'Server error ingesting applicants' });
  }
};

export const evaluateAllApplicants = async (req: Request, res: Response) => {
  try {
    // FIX: Pull jobId from the request body instead of the URL parameters
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'jobId is required in the request body' });
    }

    // 1. Fetch the Job to get the Rubric
    const job = await Job.findById(jobId);
    if (!job || !job.rubric || job.rubric.dimensions.length === 0) {
      return res.status(400).json({ message: 'Job not found or rubric not yet generated' });
    }
    
    // 2. Find all applicants for this job that DON'T have a score yet
    const applicants = await Applicant.find({ 
      jobId: jobId, 
      evaluation: { $exists: false } 
    });

    if (applicants.length === 0) {
      return res.status(200).json({ message: 'No new applicants to evaluate' });
    }

    // 3. The Evaluation Loop
    // FIX 1: Explicitly type the results array so TypeScript doesn't panic
    const results: { name: string; score: number; status: string }[] = [];
    
    for (const applicant of applicants) {
      // FIX 2: Inner try-catch for Fault Tolerance
      try {
        // Call our Bulletproof AI Service
        const aiResult = await evaluateCandidate(applicant.profile, job.rubric.dimensions);

        // Save the score and justification back to the applicant document
        applicant.evaluation = {
          score: aiResult.score,
          justification: aiResult.justification,
          evaluatedAt: new Date()
        };

        await applicant.save();
        
        // Push success to the array
        results.push({ 
          name: (applicant.profile as any).name || 'Unknown', 
          score: aiResult.score,
          status: 'Success'
        });

      } catch (candidateError) {
        // If this specific candidate fails, log it, but DON'T crash the loop!
        console.error(`Failed to evaluate candidate ${(applicant.profile as any).name}:`, candidateError);
        
        results.push({ 
          name: (applicant.profile as any).name || 'Unknown', 
          score: 0,
          status: 'Failed'
        });
      }
    }

    // 4. Return the summary of what happened
    res.status(200).json({
      message: `Successfully processed ${results.length} applicants`,
      evaluations: results
    });

  } catch (error) {
    console.error('Error in bulk evaluation:', error);
    res.status(500).json({ message: 'Server error during bulk evaluation' });
  }
};