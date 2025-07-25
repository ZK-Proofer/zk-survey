import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const path = req.originalUrl;
    const now = Date.now();

    console.log(`[REQ] ${path} ${now.toLocaleString('ko-KR')}`);

    return next.handle().pipe(
      tap(() => {
        console.log(
          `[RES] ${path} ${Date.now().toLocaleString('ko-KR')} ${
            Date.now() - now
          }ms`,
        );
      }),
    );
  }
}
