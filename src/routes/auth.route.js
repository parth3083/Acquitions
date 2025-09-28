import { signUp } from '#src/controllers/auth.controller.js';
import express from 'express';

const router = express.Router();

router.post('/sign-up', signUp);
router.post('/sign-in', (req, res) => {
  res.send('POST request from route : /api/auth/sign-in');
});
router.post('/sign-out', (req, res) => {
  res.send('POST request from route : /api/auth/sign-out');
});

export default router;
