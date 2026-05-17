import { signup } from '#controllers/auth.controller.js';
import express from 'express';

const authRouter = express.Router();

authRouter.post('/signup', signup);

authRouter.post('/signin', async (req, res) => {
  res.send('POST /api/auth/signin');
});
authRouter.post('/signout', async (req, res) => {
  res.send('POST /api/auth/signout');
});

export default authRouter;
