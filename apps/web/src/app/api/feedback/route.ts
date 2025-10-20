import { NextRequest, NextResponse } from 'next/server';
import {
  FeedbackCollector,
  RewardModel,
  ActiveLearningEngine,
} from '@ailydian/rl-feedback';

// Global instances (in production: proper state management with Redis/DB)
const feedbackCollector = new FeedbackCollector();
const rewardModel = new RewardModel();
const activeLearning = new ActiveLearningEngine();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (action === 'thumbs_up') {
      const signal = feedbackCollector.thumbsUp(params);
      return NextResponse.json({ success: true, signal });
    }

    if (action === 'thumbs_down') {
      const signal = feedbackCollector.thumbsDown(params);
      return NextResponse.json({ success: true, signal });
    }

    if (action === 'star_rating') {
      const { rating, ...restParams } = params;
      const signal = feedbackCollector.starRating(restParams, rating);
      return NextResponse.json({ success: true, signal });
    }

    if (action === 'code_copied') {
      const signal = feedbackCollector.codeCopied(params);
      return NextResponse.json({ success: true, signal });
    }

    if (action === 'regenerated') {
      const signal = feedbackCollector.responseRegenerated(params);
      return NextResponse.json({ success: true, signal });
    }

    if (action === 'edited') {
      const { editedTo, ...restParams } = params;
      const signal = feedbackCollector.responseEdited(restParams, editedTo);
      return NextResponse.json({ success: true, signal });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');
    const messageId = searchParams.get('messageId');

    if (model) {
      // Get aggregation for specific model
      const aggregation = feedbackCollector.aggregateForModel(model);
      return NextResponse.json({ aggregation });
    }

    if (messageId) {
      // Get signals for specific message
      const signals = feedbackCollector.getSignalsForMessage(messageId);

      // Estimate reward
      const responseLength = signals[0]?.response?.length || 0;
      const reward = rewardModel.estimateReward(signals, responseLength);

      return NextResponse.json({ signals, reward });
    }

    // Get all aggregations
    const aggregations = feedbackCollector.getAllAggregations();
    return NextResponse.json({ aggregations });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
