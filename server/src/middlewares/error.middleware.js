import logger from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
	const requestId = req && req.requestId;
	const status = err.statusCode || err.status || 500;
	const message = err ;

	// Log full error server-side, include requestId for correlation
	logger.error('unhandled_error', {
		message: err.message,
		stack: err.stack,
		requestId,
		path: req?.originalUrl,
		method: req?.method,
	});

	// Don't leak stack traces in production
	const payload = {
		success: false,
		message,
		requestId,
	};

	res.status(status).json(payload);
}
