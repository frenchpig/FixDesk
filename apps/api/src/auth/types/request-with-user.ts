import type { Request } from 'express';
import type { JwtPayload } from './jwt-payload';

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
