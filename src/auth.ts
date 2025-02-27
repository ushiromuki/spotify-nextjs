/**
 * @fileoverview 認証ヘルパー関数
 *
 * このモジュールでは、NextAuthの認証関連のヘルパー関数を提供します。
 * auth()関数は、現在のセッション情報を取得するために使用されます。
 */

import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

// Spotifyの認証に必要なスコープを定義
const scopes = [
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-read-playback-position",
  "playlist-read-private",
  "playlist-read-collaborative",
  "streaming",
].join(" ");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: {
          scope: scopes,
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // セッションにユーザーIDを追加
      if (session.user) {
        session.user.id = token.sub;

        // Spotifyのアクセストークンを取得
        const account = await prisma.account.findFirst({
          where: {
            userId: token.sub,
            provider: "spotify",
          },
        });

        if (account) {
          session.accessToken = account.access_token ?? undefined;
          session.refreshToken = account.refresh_token ?? undefined;
          session.expires = account.expires_at ? account.expires_at * 1000 : undefined;
        }
      }

      return session;
    },
    async jwt({ token, account, user }) {
      // 初回ログイン時にアカウント情報をトークンに追加
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expires = account.expires_at ? account.expires_at * 1000 : undefined;
        token.user = user;
      }

      // アクセストークンの有効期限をチェック
      const now = Date.now();
      if (token.expires && now > token.expires) {
        console.log("Token expired, attempting to refresh...");
        try {
          // トークンを更新
          const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
              ).toString("base64")}`,
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(`Failed to refresh token: ${data.error}`);
          }

          console.log("Token refreshed successfully");

          // トークンを更新
          token.accessToken = data.access_token;
          token.expires = Date.now() + data.expires_in * 1000;

          // データベースのアカウント情報も更新
          if (token.sub) {
            await prisma.account.update({
              where: {
                provider_providerAccountId: {
                  provider: "spotify",
                  providerAccountId: token.sub,
                },
              },
              data: {
                access_token: data.access_token,
                expires_at: Math.floor(Date.now() / 1000 + data.expires_in),
              },
            });
          }
        } catch (error) {
          console.error("Error refreshing token:", error);
          // エラーが発生した場合は、トークンをクリア
          delete token.accessToken;
          delete token.refreshToken;
          delete token.expires;
        }
      }

      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-development-secret-key",
});
