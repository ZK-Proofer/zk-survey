import { Controller } from '@nestjs/common';
import { VerifyService } from './verify.service';

@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}
}
