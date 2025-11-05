import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createProduct(name: string, stock: number): Promise<Product> {
    const product = this.productRepository.create({ name, stock });
    return this.productRepository.save(product);
  }

  async deductStock(productId: number, quantity: number): Promise<Product> {
    const product = await this.getProduct(productId);
    this.validateStock(product, quantity);

    product.stock -= quantity;
    return this.productRepository.save(product);
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
}
