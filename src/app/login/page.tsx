/**
 * @fileoverview ログインページコンポーネント
 *
 * このモジュールでは、Spotifyアカウントでのログインを提供する
 * ページコンポーネントを実装します。
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginButton from "@/components/LoginButton";

/**
 * ログインページコンポーネント
 * @returns ログインページのJSX要素
 */
export default async function LoginPage() {
	const session = await auth();

	// すでにログインしている場合はダッシュボードにリダイレクト
	if (session) {
		redirect("/dashboard");
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
			<div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
				<div className="text-center">
					<h1 className="text-4xl font-bold text-gray-900 mb-2">
						Podcast Summary
					</h1>
					<p className="text-gray-600">
						Spotifyのポッドキャストを自動で要約し、
						<br />
						効率的な情報収集をサポートします。
					</p>
				</div>

				<div className="mt-8">
					<LoginButton />
				</div>

				<div className="mt-6 text-center text-sm text-gray-500">
					<p>
						ログインすることで、
						<a
							href="/terms"
							className="font-medium text-indigo-600 hover:text-indigo-500"
						>
							利用規約
						</a>
						と
						<a
							href="/privacy"
							className="font-medium text-indigo-600 hover:text-indigo-500"
						>
							プライバシーポリシー
						</a>
						に同意したものとみなされます。
					</p>
				</div>
			</div>
		</div>
	);
}
