import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'redis',
          port: parseInt(process.env.REDIS_PORT || '6666', 10),
        });
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
