---
name: backend-architecture
description: Hexagonal/Clean Architecture patterns for NestJS backend applications.
---

# Backend Architecture Skill

Hexagonal/Clean Architecture patterns for NestJS backend applications.

**Scope:** This skill applies ONLY to NestJS backend code. Do NOT use these patterns for frontend applications.

---

## Layer Structure

```text
┌─────────────────────────────────────────────┐
│              INFRASTRUCTURE                  │
│   Controllers, Repositories, External APIs   │
│         (depends on Application)             │
├─────────────────────────────────────────────┤
│               APPLICATION                    │
│         Use Cases, Services, DTOs            │
│           (depends on Domain)                │
├─────────────────────────────────────────────┤
│                 DOMAIN                       │
│   Entities, Value Objects, Repo Interfaces   │
│          (depends on NOTHING)                │
└─────────────────────────────────────────────┘
```

**Dependency Rule:** Dependencies point INWARD only. Domain never imports from Application or Infrastructure.

---

## Implementation Order

When building a feature, follow this order:

1. **Domain** — Entities, Value Objects, Repository Interfaces
2. **Application** — Use Cases, Services, DTOs
3. **Infrastructure** — Repositories, Controllers, External Adapters

**WHY?** Each layer depends on the one below. You can't build use cases without entities. You can't build controllers without use cases.

---

## Entities Have BEHAVIOR

**Entities are NOT just data classes.** They encapsulate business logic and protect invariants.

### ❌ WRONG — Anemic Entity

```typescript
export class OrderEntity {
  constructor(
    public readonly id: string,
    public readonly items: OrderItem[],
    public readonly status: string
  ) {}
}
```

### ✅ RIGHT — Rich Entity

```typescript
export class OrderEntity {
  constructor(
    private readonly _id: string,
    private readonly _items: OrderItem[],
    private _status: OrderStatus
  ) {
    if (_items.length === 0) {
      throw new Error('Order must have at least one item')
    }
  }

  // Getters expose read-only access
  get id(): string { return this._id }
  get items(): ReadonlyArray<OrderItem> { return this._items }
  get status(): OrderStatus { return this._status }

  // BEHAVIOR — Domain logic lives here
  get totalAmount(): number {
    return this._items.reduce((sum, item) => sum + item.subtotal, 0)
  }

  canBeCancelled(): boolean {
    return this._status === OrderStatus.PENDING
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error('Only pending orders can be cancelled')
    }
    this._status = OrderStatus.CANCELLED
  }

  ship(): void {
    if (this._status !== OrderStatus.CONFIRMED) {
      throw new Error('Only confirmed orders can be shipped')
    }
    this._status = OrderStatus.SHIPPED
  }
}
```

---

## Value Objects

Value Objects encapsulate validation, formatting, and domain rules. They are **immutable** and compared by value.

```typescript
export class Email {
  private readonly _value: string

  constructor(value: string) {
    const trimmed = value.trim().toLowerCase()
    if (!this.isValid(trimmed)) {
      throw new Error(`Invalid email: ${value}`)
    }
    this._value = trimmed
  }

  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  get value(): string { return this._value }
  get domain(): string { return this._value.split('@')[1] }

  equals(other: Email): boolean {
    return this._value === other._value
  }

  toString(): string { return this._value }
}
```

**When to use a Value Object:**

- The value has validation rules (email, phone, postal code)
- The value has formatting logic (currency, percentages)
- The value has domain-specific behavior (date ranges, quantities)
- You want to avoid primitive obsession

---

## Repository Interfaces

Defined in **Domain**. Implemented in **Infrastructure**.

```typescript
// Domain — Interface (port)
export interface IOrderRepository {
  findById(id: string): Promise<OrderEntity | null>
  findByCustomer(customerId: string): Promise<OrderEntity[]>
  save(entity: OrderEntity): Promise<OrderEntity>
  delete(id: string): Promise<void>
}

// Infrastructure — Implementation (adapter)
@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<OrderEntity | null> {
    const data = await this.prisma.order.findUnique({ where: { id } })
    if (!data) return null
    return OrderInfrastructureMapper.toDomain(data)
  }

  async save(entity: OrderEntity): Promise<OrderEntity> {
    const data = OrderInfrastructureMapper.toPrisma(entity)
    const saved = await this.prisma.order.upsert({
      where: { id: entity.id.value },
      create: data,
      update: data
    })
    return OrderInfrastructureMapper.toDomain(saved)
  }
  // ...
}
```

**Key principle:** The domain defines WHAT it needs (interface). Infrastructure decides HOW to provide it (implementation).

---

## Use Cases

Use cases orchestrate domain logic. They are the entry points for application behavior.

**Responsibilities:**

- Receive input (DTO or primitives)
- Coordinate entities and repositories
- Enforce application-level rules
- Return output (DTO)

```typescript
export class PlaceOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly inventoryService: IInventoryService
  ) {}

  async execute(input: PlaceOrderInput): Promise<PlaceOrderOutput> {
    // 1. Validate stock availability
    await this.inventoryService.reserveItems(input.items)

    // 2. Create domain entity (business rules enforced here)
    const order = new OrderEntity(
      generateId(),
      input.items.map(i => new OrderItem(i.productId, i.quantity, i.price)),
      OrderStatus.PENDING
    )

    // 3. Persist via repository
    const saved = await this.orderRepository.save(order)

    // 4. Return DTO
    return {
      orderId: saved.id,
      total: saved.totalAmount,
      status: saved.status
    }
  }
}
```

