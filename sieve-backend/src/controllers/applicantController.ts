import { Request, Response } from 'express';
import Applicant from '../models/Applicant';
import Job from '../models/Job';
import { evaluateCandidate, compareCandidates, streamCandidateQA, IAIGeneratedRubric, parseResumeToProfile } from '../services/aiService';
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
    // THE FIX: We check if evaluation.score is missing, rather than the whole object
    const applicants = await Applicant.find({ 
      jobId: jobId, 
      'evaluation.score': { $exists: false } 
    });

    if (applicants.length === 0) {
      return res.status(200).json({ message: 'No new applicants to evaluate' });
    }

    // 3. The Evaluation Loop
    const results: { name: string; score: number; status: string }[] = [];
    
    for (const applicant of applicants) {
      try {
        const aiResult = await evaluateCandidate(applicant.profile, job.rubric.dimensions);

        // Save the score, justification, gaps, and strengths
        applicant.evaluation = {
          score: aiResult.score,
          justification: aiResult.justification,
          gaps: aiResult.gaps,
          strengths: aiResult.strengths,
          evaluatedAt: new Date()
        };

        await applicant.save();
        
        results.push({ 
          name: (applicant.profile as any).name || 'Unknown', 
          score: aiResult.score,
          status: 'Success'
        });

        globalEmitter.emit('evaluationProgress', {
          jobId: jobId,
          applicantId: applicant._id,
          name: (applicant.profile as any).name || 'Unknown',
          status: 'Complete',
          score: aiResult.score
        });

      } catch (candidateError) {
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

    // 4. Return the summary
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

export const overrideCandidateRank = async (req: Request, res: Response) => {
  try {
    // The ID in the URL is the Session context (Job ID)
    const jobId = req.params.id;
    
    // The body contains the specific candidate and where the recruiter dragged them
    const { applicantId, newRank } = req.body;

    if (!applicantId || typeof newRank !== 'number') {
      return res.status(400).json({ message: 'applicantId and newRank are required' });
    }

    // 1. Find the specific applicant for this specific job
    const applicant = await Applicant.findOne({ _id: applicantId, jobId: jobId });

    if (!applicant || !applicant.evaluation) {
      return res.status(404).json({ message: 'Applicant not found or not yet evaluated' });
    }

    // 2. Apply the recruiter's override
    applicant.evaluation.recruiterRank = newRank;
    await applicant.save();

    // 3. Return a success message so the frontend can highlight the overridden row
    res.status(200).json({
      message: 'Recruiter override logged successfully',
      applicantId: applicant._id,
      recruiterRank: newRank
    });

  } catch (error) {
    console.error('Error overriding rank:', error);
    res.status(500).json({ message: 'Server error saving override' });
  }
};

export const compareSelectedCandidates = async (req: Request, res: Response) => {
  // 1. OVERRIDE THE DEFAULT TIMEOUT
  // Tell Node.js to wait up to 5 minutes (300,000 ms) before cutting the connection
  req.setTimeout(300000);
  res.setTimeout(300000);

  try {
    const jobId = req.params.id;
    const { candidateIds } = req.body;

    if (!Array.isArray(candidateIds) || candidateIds.length < 2 || candidateIds.length > 3) {
      return res.status(400).json({ message: 'Please provide an array of exactly 2 or 3 candidateIds' });
    }

    const job = await Job.findById(jobId);
    if (!job || !job.rubric) {
      return res.status(404).json({ message: 'Job or rubric not found' });
    }

    // 2. THE LEAN() OPTIMIZATION
    // This strips out all heavy Mongoose tracking metadata and returns pure, lightweight JSON
    const applicants = await Applicant.find({ 
      _id: { $in: candidateIds },
      jobId: jobId 
    }).lean(); 

    if (applicants.length !== candidateIds.length) {
      return res.status(404).json({ message: 'One or more candidates not found in this session' });
    }

    // Format the clean data for Gemini
    const candidatesForAI = applicants.map(app => ({
      candidateId: app._id,
      name: (app.profile as any).name || 'Unknown',
      profile: app.profile,
      evaluation: app.evaluation 
    }));

    // Fire the comparison engine
    const comparison = await compareCandidates(job.title || 'this role', job.rubric.dimensions, candidatesForAI);

    res.status(200).json({
      message: 'Comparison generated successfully',
      comparison: comparison
    });

  } catch (error) {
    console.error('Error in candidate comparison:', error);
    res.status(500).json({ message: 'Server error generating comparison' });
  }
};

export const askApplicantQuestion = async (req: Request, res: Response) => {
  try {
    const applicantId = req.params.id;
    const { question, jobId } = req.body;

    if (!question || !jobId) {
      return res.status(400).json({ message: "question and jobId are required in the body" });
    }

    const job = await Job.findById(jobId);
    const applicant = await Applicant.findById(applicantId);

    if (!job || !applicant) {
      return res.status(404).json({ message: "Job or Applicant not found" });
    }

    if (!job.rubric || !job.rubric.dimensions || job.rubric.dimensions.length === 0) {
      return res.status(400).json({ message: "You must generate a rubric for this job first." });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await streamCandidateQA(
      question, 
      applicant.profile, 
      job.rubric as IAIGeneratedRubric
    );

    for await (const chunk of stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error in Q&A stream:', error);
    res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
    res.end();
  }
};

// Helper function to dynamically import pdfreader and turn it into a Promise
const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  // Dynamically import the ES module to bypass CommonJS/ESM conflicts
  const { PdfReader } = await import('pdfreader');

  return new Promise((resolve, reject) => {
    let extractedText = '';
    new PdfReader().parseBuffer(buffer, (err: any, item: any) => {
      if (err) {
        reject(err);
      } else if (!item) {
        // When item is null, the PDF is completely finished parsing
        resolve(extractedText);
      } else if (item.text) {
        // Accumulate the text chunks
        extractedText += item.text + ' ';
      }
    });
  });
};

export const uploadAndParseResume = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Validate the Job exists
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // 2. Validate the uploaded file
    if (!req.file) {
      return res.status(400).json({ message: 'No resume PDF file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are accepted' });
    }

    // 3. Extract raw text using the NEW pdfreader library
    const rawText = await extractTextFromPDF(req.file.buffer);

    if (!rawText || rawText.trim() === '') {
      return res.status(400).json({ message: 'Could not extract text from the provided PDF' });
    }

    // 4. Send raw text to Gemini to get structured JSON matching the Hackathon Schema
    const structuredProfile = await parseResumeToProfile(rawText);

    // 5. Save the new applicant to the database
    const newApplicant = new Applicant({
      jobId: job._id,
      source: 'external_upload',
      profile: structuredProfile
    });

    await newApplicant.save();

    // 6. Return success
    res.status(201).json({
      message: 'Resume successfully parsed and structured applicant created',
      applicant: newApplicant
    });

  } catch (error) {
    console.error('Error uploading and parsing resume:', error);
    res.status(500).json({ message: 'Server error processing resume upload' });
  }
};

// Fetch applicants for a specific job
export const getApplicantsByJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    // Query the database for applicants matching this exact job ID
    const applicants = await Applicant.find({ jobId }).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, count: applicants.length, data: applicants });
  } catch (error: any) {
    console.error(`Error fetching applicants for job ${req.params.jobId}:`, error);
    res.status(500).json({ success: false, message: 'Failed to retrieve applicants' });
  }
};

