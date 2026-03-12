import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import config from '../config/env.config';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, config.jwtSecret, (err: any, user: any) => {
      if (err) { 
        return res.sendStatus(403);
      }
      // (Optional) Attach user to request if needed: req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};