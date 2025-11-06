import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../redis/redis.module';
import { ProductModule } from '../product/product.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'test',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // 개발 환경에서만 사용
};

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory() {
        return dataSourceOptions;
      },
      dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return Promise.resolve(
          addTransactionalDataSource(new DataSource(options)),
        );
      },
    }),
    RedisModule,
    ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
