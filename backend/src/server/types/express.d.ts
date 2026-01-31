import { AuthInfo } from './models';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthInfo;
    }
  }
}
