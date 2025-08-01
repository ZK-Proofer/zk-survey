import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  email: string;
}

export class InvitationResponseDto {
  id: number;
  email: string;
  uuid: string;
  status: string;
  created_at: Date;
}

export class SaveCommitmentDto {
  @IsString()
  commitmentHash: string;
}

export class VerificationResponseDto {
  success: boolean;
  message: string;
}

export class VerifyCommitmentDto {
  @IsString()
  commitmentHash: string;
}

export class VerifyCommitmentResponseDto {
  success: boolean;
  leaves: string[];
}
