/* eslint-disable */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './product.entity';
import { RedisService } from '../redis/redis.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  async createProduct(name: string, stock: number): Promise<Product> {
    const product = this.productRepository.create({ name, stock });
    return this.productRepository.save(product);
  }

  async deductStock(productId: number, quantity: number): Promise<Product> {
    const resource = `product:${productId}:lock`;

    return this.redisService.withLock(resource, 5000, async () => {
      const product = await this.getProduct(productId);
      this.validateStock(product, quantity);

      console.log(`[product.stock] 현재 stock count : ${product.stock}`);
      return this.productRepository.save(product);
    });
  }

  async txWithLockAndRollback(
    productId: number,
    quantity: number,
  ): Promise<void> {
    const resource = `product:${productId}:lock`;
    const runner = this.dataSource.createQueryRunner();

    await runner.connect();
    await runner.startTransaction();

    try {
      await this.redisService.withLock(resource, 5000, async () => {
        const product = await runner.manager.findOne(Product, {
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) throw new Error('not found');

        this.validateStock(product, quantity);
        product.stock -= quantity;

        await runner.manager.save(product);

        // 의도적 실패 → 트랜잭션 롤백 유도
        throw new Error('forced rollback');
      });

      // withLock callback 끝나는 순간 락은 이미 해제된 상태임
      await runner.commitTransaction(); // 도달 X
    } catch (err) {
      await runner.rollbackTransaction(); // 여기서 rollback
      throw err;
    } finally {
      await runner.release();
    }
  }

  async txWithLockSafe(productId: number, quantity: number): Promise<void> {
    const resource = `product:${productId}:lock`;
    const { release } = await this.redisService.withLockManual(resource, 5000);
    const runner = this.dataSource.createQueryRunner();

    await runner.connect();
    await runner.startTransaction();
    try {
      const product = await runner.manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      this.validateStock(product, quantity);
      product.stock -= quantity;

      await runner.manager.save(product);
      await runner.commitTransaction(); // commit 먼저 또는
    } catch (e) {
      await runner.rollbackTransaction(); // rollback 먼저 시키고
      throw e;
    } finally {
      await runner.release(); // 트랜잭션 해제
      await release(); // 트랜잭션 해제 한 다음 락 해제
    }
  }

  async getProduct(productId: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    return product;
  }

  private validateStock(product: Product, quantity: number): void {
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ID ${product.id}`,
      );
    }
  }

  async clearProducts(): Promise<void> {
    await this.productRepository.clear();
  }

  @Transactional()
  async resetProducts(): Promise<Product> {
    await this.productRepository.clear();
    const newProduct = this.productRepository.create({
      name: 'Test Product',
      stock: 1000,
    });
    return this.productRepository.save(newProduct);
  }
}
