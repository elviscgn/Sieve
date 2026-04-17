import { Request, Response } from "express";
import Applicant from "../models/Applicant";
import Job from "../models/Job";
import {
  evaluateCandidate,
  compareCandidates,
  streamCandidateQA,
  IAIGeneratedRubric,
  parseResumeToProfile,
} from "../services/aiService";
import globalEmitter from "../utils/eventEmitter";

// Bulk inserts a list of formatted applicant profiles into the database for a specific job ID.
export const ingestApplicants = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    const { source, applicants } = req.body;

    if (!source || !applicants || !Array.isArray(applicants)) {
      return res
        .status(400)
        .json({ message: "Valid source and applicants array required" });
    }

    const jobExists = await Job.findById(jobId);
    if (!jobExists) {
      return res.status(404).json({ message: "Job not found" });
    }

    const formattedApplicants = applicants.map((profile: any) => ({
      jobId: jobId,
      source: source,
      profile: profile,
    }));

    const savedApplicants = await Applicant.insertMany(formattedApplicants);

    res.status(201).json({
      message: `Successfully ingested ${savedApplicants.length} applicants`,
      insertedCount: savedApplicants.length,
    });
  } catch (error) {
    console.error("Error ingesting applicants:", error);
    res.status(500).json({ message: "Server error ingesting applicants" });
  }
};

// Iterates through all unevaluated applicants for a job, generates AI evaluations, saves the scores, and emits live progress updates.
export const evaluateAllApplicants = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res
        .status(400)
        .json({ message: "jobId is required in the request body" });
    }

    const job = await Job.findById(jobId);
    if (!job || !job.rubric || job.rubric.dimensions.length === 0) {
      return res
        .status(400)
        .json({ message: "Job not found or rubric not yet generated" });
    }

    const applicants = await Applicant.find({
      jobId: jobId,
      "evaluation.score": { $exists: false },
    });

    if (applicants.length === 0) {
      return res.status(200).json({ message: "No new applicants to evaluate" });
    }

    const results: { name: string; score: number; status: string }[] = [];

    for (const applicant of applicants) {
      try {
        const aiResult = await evaluateCandidate(
          applicant.profile,
          job.rubric.dimensions,
        );

        applicant.evaluation = {
          score: aiResult.score,
          justification: aiResult.justification,
          gaps: aiResult.gaps,
          strengths: aiResult.strengths,
          evaluatedAt: new Date(),
        };

        await applicant.save();

        results.push({
          name: (applicant.profile as any).name || "Unknown",
          score: aiResult.score,
          status: "Success",
        });

        globalEmitter.emit("evaluationProgress", {
          jobId: jobId,
          applicantId: applicant._id,
          name: (applicant.profile as any).name || "Unknown",
          status: "Complete",
          score: aiResult.score,
        });
      } catch (candidateError) {
        console.error(
          `Failed to evaluate candidate ${(applicant.profile as any).name}:`,
          candidateError,
        );

        results.push({
          name: (applicant.profile as any).name || "Unknown",
          score: 0,
          status: "Failed",
        });
        globalEmitter.emit("evaluationProgress", {
          jobId: jobId,
          applicantId: applicant._id,
          name: (applicant.profile as any).name || "Unknown",
          status: "Failed",
        });
      }
    }

    res.status(200).json({
      message: `Successfully processed ${results.length} applicants`,
      evaluations: results,
    });
  } catch (error) {
    console.error("Error in bulk evaluation:", error);
    res.status(500).json({ message: "Server error during bulk evaluation" });
  }
};

// Retrieves all evaluated candidates for a specific job, formats them with AI confidence tags, and returns a sorted shortlist.
export const getSessionResults = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;

    const applicants = await Applicant.find({
      jobId: jobId,
      evaluation: { $exists: true },
    }).sort({ "evaluation.score": -1 });

    if (applicants.length === 0) {
      return res
        .status(404)
        .json({ message: "No evaluated candidates found for this session" });
    }

    const rankedShortlist = applicants.map((app, index) => {
      const score = app.evaluation?.score || 0;

      let confidence = "high";
      if (score <= 60 && score >= 40) confidence = "medium";
      if (score < 40) confidence = "low";

      return {
        applicantId: app._id,
        name: app.profile.name || "Unknown Candidate",
        aiRank: index + 1,
        recruiterRank: null,
        compositeScore: score,
        justification: app.evaluation?.justification,
        confidence: confidence,
        profile: app.profile,
      };
    });

    res.status(200).json({
      message: "Shortlist retrieved successfully",
      results: rankedShortlist,
    });
  } catch (error) {
    console.error("Error fetching session results:", error);
    res.status(500).json({ message: "Server error retrieving shortlist" });
  }
};

