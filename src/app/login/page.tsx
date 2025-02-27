/**
 * @fileoverview ログインページコンポーネント
 *
 * このモジュールでは、トップページにリダイレクトします。
 * ログイン機能はトップページのみに配置します。
 */

import { redirect } from "next/navigation";

/**
 * ログインページコンポーネント
 * @returns リダイレクト
 */
export default async function LoginPage() {
  // トップページにリダイレクト
  redirect("/");
}
