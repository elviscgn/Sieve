import { Router } from 'express';
import { createJob, generateRubric } from '../controllers/jobController';
import { ingestApplicants } from '../controllers/applicantController'; 

const router = Router();

/**
 * @openapi
 * /api/jobs:
 *   post:
 *     summary: Create a new job posting
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job created successfully
 */
//POST /api/jobs
router.post('/', createJob);

/**
 * @openapi
 * /api/jobs/{id}/applicants:
 *   post:
 *     summary: Ingest applicants into a specific job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The specific Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               applicants:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Array of talent profile objects matching the Umurava schema
 *     responses:
 *       200:
 *         description: Applicants successfully ingested
 */
// POST /api/jobs/:id/applicants
router.post('/:id/applicants', ingestApplicants);

/**
 * @openapi
 * /api/jobs/{id}/parse-rubric:
 *   post:
 *     summary: Generate a scoring rubric using AI based on the job description
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The specific Job ID
 *     responses:
 *       200:
 *         description: Rubric generated successfully
 */      
// POST /api/jobs/:id/parse-rubric  
router.post('/:id/parse-rubric', generateRubric); 

export default router;