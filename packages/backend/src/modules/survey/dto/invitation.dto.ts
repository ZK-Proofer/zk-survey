import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class SaveCommitmentDto {
  @IsString()
  @IsNotEmpty()
  commitmentHash: string;
}

export class InvitationResponseDto {
  id: number;
  email: string;
  uuid: string;
  status: string;
  created_at: Date;
}

export class VerificationResponseDto {
  success: boolean;
  message?: string;
}
