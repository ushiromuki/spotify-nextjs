/**
 * @fileoverview ポッドキャスト要約生成APIエンドポイント
 *
 * このモジュールでは、指定されたポッドキャストエピソードの要約を生成し、
 * データベースに保存するAPIエンドポイントを実装します。
 */

// Edge Runtimeの設定
export const runtime = "edge";

import { auth } from "@/auth";
import { generatePodcastSummary, parseSummary } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { createSpotifyClient, getPodcastEpisode } from "@/lib/spotify";

/**
 * ポッドキャスト要約生成API
 * @param request - リクエストオブジェクト
 * @returns 要約データまたはエラーレスポンス
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    // URLからエピソードIDを取得
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return Response.json({ error: "Invalid podcast ID" }, { status: 400 });
    }

    // Spotifyクライアントの作成
    const spotifyApi = createSpotifyClient(session.accessToken);

    // エピソード情報の取得
    const episode = await getPodcastEpisode(spotifyApi, id);

    if (!episode) {
      return new Response("Episode not found", { status: 404 });
    }

    // 要約の生成
    const summaryText = await generatePodcastSummary(episode.description);
    const parsedSummary = parseSummary(summaryText);

    // エピソード情報の保存または更新
    const podcastEpisode = await prisma.podcastEpisode.upsert({
      where: { id: episode.id },
      create: {
        id: episode.id,
        title: episode.name,
        description: episode.description,
        duration: episode.duration_ms,
        releaseDate: new Date(episode.release_date),
        spotifyUrl: episode.external_urls.spotify,
        imageUrl: episode.images[0]?.url,
        showId: episode.show.id,
        showName: episode.show.name,
      },
      update: {
        title: episode.name,
        description: episode.description,
        duration: episode.duration_ms,
        releaseDate: new Date(episode.release_date),
        spotifyUrl: episode.external_urls.spotify,
        imageUrl: episode.images[0]?.url,
        showId: episode.show.id,
        showName: episode.show.name,
      },
    });

    // 要約の保存
    const summary = await prisma.summary.create({
      data: {
        episodeId: podcastEpisode.id,
        content: JSON.stringify(parsedSummary),
      },
    });

    return Response.json({ summary });
  } catch (error) {
    console.error("[SUMMARY_API_ERROR]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
