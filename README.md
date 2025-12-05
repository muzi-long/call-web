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

项目已封装了基于 Axios 的请求工具，位于 `common/utils/request.ts`，使用统一的 baseURL，接口路径在调用时完整指定。

### 特性

- ✅ 自动处理 HTTP 状态码错误（非 200 状态码）
- ✅ 使用 Ant Design 的 `message` 组件自动提示错误信息
- ✅ 支持请求和响应拦截器
- ✅ 统一的错误处理机制
- ✅ 支持环境变量配置 API 基础地址
- ✅ 自动添加认证 token 到请求头

### 使用方法

所有项目都使用同一个请求工具，接口路径在调用时完整指定：

```typescript
import request from '@common/utils/request'

// 认证接口
const response = await request.post('/auth/login', { username, password })
await request.get('/auth/logout')

// Admin 接口
const data = await request.post('/admin/ent', { page: 1, page_size: 20 })
await request.post('/admin/ent', { name: '企业名称' })

// Workbench 接口
const result = await request.get('/api/users', { page: 1 })
await request.post('/api/data', { name: 'John' })
```

### 错误处理

当 HTTP 状态码不等于 200 时，拦截器会自动：
1. 根据状态码显示相应的错误信息
2. 优先使用后端返回的 `message` 或 `error` 字段
3. 使用 Ant Design 的 `message.error()` 提示用户

### 环境变量配置

在 `.env.development` 和 `.env.production` 文件中配置：

```env
# API 域名（不包含路径，所有接口都基于此域名）
# 接口路径在调用时指定，如：/auth/login、/admin/ent、/api/users
VITE_API_DOMAIN=http://127.0.0.1:61000
```

### 跨域处理

**开发环境**：
- 使用 Vite 代理解决跨域问题
- 请求使用相对路径（如 `/auth/login`），Vite 会自动代理到后端
- 代理配置在 `vite.config.ts` 中，自动代理 `/auth`、`/admin`、`/api` 路径

**生产环境**：
- 使用实际域名（通过 `VITE_API_DOMAIN` 配置）
- 需要后端配置 CORS 或使用同域部署

### 接口路径说明

所有接口路径在调用时完整指定：

- **认证接口**: `/auth/login`、`/auth/logout`
- **Admin 接口**: `/admin/ent`、`/admin/agent` 等
- **Workbench 接口**: `/api/users`、`/api/data` 等

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

- `@common` → `common` (公共工具目录，直接包含 utils)
- `@` → 当前项目的 `src` 目录

详细使用示例请参考 `admin/src/utils/request.example.js` 或 `workbench/src/utils/request.example.js` 文件。

