/**
 * @fileoverview 認証プロバイダーコンポーネント
 *
 * このモジュールでは、NextAuthのセッション情報をアプリケーション全体で
 * 利用可能にするプロバイダーコンポーネントを実装します。
 */

"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

interface AuthProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

/**
 * 認証プロバイダーコンポーネント
 * @param props - コンポーネントのプロパティ
 * @returns プロバイダーのJSX要素
 */
export default function AuthProvider({ children, session }: AuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
