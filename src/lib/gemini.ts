/**
 * @fileoverview Gemini APIのラッパー
 *
 * このモジュールでは、Google Cloud Gemini APIのラッパーを提供し、
 * ポッドキャストの要約生成機能を実装します。
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined");
}

// Gemini APIのインスタンスを作成
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * ポッドキャストの内容を要約します
 * @param text - 要約対象のテキスト（概要欄や書き起こし）
 * @returns 生成された要約
 */
export const generatePodcastSummary = async (text: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
以下のポッドキャストの内容を要約してください。
要約は以下の形式で出力してください：

1. 概要（100文字程度）
2. 主要なポイント（箇条書き3-5項目）
3. 詳細な内容（400文字程度）

入力テキスト：
${text}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("要約の生成中にエラーが発生しました。");
  }
};

/**
 * 要約を構造化データに変換します
 * @param summaryText - 生成された要約テキスト
 * @returns 構造化された要約データ
 */
export const parseSummary = (summaryText: string) => {
  const sections = summaryText.split("\n\n");

  return {
    overview: sections[0]?.replace(/^1\. 概要[：:]\s*/, "").trim() || "",
    keyPoints:
      sections[1]
        ?.replace(/^2\. 主要なポイント[：:]\s*/, "")
        .split("\n")
        .map((point) => point.replace(/^[•\-]\s*/, ""))
        .filter(Boolean) || [],
    details: sections[2]?.replace(/^3\. 詳細な内容[：:]\s*/, "").trim() || "",
  };
};
