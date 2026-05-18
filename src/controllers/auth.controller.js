import logger from '#config/logger.js';
import { isEmailAlreadyExistsError } from '#utils/errors.js';
import { formatValidationError } from '#utils/format.js';
import { signinSchema, signupSchema } from '#validations/auth.validation.js';
import {
  authenticateUser,
  createUser,
  generateToken,
} from '#services/auth.service.js';
import { cookies } from '#utils/cookies.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid input data',
        errors: formatValidationError(validationResult.error),
      });
    }

    const { name, email, role } = validationResult.data;
    const user = await createUser({
      name,
      email,
      password: validationResult.data.password,
      role,
    });
    const token = generateToken(user);
    cookies.set(res, 'token', token);

    logger.info('User registered successfully:', { name, email, role });
    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    logger.error('Signup error:', error);

    if (isEmailAlreadyExistsError(error)) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const validationResult = signinSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid input data',
        errors: formatValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;
    const user = await authenticateUser(email, password);
    const token = generateToken(user);
    cookies.set(res, 'token', token);

    logger.info('User signed in successfully:', {
      email: user.email,
      role: user.role,
    });
    res.status(200).json({
      message: 'Signed in successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    logger.error('Signin error:', error);

    if (
      error.message === 'USER_NOT_FOUND' ||
      error.message === 'INVALID_PASSWORD'
    ) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    cookies.clear(res, 'token');
    logger.info('User signed out');
    res.status(200).json({ message: 'Signed out successfully.' });
  } catch (error) {
    logger.error('Signout error:', error);
    next(error);
  }
};
