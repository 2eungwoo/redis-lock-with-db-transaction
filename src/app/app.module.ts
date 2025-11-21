import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../redis/redis.module';
import { ProductModule } from '../product/product.module';
import { DataSourceOptions } from 'typeorm';
import { initializeTransactionalContext } from 'typeorm-transactional';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'test',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    RedisModule,
    ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    initializeTransactionalContext();
  }
}
