/**
 * @fileoverview Prismaクライアントのシングルトンインスタンスを提供するモジュール
 *
 * このモジュールは、アプリケーション全体で共有されるPrismaクライアントのシングルトンインスタンスを
 * 作成・管理します。開発環境でのホットリロード時に複数のインスタンスが作成されることを防ぎます。
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
