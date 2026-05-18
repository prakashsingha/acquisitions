import logger from '#config/logger.js';
import { isEmailAlreadyExistsError } from '#utils/errors.js';
import { formatValidationError } from '#utils/format.js';
import { signupSchema } from '#validations/auth.validation.js';
import { createUser, generateToken } from '#services/auth.service.js';
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
