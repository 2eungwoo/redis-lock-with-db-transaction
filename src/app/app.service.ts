import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  async getStatus(): Promise<object> {
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();

    return {
      database: dbStatus,
      redis: redisStatus,
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'OK';
    } catch (error) {
      console.log(error);
      return 'Error';
    }
  }

  private async checkRedis(): Promise<string> {
    return this.redisService.checkConnection();
  }
}
