/**
 * @fileoverview ポッドキャストリストコンポーネント
 *
 * このモジュールでは、ポッドキャストエピソードのリストを表示する
 * コンポーネントを実装します。各エピソードには要約情報も表示されます。
 */

"use client";

import { generatePodcastSummary } from "@/lib/gemini";
import type { PodcastWithPlayedAt, PodcastSummary } from "@/types/spotify";
import Image from "next/image";
import { useState } from "react";

/**
 * ポッドキャストリストのプロパティ型定義
 */
interface PodcastListProps {
  podcasts: PodcastWithPlayedAt[];
  summaries: PodcastSummary[];
}

/**
 * ポッドキャストリストコンポーネント
 * @param props - コンポーネントのプロパティ
 * @returns ポッドキャストリストのJSX要素
 */
export default function PodcastList({ podcasts, summaries }: PodcastListProps) {
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<string | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleGenerateSummary = async (
    episodeId: string,
    description: string,
  ) => {
    try {
      setIsGenerating(episodeId);
      const summary = await generatePodcastSummary(description);
      // TODO: サーバーに要約を保存する処理を実装
      console.log("Generated summary:", summary);
    } catch (error) {
      console.error("Error generating summary:", error);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      {podcasts.map((episode: PodcastWithPlayedAt) => {
        const summary = summaries.find(
          (s: PodcastSummary) => s.id === episode.id,
        );

        return (
          <div
            key={episode.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start space-x-4">
                {episode.images?.[0]?.url && (
                  <div className="flex-shrink-0">
                    <Image
                      src={episode.images[0].url}
                      alt={episode.name}
                      width={120}
                      height={120}
                      className="rounded-md"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 truncate">
                    {episode.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(episode.played_at).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    に再生
                  </p>
                  {expandedEpisodeId === episode.id ? (
                    <p className="mt-2 text-gray-600">{episode.description}</p>
                  ) : (
                    <p className="mt-2 text-gray-600 line-clamp-2">
                      {episode.description}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedEpisodeId(
                        expandedEpisodeId === episode.id ? null : episode.id,
                      )
                    }
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    {expandedEpisodeId === episode.id ? "閉じる" : "もっと見る"}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {summary?.summaries.length ? (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="text-lg font-medium text-gray-900">要約</h3>
                    <p className="mt-2 text-gray-600">
                      {summary.summaries[0].content}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      生成日時:{" "}
                      {new Date(
                        summary.summaries[0].generatedAt,
                      ).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handleGenerateSummary(episode.id, episode.description)
                    }
                    disabled={isGenerating === episode.id}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isGenerating === episode.id ? "生成中..." : "要約を生成"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
