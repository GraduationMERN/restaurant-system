import logger from '../utils/logger.js';

export default function requestLogger(req, res, next) {
  const start = process.hrtime();
  const reqLog = logger.child({ requestId: req.requestId, method: req.method, url: req.originalUrl });

  // attach a request-scoped logger to the request for handlers to use
  req.log = reqLog;
  reqLog.info('request_started');

  res.on('finish', () => {
    const [s, ns] = process.hrtime(start);
    const durationMs = (s * 1e3 + ns / 1e6).toFixed(3);
    reqLog.info('request_finished', { statusCode: res.statusCode, durationMs });
  });

  next();
}
