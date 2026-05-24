import { Request, Response, NextFunction } from 'express';
import { JwtPurpose, jwtService } from '../services/jwt.service';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verifyToken = (purpose: JwtPurpose) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let token = '';
    
    // 1. Try Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = authHeader.split(' ')[1];
    }
    
    // 2. Try Request Body (JSON, Form, or Raw Text)
    if (!token && req.body) {
      if (typeof req.body === 'string' && req.body.startsWith('ey')) {
        token = req.body; // Entire body is the token
      } else if (req.body.provisioningToken) {
        token = req.body.provisioningToken; // JSON property
      }
    }
    
    // 3. Try Query Parameter (fallback)
    if (!token && req.query && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      console.log(`[AUTH] Failure: No token found for purpose ${purpose}. URL: ${req.url}`);
      console.log(`[AUTH] Headers: ${JSON.stringify(req.headers)}`);
      return res.sendStatus(401);
    }

    try {
      let decoded = jwtService.verifyToken(token, purpose);
      if (!decoded.valid) {
        console.log(`[AUTH] Failure: JWT verification failed for purpose ${purpose}`);
        return res.sendStatus(403);
      }
      req.user = decoded.decoded;
      next();
    } catch (err) {
      console.log(`[AUTH] Exception: Jwt validation failed: ${err}`);
      return res.sendStatus(403);
    }
  };
};
