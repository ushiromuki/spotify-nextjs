/**
 * @fileoverview 認証ヘルパー関数
 *
 * このモジュールでは、NextAuthの認証関連のヘルパー関数を提供します。
 * auth()関数は、現在のセッション情報を取得するために使用されます。
 */

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { prisma } from "@/lib/prisma";

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

export const { auth, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(prisma),
	providers: [
		SpotifyProvider({
			clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
			authorization: {
				params: {
					scope: scopes,
				},
			},
		}),
	],
	callbacks: {
		async session({ session, user }) {
			// セッションにユーザーIDを追加
			session.user.id = user.id;

			// Spotifyのアクセストークンを取得
			const account = await prisma.account.findFirst({
				where: {
					userId: user.id,
					provider: "spotify",
				},
			});

			if (account) {
				session.accessToken = account.access_token;
				session.refreshToken = account.refresh_token;
			}

			return session;
		},
		async jwt({ token, account }) {
			if (account) {
				token.accessToken = account.access_token;
				token.refreshToken = account.refresh_token;
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
	secret: process.env.NEXTAUTH_SECRET,
});
