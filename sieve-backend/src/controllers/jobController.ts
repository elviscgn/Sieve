import { Request, Response } from "express";
import Job from "../models/Job";
import { generateRubricFromJD } from "../services/aiService";

// Creates a new job document in the database using the provided title and raw job description.
export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, rawJD } = req.body;
    if (!title || !rawJD) {
      return res.status(400).json({ message: "Title and rawJD are required" });
    }
    const newJob = await Job.create({ title, rawJD });
    res.status(201).json(newJob);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Server error creating job" });
  }
};

// Generates an AI-driven evaluation rubric based on the raw job description and saves it to the job document.
export const generateRubric = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const aiResult = await generateRubricFromJD(job.rawJD);

    job.rubric = {
      dimensions: aiResult.dimensions || [],
      dealbreakers: aiResult.dealbreakers || [],
      niceToHave: aiResult.niceToHave || [],
    };

    await job.save();

    res.status(200).json({
      message: "Rubric generated successfully",
      job: job,
    });
  } catch (error: any) {
    console.error("Error generating rubric:", error);
    res.status(500).json({
      message: "Server error generating rubric via AI",
      errorDetails: error.message,
    });
  }
};

// Validates and completely overwrites a job's existing rubric with a recruiter's manually modified version.
export const updateJobRubric = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rubric } = req.body;

    if (!rubric || !rubric.dimensions) {
      return res
        .status(400)
        .json({
          message: "A valid rubric object is required in the request body",
        });
    }

    // Using reduce to iterate over dimensions and accumulate the total sum of their weights
    const totalWeight = rubric.dimensions.reduce(
      (sum: number, dim: any) => sum + (dim.weight || 0),
      0,
    );
    if (totalWeight !== 100) {
      return res
        .status(400)
        .json({
          message: `Rubric dimensions must sum to exactly 100. Current sum is ${totalWeight}.`,
        });
    }

    // Utilizing $set to target a specific nested field and { new: true } to return the modified document instead of the original
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: { rubric: rubric } },
      { new: true, runValidators: true },
    );

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({
      message: "Rubric successfully overwritten by recruiter",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Error updating job rubric:", error);
    res.status(500).json({ message: "Server error while updating rubric" });
  }
};

// Retrieves all job records from the database, sorted in descending order by creation date.
export const getAllJobs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to retrieve jobs" });
  }
};