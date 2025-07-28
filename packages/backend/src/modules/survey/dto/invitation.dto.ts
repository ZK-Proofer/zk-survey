import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class InvitationResponseDto {
  id: number;
  email: string;
  uuid: string;
  status: string;
  created_at: Date;
}
