import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '#config/database.js';
import { users } from '#models/users.model.js';
import { eq } from 'drizzle-orm';

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Password hashing failed', { cause: error });
  }
};

export const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw new Error('Password comparison failed', { cause: error });
  }
};

export const generateToken = user => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '1h' }
  );
};

export const authenticateUser = async (email, password) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      throw new Error('INVALID_PASSWORD');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };
  } catch (error) {
    if (
      error.message === 'USER_NOT_FOUND' ||
      error.message === 'INVALID_PASSWORD'
    ) {
      throw error;
    }
    logger.error('Error authenticating user:', error);
    throw error;
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const hashedPassword = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: hashedPassword, role })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      });

    logger.info('User created:', { name, email, role });
    return newUser;
  } catch (error) {
    logger.error('Error creating user111:', error);
    throw error;
  }
};
