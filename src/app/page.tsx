/**
 * @fileoverview ルートページコンポーネント
 */

// Edge Runtimeの設定
import Image from "next/image";
import { auth } from "@/auth";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-emerald-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center space-y-8 text-center text-white pt-20">
          <div className="relative w-16 h-16 mb-4">
            <Image
              src="/spotify.svg"
              alt="Spotify Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Podcast Insights
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
            Discover deeper insights from your favorite podcasts using AI-powered analysis
          </p>
          
          {/* CTA Button */}
          <div className="mt-8">
            {!session ? (
              <LoginButton />
            ) : (
              <a
                href="/dashboard"
                className="bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-8 rounded-full transition-all transform hover:scale-105 hover:shadow-lg"
              >
                Go to Dashboard
              </a>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 transform transition-all hover:scale-105">
            <div className="text-green-400 text-4xl mb-4">🎙️</div>
            <h3 className="text-xl font-bold text-white mb-2">Podcast Analysis</h3>
            <p className="text-gray-300">Get detailed insights and summaries from your favorite podcast episodes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 transform transition-all hover:scale-105">
            <div className="text-green-400 text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2">AI-Powered</h3>
            <p className="text-gray-300">Leverage advanced AI to extract key topics and meaningful insights</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 transform transition-all hover:scale-105">
            <div className="text-green-400 text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Analytics</h3>
            <p className="text-gray-300">Track trends and patterns across episodes and shows</p>
          </div>
        </div>
      </div>
    </div>
  );
}
