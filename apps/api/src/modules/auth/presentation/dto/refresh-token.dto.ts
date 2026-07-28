import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;

  @ApiPropertyOptional({
    description: 'Workspace actif à conserver après refresh',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
