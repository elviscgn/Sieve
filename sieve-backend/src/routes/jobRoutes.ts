import { Router } from 'express';
<<<<<<< HEAD
import { createJob, generateRubric } from '../controllers/jobController';
import { ingestApplicants } from '../controllers/applicantController'; 

const router = Router();

//POST /api/jobs
router.post('/', createJob);

// POST /api/jobs/:id/applicants
router.post('/:id/applicants', ingestApplicants);

// POST /api/jobs/:id/parse-rubric
router.post('/:id/parse-rubric', generateRubric); 
=======
import { createJob, generateRubric } from '../controllers/jobController'; // 1. Import the new function
import { evaluateAllApplicants, ingestApplicants } from '../controllers/applicantController';

const router = Router();

// Route: POST /api/jobs
router.post('/', createJob);

// Route: POST /api/jobs/:id/applicants
router.post('/:id/applicants', ingestApplicants);

// Route: POST /api/jobs/:id/rubric/generate
router.post('/:id/rubric/generate', generateRubric); 

router.post('/:id/evaluate', evaluateAllApplicants);
>>>>>>> e8e0172374d445e628a93aa1f825be3c4cc3595a

export default router;