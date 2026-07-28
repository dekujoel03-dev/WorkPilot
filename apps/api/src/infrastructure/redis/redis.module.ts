import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/** Minimal Redis-compatible client for dev when Redis is disabled. */
class InMemoryRedis {
  private store = new Map<string, string>();

  async get(key: string) {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, _mode?: string, _ttl?: number) {
    this.store.set(key, value);
    return 'OK';
  }

  async del(key: string) {
    this.store.delete(key);
    return 1;
  }

  async ping() {
    return 'PONG';
  }

  async quit() {
    this.store.clear();
  }
}

export type RedisClient = Redis | InMemoryRedis;

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): RedisClient => {
        const enabled = config.get<string>('REDIS_ENABLED', 'false') === 'true';

        if (!enabled) {
          Logger.log('Redis désactivé — cache en mémoire (dev)', 'RedisModule');
          return new InMemoryRedis();
        }

        const url = config.get<string>('REDIS_URL', 'redis://localhost:6379');
        Logger.log(`Redis activé : ${url}`, 'RedisModule');
        return new Redis(url, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          retryStrategy: (times) =>
            times > 3 ? null : Math.min(times * 200, 2000),
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
