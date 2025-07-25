import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { Observable, catchError, tap, finalize } from 'rxjs';
import { Request } from 'express';

export interface RequestWithQueryRunner extends Request {
  queryRunner: QueryRunner;
}

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly datasource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<RequestWithQueryRunner>();
    const qr = this.datasource.createQueryRunner();

    try {
      await qr.connect();
      await qr.startTransaction();
      req.queryRunner = qr;

      return next.handle().pipe(
        tap(() => {
          qr.commitTransaction().catch(() => {
            throw new InternalServerErrorException(
              'An error occurred while committing the transaction',
            );
          });
        }),
        catchError((error) => {
          qr.rollbackTransaction().catch(() => {
            throw new InternalServerErrorException(
              'An error occurred while rolling back the transaction',
            );
          });
          throw error;
        }),
        finalize(() => {
          qr.release().catch(() => {
            console.error('An error occurred while releasing the QueryRunner');
          });
        }),
      );
    } catch {
      await qr.release();
      throw new InternalServerErrorException(
        'An error occurred while initializing the transaction',
      );
    }
  }
}
