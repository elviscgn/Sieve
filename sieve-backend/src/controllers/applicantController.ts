import { Request, Response } from 'express';
import Applicant from '../models/Applicant';
import Job from '../models/Job';
import { evaluateCandidate } from '../services/aiService';
import globalEmitter from '../utils/eventEmitter';

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
      try {
        const aiResult = await evaluateCandidate(applicant.profile, job.rubric.dimensions);

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

        // NEW: Broadcast the success message!
        globalEmitter.emit('evaluationProgress', {
          jobId: jobId,
          applicantId: applicant._id,
          name: (applicant.profile as any).name || 'Unknown',
          status: 'Complete',
          score: aiResult.score
        });

      } catch (candidateError) {
        // If this specific candidate fails, log it, but DON'T crash the loop!
        console.error(`Failed to evaluate candidate ${(applicant.profile as any).name}:`, candidateError);
        
        results.push({ 
          name: (applicant.profile as any).name || 'Unknown', 
          score: 0,
          status: 'Failed'
        });
        globalEmitter.emit('evaluationProgress', {
          jobId: jobId,
          applicantId: applicant._id,
          name: (applicant.profile as any).name || 'Unknown',
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

export const getSessionResults = async (req: Request, res: Response) => {
  try {
    // The ID in the URL represents the context of the session (the Job ID)
    const jobId = req.params.id;

    // 1. Fetch all applicants that HAVE an evaluation object, sorted by score (highest first)
    const applicants = await Applicant.find({ 
      jobId: jobId,
      evaluation: { $exists: true } 
    }).sort({ 'evaluation.score': -1 });

    if (applicants.length === 0) {
      return res.status(404).json({ message: 'No evaluated candidates found for this session' });
    }

    // 2. Map the raw database output to the exact schema the blueprint requires
    const rankedShortlist = applicants.map((app, index) => {
      const score = app.evaluation?.score || 0;

      // Calculate confidence tags based on the blueprint rules
      let confidence = 'high';
      if (score <= 60 && score >= 40) confidence = 'medium';
      if (score < 40) confidence = 'low';

      return {
        applicantId: app._id,
        name: app.profile.name || 'Unknown Candidate',
        aiRank: index + 1, // Automatically assigned based on the -1 database sort
        recruiterRank: null, // Left null until the recruiter drag-to-reranks
        compositeScore: score,
        justification: app.evaluation?.justification,
        confidence: confidence,
        profile: app.profile // Sending the raw profile so the UI can render details
      };
    });

    // 3. Return the payload
    res.status(200).json({
      message: 'Shortlist retrieved successfully',
      results: rankedShortlist
    });

  } catch (error) {
    console.error('Error fetching session results:', error);
    res.status(500).json({ message: 'Server error retrieving shortlist' });
  }
};

export const streamSessionProgress = (req: Request, res: Response) => {
  const jobId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); 

  const progressListener = (data: any) => {
    // Only send data if the event belongs to the specific job this UI is looking at
    if (data.jobId === jobId) {
      // SSE format requires starting with "data: " and ending with "\n\n"
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  globalEmitter.on('evaluationProgress', progressListener);

  req.on('close', () => {
    globalEmitter.off('evaluationProgress', progressListener);
    res.end();
  });
};