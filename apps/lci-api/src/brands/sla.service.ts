// LCI API - SLA Service
// White-hat: SLA tracking and metrics

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  // SLA targets (in hours)
  private readonly SLA_TARGETS = {
    FIRST_RESPONSE: 24, // First response within 24 hours
    RESOLUTION: 72, // Resolution within 72 hours (3 days)
    CRITICAL: 4, // Critical complaints: 4 hours first response
  };

  /**
   * Calculates time elapsed since complaint was published
   * Returns duration in hours
   */
  calculateElapsedTime(publishedAt: Date): number {
    const now = new Date();
    const elapsed = now.getTime() - publishedAt.getTime();
    return elapsed / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Calculates response time between complaint and first brand response
   * Returns duration in hours
   */
  calculateResponseTime(publishedAt: Date, respondedAt: Date): number {
    const elapsed = respondedAt.getTime() - publishedAt.getTime();
    return elapsed / (1000 * 60 * 60);
  }

  /**
   * Checks if first response SLA is breached
   */
  isFirstResponseBreached(
    publishedAt: Date,
    severity: string,
    hasResponse: boolean,
  ): {
    breached: boolean;
    elapsedHours: number;
    targetHours: number;
    remainingHours: number;
  } {
    const elapsedHours = this.calculateElapsedTime(publishedAt);
    const targetHours =
      severity === 'CRITICAL'
        ? this.SLA_TARGETS.CRITICAL
        : this.SLA_TARGETS.FIRST_RESPONSE;

    const breached = !hasResponse && elapsedHours > targetHours;
    const remainingHours = Math.max(0, targetHours - elapsedHours);

    return {
      breached,
      elapsedHours: Math.round(elapsedHours * 10) / 10,
      targetHours,
      remainingHours: Math.round(remainingHours * 10) / 10,
    };
  }

  /**
   * Checks if resolution SLA is breached
   */
  isResolutionBreached(
    publishedAt: Date,
    state: string,
  ): {
    breached: boolean;
    elapsedHours: number;
    targetHours: number;
    remainingHours: number;
  } {
    const elapsedHours = this.calculateElapsedTime(publishedAt);
    const targetHours = this.SLA_TARGETS.RESOLUTION;

    // Only breached if not yet resolved
    const unresolvedStates = ['OPEN', 'IN_PROGRESS', 'ESCALATED'];
    const breached =
      unresolvedStates.includes(state) && elapsedHours > targetHours;
    const remainingHours = Math.max(0, targetHours - elapsedHours);

    return {
      breached,
      elapsedHours: Math.round(elapsedHours * 10) / 10,
      targetHours,
      remainingHours: Math.round(remainingHours * 10) / 10,
    };
  }

  /**
   * Calculates SLA metrics for a complaint
   */
  calculateSlaMetrics(complaint: {
    publishedAt: Date | null;
    severity: string;
    state: string;
    responses?: Array<{ createdAt: Date }>;
  }): {
    firstResponse: {
      breached: boolean;
      elapsedHours: number;
      targetHours: number;
      remainingHours: number;
      respondedAt?: Date;
      responseTimeHours?: number;
    };
    resolution: {
      breached: boolean;
      elapsedHours: number;
      targetHours: number;
      remainingHours: number;
    };
    overallStatus: 'GREEN' | 'YELLOW' | 'RED';
  } {
    // Cannot calculate SLA for draft complaints
    if (!complaint.publishedAt) {
      return {
        firstResponse: {
          breached: false,
          elapsedHours: 0,
          targetHours: this.SLA_TARGETS.FIRST_RESPONSE,
          remainingHours: this.SLA_TARGETS.FIRST_RESPONSE,
        },
        resolution: {
          breached: false,
          elapsedHours: 0,
          targetHours: this.SLA_TARGETS.RESOLUTION,
          remainingHours: this.SLA_TARGETS.RESOLUTION,
        },
        overallStatus: 'GREEN',
      };
    }

    const hasResponse = !!(complaint.responses && complaint.responses.length > 0);
    const firstResponse: any = this.isFirstResponseBreached(
      complaint.publishedAt,
      complaint.severity,
      hasResponse,
    );

    // If there's a response, calculate response time
    if (hasResponse && complaint.responses) {
      const firstResponseDate = complaint.responses[0].createdAt;
      const responseTimeHours = this.calculateResponseTime(
        complaint.publishedAt,
        firstResponseDate,
      );
      firstResponse.respondedAt = firstResponseDate;
      firstResponse.responseTimeHours =
        Math.round(responseTimeHours * 10) / 10;
    }

    const resolution = this.isResolutionBreached(
      complaint.publishedAt,
      complaint.state,
    );

    // Determine overall status
    let overallStatus: 'GREEN' | 'YELLOW' | 'RED';
    if (firstResponse.breached || resolution.breached) {
      overallStatus = 'RED'; // SLA breached
    } else if (
      firstResponse.remainingHours < 4 ||
      resolution.remainingHours < 12
    ) {
      overallStatus = 'YELLOW'; // Warning: SLA at risk
    } else {
      overallStatus = 'GREEN'; // SLA healthy
    }

    return {
      firstResponse,
      resolution,
      overallStatus,
    };
  }

  /**
   * Calculates brand-level SLA statistics
   */
  calculateBrandStats(complaints: Array<{
    publishedAt: Date | null;
    severity: string;
    state: string;
    responses?: Array<{ createdAt: Date }>;
  }>): {
    totalComplaints: number;
    openComplaints: number;
    resolvedComplaints: number;
    slaBreaches: number;
    slaCompliance: number;
    avgResponseTimeHours: number;
    avgResolutionTimeHours: number;
  } {
    const publishedComplaints = complaints.filter((c) => c.publishedAt);

    let slaBreaches = 0;
    let totalResponseTime = 0;
    let responseCount = 0;
    let totalResolutionTime = 0;
    let resolutionCount = 0;

    publishedComplaints.forEach((complaint) => {
      const metrics = this.calculateSlaMetrics(complaint);

      // Count breaches
      if (metrics.firstResponse.breached || metrics.resolution.breached) {
        slaBreaches++;
      }

      // Calculate response time
      if (metrics.firstResponse.responseTimeHours !== undefined) {
        totalResponseTime += metrics.firstResponse.responseTimeHours;
        responseCount++;
      }

      // Calculate resolution time for resolved complaints
      if (['RESOLVED', 'REJECTED'].includes(complaint.state)) {
        totalResolutionTime += metrics.resolution.elapsedHours;
        resolutionCount++;
      }
    });

    const openComplaints = complaints.filter((c) =>
      ['OPEN', 'IN_PROGRESS', 'ESCALATED'].includes(c.state),
    ).length;
    const resolvedComplaints = complaints.filter((c) =>
      ['RESOLVED', 'REJECTED'].includes(c.state),
    ).length;

    const slaCompliance =
      publishedComplaints.length > 0
        ? Math.round(
            ((publishedComplaints.length - slaBreaches) /
              publishedComplaints.length) *
              100,
          )
        : 100;

    const avgResponseTimeHours =
      responseCount > 0
        ? Math.round((totalResponseTime / responseCount) * 10) / 10
        : 0;

    const avgResolutionTimeHours =
      resolutionCount > 0
        ? Math.round((totalResolutionTime / resolutionCount) * 10) / 10
        : 0;

    return {
      totalComplaints: complaints.length,
      openComplaints,
      resolvedComplaints,
      slaBreaches,
      slaCompliance,
      avgResponseTimeHours,
      avgResolutionTimeHours,
    };
  }
}
