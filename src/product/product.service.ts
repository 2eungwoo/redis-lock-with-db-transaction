/* eslint-disable */
import { Lock } from 'redlock';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { RedisService } from '../redis/redis.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly redisService: RedisService,
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

      product.stock -= quantity;
      console.log(
        `[product.stock] ============= 현재 stock count : ${product.stock}`,
      );
      return this.productRepository.save(product);
    });
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
      stock: 100,
    });
    return this.productRepository.save(newProduct);
  }
}
