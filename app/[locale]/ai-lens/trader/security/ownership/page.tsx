export default function OwnershipPage() {
  return (
    <div className="min-h-screen bg-binance-dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-binance-text mb-4">
            ⚖️ Ownership & Legal Compliance
          </h1>
          <p className="text-binance-textSecondary">
            Copyright protection and intellectual property information
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
            <h2 className="text-xl font-semibold text-binance-text mb-4">
              Copyright Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-binance-textSecondary text-sm">Owner</p>
                <p className="text-binance-text font-semibold">Emrah Şardağ</p>
              </div>
              <div>
                <p className="text-binance-textSecondary text-sm">Project</p>
                <p className="text-binance-text font-semibold">AILYDIAN AI LENS PRO CRYPTO TRADER</p>
              </div>
              <div>
                <p className="text-binance-textSecondary text-sm">Copyright Year</p>
                <p className="text-binance-text font-semibold">2024</p>
              </div>
            </div>
          </div>
          
          <div className="bg-binance-panel p-6 rounded-lg border border-gray-600">
            <h2 className="text-xl font-semibold text-binance-text mb-4">
              Legal Notice
            </h2>
            <div className="text-binance-textSecondary text-sm space-y-2">
              <p>
                This software is the intellectual property of Emrah Şardağ and is protected 
                by copyright laws and international treaties.
              </p>
              <p>
                Unauthorized reproduction, distribution, or reverse engineering is strictly prohibited.
              </p>
              <p className="text-binance-yellow font-semibold mt-4">
                All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
