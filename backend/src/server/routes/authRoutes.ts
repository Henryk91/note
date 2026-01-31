import { Router } from 'express';
import { authController, LoginSchema, RegisterSchema } from '../controllers/AuthController';
import { validate } from '../middleware/validation';

export const authRouter = Router();

authRouter.post('/register', validate(RegisterSchema), authController.register);
authRouter.post('/login', validate(LoginSchema), authController.login);
authRouter.get('/me', authController.getMe);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.post('/logout-all', authController.logoutAll);

export default authRouter;
