/**
 * @fileoverview Spotify Web APIクライアントのラッパー
 *
 * このモジュールでは、spotify-web-api-nodeのラッパーを提供し、
 * アプリケーション固有の機能を追加します。
 */

import SpotifyWebApi from "spotify-web-api-node";

/**
 * Spotifyクライアントのインスタンスを作成します
 * @param accessToken - Spotifyのアクセストークン
 * @returns SpotifyWebApiのインスタンス
 */
export const createSpotifyClient = (accessToken?: string) => {
	const spotifyApi = new SpotifyWebApi({
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
		redirectUri: process.env.SPOTIFY_REDIRECT_URI,
	});

	if (accessToken) {
		spotifyApi.setAccessToken(accessToken);
	}

	return spotifyApi;
};

/**
 * 最近再生したポッドキャストエピソードを取得します
 * @param spotifyApi - SpotifyWebApiのインスタンス
 * @param limit - 取得する件数（デフォルト: 50）
 * @returns 最近再生したポッドキャストエピソードの配列
 */
export const getRecentlyPlayedPodcasts = async (
	spotifyApi: SpotifyWebApi,
	limit = 50,
) => {
	const response = await spotifyApi.getMyRecentlyPlayedTracks({
		limit,
	});

	// ポッドキャストエピソードのみをフィルタリング
	const podcastEpisodes = response.body.items.filter(
		(item) => item.track.type === "episode",
	);

	return podcastEpisodes;
};

/**
 * ポッドキャストエピソードの詳細情報を取得します
 * @param spotifyApi - SpotifyWebApiのインスタンス
 * @param episodeId - エピソードID
 * @returns エピソードの詳細情報
 */
export const getPodcastEpisode = async (
	spotifyApi: SpotifyWebApi,
	episodeId: string,
) => {
	const response = await spotifyApi.getEpisode(episodeId);
	return response.body;
};

/**
 * 現在再生中のポッドキャストエピソードを取得します
 * @param spotifyApi - SpotifyWebApiのインスタンス
 * @returns 現在再生中のエピソード情報（再生中でない場合はnull）
 */
export const getCurrentlyPlayingPodcast = async (spotifyApi: SpotifyWebApi) => {
	try {
		const response = await spotifyApi.getMyCurrentPlayingTrack();

		if (response.body && response.body.item?.type === "episode") {
			return response.body;
		}

		return null;
	} catch (error) {
		console.error("Error getting currently playing track:", error);
		return null;
	}
};
