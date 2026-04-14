import { Request, Response } from 'express';
import { evaluateCandidate, streamCandidateQA, IAIGeneratedRubric } from '../services/aiService';import Job from '../models/Job';
// Assuming you have a Candidate model. Adjust the import path if necessary!
import Applicant from '../models/Applicant'; 

export const askApplicantQuestion = async (req: Request, res: Response) => {
  try {
    const applicantId = req.params.id;
    const { question, jobId } = req.body;

    if (!question || !jobId) {
      return res.status(400).json({ message: "question and jobId are required in the body" });
    }

    // 1. Fetch the context from MongoDB
    const job = await Job.findById(jobId);
    const applicant = await Applicant.findById(applicantId);

    if (!job || !applicant) {
      return res.status(404).json({ message: "Job or Applicant not found" });
    }

    // THE FIX: Add a safety guard to ensure the rubric actually exists!
    if (!job.rubric || !job.rubric.dimensions || job.rubric.dimensions.length === 0) {
      return res.status(400).json({ message: "You must generate a rubric for this job first." });
    }

    // 2. Set the Server-Sent Events (SSE) Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 3. Start the AI Stream
    // THE FIX: Use "as IAIGeneratedRubric" to promise TypeScript the data is safe
    const stream = await streamCandidateQA(
      question, 
      applicant.profile, 
      job.rubric as IAIGeneratedRubric
    );
    // 4. The Streaming Loop
    for await (const chunk of stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    // 5. The Closing Signal
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error in Q&A stream:', error);
    res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
    res.end();
  }
};