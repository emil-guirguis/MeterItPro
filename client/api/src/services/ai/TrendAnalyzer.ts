/**
 * AI-Powered Meter Insights - Trend Analysis Service
 * Analyzes consumption trends using linear regression
 */

import { Trend, Reading, TrendAnalysisResult } from './types';

/**
 * TrendAnalyzer for identifying consumption trends
 */
export class TrendAnalyzer {
  /**
   * Analyzes trends in meter readings
   */
  analyzeTrends(
    deviceId: string,
    deviceName: string,
    readings: Reading[],
    period: string = 'month'
  ): Trend {
    if (readings.length < 2) {
      return {
        deviceId,
        deviceName,
        direction: 'stable',
        percentChange: 0,
        period,
      };
    }

    // Perform linear regression
    const regression = this.linearRegression(readings);

    // Determine trend direction
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (regression.slope > 0.01) {
      direction = 'increasing';
    } else if (regression.slope < -0.01) {
      direction = 'decreasing';
    }

    // Calculate percent change
    const firstValue = readings[0].value;
    const lastValue = readings[readings.length - 1].value;
    const percentChange = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    return {
      deviceId,
      deviceName,
      direction,
      percentChange,
      period,
    };
  }

  /**
   * Performs linear regression on readings
   */
  private linearRegression(readings: Reading[]): TrendAnalysisResult {
    const n = readings.length;
    const values = readings.map((r) => r.value);

    // Calculate x values (0, 1, 2, ...)
    const x = Array.from({ length: n }, (_, i) => i);

    // Calculate means
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (values[i] - yMean);
      denominator += (x[i] - xMean) * (x[i] - xMean);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate R-squared
    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept;
      ssRes += Math.pow(values[i] - predicted, 2);
      ssTot += Math.pow(values[i] - yMean, 2);
    }

    const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

    return {
      deviceId: readings[0]?.meterId || '',
      deviceName: '',
      direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      percentChange: 0,
      slope,
      rSquared,
      period: 'month',
    };
  }

  /**
   * Compares trends between two periods
   */
  compareTrends(
    readings1: Reading[],
    readings2: Reading[]
  ): { comparison: 'accelerating' | 'decelerating' | 'stable'; change: number } {
    const trend1 = this.linearRegression(readings1);
    const trend2 = this.linearRegression(readings2);

    const slopeChange = trend2.slope - trend1.slope;
    let comparison: 'accelerating' | 'decelerating' | 'stable' = 'stable';

    if (slopeChange > 0.01) {
      comparison = 'accelerating';
    } else if (slopeChange < -0.01) {
      comparison = 'decelerating';
    }

    return {
      comparison,
      change: slopeChange,
    };
  }

  /**
   * Forecasts future consumption based on trend
   */
  forecast(readings: Reading[], periods: number = 7): number[] {
    if (readings.length < 2) {
      return Array(periods).fill(readings[0]?.value || 0);
    }

    const regression = this.linearRegression(readings);
    const forecast: number[] = [];

    for (let i = 0; i < periods; i++) {
      const x = readings.length + i;
      const predicted = regression.slope * x + (readings[0].value - regression.slope * 0);
      forecast.push(Math.max(0, predicted)); // Ensure non-negative
    }

    return forecast;
  }

  /**
   * Calculates moving average
   */
  movingAverage(readings: Reading[], windowSize: number = 7): number[] {
    const values = readings.map((r) => r.value);
    const averages: number[] = [];

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = values.slice(start, i + 1);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;
      averages.push(avg);
    }

    return averages;
  }

  /**
   * Calculates volatility (standard deviation of changes)
   */
  calculateVolatility(readings: Reading[]): number {
    if (readings.length < 2) {
      return 0;
    }

    const values = readings.map((r) => r.value);
    const changes: number[] = [];

    for (let i = 1; i < values.length; i++) {
      changes.push(values[i] - values[i - 1]);
    }

    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / changes.length;

    return Math.sqrt(variance);
  }
}
