import type { AuthContext } from "./auth.ts";

// 生命全局类型扩展
declare global {
  // 扩展Express命名空间
  namespace Express {
    // 扩展 Express 的 Request 接口
    interface Request {
      auth?: AuthContext,
    }
  }
}

// 将当前文件声明为模块，避免全局声明异常。
export { };