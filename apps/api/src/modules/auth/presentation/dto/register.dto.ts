import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'joel@acme.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8, { message: 'Minimum 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Doit contenir majuscule, minuscule et chiffre',
  })
  password!: string;

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
  @ValidateIf((o: RegisterDto) => !o.inviteToken)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  workspaceName?: string;

  @ApiPropertyOptional({ description: "Token d'invitation workspace" })
  @IsOptional()
  @IsString()
  inviteToken?: string;
}
