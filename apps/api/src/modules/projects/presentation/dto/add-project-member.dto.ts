import { IsEmail, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ROLES = ['VIEWER', 'EDITOR', 'ADMIN'] as const;

export class AddProjectMemberDto {
  @ApiProperty({ example: 'collegue@acme.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: ROLES, default: 'EDITOR' })
  @IsOptional()
  @IsIn(ROLES)
  role?: (typeof ROLES)[number];
}

export class UpdateProjectMemberRoleDto {
  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role!: (typeof ROLES)[number];
}
