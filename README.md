## Distributed-Lock TTL & Transaction Timing Experiment

> A NestJS + PostgreSQL + Redis Redlock experiment validating behavior when a Redis TTL expires before the DB transaction commits.

## Overview

> Multi-instance environment (3 apps) used to force timing collisions between  
> Redis lock TTL expiry and PostgreSQL row-level locking.  
> The goal: verify whether data corruption occurs when the lock disappears early.

## Core Behavior

> Even when the Redis distributed lock expires before the DB commit,  
> PostgreSQL serialization rules + row-level locks prevent dirty writes.  
> Stock is always decremented correctly with no corruption.

## Redlock Auto-Extension Note

> The “lock auto-extend” log is only a **printed message**, not a real TTL extension.  
> It has **zero effect** on concurrency, correctness, or timing experiments.

## Link

> [link](https://2eungwoo.tistory.com/entry/Lock-key-%EB%A7%8C%EB%A3%8C-%EC%8B%9C%EC%A0%90%EA%B3%BC-DB-%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98-%EC%BB%A4%EB%B0%8B-%EC%8B%9C%EC%A0%90%EC%9D%B4-%EC%97%AD%EC%88%9C%EC%9D%B4-%EB%90%98%EB%A9%B4)

## etc

> Updated: 2025-11-21
