import { Router } from 'express';
import { emailController } from '../controllers/EmailController';

const router = Router();

router.post('/email', emailController.sendEmail);
router.post('/emails', emailController.sendEmails);

export default router;
