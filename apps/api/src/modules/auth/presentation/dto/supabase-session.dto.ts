import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SupabaseSessionDto {
  @ApiPropertyOptional({ description: 'Workspace actif souhaité' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
