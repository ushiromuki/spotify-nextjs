/**
 * @fileoverview ポッドキャスト要約生成APIエンドポイント
 *
 * このモジュールでは、指定されたポッドキャストエピソードの要約を生成し、
 * データベースに保存するAPIエンドポイントを実装します。
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSpotifyClient, getPodcastEpisode } from "@/lib/spotify";
import { generatePodcastSummary, parseSummary } from "@/lib/gemini";

/**
 * ポッドキャスト要約生成API
 * @param request - リクエストオブジェクト
 * @param context - ルートパラメータを含むコンテキスト
 * @returns 要約データまたはエラーレスポンス
 */
export async function POST(
	request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await auth();

		if (!session?.accessToken) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		if (!params?.id) {
			return NextResponse.json(
				{ error: "Invalid podcast ID" },
				{ status: 400 },
			);
		}

		const { id } = params;

		// Spotifyクライアントの作成
		const spotifyApi = createSpotifyClient(session.accessToken);

		// エピソード情報の取得
		const episode = await getPodcastEpisode(spotifyApi, id);

		if (!episode) {
			return new NextResponse("Episode not found", { status: 404 });
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

		return NextResponse.json({ summary });
	} catch (error) {
		console.error(`[SUMMARY_API_ERROR] ID: ${params?.id}`, error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
