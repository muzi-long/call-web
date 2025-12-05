# Call Web

基于 React + Vite + Ant Design 的前端项目，包含 Admin 和 Workbench 两个子应用。

## 项目结构

```
call-web/
├── admin/          # 管理后台应用
├── workbench/      # 工作台应用
├── common/         # 公共工具目录
│   └── utils/
│       ├── request.ts  # 请求工具
│       └── auth.ts     # 认证工具
├── package.json    # 根目录配置
└── pnpm-workspace.yaml  # pnpm workspace 配置
```

## 技术栈

- React 18
- Vite 5
- Ant Design 5
- Axios (HTTP 请求库)
- pnpm (包管理器)

## 安装依赖

```bash
pnpm install
```

## 开发

### 启动 Admin 项目
```bash
pnpm dev:admin
```
访问地址: http://localhost:3000

### 启动 Workbench 项目
```bash
pnpm dev:workbench
```
访问地址: http://localhost:3001

## 打包

### 打包 Admin 项目
```bash
pnpm build:admin
```
打包结果在 `admin/dist` 目录

### 打包 Workbench 项目
```bash
pnpm build:workbench
```
打包结果在 `workbench/dist` 目录

### 同时打包两个项目
```bash
pnpm build
```

## 请求工具

项目已封装了基于 Axios 的请求工具，位于 `common/utils/` 目录下，根据不同的接口路径提供了三种请求工具。

### 请求工具分类

1. **`request.ts`** - Workbench 项目使用，接口路径为 `/api/*`
2. **`admin-request.ts`** - Admin 项目使用，接口路径为 `/admin/*`
3. **`auth-request.ts`** - 认证接口使用，接口路径为 `/auth/*`

### 特性

- ✅ 自动处理 HTTP 状态码错误（非 200 状态码）
- ✅ 使用 Ant Design 的 `message` 组件自动提示错误信息
- ✅ 支持请求和响应拦截器
- ✅ 统一的错误处理机制
- ✅ 支持环境变量配置 API 基础地址
- ✅ 根据项目类型自动使用不同的 baseURL

### 使用方法

#### Workbench 项目

```typescript
import request from '@common/utils/request'

// 调用 /api/* 下的接口
const data = await request.get('/users', { page: 1, pageSize: 10 })
const result = await request.post('/users', { name: 'John', age: 30 })
```

#### Admin 项目

```typescript
import adminRequest from '@common/utils/admin-request'

// 调用 /admin/* 下的接口
const data = await adminRequest.get('/users', { page: 1, pageSize: 10 })
const result = await adminRequest.post('/users', { name: 'John', age: 30 })
```

#### 认证接口（两个项目都可以使用）

```typescript
import authRequest from '@common/utils/auth-request'

// 调用 /auth/* 下的接口
const response = await authRequest.post('/auth/login', { username, password })
await authRequest.get('/auth/logout')
```

### 错误处理

当 HTTP 状态码不等于 200 时，拦截器会自动：
1. 根据状态码显示相应的错误信息
2. 优先使用后端返回的 `message` 或 `error` 字段
3. 使用 Ant Design 的 `message.error()` 提示用户

### 环境变量配置

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

### 接口路径说明

- **Admin 接口**: `domain/admin/*` - 使用 `admin-request.ts`
- **Workbench 接口**: `domain/api/*` - 使用 `request.ts`
- **认证接口**: `domain/auth/*` - 使用 `auth-request.ts`

### 请求拦截器

可以在 `common/utils/request.ts` 的请求拦截器中添加认证信息等：

```javascript
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 路径别名

项目已配置路径别名，方便引用共享代码：

- `@common` → `common` (公共工具)
- `@` → 当前项目的 `src` 目录

详细使用示例请参考 `admin/src/utils/request.example.js` 或 `workbench/src/utils/request.example.js` 文件。

