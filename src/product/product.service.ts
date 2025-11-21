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

  async txWithLockUnsafe(productId: number, quantity: number): Promise<void> {
    const resource = `product:${productId}:lock`;
    const runner = this.dataSource.createQueryRunner();

    await runner.connect();
    await runner.startTransaction();

    try {
      // Redis 안에서 락 읽기/검증/update 수행
      await this.redisService.withLock(resource, 5000, async () => {
        const product = await runner.manager.findOne(Product, {
          where: { id: productId },
        });

        if (!product) throw new Error('not found');

        this.validateStock(product, quantity);
        product.stock -= quantity;

        console.log(
          `[UNSAFE] 트랜잭션=${runner.connection.getMetadata.name} / 중간 stock = ${product.stock}`,
        );
        await runner.manager.save(product);
        return true; // dirty read 재현하기위해서 리턴쳐버림
      });

      // 이 시점에서 redis 락은 이미 풀렸으나 트랜잭션은 아직 안끝남
      // 딜레이 추가해서 충돌 유발
      await new Promise((res) => setTimeout(res, 3000));

      // 그 다음에 커밋 -> 이 시점에 다른 요청 들어오게만듬
      await runner.commitTransaction();
    } catch (err) {
      await runner.rollbackTransaction();
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
        // 얘도 redis 문제인지 db문제인지 구분이 필요하므로 db쪽에서도 락 잡아주도록 설정
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
