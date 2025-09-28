import { db } from '#src/config/database.js';
import logger from '#src/config/logger.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '#src/models/user.model.js';

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error('Error in hashing the password', error);
    throw new Error('Failed the hash the password');
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) throw new Error('User already exists');

    const passsword_hash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: passsword_hash, role })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      });

    logger.info(`User ${newUser.email} created successfully`);

    return newUser;
  } catch (error) {
    logger.error('Failed in creating the user', error);
  }
};
