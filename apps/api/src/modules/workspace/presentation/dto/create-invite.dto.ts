import { IsEmail, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const INVITE_ROLES = ['ADMIN', 'MEMBER', 'GUEST'] as const;

export class CreateInviteDto {
  @ApiProperty({ example: 'collegue@acme.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email!: string;

  @ApiPropertyOptional({ enum: INVITE_ROLES, default: 'MEMBER' })
  @IsOptional()
  @IsIn(INVITE_ROLES)
  role?: (typeof INVITE_ROLES)[number];
}
