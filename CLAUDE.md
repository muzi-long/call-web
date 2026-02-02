# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

这是一个基于 pnpm workspace 的 monorepo 项目，包含两个 React 应用：
- **admin** - 管理后台（端口 3000）
- **workbench** - 工作台应用（端口 3001）
- **common** - 共享代码（工具函数、认证 API）

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发环境
pnpm dev:admin       # 启动 admin 应用
pnpm dev:workbench   # 启动 workbench 应用

# 生产构建
pnpm build:admin     # 打包 admin
pnpm build:workbench # 打包 workbench
pnpm build           # 同时打包两个应用
```

## 技术栈

- React 18 + TypeScript 5
- Vite 5 构建工具
- Ant Design 5 UI 组件库
- React Router 7 路由
- Axios HTTP 客户端
- JsSIP（workbench 专用，WebRTC/SIP 通信）

## 代码架构

### 路径别名

两个应用均配置了以下别名（tsconfig.json + vite.config.ts）：
- `@common/*` → `../common/*` - 访问共享代码
- `@/*` → `./src/*` - 访问当前应用代码

### 分层结构

```
页面组件 → API 方法 → request 工具 → Axios → 后端
```

### 共享层 (common/)

- `common/utils/request.ts` - 统一请求封装，自动处理错误和 token
- `common/utils/auth.ts` - Token 管理，登录状态检查
- `common/api/auth.ts` - 登录/登出 API

### 关键模式

**路由保护**: `ProtectedRoute` 组件检查认证状态，监听 `auth:unauthorized` 事件处理 token 过期

**环境配置**:
- 开发环境使用 Vite 代理转发 `/auth`、`/admin`、`/api` 路径
- 生产环境使用 `VITE_API_DOMAIN` 环境变量

**WebRTC 服务** (workbench): `workbench/src/services/webrtc.ts` 封装 JsSIP，采用事件驱动架构

### API 路径约定

- `/auth/*` - 认证接口
- `/admin/*` - Admin 后台接口
- `/api/*` - Workbench 业务接口
