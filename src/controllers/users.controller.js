import logger from '#config/logger.js';
import {
  deleteUser as deleteUserRecord,
  getAllUsers,
  getUserById as findUserById,
  updateUser as updateUserRecord,
} from '#services/users.services.js';
import { isEmailAlreadyExistsError } from '#utils/errors.js';
import { formatValidationError } from '#utils/format.js';
import {
  updateUserSchema,
  userIdSchema,
} from '#validations/users.validation.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    const userRows = await getAllUsers();
    res.status(200).json({
      message: 'Users fetched successfully',
      data: {
        users: userRows,
        count: userRows.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const paramsResult = userIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(400).json({
        message: 'Invalid user id',
        errors: formatValidationError(paramsResult.error),
      });
    }

    const { id } = paramsResult.data;
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info('User fetched by id:', { id });
    res.status(200).json({
      message: 'User fetched successfully',
      data: { user },
    });
  } catch (error) {
    logger.error('Error fetching user by id:', error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const paramsResult = userIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(400).json({
        message: 'Invalid user id',
        errors: formatValidationError(paramsResult.error),
      });
    }

    const bodyResult = updateUserSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        message: 'Invalid input data',
        errors: formatValidationError(bodyResult.error),
      });
    }

    const { id } = paramsResult.data;
    const isAdmin = req.user.role === 'admin';
    if (req.user.id !== id) {
      return res.status(403).json({
        message: 'You can only update your own account',
      });
    }

    const payload = bodyResult.data;
    if (payload.role !== undefined && !isAdmin) {
      return res.status(403).json({
        message: 'Only administrators can change user roles',
      });
    }

    const updates = { ...payload };
    if (!isAdmin) {
      delete updates.role;
    }

    const user = await updateUserRecord(id, updates);
    logger.info('User updated via API:', { id, actorId: req.user.id });
    res.status(200).json({
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    logger.error('Error updating user:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (isEmailAlreadyExistsError(error)) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const paramsResult = userIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(400).json({
        message: 'Invalid user id',
        errors: formatValidationError(paramsResult.error),
      });
    }

    const { id } = paramsResult.data;
    await deleteUserRecord(id);
    logger.info('User deleted via API:', { id, actorId: req.user.id });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' });
    }
    next(error);
  }
};
