/* eslint-disable */
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redlock: Redlock;

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {
    // Redlock 인스턴스는 싱글톤처럼 1개만 생성
    this.redlock = new Redlock([this.redis], {
      driftFactor: 0.01, // 시간 보정 계수
      retryCount: 40, // 재시도 횟수
      retryDelay: 200, // 재시도 간격(ms)
      retryJitter: 200, // 랜덤 지연
      automaticExtensionThreshold: 500, // 만료 연장 임계값(ms)
    });

    this.redlock.on('clientError', (err: unknown) => {
      if (err instanceof Error)
        this.logger.error('Redlock client error:', err.message, err.stack);
      else this.logger.error(`Redlock client error: ${String(err)}`);
    });
  }

  // Redis 클라이언트 반환
  public getClient(): Redis {
    return this.redis;
  }

  // Redis 연결 확인용
  async checkConnection(): Promise<string> {
    try {
      const result = await this.redis.ping();
      this.logger.log(`Redis ping: ${result}`);
      return result;
    } catch (error) {
      this.logger.error('Redis 연결 실패', error);
      return 'Error connecting to Redis';
    }
  }

  async withLock<T>(
    resource: string,
    duration = 3000,
    fn: () => Promise<T>,
  ): Promise<T> {
    let result: T | undefined; // result를 undefined로 초기화 가능하도록 변경
    try {
      await this.redlock.using([resource], duration, async (signal) => {
        this.logger.debug(`락 획득 후 실행: ${resource}`);
        result = await fn(); // fn()의 결과를 result에 저장

        // 필요 시 연장 예시
        if (!signal.aborted) {
          this.logger.verbose(`락 자동 연장: ${resource}`);
        }
      });
    } catch (error) {
      // 임계 영역 실행 중 발생한 오류를 로깅하고 다시 throw
      this.logger.error(
        `withLock 임계 영역 실행 중 오류 발생: ${resource}`,
        error,
      );
      throw error; // 오류를 다시 던져서 호출자에게 전파
    }

    // fn()이 성공적으로 값을 반환하지 않았을 경우를 대비한 안전 장치
    if (result === undefined) {
      throw new Error(
        `withLock: Critical section for resource ${resource} did not return a value.`,
      );
    }

    return result; // 성공적으로 할당된 결과 반환
  }

  // 서비스 종료 시 연결 해제
  async onModuleDestroy() {
    try {
      await this.redis.quit();
      this.logger.log('Redis 연결 종료');
    } catch (error) {
      this.logger.error('Redis 종료 중 오류', error);
    }
  }
}