**Use Cases should NOT:**

- Contain business logic (that belongs in entities)
- Know about HTTP, databases, or frameworks
- Return entities directly (return DTOs)

---

## DTOs — Data Transfer Objects

DTOs cross boundaries between layers. They are classes — with validation decorators for input, without for output.

### Input DTOs with Validation (class-validator)

In NestJS, using `class-validator` decorators is the standard pattern:

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string

  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string
}
```

### Output DTOs

Output DTOs are classes without validation decorators:

```typescript
export class UserResponseDto {
  id!: string
  email!: string
  name!: string
  createdAt!: Date
}
```

### DTO vs Domain Validation

| Validation Type        | Where                                | Purpose                                    | Example                                  |
| ---------------------- | ------------------------------------ | ------------------------------------------ | ---------------------------------------- |
| **DTO (Input)**        | Application/Infrastructure boundary  | Format, required fields, basic constraints | "email must be valid format"             |
| **Domain (VO/Entity)** | Domain layer                         | Business invariants, domain rules          | "email domain must be from approved list"|

Both can coexist. DTO validation catches malformed input early. Domain validation enforces business rules.

**Never expose entities to the outside world.** Always map to DTOs at the boundary.

---

## Mappers

Mappers handle the conversion between different representations of data. There are two types:

### Application Mappers (Entity → DTO)

Live in **Application layer**. Convert entities to response DTOs.

```typescript
import type { OrderEntity } from '~/orders/domain/entities'
import { OrderResponseDto } from '../dtos'

export class OrderMapper {
  static toResponseDto(entity: OrderEntity): OrderResponseDto {
    const dto: OrderResponseDto = {
      id: entity.id,
      status: entity.status,
      total: entity.totalAmount,
      itemCount: entity.items.length,
      createdAt: entity.createdAt
    }

    return Object.assign(new OrderResponseDto(), dto)
  }
}
```

### Infrastructure Mappers (Prisma ↔ Entity)

Live in **Infrastructure layer**. Convert between Prisma records and domain entities.

```typescript
import type { Order as PrismaOrder } from '@generated'
import { OrderEntity } from '~/orders/domain/entities'
import { OrderIdValueObject } from '~/orders/domain/value-objects'

export class OrderInfrastructureMapper {
  static toDomain(prisma: PrismaOrder): OrderEntity {
    return new OrderEntity(
      new OrderIdValueObject(prisma.id),
      prisma.items.map(i => new OrderItem(i.productId, i.quantity, i.price)),
      prisma.status as OrderStatus,
      prisma.createdAt,
      prisma.updatedAt
    )
  }

  static toPrisma(entity: OrderEntity): Partial<PrismaOrder> {
    return {
      id: entity.id.value,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    }
  }
}
```

### Why Two Mapper Types?

| Mapper Type     | Direction              | Purpose                                  |
| --------------- | ---------------------- | ---------------------------------------- |
| Application     | Entity → DTO           | Shape data for API responses             |
| Infrastructure  | Prisma → Entity        | Reconstruct domain objects from DB       |
| Infrastructure  | Entity → Prisma        | Prepare domain objects for persistence   |

---

## Testing Strategy

| Layer                          | Test Type   | Mock What                 |
| ------------------------------ | ----------- | ------------------------- |
| Domain (Entities, VOs)         | Unit        | Nothing — pure logic      |
| Application (Use Cases)        | Unit        | Repository interfaces     |
| Infrastructure (Repos)         | Integration | Database (or use test DB) |
| Infrastructure (Controllers)   | E2E         | Nothing (full stack)      |

### Test Behavior, Not Construction

```typescript
// ❌ WEAK — Tests implementation details
it('should create entity', () => {
  const order = new OrderEntity('1', [item], OrderStatus.PENDING)
  expect(order.id).toBe('1')
})

// ✅ STRONG — Tests business behavior
describe('OrderEntity', () => {
  it('should allow cancellation when pending', () => {
    const order = new OrderEntity('1', [item], OrderStatus.PENDING)
    order.cancel()
    expect(order.status).toBe(OrderStatus.CANCELLED)
  })

  it('should reject cancellation when already shipped', () => {
    const order = new OrderEntity('1', [item], OrderStatus.SHIPPED)
    expect(() => order.cancel()).toThrow('Only pending orders can be cancelled')
  })
})
```

---

## Quick Reference

| Concept                   | Lives In       | Depends On        |
| ------------------------- | -------------- | ----------------- |
| Entity                    | Domain         | Value Objects     |
| Value Object              | Domain         | Nothing           |
| Repository Interface      | Domain         | Entity            |
| Repository Implementation | Infrastructure | Domain, Prisma    |
| Use Case                  | Application    | Domain interfaces |
| Controller                | Infrastructure | Application       |
| DTO                       | Application    | Nothing           |
| Application Mapper        | Application    | Entity, DTO       |
| Infrastructure Mapper     | Infrastructure | Entity, Prisma    |

---

## The Core Principle

> "If you have a utility function that takes entity data and does something with it, that function belongs IN the entity."

Ask yourself: "Does this logic apply regardless of how the data is stored or displayed?" If yes, it belongs in the Domain.
