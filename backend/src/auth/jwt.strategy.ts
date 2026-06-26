import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { JwtPayload } from './interfaces/request-with-user.interface';
import { parseAuthCookie } from './auth-cookie.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_SECRET environment variable is not set. Server cannot start without it.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => parseAuthCookie(req?.headers?.cookie),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId,
    };
  }
}
