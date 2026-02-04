/**
 * AI-Powered Meter Insights - Insights Service
 * Generates dashboard insights including anomalies, trends, and recommendations
 */

import { InsightsRequest, Anomaly, Trend, Device, Meter, Reading } from './types';
import { AnomalyDetector } from './AnomalyDetector';
import { TrendAnalyzer } from './TrendAnalyzer';
import { getCache, generateInsightsCacheKey } from './cache';
import { getAIServiceConfig } from './config';
import { InsufficientDataError } from './errors';

/**
 * InsightsService for generating dashboard insights
 */
export class InsightsService {
  private anomalyDetector: AnomalyDetector;
  private trendAnalyzer: TrendAnalyzer;
  private cache = getCache();
  private cacheInsightsTtlMs: number;
  private minDataPoints = 30; // Minimum data points for insights

  constructor() {
    const config = getAIServiceConfig();
    this.anomalyDetector = new AnomalyDetector();
    this.trendAnalyzer = new TrendAnalyzer();
    this.cacheInsightsTtlMs = config.cacheInsightsTtlMs;
  }

  /**
   * Generates dashboard insights
   */
  async generateInsights(
    request: InsightsRequest,
    devices: Device[],
    readings: Map<string, Reading[]>,
    forceRefresh: boolean = false
  ): Promise<{
    topConsumers: Array<{
      deviceId: string;
      deviceName: string;
      consumption: number;
      unit: string;
      percentOfTotal: number;
    }>;
    anomalies: Anomaly[];
    trends: Trend[];
    recommendations: string[];
    dataPeriod: { start: string; end: string };
    dataQuality: 'sufficient' | 'insufficient';
  }> {
    // Check cache if not forcing refresh
    if (!forceRefresh) {
      const cacheKey = generateInsightsCacheKey(request.tenantId, request.period || 'month');
      const cached = this.cache.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Filter devices by tenant
    const tenantDevices = devices.filter((d) => d.tenantId === request.tenantId);

    if (tenantDevices.length === 0) {
      throw new InsufficientDataError('No devices found for tenant');
    }

    // Check data quality
    const dataQuality = this.checkDataQuality(tenantDevices, readings);

    // Calculate top consumers
    const topConsumers = this.calculateTopConsumers(tenantDevices, readings);

    // Detect anomalies
    const anomalies = await this.detectAnomalies(tenantDevices, readings);

    // Analyze trends
    const trends = this.analyzeTrends(tenantDevices, readings, request.period || 'month');

    // Generate recommendations
    const recommendations = this.generateRecommendations(anomalies, trends, topConsumers);

    // Calculate data period
    const dataPeriod = this.calculateDataPeriod(request.period || 'month');

    const result = {
      topConsumers,
      anomalies,
      trends,
      recommendations,
      dataPeriod,
      dataQuality,
    };

    // Cache the result
    const cacheKey = generateInsightsCacheKey(request.tenantId, request.period || 'month');
    this.cache.set(cacheKey, result, this.cacheInsightsTtlMs);

    return result;
  }

  /**
   * Checks data quality for insights generation
   */
  private checkDataQuality(
    devices: Device[],
    readings: Map<string, Reading[]>
  ): 'sufficient' | 'insufficient' {
    let deviceCount = 0;

    for (const device of devices) {
      const deviceReadings = readings.get(device.id) || [];
      if (deviceReadings.length >= this.minDataPoints) {
        deviceCount++;
      }
    }

    // Need at least 50% of devices with sufficient data
    return deviceCount >= devices.length * 0.5 ? 'sufficient' : 'insufficient';
  }

  /**
   * Calculates top consuming devices
   */
  private calculateTopConsumers(
    devices: Device[],
    readings: Map<string, Reading[]>
  ): Array<{
    deviceId: string;
    deviceName: string;
    consumption: number;
    unit: string;
    percentOfTotal: number;
  }> {
    const consumptions: Array<{
      deviceId: string;
      deviceName: string;
      consumption: number;
      unit: string;
    }> = [];

    let totalConsumption = 0;

    for (const device of devices) {
      const deviceReadings = readings.get(device.id) || [];
      const consumption = deviceReadings.reduce((sum, r) => sum + r.value, 0);

      if (consumption > 0) {
        consumptions.push({
          deviceId: device.id,
          deviceName: device.name,
          consumption,
          unit: 'kWh', // TODO: Get from meter metadata
        });
        totalConsumption += consumption;
      }
    }

    // Sort by consumption and take top 5
    return consumptions
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        percentOfTotal: totalConsumption > 0 ? (item.consumption / totalConsumption) * 100 : 0,
      }));
  }

  /**
   * Detects anomalies across all devices
   */
  private async detectAnomalies(
    devices: Device[],
    readings: Map<string, Reading[]>
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    for (const device of devices) {
      const deviceReadings = readings.get(device.id) || [];

      if (deviceReadings.length >= this.minDataPoints) {
        const deviceAnomalies = await this.anomalyDetector.detectAnomalies(
          device.id,
          device.name,
          deviceReadings.slice(-7), // Last 7 readings
          deviceReadings // Historical data
        );

        anomalies.push(...deviceAnomalies);
      }
    }

    return anomalies.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Analyzes trends across all devices
   */
  private analyzeTrends(
    devices: Device[],
    readings: Map<string, Reading[]>,
    period: string
  ): Trend[] {
    const trends: Trend[] = [];

    for (const device of devices) {
      const deviceReadings = readings.get(device.id) || [];

      if (deviceReadings.length >= 2) {
        const trend = this.trendAnalyzer.analyzeTrends(device.id, device.name, deviceReadings, period);
        trends.push(trend);
      }
    }

    return trends;
  }

  /**
   * Generates recommendations based on insights
   */
  private generateRecommendations(
    anomalies: Anomaly[],
    trends: Trend[],
    topConsumers: Array<{ deviceId: string; deviceName: string; consumption: number }>
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations based on anomalies
    const highSeverityAnomalies = anomalies.filter((a) => a.severity === 'high');
    if (highSeverityAnomalies.length > 0) {
      recommendations.push(
        `Investigate ${highSeverityAnomalies.length} high-severity anomalies detected in your devices`
      );
    }

    // Recommendations based on trends
    const increasingTrends = trends.filter((t) => t.direction === 'increasing');
    if (increasingTrends.length > 0) {
      recommendations.push(
        `${increasingTrends.length} devices show increasing consumption trends - consider optimization`
      );
    }

    // Recommendations based on top consumers
    if (topConsumers.length > 0) {
      const topDevice = topConsumers[0];
      recommendations.push(
        `${topDevice.deviceName} is your highest consumer - review its usage patterns`
      );
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('All systems operating normally - continue monitoring');
    }

    return recommendations;
  }

  /**
   * Calculates data period based on period string
   */
  private calculateDataPeriod(period: string): { start: string; end: string } {
    const now = new Date();
    let start: Date;

    switch (period) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(now.getMonth());
        start.setDate(1);
        break;
      case 'year':
        start = new Date(now);
        start.setMonth(0);
        start.setDate(1);
        break;
      default:
        start = new Date(now);
        start.setMonth(now.getMonth());
        start.setDate(1);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  }

  /**
   * Clears insights cache for a tenant
   */
  clearTenantCache(tenantId: string): void {
    const periods = ['today', 'week', 'month', 'year'];
    periods.forEach((period) => {
      const cacheKey = generateInsightsCacheKey(tenantId, period);
      this.cache.delete(cacheKey);
    });
  }
}
