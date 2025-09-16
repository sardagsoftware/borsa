/**
 * AILYDIAN - Quantum Portfolio Test Page
 * Test quantum-ML microservice connectivity
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function QuantumTestPage() {
  const [serviceStatus, setServiceStatus] = useState<string>('Checking...');
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Test service health on component mount
  useEffect(() => {
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    try {
      const response = await fetch('/api/quantum-ml/health');
      const data = await response.json();
      
      if (response.ok) {
        setServiceStatus(`✅ Service Online - ${data.status}`);
      } else {
        setServiceStatus(`❌ Service Error - ${data.error}`);
      }
    } catch (error) {
      setServiceStatus('🔌 Service Offline - Cannot connect');
    }
  };

  const testPortfolioOptimization = async () => {
    setLoading(true);
    try {
      const testData = {
        assets: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
        risk_tolerance: 0.5,
        objective: 'sharpe'
      };

      const response = await fetch('/api/quantum-ml/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      setTestResults({ error: 'Test failed: ' + error });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Quantum-ML Service Test
        </h1>

        {/* Service Status */}
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Service Status</h2>
          <p className="text-gray-300 mb-4">{serviceStatus}</p>
          <Button onClick={checkServiceHealth} variant="outline">
            Refresh Status
          </Button>
        </Card>

        {/* Test Portfolio Optimization */}
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Portfolio Optimization</h2>
          <p className="text-gray-300 mb-4">
            Test quantum portfolio optimization with sample assets
          </p>
          <Button 
            onClick={testPortfolioOptimization}
            disabled={loading}
            className="mb-4"
          >
            {loading ? 'Running Test...' : 'Test Optimization'}
          </Button>

          {testResults && (
            <div className="bg-black/50 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-2">Test Results:</h3>
              <pre className="text-gray-300 text-sm overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        {/* Docker Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Docker Commands</h2>
          <div className="space-y-2 text-gray-300 text-sm font-mono">
            <p>Start service: docker-compose up quantum-ml -d</p>
            <p>Check logs: docker-compose logs quantum-ml</p>
            <p>Stop service: docker-compose stop quantum-ml</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
