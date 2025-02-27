/**
 * @fileoverview Prismaクライアントのシングルトンインスタンスを提供するモジュール
 *
 * このモジュールは、アプリケーション全体で共有されるPrismaクライアントのシングルトンインスタンスを
 * 作成・管理します。開発環境でのホットリロード時に複数のインスタンスが作成されることを防ぎます。
 * Edge Runtimeでの実行に対応するため、D1 Driverアダプターを使用しています。
 */

import { PrismaClient } from "@prisma/client";
import { D1Database } from '@cloudflare/workers-types';
import { PrismaD1 } from '@prisma/adapter-d1';

// グローバルスコープでPrismaClientを保持するための型定義
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Edge Runtimeでの実行かどうかを判定
const isEdgeRuntime = typeof globalThis.process?.versions?.node === 'undefined';

// Prismaクライアントの初期化
let prisma: PrismaClient;

// 開発環境では通常のPrismaClientを使用
prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
