/**
 * @fileoverview Spotify APIのカスタム型定義
 *
 * このモジュールでは、Spotify Web APIの型定義を拡張し、
 * ポッドキャストエピソード特有のフィールドを追加します。
 */

import type { Episode } from "@spotify/web-api-ts-sdk";

export interface PodcastEpisode extends Episode {
  summary?: string;
  isProcessing?: boolean;
}

declare module "@spotify/web-api-ts-sdk" {
  interface PlayHistory {
    track: Episode;
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
