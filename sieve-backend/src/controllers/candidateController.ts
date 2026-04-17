import { Request, Response } from "express";
import {
  evaluateCandidate,
  streamCandidateQA,
  IAIGeneratedRubric,
} from "../services/aiService";
import Job from "../models/Job";
import Applicant from "../models/Applicant";

// Establishes a Server-Sent Events (SSE) connection to stream real-time AI-generated answers based on a specific candidate and job rubric.
export const askApplicantQuestion = async (req: Request, res: Response) => {
  try {
    const applicantId = req.params.id;
    const { question, jobId } = req.body;

    if (!question || !jobId) {
      return res
        .status(400)
        .json({ message: "question and jobId are required in the body" });
    }

    const job = await Job.findById(jobId);
    const applicant = await Applicant.findById(applicantId);

    if (!job || !applicant) {
      return res.status(404).json({ message: "Job or Applicant not found" });
    }

    if (
      !job.rubric ||
      !job.rubric.dimensions ||
      job.rubric.dimensions.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "You must generate a rubric for this job first." });
    }

    // Configuring necessary headers to maintain a persistent, non-cached streaming connection
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await streamCandidateQA(
      question,
      applicant.profile,
      job.rubric as IAIGeneratedRubric,
    );
    
    // Consuming the async generator stream and pushing raw text chunks to the client
    for await (const chunk of stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error in Q&A stream:", error);
    res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
    res.end();
  }
};