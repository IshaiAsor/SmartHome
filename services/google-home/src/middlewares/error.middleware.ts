import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.status ?? 500;
  console.error(`[google-home] ${req.method} ${req.url} → ${status}:`, err.message ?? err);
  res.status(status).json({ error: err.message ?? 'Internal server error' });
}
