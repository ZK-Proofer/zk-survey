import { Request, Response, NextFunction } from 'express';
import { Logger, NestMiddleware } from '@nestjs/common';

export class LogMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LogMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log(`${req.method} ${req.url}`);
    next();
  }
}
