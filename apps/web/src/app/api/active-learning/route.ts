import { NextRequest, NextResponse } from 'next/server';
import {
  FeedbackCollector,
  RewardModel,
  ActiveLearningEngine,
} from '@ailydian/rl-feedback';

// Global instances
const feedbackCollector = new FeedbackCollector();
const rewardModel = new RewardModel();
const activeLearning = new ActiveLearningEngine();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topN = parseInt(searchParams.get('top') || '10', 10);
    const minPriority = parseFloat(searchParams.get('minPriority') || '0.5');

    // Get all signals
    const aggregations = feedbackCollector.getAllAggregations();
    const allSignals: any[] = [];

    for (const agg of aggregations) {
      // This is simplified - in production, fetch from DB
      const signals = feedbackCollector.getSignalsForMessage('dummy');
      allSignals.push(...signals);
    }

    // Group by message and estimate rewards
    const signalsByMessage = new Map();
    const responseLengths = new Map();

    for (const signal of allSignals) {
      const existing = signalsByMessage.get(signal.messageId) || [];
      existing.push(signal);
      signalsByMessage.set(signal.messageId, existing);
      responseLengths.set(signal.messageId, signal.response?.length || 0);
    }

    const rewards = rewardModel.batchEstimate(signalsByMessage, responseLengths);

    // Identify labeling candidates
    let candidates = activeLearning.identifyCandidates(allSignals, rewards);

    // Filter by priority
    candidates = activeLearning.filterByPriority(candidates, minPriority);

    // Get top N
    const topCandidates = candidates.slice(0, topN);

    return NextResponse.json({
      total: candidates.length,
      returned: topCandidates.length,
      candidates: topCandidates,
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
    const { messageId, humanLabel } = await request.json();

    if (!messageId || humanLabel === undefined) {
      return NextResponse.json(
        { error: 'Missing messageId or humanLabel' },
        { status: 400 }
      );
    }

    // In production: Store human label in database for training
    console.log(`[Active Learning] Human label for ${messageId}: ${humanLabel}`);

    return NextResponse.json({
      success: true,
      messageId,
      humanLabel,
      message: 'Label recorded for future training',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
