/**
 * @fileoverview Spotify APIのカスタム型定義
 *
 * このモジュールでは、Spotify Web APIの型定義を拡張し、
 * ポッドキャストエピソード特有のフィールドを追加します。
 */

import type { Episode } from "@spotify/web-api-ts-sdk";

/**
 * Spotifyエピソードの基本型定義
 */
export interface SpotifyEpisode {
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
export interface PodcastWithPlayedAt extends SpotifyEpisode {
  played_at: string;
}

/**
 * ポッドキャスト要約情報の型定義
 */
export interface PodcastSummary {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  releaseDate: Date | null;
  spotifyUrl: string | null;
  imageUrl: string | null;
  showId: string | null;
  showName: string | null;
  summaries: Array<{
    id: string;
    content: string;
    generatedAt: Date;
  }>;
}

/**
 * アプリケーション用に拡張したポッドキャストエピソードの型定義
 */
export interface ExtendedPodcastEpisode extends Episode {
  summary?: string;
  isProcessing?: boolean;
}

declare module "spotify-web-api-node" {
  namespace SpotifyApi {
    type EpisodeObject = SpotifyEpisode;

    interface PlayHistoryObject {
      track: EpisodeObject;
      played_at: string;
      context: {
        type: string;
        href: string;
        external_urls: {
          spotify: string;
        };
      } | null;
    }
  }
}
