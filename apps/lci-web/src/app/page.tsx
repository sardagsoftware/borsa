export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          LyDian AI
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          System Health Dashboard - Enterprise Grade Monitoring
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/status"
            className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:shadow-2xl transition-all"
          >
            View Status Dashboard
          </a>
          <a
            href="/demo-status.html"
            className="px-8 py-4 rounded-full bg-white border-2 border-purple-600 text-purple-600 font-bold hover:shadow-2xl transition-all"
          >
            Demo Version
          </a>
        </div>
      </div>
    </div>
  );
}
