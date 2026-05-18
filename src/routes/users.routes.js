import express from 'express';
import {
  deleteUser,
  fetchAllUsers,
  getUserById,
  updateUser,
} from '#controllers/users.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';

const usersRoutes = express.Router();

usersRoutes.use(authenticateToken);

usersRoutes.get('/', fetchAllUsers);
usersRoutes.get('/:id', getUserById);
usersRoutes.put('/:id', updateUser);
usersRoutes.delete('/:id', requireRole('admin'), deleteUser);

export default usersRoutes;
