import * as chatService from './chat.service.js';

export const checkHealth = (req, res) => {
    res.json({ status: 'ok', time: new Date() });
}

export const answerQuestion = async (req, res) => {
    try {
        const { message } = req.body;
        
        // Retrieve Guest ID from headers
        const guestId = req.headers['x-guest-id'] || "anonymous_guest";

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, error: 'Invalid message' });
        }

        console.log(`📝 Request from ${guestId}: "${message}"`);

        // Call Service
        const result = await chatService.processUserMessage(message, guestId);

        res.json({
            success: true,
            answer: result.answer,
            action: result.action
        });

    } catch (error) {
        console.error('❌ Controller Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
}