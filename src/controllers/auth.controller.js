import logger from '#src/config/logger.js';
import { createUser } from '#src/services/auth.service.js';
import { cookies } from '#src/utils/cookies.js';
import { formatValidator } from '#src/utils/format.js';
import { jwtToken } from '#src/utils/jwt.js';
import { signUpSchema } from '#src/validations/auth.js';

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
