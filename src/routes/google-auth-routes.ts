import { Router } from 'express';
import { googleAuth } from '../http/controllers/auth-google-controller';

const googleAuthRouter = Router();

googleAuthRouter.post('/auth/google', googleAuth);

export default googleAuthRouter;