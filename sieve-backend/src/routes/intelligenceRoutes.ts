import { Router } from 'express';
import { getTalentPoolIntelligence } from '../controllers/intelligenceController';

const router = Router();

/**
 * @swagger
 * /api/intelligence:
 *   get:
 *     summary: Get Talent Pool Intelligence
 *     description: Analyzes all screening sessions and returns market insights and skill gaps.
 *     tags: [Intelligence]
 *     responses:
 *       200:
 *         description: Dashboard insights generated successfully.
 */
router.get('/', getTalentPoolIntelligence);

export default router;