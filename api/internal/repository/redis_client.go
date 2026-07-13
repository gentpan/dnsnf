package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

type RedisStore struct {
	client *redis.Client
	logger *slog.Logger
}

func NewRedisClient(cfg RedisConfig, logger *slog.Logger) *RedisStore {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr,
		Password: cfg.Password,
		DB:       cfg.DB,
	})
	return &RedisStore{client: client, logger: logger}
}

func (r *RedisStore) Ping(ctx context.Context) error {
	return r.client.Ping(ctx).Err()
}

func (r *RedisStore) Get(ctx context.Context, key string, out any) error {
	val, err := r.client.Get(ctx, key).Result()
	if err != nil {
		return err
	}
	if err := json.Unmarshal([]byte(val), out); err != nil {
		return fmt.Errorf("unmarshal redis payload: %w", err)
	}
	return nil
}

func (r *RedisStore) Set(ctx context.Context, key string, payload any, ttl time.Duration) error {
	b, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal redis payload: %w", err)
	}
	if err := r.client.Set(ctx, key, b, ttl).Err(); err != nil {
		return fmt.Errorf("set redis key: %w", err)
	}
	return nil
}

func (r *RedisStore) Close() error {
	return r.client.Close()
}
