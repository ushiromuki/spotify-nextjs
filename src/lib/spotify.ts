/**
 * @fileoverview Spotify Web APIクライアントのラッパー
 *
 * このモジュールでは、spotify-web-api-nodeのラッパーを提供し、
 * アプリケーション固有の機能を追加します。
 */

import SpotifyWebApi from "spotify-web-api-node";

/**
 * Spotifyトラックがエピソードかどうかをチェックする型ガード関数
 * @param track 検証するトラック
 * @returns エピソードの場合true
 */
function isEpisodeTrack(track: unknown): track is SpotifyApi.EpisodeObject {
  if (!track || typeof track !== "object") return false;
  const potentialEpisode = track as Partial<SpotifyApi.EpisodeObject>;
  return (
    potentialEpisode.type === "episode" &&
    typeof potentialEpisode.id === "string" &&
    typeof potentialEpisode.name === "string" &&
    typeof potentialEpisode.description === "string"
  );
}

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
 * @returns 最近再生したエピソード情報の配列
 */
export const getRecentlyPlayedPodcasts = async (spotifyApi: SpotifyWebApi) => {
  const response = await spotifyApi.getMyRecentlyPlayedTracks({
    limit: 50,
  });

  return response.body.items
    .filter((item) => isEpisodeTrack(item.track))
    .map((item) => ({
      ...item.track,
      played_at: item.played_at,
    }));
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
