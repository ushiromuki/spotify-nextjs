/**
 * @fileoverview NextAuth認証ルートの設定
 *
 * このモジュールでは、NextAuthを使用したSpotify OAuth認証の設定を行います。
 * PrismaAdapterを使用してユーザー情報をデータベースに保存し、
 * セッション情報にSpotifyのアクセストークンを含めるようにカスタマイズしています。
 */

import { auth } from "@/auth";

export const { GET, POST } = auth.handlers;
