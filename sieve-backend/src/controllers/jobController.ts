import { Request, Response } from 'express';
import Job from '../models/Job';
import { generateRubricFromJD } from '../services/aiService'; 

export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, rawJD } = req.body;
    if (!title || !rawJD) {
      return res.status(400).json({ message: 'Title and rawJD are required' });
    }
    const newJob = await Job.create({ title, rawJD });
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Server error creating job' });
  }
};

export const generateRubric = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;

    // 1. Find the job in the database
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }


    const aiResult = await generateRubricFromJD(job.rawJD);
    
    // Strictly map the AI's master object to our schema
    job.rubric = {
      dimensions: aiResult.dimensions || [],
      dealbreakers: aiResult.dealbreakers || [],
      niceToHave: aiResult.niceToHave || []
    };

    await job.save();

    // 5. Send the updated job back to the frontend
    res.status(200).json({
      message: 'Rubric generated successfully',
      job: job
    });

  } catch (error: any) {
    console.error('Error generating rubric:', error);
    // Force the server to send the actual error back to PowerShell
    res.status(500).json({ 
      message: 'Server error generating rubric via AI',
      errorDetails: error.message 
    });
  }
};

export const updateJobRubric = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rubric } = req.body;

    if (!rubric || !rubric.dimensions) {
      return res.status(400).json({ message: 'A valid rubric object is required in the request body' });
    }

    // Ensure the weights still equal exactly 100 before saving
    const totalWeight = rubric.dimensions.reduce((sum: number, dim: any) => sum + (dim.weight || 0), 0);
    if (totalWeight !== 100) {
      return res.status(400).json({ message: `Rubric dimensions must sum to exactly 100. Current sum is ${totalWeight}.` });
    }

    // Find the job and completely overwrite the rubric field
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: { rubric: rubric } },
      { new: true, runValidators: true } // new: true returns the updated document
    );

    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({
      message: 'Rubric successfully overwritten by recruiter',
      job: updatedJob
    });

  } catch (error) {
    console.error('Error updating job rubric:', error);
    res.status(500).json({ message: 'Server error while updating rubric' });
  }
};

// Fetch all jobs for the dashboard
export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    // find() without parameters gets everything, sort({ createdAt: -1 }) puts newest first
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve jobs' });
  }
};

