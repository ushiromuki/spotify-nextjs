/**
 * @fileoverview NextAuth認証ルートの設定
 *
 * このモジュールでは、NextAuthを使用したSpotify OAuth認証の設定を行います。
 * PrismaAdapterを使用してユーザー情報をデータベースに保存し、
 * セッション情報にSpotifyのアクセストークンを含めるようにカスタマイズしています。
 */

import { handlers } from "@/auth";

// Edge Runtimeの設定
export const runtime = "edge";

// NextAuth v5の新しいエクスポート形式
export const { GET, POST } = handlers;
