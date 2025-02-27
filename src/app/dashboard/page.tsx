/**
 * @fileoverview ダッシュボードページコンポーネント
 *
 * このモジュールでは、ユーザーのポッドキャスト視聴履歴と要約を表示する
 * ダッシュボードページを実装します。
 */

import { auth } from "@/auth";
import PodcastList from "@/components/PodcastList";
import { prisma } from "@/lib/prisma";
import { createSpotifyClient, getRecentlyPlayedPodcasts } from "@/lib/spotify";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * Spotifyエピソードの型定義
 */
interface SpotifyEpisode {
  type: "episode";
  id: string;
  name: string;
  description: string;
  duration_ms: number;
  release_date: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
  show: {
    id: string;
    name: string;
  };
}

/**
 * 再生履歴付きポッドキャストの型定義
 */
interface PodcastWithPlayedAt extends SpotifyEpisode {
  played_at: string;
}

/**
 * デモポッドキャストデータを生成する関数
 * @returns デモポッドキャストデータの配列
 */
function getDefaultPodcasts(): PodcastWithPlayedAt[] {
  return [
    {
      id: "demo-1",
      type: "episode",
      name: "テクノロジーの未来と人工知能",
      description: "この回では、最新のAI技術動向と、それが私たちの生活にどのような影響を与えるかについて議論します。GPT-4、生成AIの進化、そして倫理的な課題について専門家が解説します。",
      duration_ms: 2400000, // 40分
      release_date: "2025-02-20",
      images: [
        {
          url: "https://i.scdn.co/image/ab67656300005f1f5755e1e2e4afa8f916b1e167",
          height: 300,
          width: 300,
        },
      ],
      external_urls: {
        spotify: "https://open.spotify.com/episode/demo1",
      },
      show: {
        id: "show-1",
        name: "テックトーク",
      },
      played_at: new Date().toISOString(),
    },
    {
      id: "demo-2",
      type: "episode",
      name: "健康的な生活習慣とマインドフルネス",
      description: "現代社会でのストレス管理と健康的な生活習慣の重要性について。マインドフルネス瞑想、運動、栄養バランスの取れた食事など、日常に取り入れられる実践的なアドバイスを提供します。",
      duration_ms: 1800000, // 30分
      release_date: "2025-02-15",
      images: [
        {
          url: "https://i.scdn.co/image/ab67656300005f1f8a7b5713ac4b3961b6c6dd2e",
          height: 300,
          width: 300,
        },
      ],
      external_urls: {
        spotify: "https://open.spotify.com/episode/demo2",
      },
      show: {
        id: "show-2",
        name: "ウェルネスジャーニー",
      },
      played_at: new Date(Date.now() - 86400000).toISOString(), // 1日前
    },
  ];
}

/**
 * ダッシュボードページコンポーネント
 * @returns ダッシュボードページのJSX要素
 */
export default async function DashboardPage() {
  // デフォルトでデモデータを使用
  let podcastsToDisplay = getDefaultPodcasts();
  let isUsingDemoData = true;
  let summaries = [];
  let errorMessage: string | null = null;
  let authError = false;

  try {
    const session = await auth();

    if (!session) {
      // 未認証の場合はログインページにリダイレクト
      redirect("/login");
    }

    // アクセストークンがない場合はエラーメッセージを表示
    if (!session.accessToken) {
      console.log("No access token found");
      errorMessage = "Spotifyのアクセストークンが見つかりません。再度ログインしてください。";
      authError = true;
    } else {
      // トークンの有効期限をチェック（リダイレクトではなくエラーメッセージを表示）
      if (session.expires && Date.now() > session.expires) {
        console.log("Session token expired");
        errorMessage = "Spotifyのセッションが期限切れです。再度ログインしてください。";
        authError = true;
      } else {
        // Spotifyクライアントの作成
        const spotifyApi = createSpotifyClient(session.accessToken);

        try {
          console.log("Fetching podcasts with access token:", session.accessToken?.substring(0, 10) + "...");
          
          // 専用の関数を使用して最近再生したポッドキャストを取得
          const recentPodcasts = await getRecentlyPlayedPodcasts(spotifyApi);
          
          console.log(`Found ${recentPodcasts.length} podcasts`);

          // ポッドキャストが見つかった場合はデモデータを置き換え
          if (recentPodcasts.length > 0) {
            podcastsToDisplay = recentPodcasts;
            isUsingDemoData = false;

            // データベースから要約情報を取得
            summaries = await prisma.podcastEpisode.findMany({
              where: {
                id: {
                  in: recentPodcasts.map((podcast) => podcast.id),
                },
              },
              include: {
                summaries: true,
              },
            });

            console.log(`Found ${summaries.length} summaries in database`);
          } else {
            console.log("No podcasts found, using demo data");
          }
        } catch (error: any) {
          console.error("Error fetching podcasts:", error);
          
          // トークン関連のエラーの場合はエラーメッセージを表示
          if (error.message && (
            error.message.includes("token") || 
            error.message.includes("expired") || 
            error.message.includes("authentication")
          )) {
            console.log("Token error detected");
            errorMessage = "Spotifyの認証に問題があります。再度ログインしてください。";
            authError = true;
          } else {
            // その他のエラーの場合はエラーメッセージを設定
            errorMessage = "ポッドキャストの取得中にエラーが発生しました。しばらくしてから再度お試しください。";
          }
        }
      }
    }
  } catch (error: any) {
    console.error("Error in dashboard page:", error);
    errorMessage = "ページの読み込み中にエラーが発生しました。しばらくしてから再度お試しください。";
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          最近聴いたポッドキャスト
          {isUsingDemoData && " (デモデータ)"}
        </h1>
        
        {errorMessage && (
          <div className={`border-l-4 p-4 mb-6 ${authError ? 'bg-red-50 border-red-400' : 'bg-yellow-50 border-yellow-400'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${authError ? 'text-red-400' : 'text-yellow-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className={`text-sm ${authError ? 'text-red-700' : 'text-yellow-700'}`}>{errorMessage}</p>
                {authError && (
                  <div className="mt-2">
                    <Link href="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      ログインページへ
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <PodcastList podcasts={podcastsToDisplay} summaries={summaries} />
      </main>
    </div>
  );
}
