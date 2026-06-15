import { Request, Response, NextFunction } from 'express';
import { JwtPurpose, jwtService } from '../services/jwt.service';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

function extractToken(req: Request): string {
  // 1. Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader) return authHeader.split(' ')[1];

  // 2. Request body (raw JWT string or { provisioningToken })
  if (req.body) {
    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      bodyData = bodyData.trim();
      try {
        const parsed = JSON.parse(bodyData);
        if (parsed && typeof parsed === 'object') bodyData = parsed;
      } catch {}
    }
    if (typeof bodyData === 'string' && (bodyData.startsWith('ey') || bodyData.startsWith('"ey'))) {
      let t = bodyData;
      if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
      return t;
    }
    if (bodyData?.provisioningToken) return bodyData.provisioningToken.trim();
  }

  // 3. Query parameter
  if (req.query?.token) return req.query.token as string;

  return '';
}

export const verifyTokenAny = (purposes: JwtPurpose[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      console.log(`[AUTH] ❌ No token found. URL: ${req.url}`);
      return res.sendStatus(401);
    }

    for (const purpose of purposes) {
      try {
        const decoded = jwtService.verifyToken(token, purpose);
        if (decoded.valid) {
          req.user = { ...decoded.decoded, _jwtPurpose: purpose };
          return next();
        }
      } catch {}
    }

    console.log(`[AUTH] ❌ JWT not valid for any of: ${purposes.join(', ')}`);
    return res.sendStatus(403);
  };
};

export const verifyToken = (purpose: JwtPurpose) => verifyTokenAny([purpose]);
