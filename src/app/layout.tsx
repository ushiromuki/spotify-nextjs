/**
 * @fileoverview ルートレイアウトコンポーネント
 *
 * このモジュールでは、アプリケーション全体のレイアウトを定義し、
 * 共通のスタイルやプロバイダーを設定します。
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Podcast Summary - Spotifyポッドキャストの要約サービス",
	description:
		"Spotifyで聴いたポッドキャストを自動で要約し、効率的な情報収集をサポートします。",
};

/**
 * ルートレイアウトコンポーネント
 * @param props - コンポーネントのプロパティ
 * @returns レイアウトのJSX要素
 */
export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	return (
		<html lang="ja">
			<body className={inter.className}>
				<AuthProvider session={session}>{children}</AuthProvider>
			</body>
		</html>
	);
}
