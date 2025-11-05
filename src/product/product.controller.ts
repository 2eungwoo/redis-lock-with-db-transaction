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
import { Product } from './product.entity';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.createProduct(
      createProductDto.name,
      createProductDto.stock,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productService.getProduct(id);
  }

  @Post(':id/deduct')
  deductStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() deductStockDto: DeductStockDto,
  ): Promise<Product> {
    return this.productService.deductStock(id, deductStockDto.quantity);
  }
}
