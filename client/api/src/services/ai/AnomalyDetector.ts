/**
 * AI-Powered Meter Insights - Anomaly Detection Service
 * Detects anomalies in meter readings using statistical methods
 */

import { Anomaly, BaselineData, Reading } from './types';
import { getCache, generateBaselineCacheKey } from './cache';

/**
 * AnomalyDetector for identifying unusual patterns in meter readings
 */
export class AnomalyDetector {
  private cache = getCache();
  private baselineCacheTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  private stdDevThreshold = 2; // 2 standard deviations

  /**
   * Detects anomalies in meter readings
   */
  async detectAnomalies(
    deviceId: string,
    deviceName: string,
    readings: Reading[],
    historicalReadings: Reading[] = []
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    if (readings.length === 0) {
      return anomalies;
    }

    // Calculate baseline from historical data
    const baseline = this.calculateBaseline(deviceId, historicalReadings);

    if (!baseline) {
      return anomalies;
    }

    // Check each reading for anomalies
    for (const reading of readings) {
      const anomaly = this.checkReading(reading, baseline, deviceId, deviceName);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    // Detect pattern changes
    const patternAnomalies = this.detectPatternChanges(readings, baseline, deviceId, deviceName);
    anomalies.push(...patternAnomalies);

    return anomalies;
  }

  /**
   * Calculates baseline from historical data
   */
  private calculateBaseline(deviceId: string, historicalReadings: Reading[]): BaselineData | null {
    // Check cache first
    const cacheKey = generateBaselineCacheKey(deviceId);
    const cached = this.cache.get<BaselineData>(cacheKey);
    if (cached) {
      return cached;
    }

    if (historicalReadings.length < 30) {
      // Need at least 30 data points
      return null;
    }

    // Extract values
    const values = historicalReadings.map((r) => r.value);

    // Calculate statistics
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const baseline: BaselineData = {
      deviceId,
      tenantId: historicalReadings[0]?.tenantId || '',
      mean,
      stdDev,
      min,
      max,
      dataPoints: values.length,
      calculatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Cache the baseline
    this.cache.set(cacheKey, baseline, this.baselineCacheTtlMs);

    return baseline;
  }

  /**
   * Checks a single reading for anomalies
   */
  private checkReading(
    reading: Reading,
    baseline: BaselineData,
    deviceId: string,
    deviceName: string
  ): Anomaly | null {
    const { value } = reading;
    const { mean, stdDev } = baseline;

    // Check if value is outside normal range (mean ± 2σ)
    const lowerBound = mean - this.stdDevThreshold * stdDev;
    const upperBound = mean + this.stdDevThreshold * stdDev;

    if (value < lowerBound || value > upperBound) {
      const deviation = Math.abs(value - mean) / stdDev;
      const percentDiff = ((value - mean) / mean) * 100;

      let severity: 'low' | 'medium' | 'high' = 'low';
      if (deviation > 3) {
        severity = 'high';
      } else if (deviation > 2.5) {
        severity = 'medium';
      }

      const type = value > mean ? 'spike' : 'drop';

      return {
        deviceId,
        deviceName,
        type,
        severity,
        explanation: `Reading is ${Math.abs(percentDiff).toFixed(1)}% ${
          value > mean ? 'above' : 'below'
        } average (${mean.toFixed(2)})`,
        recommendation: `Consider investigating ${deviceName} for potential ${
          type === 'spike' ? 'overconsumption or malfunction' : 'underperformance'
        }`,
        detectedAt: reading.timestamp,
      };
    }

    return null;
  }

  /**
   * Detects pattern changes in readings
   */
  private detectPatternChanges(
    readings: Reading[],
    baseline: BaselineData,
    deviceId: string,
    deviceName: string
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (readings.length < 7) {
      return anomalies;
    }

    // Calculate average of recent readings
    const recentReadings = readings.slice(-7);
    const recentAvg = recentReadings.reduce((sum, r) => sum + r.value, 0) / recentReadings.length;

    // Compare to baseline
    const percentChange = ((recentAvg - baseline.mean) / baseline.mean) * 100;

    if (Math.abs(percentChange) > 50) {
      anomalies.push({
        deviceId,
        deviceName,
        type: 'pattern_change',
        severity: Math.abs(percentChange) > 100 ? 'high' : 'medium',
        explanation: `Consumption pattern has changed by ${Math.abs(percentChange).toFixed(1)}% over the last 7 readings`,
        recommendation: `Review recent changes to ${deviceName} usage patterns`,
        detectedAt: new Date().toISOString(),
      });
    }

    return anomalies;
  }

  /**
   * Detects threshold-based anomalies
   */
  detectThresholdAnomalies(
    deviceId: string,
    deviceName: string,
    readings: Reading[],
    threshold: number
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    for (const reading of readings) {
      if (reading.value > threshold) {
        anomalies.push({
          deviceId,
          deviceName,
          type: 'threshold_exceeded',
          severity: reading.value > threshold * 1.5 ? 'high' : 'medium',
          explanation: `Reading (${reading.value}) exceeds threshold (${threshold})`,
          recommendation: `Investigate high consumption on ${deviceName}`,
          detectedAt: reading.timestamp,
        });
      }
    }

    return anomalies;
  }

  /**
   * Clears baseline cache for a device
   */
  clearBaseline(deviceId: string): void {
    const cacheKey = generateBaselineCacheKey(deviceId);
    this.cache.delete(cacheKey);
  }

  /**
   * Gets baseline data for a device
   */
  getBaseline(deviceId: string): BaselineData | null {
    const cacheKey = generateBaselineCacheKey(deviceId);
    return this.cache.get<BaselineData>(cacheKey) || null;
  }
}
