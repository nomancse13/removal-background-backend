import { ExecutionContext, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ErrorMessage, UserTypesEnum } from 'src/authentication/common/enum';
import { IS_PUBLIC_KEY } from 'src/authentication/utils/decorators';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  // handle request for admin
  handleRequest(err: any, user: any) {
    if (err) {
      throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    }
    // You can throw an exception based on either "info" or "err" arguments
    if (!user) {
      throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    }

    if (user.hashType != UserTypesEnum.ADMIN) {
      throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    }
    return user;
  }
}
