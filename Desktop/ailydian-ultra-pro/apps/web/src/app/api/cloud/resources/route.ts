import { NextRequest, NextResponse } from 'next/server';
import {
  MultiCloudAutoscaler,
  AWSAdapter,
  GCPAdapter,
  GPUType,
} from '@ailydian/multi-cloud';

// Global autoscaler instance (in production: proper state management)
let autoscaler: MultiCloudAutoscaler | null = null;

function getAutoscaler(): MultiCloudAutoscaler {
  if (!autoscaler) {
    autoscaler = new MultiCloudAutoscaler({
      policy: {
        minInstances: 0,
        maxInstances: 10,
        targetGpuUtilization: 70,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
        cooldownSeconds: 300, // 5 minutes
      },
      providers: [new AWSAdapter(), new GCPAdapter()],
      preferredRegions: ['us-east-1', 'us-west-2', 'us-central1'],
      gpuType: GPUType.T4,
      useSpot: true,
    });
  }
  return autoscaler;
}

export async function GET() {
  try {
    const scaler = getAutoscaler();
    const status = scaler.getStatus();
    const instances = scaler.getInstances();

    return NextResponse.json({
      status,
      instances: instances.map((i) => ({
        id: i.id,
        provider: i.provider,
        region: i.region,
        gpuType: i.gpuType,
        gpuCount: i.gpuCount,
        status: i.status,
        hourlyRate: i.hourlyRate,
        createdAt: i.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, metrics } = await request.json();

    const scaler = getAutoscaler();

    if (action === 'evaluate') {
      // Evaluate scaling decision
      const decision = await scaler.evaluateScaling(metrics || []);
      return NextResponse.json({ decision });
    }

    if (action === 'scale') {
      // Execute scaling
      const decision = await scaler.evaluateScaling(metrics || []);
      await scaler.executeScaling(decision);

      const status = scaler.getStatus();
      return NextResponse.json({
        success: true,
        decision,
        status,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "evaluate" or "scale"' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
