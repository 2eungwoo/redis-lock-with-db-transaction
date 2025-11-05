import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: Repository<Product>;

  const mockProductRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deductStock', () => {
    it('동시에 100개의 재고 차감 요청 시 Race Condition 발생', async () => {
      // given
      // db 초기 재고라고 가정하고 함
      const initialStock = 100;
      const productInDb = { id: 1, name: 'Test Product', stock: initialStock };
      // getProduct 호출마다 db 현재 상태 복제해서 리턴
      mockProductRepository.findOne.mockImplementation(async () => {
        return { ...productInDb };
      });

      // save 호출로 db 상태 업데이트
      mockProductRepository.save.mockImplementation(
        async (product: Product) => {
          productInDb.stock = product.stock;
          return product;
        },
      );

      // when
      const concurrentRequests = 100;
      const promises = [];
      for (let i = 0; i < concurrentRequests; i++) {
        // 각 요청은 거의 동시에 `getProduct`를 호출하여 초기 재고(100)를 읽음
        promises.push(service.deductStock(1, 1));
      }
      await Promise.all(promises);

      // then
      // 모든 요청이 재고 100인 상태에서 시작하여 1을 뺀 99를 저장하려고 시도함
      // 마지막 요청의 결과만 반영되어 최종 재고는 99가 됨
      expect(productInDb.stock).not.toBe(0);
      expect(productInDb.stock).toBe(99);
    });
  });
});
