export default function SBOMPage() {
  return (
    <div className="min-h-screen bg-binance-dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-binance-text mb-4">
            📋 Software Bill of Materials (SBOM)
          </h1>
          <p className="text-binance-textSecondary">
            Comprehensive package vulnerability analysis and dependency mapping
          </p>
        </div>
        
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
          <h2 className="text-xl font-semibold text-binance-text mb-4">
            Package Dependencies
          </h2>
          <div className="text-binance-textSecondary">
            SBOM analysis will be displayed here...
          </div>
        </div>
      </div>
    </div>
  );
}
