import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  public getClient(): Redis {
    return this.redis;
  }

  async checkConnection(): Promise<string> {
    try {
      const result = await this.redis.ping();
      return result; // 'PONG'
    } catch (error) {
      console.error(error);
      return 'Error connecting to Redis';
    }
  }
}
