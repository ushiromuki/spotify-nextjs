/**
 * @fileoverview ダッシュボードページコンポーネント
 *
 * このモジュールでは、ユーザーのポッドキャスト視聴履歴と要約を表示する
 * ダッシュボードページを実装します。
 */

import { auth } from "@/auth";
import PodcastList from "@/components/PodcastList";
import { prisma } from "@/lib/prisma";
import { createSpotifyClient } from "@/lib/spotify";
import { redirect } from "next/navigation";

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
 * Spotifyトラックがエピソードかどうかをチェックする型ガード関数
 * @param track 検証するトラック
 * @returns エピソードの場合true
 */
function isEpisodeTrack(track: unknown): track is SpotifyEpisode {
  if (!track || typeof track !== "object") return false;
  const potentialEpisode = track as Partial<SpotifyEpisode>;
  return (
    potentialEpisode.type === "episode" &&
    typeof potentialEpisode.id === "string" &&
    typeof potentialEpisode.name === "string" &&
    typeof potentialEpisode.description === "string" &&
    typeof potentialEpisode.duration_ms === "number" &&
    typeof potentialEpisode.release_date === "string" &&
    Array.isArray(potentialEpisode.images) &&
    typeof potentialEpisode.external_urls === "object" &&
    typeof potentialEpisode.show === "object"
  );
}

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
    const recentPodcastsResponse = await spotifyApi.getMyRecentlyPlayedTracks({
      limit: 50,
    });

    const recentPodcasts = recentPodcastsResponse.body.items
      .filter((item) => isEpisodeTrack(item.track))
      .map((item): PodcastWithPlayedAt => {
        const track = item.track as unknown as SpotifyEpisode;
        return {
          id: track.id,
          name: track.name,
          type: track.type,
          description: track.description,
          duration_ms: track.duration_ms,
          release_date: track.release_date,
          images: track.images,
          external_urls: track.external_urls,
          show: track.show,
          played_at: item.played_at,
        };
      });

    // データベースから要約情報を取得
    const summaries = await prisma.podcastEpisode.findMany({
      where: {
        id: {
          in: recentPodcasts.map((podcast) => podcast.id),
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
