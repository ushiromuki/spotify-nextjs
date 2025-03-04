/**
 * @fileoverview NextAuthの型定義の拡張
 *
 * このモジュールでは、NextAuthのデフォルトの型定義を拡張し、
 * Spotifyのアクセストークンなどのカスタムフィールドを追加します。
 */

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    refreshToken?: string;
    expires?: number;
    error?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    spotifyId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expires?: number;
    error?: string;
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      spotifyId?: string;
    };
  }
}
