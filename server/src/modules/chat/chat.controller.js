import * as ragEngine from './chat.service.js';

export const checkHealth = (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
}

export const answerQuestion = async (req, res) => {
    try {
        const { message } = req.body;

        // Validation
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message is required and must be a non-empty string'
            });
        }

        // Process the question
        console.log(`📝 User question: "${message}"`);
        const result = await ragEngine.answerQuestion(message);

        console.log(`✅ Response generated`);

        res.json(result);

    } catch (error) {
        console.error('❌ Error processing chat:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            answer: "I'm having trouble right now. Please try again in a moment."
        });
    }
}