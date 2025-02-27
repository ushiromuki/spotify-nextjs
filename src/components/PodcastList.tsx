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
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

/**
 * ポッドキャストリストのプロパティ型定義
 */
interface PodcastListProps {
  podcasts: PodcastWithPlayedAt[];
  summaries: PodcastSummary[];
}

/**
 * ポッドキャストの再生時間をフォーマットする関数
 * @param ms - ミリ秒単位の再生時間
 * @returns フォーマットされた再生時間（例：「45分」、「1時間30分」）
 */
function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}時間${remainingMinutes > 0 ? `${remainingMinutes}分` : ''}`;
  }
  
  return `${minutes}分`;
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
  const [generatedSummaries, setGeneratedSummaries] = useState<Record<string, string>>({});

  const handleGenerateSummary = async (
    episodeId: string,
    description: string,
  ) => {
    try {
      setIsGenerating(episodeId);
      const summary = await generatePodcastSummary(description);
      
      // クライアント側で一時的に要約を保存
      setGeneratedSummaries(prev => ({
        ...prev,
        [episodeId]: summary
      }));
      
      // TODO: サーバーに要約を保存する処理を実装
      console.log("Generated summary:", summary);
    } catch (error) {
      console.error("Error generating summary:", error);
    } finally {
      setIsGenerating(null);
    }
  };

  if (podcasts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h3 className="text-xl font-medium text-gray-900 mb-4">ポッドキャストが見つかりませんでした</h3>
        <p className="text-gray-600">
          Spotifyでポッドキャストを聴くと、ここに表示されます。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {podcasts.map((episode: PodcastWithPlayedAt) => {
        const dbSummary = summaries.find(
          (s: PodcastSummary) => s.id === episode.id,
        );
        const clientSummary = generatedSummaries[episode.id];
        const hasSummary = dbSummary?.summaries.length > 0 || clientSummary;
        const summaryContent = dbSummary?.summaries[0]?.content || clientSummary;
        
        // 再生日時を相対時間に変換（例：「3日前」）
        const playedAtRelative = formatDistanceToNow(new Date(episode.played_at), {
          addSuffix: true,
          locale: ja
        });

        return (
          <div
            key={episode.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
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
                      className="rounded-md shadow-sm hover:shadow transition-shadow duration-300"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold text-gray-900 truncate">
                      {episode.name}
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {formatDuration(episode.duration_ms)}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{episode.show.name}</span>
                    <span className="mx-2">•</span>
                    <span>{playedAtRelative}に再生</span>
                  </div>
                  
                  {expandedEpisodeId === episode.id ? (
                    <div className="mt-3 text-gray-600 prose prose-sm max-w-none">
                      {episode.description}
                    </div>
                  ) : (
                    <p className="mt-3 text-gray-600 line-clamp-2">
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
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
                  >
                    {expandedEpisodeId === episode.id ? "閉じる" : "もっと見る"}
                  </button>
                  
                  <a
                    href={episode.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 text-sm text-green-600 hover:text-green-500 focus:outline-none focus:underline"
                  >
                    Spotifyで聴く
                  </a>
                </div>
              </div>

              <div className="mt-6">
                {hasSummary ? (
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      AI要約
                    </h3>
                    <div className="mt-2 text-gray-600 prose prose-sm max-w-none">
                      {summaryContent}
                    </div>
                    {dbSummary?.summaries[0]?.generatedAt && (
                      <p className="mt-3 text-xs text-gray-500">
                        生成日時:{" "}
                        {new Date(
                          dbSummary.summaries[0].generatedAt,
                        ).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handleGenerateSummary(episode.id, episode.description)
                    }
                    disabled={isGenerating === episode.id}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
                  >
                    {isGenerating === episode.id ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        AI要約を生成中...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        AI要約を生成
                      </>
                    )}
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
