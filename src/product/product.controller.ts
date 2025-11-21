import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { DeductStockDto } from './dto/deduct-stock.dto';
import { ProductResponseDto } from './dto/product.response.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productService.createProduct(
      createProductDto.name,
      createProductDto.stock,
    );
    return ProductResponseDto.from(product);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductResponseDto> {
    const product = await this.productService.getProduct(id);
    return ProductResponseDto.from(product);
  }

  @Post(':id/deduct')
  async deductStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() deductStockDto: DeductStockDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productService.deductStock(
      id,
      deductStockDto.quantity,
    );
    return ProductResponseDto.from(product);
  }

  @Post('reset')
  async reset(): Promise<ProductResponseDto> {
    const product = await this.productService.resetProducts();
    return ProductResponseDto.from(product);
  }

  @Post(':id/tx-rollback')
  async txRollback(@Param('id') id: number) {
    await this.productService.txWithLockAndRollback(+id, 1);
    return { ok: true };
  }

  @Post(':id/tx-safe')
  async txSafe(@Param('id') id: number) {
    await this.productService.txWithLockSafe(+id, 1);
    return { ok: true };
  }

  @Post('clear')
  clear(): Promise<void> {
    return this.productService.clearProducts();
  }
}
