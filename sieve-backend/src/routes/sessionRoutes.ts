import { Router } from "express";
import {
  evaluateAllApplicants,
  getSessionResults,
  streamSessionProgress,
  overrideCandidateRank,
  compareSelectedCandidates,
  getAllSessions,
} from "../controllers/applicantController";
import { apiKeyAuth } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /api/sessions:
 *   post:
 *     summary: Trigger the AI evaluation process for all applicants
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: The MongoDB ID of the job being evaluated
 *     responses:
 *       200:
 *         description: Evaluation triggered successfully
 */
// POST /api/sessions - Triggers evaluation
router.post("/", evaluateAllApplicants);

/**
 * @openapi
 * /api/sessions/{id}/results:
 *   get:
 *     summary: Fetch the evaluation leaderboard for a session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The specific Session (Job) ID
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 */
// GET /api/sessions/:id/results - Fetches leaderboard
router.get("/:id/results", getSessionResults);

/**
 * @openapi
 * /api/sessions/{id}/stream:
 *   get:
 *     summary: Connect to the live Server-Sent Events (SSE) progress stream
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The specific Session (Job) ID
 *     responses:
 *       200:
 *         description: SSE connection established
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
// GET /api/sessions/:id/stream - Live SSE progress
router.get("/:id/stream", streamSessionProgress);

/**
 * @openapi
 * /api/sessions/{id}/override:
 *   put:
 *     summary: Log a recruiter manual rank override for a candidate
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The specific Session (Job) ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicantId
 *               - newRank
 *             properties:
 *               applicantId:
 *                 type: string
 *                 description: The MongoDB ID of the candidate being moved
 *               newRank:
 *                 type: number
 *                 description: The new numerical rank assigned by the recruiter
 *                 example: 1
 *     responses:
 *       200:
 *         description: Recruiter override logged successfully
 */
router.put("/:id/override", overrideCandidateRank);

/**
 * @openapi
 * /api/sessions/{id}/compare:
 *   post:
 *     summary: Generate a head-to-head AI comparison for selected candidates
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The specific Session (Job) ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidateIds
 *             properties:
 *               candidateIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of exactly 2 or 3 candidate MongoDB IDs
 *                 example: ["661a9f8b1c2d3e4f5a6b7c8d", "661a9f8b1c2d3e4f5a6b7c8e"]
 *     responses:
 *       200:
 *         description: Comparison generated successfully
 *       400:
 *         description: Invalid candidateIds array
 *       404:
 *         description: Job or candidates not found
 */
router.post("/:id/compare", compareSelectedCandidates);

/**
 * @openapi
 * /api/sessions:
 *   get:
 *     summary: Fetch all sessions (jobs) with their applicant statistics
 *     tags: [Sessions]
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 */
router.get("/", apiKeyAuth, getAllSessions);

export default router;
