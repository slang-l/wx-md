# wx-md

一个用于编辑 Markdown 并预览微信公众号排版的前后端 monorepo。

## 目录结构

```text
wx-md/
├─ apps/
│  ├─ web/                 # React + Vite 前端
│  └─ api/                 # Express + TypeScript 服务端
├─ package.json            # 工作区统一命令
├─ pnpm-workspace.yaml     # pnpm workspace 定义
└─ tsconfig.base.json      # 前后端共享 TypeScript 基础配置
```

服务端基础框架包含环境配置校验、CORS、JSON 请求体解析、请求 ID、统一错误响应、优雅退出、健康检查和基础测试。前端文档数据目前仍保存在浏览器 `localStorage`，数据库与文档 CRUD 可以在此基础上继续扩展。

## 环境要求

- Node.js 20.12+（不含 21），或 Node.js 22+
- pnpm 9.15.4

## 本地开发

安装依赖：

```bash
pnpm install
```

如需修改服务端默认配置，可复制环境变量示例：

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

同时启动前后端：

```bash
pnpm dev
```

- Web：<http://localhost:5173>
- API：<http://localhost:3000>
- 健康检查：<http://localhost:3000/api/health>

Vite 已将开发环境的 `/api` 请求代理到 `http://127.0.0.1:3000`。也可以使用 `pnpm dev:web` 或 `pnpm dev:api` 单独启动应用。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 并行启动 Web 和 API 开发服务 |
| `pnpm typecheck` | 检查所有应用的 TypeScript 类型 |
| `pnpm test` | 运行所有应用的测试 |
| `pnpm build` | 构建全部应用 |
| `pnpm check` | 依次执行类型检查、测试和构建 |
| `pnpm --filter @wx-md/api start` | 启动已构建的 API |

## API 基础约定

### `GET /api/health`

```json
{
  "status": "ok",
  "service": "wx-md-api",
  "timestamp": "2026-07-26T00:00:00.000Z",
  "uptime": 12.34
}
```

404 和服务端错误使用统一结构：

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found",
    "requestId": "8ae223ac-8094-4c16-bdb4-e5f04c12637d"
  }
}
```

响应会同时携带 `x-request-id` header，调用方也可以在请求中传入该 header 以便链路追踪。

可用环境变量见 [`apps/api/.env.example`](apps/api/.env.example)：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`、`test` 或 `production` |
| `HOST` | `0.0.0.0` | API 监听地址 |
| `PORT` | `3000` | API 端口 |
| `CORS_ORIGINS` | `http://localhost:5173` | 允许的来源，多个值使用逗号分隔 |
