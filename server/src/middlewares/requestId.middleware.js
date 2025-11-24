import { v4 as uuidv4 } from 'uuid';

export default function requestIdMiddleware(req, res, next) {
  try {
    const headerId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
    const id = headerId || uuidv4();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
  } catch (err) {
    // If uuid generation fails for any reason, continue without blocking the request
  }
  next();
}
