import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LockModule } from './lock/lock.module';

@Module({
  imports: [LockModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
