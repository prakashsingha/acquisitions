import { db } from '#config/database.js';
import { users } from '#models/users.model.js';
import logger from '#config/logger.js';
import { hashPassword } from '#services/auth.service.js';
import { and, eq, ne } from 'drizzle-orm';

const publicUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  created_at: users.created_at,
  updated_at: users.updated_at,
};

export const getAllUsers = async () => {
  try {
    return await db.select(publicUserColumns).from(users);
  } catch (error) {
    logger.error('Error getting all users:', error);
    throw error;
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select(publicUserColumns)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  } catch (error) {
    logger.error('Error getting user by id:', error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const existing = await getUserById(id);
    if (!existing) {
      throw new Error('USER_NOT_FOUND');
    }

    if (updates.email !== undefined) {
      const [emailTaken] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, updates.email), ne(users.id, id)))
        .limit(1);
      if (emailTaken) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }
    }

    const patch = { updated_at: new Date() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.email !== undefined) patch.email = updates.email;
    if (updates.role !== undefined) patch.role = updates.role;
    if (updates.password !== undefined) {
      patch.password = await hashPassword(updates.password);
    }

    const [updated] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning(publicUserColumns);

    logger.info('User updated:', { id });
    return updated;
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    const existing = await getUserById(id);
    if (!existing) {
      throw new Error('USER_NOT_FOUND');
    }

    await db.delete(users).where(eq(users.id, id));
    logger.info('User deleted:', { id });
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
};
