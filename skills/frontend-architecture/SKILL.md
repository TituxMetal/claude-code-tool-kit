---
name: frontend-architecture
description: Feature-based architecture patterns for React/Astro frontend applications.
---

# Frontend Architecture Skill

Feature-based architecture patterns for React/Astro frontend applications.

**Scope:** This skill applies ONLY to frontend code. Do NOT use these patterns for NestJS backend applications.

---

## Feature-Based Structure

```text
src/
├── components/ui/           # Shared UI primitives
├── features/                # Feature modules (main code lives here)
│   ├── auth/
│   ├── profile/
│   └── dashboard/
├── lib/                     # Shared utilities & clients
├── types/                   # Global type definitions
└── utils/                   # Global helper functions
```

**Rule:** Business logic lives in `features/`. Shared/reusable code lives outside.

---

## Feature Module Structure

Each feature is self-contained with its own layers:

```text
features/
└── orders/
    ├── api/                 # API services
    │   ├── order.service.ts
    │   └── order.service.spec.ts
    ├── components/          # UI components
    │   ├── OrderList.tsx
    │   ├── OrderList.spec.tsx
    │   ├── OrderCard.tsx
    │   └── OrderContainer.tsx
    ├── hooks/               # Custom hooks
    │   └── useOrders.ts
    ├── schemas/             # Zod validation schemas
    │   ├── order.schema.ts
    │   └── order.schema.spec.ts
    ├── store/               # State management
    │   ├── order.store.ts
    │   └── order.store.spec.ts
    ├── types/               # Feature-specific types
    │   └── order.types.ts
    └── index.ts             # Public exports (barrel file)
```

---

## Component Patterns

### Container vs Presentational

**Containers** handle logic, data fetching, and state. **Presentational** components render UI.

```typescript
// ❌ BAD — Mixed concerns
export const OrderList = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await fetchOrders()
      setOrders(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Spinner />
  return <ul>{orders.map(o => <li key={o.id}>{o.name}</li>)}</ul>
}

// ✅ GOOD — Separated concerns

// OrderContainer.tsx (Container)
export const OrderContainer = () => {
  const { orders, isLoading } = useOrders()

  if (isLoading) return <Spinner />
  return <OrderList orders={orders} />
}

// OrderList.tsx (Presentational)
interface OrderListProps {
  orders: Order[]
}

export const OrderList = ({ orders }: OrderListProps) => {
  return (
    <ul>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </ul>
  )
}
```

### Component Props

Always define explicit prop interfaces:

```typescript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export const Button = ({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) => {
  return (
    <button onClick={onClick} disabled={disabled} className={variant}>
      {label}
    </button>
  )
}
```

---

## State Management (Nanostores)

Use nanostores for lightweight, framework-agnostic state.

### Store Structure

```typescript
import { atom, computed } from 'nanostores'

// State atoms — use $ prefix
export const $orders = atom<Order[]>([])
export const $isLoading = atom<boolean>(false)
export const $error = atom<string | null>(null)
export const $selectedId = atom<string | null>(null)

// Computed values — derived state
export const $orderCount = computed($orders, orders => orders.length)
export const $hasOrders = computed($orders, orders => orders.length > 0)
export const $selectedOrder = computed(
  [$orders, $selectedId],
  (orders, id) => orders.find(o => o.id === id) ?? null
)

// Actions — grouped in object
export const orderActions = {
  async fetchAll() {
    $isLoading.set(true)
    $error.set(null)
    try {
      const orders = await orderService.getAll()
      $orders.set(orders)
    } catch (err) {
      $error.set(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      $isLoading.set(false)
    }
  },

  select(id: string) {
    $selectedId.set(id)
  },

  clear() {
    $orders.set([])
    $selectedId.set(null)
    $error.set(null)
  }
}
```

### Using Stores in Components

```typescript
import { useStore } from '@nanostores/react'
import { $orders, $isLoading, orderActions } from '../store/order.store'

export const OrderContainer = () => {
  const orders = useStore($orders)
  const isLoading = useStore($isLoading)

  useEffect(() => {
    orderActions.fetchAll()
  }, [])

  if (isLoading) return <Spinner />
  return <OrderList orders={orders} />
}
```

---

## API Services

Services handle all API communication. They return typed data.

```typescript
import { api } from '~/lib/apiRequest'
import type { Order, CreateOrderInput } from '../types/order.types'

export const orderService = {
  getAll: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/api/orders')
    if (!response.success) throw new Error(response.message)
    return response.data
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/api/orders/${id}`)
    if (!response.success) throw new Error(response.message)
    return response.data
  },

  create: async (input: CreateOrderInput): Promise<Order> => {
    const response = await api.post<Order>('/api/orders', input)
    if (!response.success) throw new Error(response.message)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    const response = await api.delete(`/api/orders/${id}`)
    if (!response.success) throw new Error(response.message)
  }
}
```

---

## Validation Schemas (Zod)

Use Zod for form validation and type inference.

```typescript
import { z } from 'zod'

