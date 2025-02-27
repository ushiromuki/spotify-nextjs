/**
 * @fileoverview Spotify Web APIクライアントのラッパー
 *
 * このモジュールでは、spotify-web-api-nodeのラッパーを提供し、
 * アプリケーション固有の機能を追加します。
 */

import SpotifyWebApi from "spotify-web-api-node";
import { auth } from "@/auth";

// ダミーレスポンスを生成する関数
const createEmptyResponse = (limit = 20) => ({
  body: {
    items: [],
    next: null,
    cursors: { after: null, before: null },
    limit: limit,
    href: ""
  }
});

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
 * トークンが期限切れかどうかをチェックする関数
 * @param error エラーオブジェクト
 * @returns 期限切れの場合true
 */
function isTokenExpiredError(error: any): boolean {
  return (
    error.statusCode === 401 || 
    (error.message && (
      error.message.includes("expired") || 
      error.message.includes("token")
    )) || 
    (error.body && error.body.error && (
      (error.body.error.message && error.body.error.message.includes("expired")) ||
      (error.body.error.status === 401)
    ))
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
    redirectUri: process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/spotify` : 'http://localhost:3000/api/auth/callback/spotify',
  });

  if (accessToken) {
    console.log("Setting Spotify access token:", accessToken.substring(0, 10) + "...");
    spotifyApi.setAccessToken(accessToken);
  } else {
    console.warn("No Spotify access token provided");
  }

  // 元のメソッドを保存
  const originalGetMyRecentlyPlayedTracks = spotifyApi.getMyRecentlyPlayedTracks.bind(spotifyApi);
  
  // メソッドをオーバーライド
  spotifyApi.getMyRecentlyPlayedTracks = async (options) => {
    if (!accessToken) {
      console.warn("No access token available. Using empty response.");
      return createEmptyResponse(options?.limit);
    }

    try {
      return await originalGetMyRecentlyPlayedTracks(options);
    } catch (error: any) {
      console.error("Spotify API error:", error.message || error);
      
      // トークンが無効または期限切れの場合
      if (isTokenExpiredError(error)) {
        console.warn("Invalid or expired Spotify token. Redirecting to login...");
        
        // セッションを取得して確認
        try {
          const session = await auth();
          if (!session || !session.accessToken) {
            console.warn("No valid session or access token found");
          } else if (session.accessToken !== accessToken) {
            console.log("Session token differs from provided token. Using session token instead.");
            spotifyApi.setAccessToken(session.accessToken);
            try {
              return await originalGetMyRecentlyPlayedTracks(options);
            } catch (retryError) {
              console.error("Retry with session token failed:", retryError);
            }
          }
        } catch (sessionError) {
          console.error("Error checking session:", sessionError);
        }
      } else {
        console.warn("Other Spotify API error:", error);
      }
      
      // エラーが発生した場合は空のレスポンスを返す
      return createEmptyResponse(options?.limit);
    }
  };

  return spotifyApi;
};

/**
 * 最近再生したポッドキャストエピソードを取得します
 * @param spotifyApi - SpotifyWebApiのインスタンス
 * @returns 最近再生したエピソード情報の配列
 */
export const getRecentlyPlayedPodcasts = async (spotifyApi: SpotifyWebApi) => {
  try {
    const response = await spotifyApi.getMyRecentlyPlayedTracks({
      limit: 50,
    });

    return response.body.items
      .filter((item) => {
        try {
          return item.track && item.track.type === "episode";
        } catch (e) {
          return false;
        }
      })
      .map((item) => {
        try {
          const track = item.track as unknown as SpotifyApi.EpisodeObject;
          return {
            id: track.id,
            name: track.name,
            description: track.description,
            duration_ms: track.duration_ms,
            release_date: track.release_date,
            images: track.images,
            external_urls: track.external_urls,
            show: track.show,
            played_at: item.played_at,
          };
        } catch (e) {
          console.error("Error mapping podcast:", e);
          return null;
        }
      })
      .filter(Boolean); // nullを除外
  } catch (error) {
    console.error("Error fetching recently played podcasts:", error);
    return [];
  }
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
  try {
    const response = await spotifyApi.getEpisode(episodeId);
    return response.body;
  } catch (error) {
    console.error(`Error fetching podcast episode ${episodeId}:`, error);
    return null;
  }
};

/**
 * 現在再生中のポッドキャストエピソードを取得します
 * @param spotifyApi - SpotifyWebApiのインスタンス
 * @returns 現在再生中のエピソード情報（再生中でない場合はnull）
 */
export const getCurrentlyPlayingPodcast = async (spotifyApi: SpotifyWebApi) => {
  try {
    const response = await spotifyApi.getMyCurrentPlayingTrack();
    
    if (response.body && response.body.item && response.body.item.type === "episode") {
      return response.body.item;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching currently playing podcast:", error);
    return null;
  }
};
