import express, { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import config from '../config/env.config';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // TODO: Replace hardcoded check with DB lookup (e.g. users table)
  if (username === 'admin' && password === 'admin') {
    const token = jwt.sign({ user: 'admin', role: 'admin' }, config.jwtSecret, { expiresIn: '24h' });
    
    res.json({
      token,
      expiresIn: 86400
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

export default router;