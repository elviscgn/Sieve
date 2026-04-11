import { Request, Response } from 'express';
import Applicant from '../models/Applicant';
import Job from '../models/Job';

export const ingestApplicants = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    const { source, applicants } = req.body;

    // 1. Validation & Verification
    if (!source || !applicants || !Array.isArray(applicants)) {
      return res.status(400).json({ message: 'Valid source and applicants array required' });
    }

    const jobExists = await Job.findById(jobId);
    if (!jobExists) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // 2. Formatting the Data
    const formattedApplicants = applicants.map((profile: any) => ({
      jobId: jobId,
      source: source,
      profile: profile
    }));

    // 3. Bulk Database Insertion
    const savedApplicants = await Applicant.insertMany(formattedApplicants);

    // 4. Success Response
    res.status(201).json({ 
      message: `Successfully ingested ${savedApplicants.length} applicants`, 
      insertedCount: savedApplicants.length 
    });

  } catch (error) {
    console.error('Error ingesting applicants:', error);
    res.status(500).json({ message: 'Server error ingesting applicants' });
  }
};