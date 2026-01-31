import { Router } from 'express';
import { authController, RegisterSchema, LoginSchema } from '../controllers/AuthController';
import { validate } from '../middleware/validation';

const router = Router();

router.post('/register', validate(RegisterSchema), (req, res) => authController.register(req, res));
router.post('/login', validate(LoginSchema), (req, res) => authController.login(req, res));
router.get('/me', (req, res) => authController.getMe(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.post('/logout-all', (req, res) => authController.logoutAll(req, res));

export default router;
