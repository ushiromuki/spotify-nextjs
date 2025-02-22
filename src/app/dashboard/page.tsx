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

/**
 * ダッシュボードページコンポーネント
 * @returns ダッシュボードページのJSX要素
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Spotifyクライアントの作成
  const spotifyApi = createSpotifyClient(session.accessToken);

  try {
    // 最近再生したポッドキャストを取得
    const recentPodcasts = await getRecentlyPlayedPodcasts(spotifyApi);

    // データベースから要約情報を取得
    const summaries = await prisma.podcastEpisode.findMany({
      where: {
        id: {
          in: recentPodcasts.map((podcast) => podcast.track.id),
        },
      },
      include: {
        summaries: true,
      },
    });

    return (
      <div className="min-h-screen bg-gray-100">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            最近聴いたポッドキャスト
          </h1>
          <PodcastList podcasts={recentPodcasts} summaries={summaries} />
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error fetching podcasts:", error);
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            エラーが発生しました
          </h1>
          <p className="text-gray-600">
            ポッドキャストの取得中にエラーが発生しました。
            <br />
            しばらくしてから再度お試しください。
          </p>
        </div>
      </div>
    );
  }
}
