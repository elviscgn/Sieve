import { Router } from 'express';
import { askApplicantQuestion, getApplicantsByJob } from '../controllers/applicantController';
import { apiKeyAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/applicants/{id}/ask:
 *   post:
 *     summary: Ask a question about an applicant (Real-time Stream)
 *     description: Streams a real-time AI response answering a recruiter's question about a specific candidate based on the job rubric and their profile.
 *     tags: [Applicants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ID of the applicant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - question
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: The MongoDB ID of the job session
 *               question:
 *                 type: string
 *                 description: The question to ask the AI (e.g., "Does this candidate have React experience?")
 *     responses:
 *       200:
 *         description: Server-Sent Events (SSE) stream of text chunks.
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         description: Missing required fields or rubric not generated.
 *       404:
 *         description: Job or Applicant not found.
 */
router.post('/:id/ask', askApplicantQuestion);

/**
 * @openapi
 * /api/applicants/job/{jobId}:
 *   get:
 *     summary: Fetch all applicants for a specific job
 *     tags: [Applicants]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ID of the job to filter applicants by
 *     responses:
 *       200:
 *         description: A list of applicants for the specified job
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error retrieving applicants
 */
router.get('/job/:jobId', apiKeyAuth, getApplicantsByJob);

export default router;