// Establishes a Server-Sent Events (SSE) connection to stream live evaluation progress to the frontend.
export const streamSessionProgress = (req: Request, res: Response) => {
  const jobId = req.params.id;

  // Configuring necessary headers to maintain a persistent, non-cached streaming connection
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const progressListener = (data: any) => {
    if (data.jobId === jobId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  globalEmitter.on("evaluationProgress", progressListener);

  req.on("close", () => {
    globalEmitter.off("evaluationProgress", progressListener);
    res.end();
  });
};

// Updates a specific candidate's database record with a manual rank overridden by the recruiter.
export const overrideCandidateRank = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;

    const { applicantId, newRank } = req.body;

    if (!applicantId || typeof newRank !== "number") {
      return res
        .status(400)
        .json({ message: "applicantId and newRank are required" });
    }

    const applicant = await Applicant.findOne({
      _id: applicantId,
      jobId: jobId,
    });

    if (!applicant || !applicant.evaluation) {
      return res
        .status(404)
        .json({ message: "Applicant not found or not yet evaluated" });
    }

    applicant.evaluation.recruiterRank = newRank;
    await applicant.save();

    res.status(200).json({
      message: "Recruiter override logged successfully",
      applicantId: applicant._id,
      recruiterRank: newRank,
    });
  } catch (error) {
    console.error("Error overriding rank:", error);
    res.status(500).json({ message: "Server error saving override" });
  }
};

// Fetches 2-3 specific candidates and passes their profiles to the AI service to generate a comparative analysis.
export const compareSelectedCandidates = async (
  req: Request,
  res: Response,
) => {
  // Extending timeouts to prevent the connection from dropping during potentially long AI processing times
  req.setTimeout(300000);
  res.setTimeout(300000);

  try {
    const jobId = req.params.id;
    const { candidateIds } = req.body;

    if (
      !Array.isArray(candidateIds) ||
      candidateIds.length < 2 ||
      candidateIds.length > 3
    ) {
      return res
        .status(400)
        .json({
          message: "Please provide an array of exactly 2 or 3 candidateIds",
        });
    }

    const job = await Job.findById(jobId);
    if (!job || !job.rubric) {
      return res.status(404).json({ message: "Job or rubric not found" });
    }

    // Using lean() to strip Mongoose tracking metadata for improved performance when querying read-only data
    const applicants = await Applicant.find({
      _id: { $in: candidateIds },
      jobId: jobId,
    }).lean();

    if (applicants.length !== candidateIds.length) {
      return res
        .status(404)
        .json({ message: "One or more candidates not found in this session" });
    }

    const candidatesForAI = applicants.map((app) => ({
      candidateId: app._id,
      name: (app.profile as any).name || "Unknown",
      profile: app.profile,
      evaluation: app.evaluation,
    }));

    const comparison = await compareCandidates(
      job.title || "this role",
      job.rubric.dimensions,
      candidatesForAI,
    );

    res.status(200).json({
      message: "Comparison generated successfully",
      comparison: comparison,
    });
  } catch (error) {
    console.error("Error in candidate comparison:", error);
    res.status(500).json({ message: "Server error generating comparison" });
  }
};

// Streams a real-time AI-generated answer to a custom question asked against a specific candidate's profile.
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

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await streamCandidateQA(
      question,
      applicant.profile,
      job.rubric as IAIGeneratedRubric,
    );

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

// Dynamically imports the pdfreader library and extracts text from a PDF buffer, returning it as a Promise.
const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  // Using dynamic import to bypass conflicts between CommonJS compilation and the ESM-based pdfreader package
  const { PdfReader } = await import("pdfreader");

  return new Promise((resolve, reject) => {
    let extractedText = "";
    new PdfReader().parseBuffer(buffer, (err: any, item: any) => {
      if (err) {
        reject(err);
      } else if (!item) {
        resolve(extractedText);
      } else if (item.text) {
        extractedText += item.text + " ";
      }
    });
  });
};

// Receives a PDF file upload, extracts its text, uses AI to structure it into JSON, and saves the new applicant profile.
export const uploadAndParseResume = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No resume PDF file uploaded" });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "Only PDF files are accepted" });
    }

    const rawText = await extractTextFromPDF(req.file.buffer);

    if (!rawText || rawText.trim() === "") {
      return res
        .status(400)
        .json({ message: "Could not extract text from the provided PDF" });
    }

    const structuredProfile = await parseResumeToProfile(rawText);

    const newApplicant = new Applicant({
      jobId: job._id,
      source: "external_upload",
      profile: structuredProfile,
    });

    await newApplicant.save();

    res.status(201).json({
      message: "Resume successfully parsed and structured applicant created",
      applicant: newApplicant,
    });
  } catch (error) {
    console.error("Error uploading and parsing resume:", error);
    res.status(500).json({ message: "Server error processing resume upload" });
  }
};

// Queries and returns all applicant records associated with a specific job ID, sorted by creation date.
export const getApplicantsByJob = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { jobId } = req.params;

    const applicants = await Applicant.find({ jobId }).sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: applicants.length, data: applicants });
  } catch (error: any) {
    console.error(
      `Error fetching applicants for job ${req.params.jobId}:`,
      error,
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to retrieve applicants" });
  }
};

// Retrieves all jobs and maps over them to attach aggregate applicant and evaluation counts for dashboard visualization.
export const getAllSessions = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).lean();

    // Using Promise.all to concurrently execute database count queries for every job, reducing total lookup time
    const sessionsSummary = await Promise.all(
      jobs.map(async (job) => {
        const applicantCount = await Applicant.countDocuments({
          jobId: job._id,
        });

        const evaluatedCount = await Applicant.countDocuments({
          jobId: job._id,
          "evaluation.score": { $exists: true },
        });

        return {
          ...job,
          applicantCount,
          evaluatedCount,
          status: job.rubric ? "Active" : "Draft",
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: sessionsSummary.length,
      data: sessionsSummary,
    });
  } catch (error) {
    console.error("Error fetching sessions summary:", error);
    res.status(500).json({ message: "Server error retrieving sessions" });
  }
};