# 请求工具使用说明

## 统一的请求工具

项目使用统一的请求工具 `request.ts`，所有接口都使用同一个 baseURL（`VITE_API_DOMAIN`），接口路径在调用时完整指定。

## 使用方法

```typescript
import request from '@common/utils/request'

// 认证接口
const response = await request.post('/auth/login', { username, password })
await request.get('/auth/logout')

// Admin 接口
const data = await request.post('/admin/ent', { page: 1, page_size: 20 })
await request.post('/admin/ent', { name: '企业名称' })
await request.put('/admin/ent', { id: 1, name: '新名称' })
await request.delete('/admin/ent', { id: 1 })

// Workbench 接口
const result = await request.get('/api/users', { page: 1 })
await request.post('/api/data', { name: 'John' })
```

## 环境变量配置

在 `.env.development` 和 `.env.production` 文件中配置：

```env
# API 域名（不包含路径，所有接口都基于此域名）
# 接口路径在调用时指定，如：/auth/login、/admin/ent、/api/users
VITE_API_DOMAIN=http://localhost:8080
```

## 接口路径说明

所有接口路径在调用时完整指定：

- **认证接口**: `/auth/login`、`/auth/logout`
- **Admin 接口**: `/admin/ent`、`/admin/agent` 等
- **Workbench 接口**: `/api/users`、`/api/data` 等

## 使用示例

### Admin 项目中使用

```typescript
// admin/src/api/auth.ts
import request from '@common/utils/request'

export const login = async (username: string, password: string) => {
  return await request.post('/auth/login', { username, password })
}

// admin/src/api/enterprise.ts
import request from '@common/utils/request'

export const getEnterpriseList = async (params: any) => {
  return await request.post('/admin/ent', params)
}
```

### Workbench 项目中使用

```typescript
// workbench/src/api/some-api.ts
import request from '@common/utils/request'

export const getData = async () => {
  return await request.get('/api/data')
}

export const login = async (username: string, password: string) => {
  return await request.post('/auth/login', { username, password })
}
```
