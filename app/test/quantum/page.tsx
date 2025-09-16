'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2, Play, Activity } from 'lucide-react'

interface ServiceTest {
  name: string
  endpoint: string
  status: 'idle' | 'testing' | 'passed' | 'failed'
  message?: string
  responseTime?: number
}

export default function QuantumTestPage() {
  const [services, setServices] = useState<ServiceTest[]>([
    {
      name: 'Quantum ML Service',
      endpoint: '/api/quantum/predict',
      status: 'idle'
    },
    {
      name: 'Portfolio Optimization',
      endpoint: '/api/quantum/portfolio',
      status: 'idle'
    },
    {
      name: 'Risk Analysis',
      endpoint: '/api/quantum/risk',
      status: 'idle'
    },
    {
      name: 'Market Prediction',
      endpoint: '/api/quantum/market',
      status: 'idle'
    }
  ])

  const [globalStatus, setGlobalStatus] = useState<'idle' | 'testing' | 'completed'>('idle')

  const testService = async (service: ServiceTest, index: number) => {
    setServices(prev => prev.map((s, i) => 
      i === index ? { ...s, status: 'testing' } : s
    ))

    try {
      const startTime = Date.now()
      const response = await fetch(service.endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const endTime = Date.now()

      const isSuccess = response.ok
      setServices(prev => prev.map((s, i) => 
        i === index ? {
          ...s,
          status: isSuccess ? 'passed' : 'failed',
          message: isSuccess ? 'Service responding' : `HTTP ${response.status}`,
          responseTime: endTime - startTime
        } : s
      ))
    } catch (error) {
      setServices(prev => prev.map((s, i) => 
        i === index ? {
          ...s,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Connection failed'
        } : s
      ))
    }
  }

  const testAllServices = async () => {
    setGlobalStatus('testing')
    
    for (let i = 0; i < services.length; i++) {
      await testService(services[i], i)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setGlobalStatus('completed')
  }

  const resetTests = () => {
    setServices(prev => prev.map(s => ({
      ...s,
      status: 'idle',
      message: undefined,
      responseTime: undefined
    })))
    setGlobalStatus('idle')
  }

  const getStatusIcon = (status: ServiceTest['status']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: ServiceTest['status']) => {
    switch (status) {
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="outline">Ready</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quantum ML Service Tests</h1>
        <p className="text-gray-600">Test quantum machine learning service connectivity and performance</p>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Test Controls
            </CardTitle>
            <CardDescription>
              Run comprehensive tests on all quantum ML services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={testAllServices}
                disabled={globalStatus === 'testing'}
                className="flex items-center gap-2"
              >
                {globalStatus === 'testing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing Services...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={resetTests}
                disabled={globalStatus === 'testing'}
              >
                Reset Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {services.map((service, index) => (
          <Card key={service.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </div>
                {getStatusBadge(service.status)}
              </div>
              <CardDescription>
                Endpoint: <code className="text-sm bg-gray-100 px-2 py-1 rounded">{service.endpoint}</code>
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {service.message && (
                    <p className={`text-sm ${
                      service.status === 'passed' ? 'text-green-600' : 
                      service.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {service.message}
                    </p>
                  )}
                  {service.responseTime && (
                    <p className="text-sm text-gray-500">
                      Response time: {service.responseTime}ms
                    </p>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testService(service, index)}
                  disabled={service.status === 'testing' || globalStatus === 'testing'}
                >
                  Test Individual
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {globalStatus === 'completed' && (
        <div className="mt-6">
          <Card className={`border-2 ${
            services.every(s => s.status === 'passed') 
              ? 'border-green-200 bg-green-50' 
              : 'border-yellow-200 bg-yellow-50'
          }`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Test Results Summary
                </h3>
                <p className="text-sm text-gray-600">
                  {services.filter(s => s.status === 'passed').length} of {services.length} services passed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}