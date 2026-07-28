import { Module } from '@nestjs/common';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { DashboardService } from './application/dashboard.service';
import { DashboardController } from './presentation/dashboard.controller';

@Module({
  imports: [IntelligenceModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
