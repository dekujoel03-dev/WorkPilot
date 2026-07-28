import { IsString, MinLength, MaxLength, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupabaseRegisterDto {
  @ApiProperty({ example: 'Joel' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Martin' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @ValidateIf((o: SupabaseRegisterDto) => !o.inviteToken)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  workspaceName?: string;

  @ApiPropertyOptional({ description: "Token d'invitation workspace" })
  @IsOptional()
  @IsString()
  inviteToken?: string;
}
