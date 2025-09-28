import logger from '#src/config/logger.js';
import { createUser, authenticateUser } from '#src/services/auth.service.js';
import { cookies } from '#src/utils/cookies.js';
import { formatValidator } from '#src/utils/format.js';
import { jwtToken } from '#src/utils/jwt.js';
import { signUpSchema, signInSchema } from '#src/validations/auth.js';

export const signUp = async (req, res, next) => {
  try {
    const ValidationResult = signUpSchema.safeParse(req.body);
    if (!ValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidator(ValidationResult.error),
      });
    }
    const { name, email, role, password } = ValidationResult.data;

    //AUTH SERVICE
    const user = await createUser({ name, email, password, role });
    const token = jwtToken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    cookies.set(res, 'token', token);

    logger.info('User registered successfully', email);
    return res.status(200).json({
      message: 'User registered',
      user: {
        id: user.id,
        name:user.name,
        email:user.email,
        role:user.role,
      },
    });
  } catch (error) {
    logger.error('Failed to sign up', error);
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const ValidationResult = signInSchema.safeParse(req.body);
    if (!ValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidator(ValidationResult.error),
      });
    }
    const { email, password } = ValidationResult.data;

    //AUTH SERVICE
    const user = await authenticateUser({ email, password });
    const token = jwtToken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    cookies.set(res, 'token', token);

    logger.info('User signed in successfully', email);
    return res.status(200).json({
      message: 'User signed in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Failed to sign in', error);
    if (error.message === 'User not found') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (error.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    cookies.clear(res, 'token');
    
    logger.info('User signed out successfully');
    return res.status(200).json({
      message: 'User signed out successfully',
    });
  } catch (error) {
    logger.error('Failed to sign out', error);
    next(error);
  }
};