// Define schema
export const createOrderSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name must not exceed 100 characters' }),
  quantity: z
    .number()
    .min(1, { message: 'Quantity must be at least 1' })
    .max(1000, { message: 'Quantity must not exceed 1000' }),
  notes: z.string().optional()
})

// Infer type from schema
export type CreateOrderSchema = z.infer<typeof createOrderSchema>
```

### Using with React Hook Form

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOrderSchema, type CreateOrderSchema } from '../schemas/order.schema'

export const CreateOrderForm = ({ onSubmit }: { onSubmit: (data: CreateOrderSchema) => void }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateOrderSchema>({
    resolver: zodResolver(createOrderSchema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input type="number" {...register('quantity', { valueAsNumber: true })} />
      {errors.quantity && <span>{errors.quantity.message}</span>}

      <button type="submit">Create</button>
    </form>
  )
}
```

---

## Custom Hooks

Hooks encapsulate reusable logic and connect stores to components.

```typescript
import { useStore } from '@nanostores/react'
import { $orders, $isLoading, $error, orderActions } from '../store/order.store'

export interface UseOrdersReturn {
  orders: Order[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (input: CreateOrderInput) => Promise<void>
}

export const useOrders = (): UseOrdersReturn => {
  const orders = useStore($orders)
  const isLoading = useStore($isLoading)
  const error = useStore($error)

  const create = async (input: CreateOrderInput) => {
    try {
      $isLoading.set(true)
      await orderService.create(input)
      await orderActions.fetchAll()
    } catch (err) {
      $error.set(err instanceof Error ? err.message : 'Failed to create order')
      throw err
    } finally {
      $isLoading.set(false)
    }
  }

  return {
    orders,
    isLoading,
    error,
    refresh: orderActions.fetchAll,
    create
  }
}
```

---

## Types Organization

### Feature Types

```typescript
// types/order.types.ts

export interface Order {
  id: string
  name: string
  quantity: number
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

export interface CreateOrderInput {
  name: string
  quantity: number
  notes?: string
}

export interface UpdateOrderInput {
  name?: string
  quantity?: number
  status?: OrderStatus
}
```

### Global Types

```typescript
// types/api.types.ts

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
```

---

## Barrel Exports

Each feature has an `index.ts` that exports its public API:

```typescript
// features/orders/index.ts

// Components
export { OrderContainer } from './components/OrderContainer'
export { OrderList } from './components/OrderList'
export { OrderCard } from './components/OrderCard'

// Hooks
export { useOrders } from './hooks/useOrders'

// Types
export type { Order, OrderStatus, CreateOrderInput } from './types/order.types'
```

**Rule:** Import from the feature barrel, not internal paths:

```typescript
// ✅ GOOD
import { OrderContainer, useOrders } from '~/features/orders'

// ❌ BAD
import { OrderContainer } from '~/features/orders/components/OrderContainer'
```

---

## Testing Strategy

| Layer      | Test Type   | Mock What                    |
| ---------- | ----------- | ---------------------------- |
| Components | Unit        | Hooks, stores                |
| Hooks      | Unit        | Services, stores             |
| Stores     | Unit        | Services                     |
| Services   | Unit        | API client                   |
| Schemas    | Unit        | Nothing — pure validation    |

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import { OrderList } from './OrderList'

describe('OrderList', () => {
  it('should render orders', () => {
    const orders = [
      { id: '1', name: 'Order 1', quantity: 5, status: 'pending' },
      { id: '2', name: 'Order 2', quantity: 3, status: 'completed' }
    ]

    render(<OrderList orders={orders} />)

    expect(screen.getByText('Order 1')).toBeInTheDocument()
    expect(screen.getByText('Order 2')).toBeInTheDocument()
  })

  it('should show empty state when no orders', () => {
    render(<OrderList orders={[]} />)

    expect(screen.getByText('No orders found')).toBeInTheDocument()
  })
})
```

---

## Quick Reference

| Concept        | Lives In            | Depends On              |
| -------------- | ------------------- | ----------------------- |
| UI Component   | `components/`       | Props only              |
| Container      | `components/`       | Hooks, stores           |
| Hook           | `hooks/`            | Stores, services        |
| Store          | `store/`            | Services                |
| Service        | `api/`              | API client              |
| Schema         | `schemas/`          | Nothing                 |
| Types          | `types/`            | Nothing                 |
| Shared UI      | `components/ui/`    | Props only              |

---

## The Core Principle

> "Keep components dumb, hooks smart, and stores as the single source of truth."

- **Components** render UI based on props
- **Hooks** orchestrate logic and connect to stores
- **Stores** hold state and expose actions
- **Services** handle external communication
