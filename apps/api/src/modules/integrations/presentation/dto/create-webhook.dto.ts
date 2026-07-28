import { IsString, IsUrl, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://example.com/hooks/work-pilot' })
  @IsUrl({}, { message: 'URL invalide' })
  url!: string;

  @ApiProperty({ example: ['project.created', 'task.updated'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events!: string[];
}
