import { Router } from "express";
import {
  createJob,
  generateRubric,
  getAllJobs,
  updateJobRubric,
} from "../controllers/jobController";
import { ingestApplicants } from "../controllers/applicantController";
import multer from "multer";
import { uploadAndParseResume } from "../controllers/applicantController";
import { apiKeyAuth } from "../middleware/auth";

// Configure multer to hold the file in memory temporarily
const upload = multer({ storage: multer.memoryStorage() });

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
router.post("/", createJob);

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
router.post("/:id/applicants", ingestApplicants);

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
router.post("/:id/parse-rubric", generateRubric);

/**
 * @swagger
 * /api/jobs/{id}/rubric:
 *   put:
 *     summary: Overwrite Job Rubric (Human-in-the-Loop)
 *     description: Allows a recruiter to manually edit and overwrite the AI-generated rubric dimensions, weights, and dealbreakers.
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ID of the job
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rubric
 *             properties:
 *               rubric:
 *                 type: object
 *                 description: The completely modified rubric object
 *     responses:
 *       200:
 *         description: Rubric successfully overwritten
 *       400:
 *         description: Invalid rubric format or weights do not equal 100
 *       404:
 *         description: Job not found
 */
router.put("/:id/rubric", updateJobRubric);

/**
 * @swagger
 * /api/jobs/{id}/upload-resume:
 *   post:
 *     summary: Upload and Parse Candidate Resume (PDF)
 *     description: Accepts a PDF resume, uses AI to extract text, and maps it strictly to the Umurava Talent Profile Schema.
 *     tags: [Applicants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ID of the job this applicant is applying for
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: The PDF resume file to parse
 *     responses:
 *       201:
 *         description: Resume parsed and applicant created
 *       400:
 *         description: Invalid file format or missing file
 *       404:
 *         description: Job not found
 */
router.post(
  "/:id/upload-resume",
  upload.single("resume"),
  uploadAndParseResume,
);

/**
 * @openapi
 * /api/jobs:
 *   get:
 *     summary: Fetch all jobs for the dashboard
 *     tags: [Jobs]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of all jobs retrieved successfully
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
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error retrieving jobs
 */
router.get("/", apiKeyAuth, getAllJobs);

export default router;
