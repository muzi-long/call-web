# 请求工具使用说明

## 请求工具分类

根据后端接口的不同路径，提供了三种请求工具：

### 1. `request.ts` - 通用请求工具（用于 Workbench）

用于 Workbench 项目，接口路径为 `/api/*`

```typescript
import request from '@common/utils/request'

// 调用 /api/* 下的接口
const data = await request.get('/users')
const result = await request.post('/users', { name: 'John' })
```

### 2. `admin-request.ts` - Admin 专用请求工具

用于 Admin 项目，接口路径为 `/admin/*`

```typescript
import adminRequest from '@common/utils/admin-request'

// 调用 /admin/* 下的接口
const data = await adminRequest.get('/users')
const result = await adminRequest.post('/users', { name: 'John' })
```

### 3. `auth-request.ts` - 认证请求工具

用于认证相关接口，接口路径为 `/auth/*`（不在 /admin/ 或 /api/ 下）

```typescript
import authRequest from '@common/utils/auth-request'

// 调用 /auth/* 下的接口
const response = await authRequest.post('/auth/login', { username, password })
await authRequest.get('/auth/logout')
```

## 环境变量配置

在 `.env.development` 和 `.env.production` 文件中配置：

```env
# API 域名（不包含路径，用于认证接口等公共接口）
VITE_API_DOMAIN=http://localhost:8080

# Admin 项目的 API 基础地址（admin 接口使用 /admin/*）
VITE_ADMIN_API_BASE_URL=http://localhost:8080/admin

# Workbench 项目的 API 基础地址（workbench 接口使用 /api/*）
VITE_API_BASE_URL=http://localhost:8080/api

# 认证接口的基础地址（可选，如果不配置则使用 VITE_API_DOMAIN）
# VITE_AUTH_API_BASE_URL=http://localhost:8080
```

## 接口路径说明

- **Admin 接口**: `domain/admin/*` - 使用 `admin-request.ts`
- **Workbench 接口**: `domain/api/*` - 使用 `request.ts`
- **认证接口**: `domain/auth/*` - 使用 `auth-request.ts`

## 使用示例

### Admin 项目中使用

```typescript
// admin/src/api/some-api.ts
import adminRequest from '@common/utils/admin-request'
import authRequest from '@common/utils/auth-request'

// Admin 业务接口
export const getUsers = async () => {
  return await adminRequest.get('/users') // 实际请求: http://localhost:8080/admin/users
}

// 认证接口
export const login = async (username: string, password: string) => {
  return await authRequest.post('/auth/login', { username, password }) // 实际请求: http://localhost:8080/auth/login
}
```

### Workbench 项目中使用

```typescript
// workbench/src/api/some-api.ts
import request from '@common/utils/request'
import authRequest from '@common/utils/auth-request'

// Workbench 业务接口
export const getData = async () => {
  return await request.get('/data') // 实际请求: http://localhost:8080/api/data
}

// 认证接口
export const login = async (username: string, password: string) => {
  return await authRequest.post('/auth/login', { username, password }) // 实际请求: http://localhost:8080/auth/login
}
```

