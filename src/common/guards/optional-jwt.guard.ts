import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // ignore missing/invalid token
      const request = context.switchToHttp().getRequest();
      request.user = null;
    }
    return true;
  }

  handleRequest(_err: unknown, user: any) {
    return user ?? null;
  }
}

