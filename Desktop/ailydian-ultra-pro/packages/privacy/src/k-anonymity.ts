/**
 * K-Anonymity Engine
 *
 * Ensures each record is indistinguishable from at least k-1 other records
 * Implements:
 * - Generalization (age -> age range)
 * - Suppression (remove identifying values)
 * - K-anonymity verification
 * - L-diversity (optional extension)
 */

export interface QuasiIdentifier {
  field: string;
  type: 'numeric' | 'categorical' | 'date';
}

export interface GeneralizationRule {
  field: string;
  method: 'range' | 'category' | 'suppression';
  params?: any;
}

export interface AnonymizationResult<T> {
  data: T[];
  k: number;
  wasGeneralized: boolean;
  suppressedRecords: number;
}

export class KAnonymityEngine {
  /**
   * Verify if dataset satisfies k-anonymity
   */
  verifyKAnonymity<T>(
    data: T[],
    quasiIdentifiers: QuasiIdentifier[],
    k: number
  ): { satisfies: boolean; minGroupSize: number } {
    // Group records by quasi-identifier combinations
    const groups = this.groupByQuasiIdentifiers(data, quasiIdentifiers);

    // Find smallest group
    const groupSizes = Array.from(groups.values()).map(g => g.length);
    const minGroupSize = Math.min(...groupSizes);

    return {
      satisfies: minGroupSize >= k,
      minGroupSize,
    };
  }

  /**
   * Achieve k-anonymity through generalization and suppression
   */
  anonymize<T>(
    data: T[],
    quasiIdentifiers: QuasiIdentifier[],
    k: number,
    rules: GeneralizationRule[]
  ): AnonymizationResult<T> {
    let anonymizedData = [...data];
    let wasGeneralized = false;
    let suppressedRecords = 0;

    // Apply generalization rules
    for (const rule of rules) {
      anonymizedData = this.applyGeneralization(anonymizedData, rule);
      wasGeneralized = true;
    }

    // Check if k-anonymity is satisfied
    const { satisfies, minGroupSize } = this.verifyKAnonymity(
      anonymizedData,
      quasiIdentifiers,
      k
    );

    // If still not satisfied, suppress records
    if (!satisfies) {
      const { data: suppressed, count } = this.suppressSmallGroups(
        anonymizedData,
        quasiIdentifiers,
        k
      );
      anonymizedData = suppressed;
      suppressedRecords = count;
    }

    return {
      data: anonymizedData,
      k: Math.min(k, minGroupSize),
      wasGeneralized,
      suppressedRecords,
    };
  }

  /**
   * Apply generalization rule to dataset
   */
  private applyGeneralization<T>(data: T[], rule: GeneralizationRule): T[] {
    return data.map(record => {
      const newRecord = { ...record };
      const value = (record as any)[rule.field];

      switch (rule.method) {
        case 'range':
          // Numeric generalization (e.g., 25 -> "20-30")
          if (typeof value === 'number') {
            const rangeSize = rule.params?.rangeSize || 10;
            const lower = Math.floor(value / rangeSize) * rangeSize;
            const upper = lower + rangeSize;
            (newRecord as any)[rule.field] = `${lower}-${upper}`;
          }
          break;

        case 'category':
          // Categorical generalization (e.g., "Engineer" -> "Tech")
          if (rule.params?.mapping) {
            (newRecord as any)[rule.field] =
              rule.params.mapping[value] || value;
          }
          break;

        case 'suppression':
          // Complete suppression
          (newRecord as any)[rule.field] = '*';
          break;
      }

      return newRecord;
    });
  }

  /**
   * Suppress records in groups smaller than k
   */
  private suppressSmallGroups<T>(
    data: T[],
    quasiIdentifiers: QuasiIdentifier[],
    k: number
  ): { data: T[]; count: number } {
    const groups = this.groupByQuasiIdentifiers(data, quasiIdentifiers);

    const validRecords: T[] = [];
    let suppressedCount = 0;

    for (const group of groups.values()) {
      if (group.length >= k) {
        validRecords.push(...group);
      } else {
        suppressedCount += group.length;
      }
    }

    return { data: validRecords, count: suppressedCount };
  }

  /**
   * Group records by quasi-identifier values
   */
  private groupByQuasiIdentifiers<T>(
    data: T[],
    quasiIdentifiers: QuasiIdentifier[]
  ): Map<string, T[]> {
    const groups = new Map<string, T[]>();

    for (const record of data) {
      // Create key from quasi-identifier values
      const key = quasiIdentifiers
        .map(qi => String((record as any)[qi.field]))
        .join('|');

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    }

    return groups;
  }

  /**
   * Verify L-diversity (extension of k-anonymity)
   * Ensures at least L distinct values for sensitive attribute in each group
   */
  verifyLDiversity<T>(
    data: T[],
    quasiIdentifiers: QuasiIdentifier[],
    sensitiveAttribute: string,
    l: number
  ): { satisfies: boolean; minDiversity: number } {
    const groups = this.groupByQuasiIdentifiers(data, quasiIdentifiers);

    let minDiversity = Infinity;

    for (const group of groups.values()) {
      const distinctValues = new Set(
        group.map(record => (record as any)[sensitiveAttribute])
      );
      minDiversity = Math.min(minDiversity, distinctValues.size);
    }

    return {
      satisfies: minDiversity >= l,
      minDiversity,
    };
  }
}
