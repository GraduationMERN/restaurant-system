import express from 'express';
import { checkHealth, answerQuestion } from './chat.controller.js';
const router = express.Router();

router.get('/health', checkHealth);
// Main chat endpoint
router.post('/chat', answerQuestion);

export default router;
