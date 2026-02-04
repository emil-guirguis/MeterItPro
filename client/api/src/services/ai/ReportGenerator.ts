/**
 * AI-Powered Meter Insights - Report Generator Service
 * Generates PDF and Excel reports from meter data
 */

import { ReportRequest, Report, Device, Meter, Reading, ParsedQuery } from './types';
import { QueryParser } from './QueryParser';
import { InvalidQueryError, PermissionDeniedError } from './errors';
import { getAIServiceConfig } from './config';

/**
 * ReportGenerator for creating formatted reports
 */
export class ReportGenerator {
  private queryParser: QueryParser;
  private reportTimeoutMs: number;
  private reportRetentionDays: number;

  constructor() {
    const config = getAIServiceConfig();
    this.queryParser = new QueryParser();
    this.reportTimeoutMs = config.reportTimeoutMs;
    this.reportRetentionDays = config.reportRetentionDays;
  }

  /**
   * Generates a report from a natural language request
   */
  async generateReport(
    request: ReportRequest,
    userId: string,
    devices: Device[],
    readings: Map<string, Reading[]>,
    userPermissions: string[] = []
  ): Promise<Report> {
    // Parse the report request
    const parsed = await this.queryParser.parseQuery(request.query, 'report');

    // Validate user permissions
    this.validatePermissions(parsed, userPermissions);

    // Filter devices based on parsed query
    const filteredDevices = this.filterDevices(devices, parsed, request.tenantId);

    // Prepare report data
    const reportData = this.prepareReportData(filteredDevices, readings, parsed);

    // Create report record
    const report: Report = {
      id: this.generateReportId(),
      tenantId: request.tenantId,
      userId,
      query: request.query,
      format: request.format,
      status: 'queued',
      createdAt: new Date().toISOString(),
      expiresAt: this.calculateExpirationDate(),
    };

    return report;
  }

  /**
   * Validates user permissions for report data
   */
  private validatePermissions(parsed: ParsedQuery, userPermissions: string[]): void {
    // Check if user has permission to access the requested scope
    if (parsed.scope !== 'all' && !userPermissions.includes(parsed.scope)) {
      throw new PermissionDeniedError(
        `You do not have permission to access ${parsed.scope} data`
      );
    }
  }

  /**
   * Filters devices based on parsed query
   */
  private filterDevices(devices: Device[], parsed: ParsedQuery, tenantId: string): Device[] {
    let filtered = devices.filter((d) => d.tenantId === tenantId);

    // Filter by device type
    if (parsed.filters.deviceTypes && parsed.filters.deviceTypes.length > 0) {
      filtered = filtered.filter((d) =>
        parsed.filters.deviceTypes?.some((type) =>
          d.type.toLowerCase().includes(type.toLowerCase())
        )
      );
    }

    // Filter by location
    if (parsed.filters.locations && parsed.filters.locations.length > 0) {
      filtered = filtered.filter((d) => {
        const hierarchy = d.locationHierarchy || [];
        const location = d.location || '';

        return parsed.filters.locations?.some((loc) => {
          const locLower = loc.toLowerCase();
          return (
            location.toLowerCase().includes(locLower) ||
            hierarchy.some((h) => h.toLowerCase().includes(locLower))
          );
        });
      });
    }

    return filtered;
  }

  /**
   * Prepares report data
   */
  private prepareReportData(
    devices: Device[],
    readings: Map<string, Reading[]>,
    parsed: ParsedQuery
  ): any {
    const reportData: any = {
      devices: [],
      metrics: {},
      summary: {},
    };

    // Prepare device data
    for (const device of devices) {
      const deviceReadings = readings.get(device.id) || [];
      const totalConsumption = deviceReadings.reduce((sum, r) => sum + r.value, 0);

      reportData.devices.push({
        id: device.id,
        name: device.name,
        type: device.type,
        location: device.location,
        consumption: totalConsumption,
        readingCount: deviceReadings.length,
      });
    }

    // Calculate metrics
    if (parsed.metrics) {
      reportData.metrics = this.calculateMetrics(parsed.metrics, devices, readings);
    }

    // Generate summary
    reportData.summary = this.generateSummary(reportData.devices);

    return reportData;
  }

  /**
   * Calculates requested metrics
   */
  private calculateMetrics(
    metrics: string[],
    devices: Device[],
    readings: Map<string, Reading[]>
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const metric of metrics) {
      switch (metric) {
        case 'top_consumers':
          result.topConsumers = this.calculateTopConsumers(devices, readings);
          break;
        case 'anomalies':
          result.anomalies = this.detectAnomalies(devices, readings);
          break;
        case 'trends':
          result.trends = this.calculateTrends(devices, readings);
          break;
        case 'consumption':
          result.totalConsumption = this.calculateTotalConsumption(devices, readings);
          break;
        case 'usage':
          result.usageStats = this.calculateUsageStats(devices, readings);
          break;
      }
    }

    return result;
  }

  /**
   * Calculates top consumers
   */
  private calculateTopConsumers(
    devices: Device[],
    readings: Map<string, Reading[]>
  ): Array<{ name: string; consumption: number }> {
    const consumers = devices
      .map((d) => ({
        name: d.name,
        consumption: (readings.get(d.id) || []).reduce((sum, r) => sum + r.value, 0),
      }))
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 10);

    return consumers;
  }

  /**
   * Detects anomalies
   */
  private detectAnomalies(
    devices: Device[],
    readings: Map<string, Reading[]>
  ): Array<{ device: string; type: string; value: number }> {
    const anomalies: Array<{ device: string; type: string; value: number }> = [];

    for (const device of devices) {
      const deviceReadings = readings.get(device.id) || [];
      if (deviceReadings.length < 2) continue;

      const values = deviceReadings.map((r) => r.value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      for (const reading of deviceReadings) {
        if (Math.abs(reading.value - mean) > 2 * stdDev) {
          anomalies.push({
            device: device.name,
            type: reading.value > mean ? 'spike' : 'drop',
            value: reading.value,
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Calculates trends
   */
  private calculateTrends(
    devices: Device[],
    readings: Map<string, Reading[]>
  ): Array<{ device: string; trend: string; change: number }> {
    const trends: Array<{ device: string; trend: string; change: number }> = [];

    for (const device of devices) {
      const deviceReadings = readings.get(device.id) || [];
      if (deviceReadings.length < 2) continue;

      const values = deviceReadings.map((r) => r.value);
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      const change = ((secondAvg - firstAvg) / firstAvg) * 100;
      const trend = change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable';

      trends.push({
        device: device.name,
        trend,
        change,
      });
    }

    return trends;
  }

  /**
   * Calculates total consumption
   */
  private calculateTotalConsumption(
    devices: Device[],
    readings: Map<string, Reading[]>
  ): number {
    let total = 0;

    for (const device of devices) {
      const deviceReadings = readings.get(device.id) || [];
      total += deviceReadings.reduce((sum, r) => sum + r.value, 0);
    }

    return total;
  }

  /**
   * Calculates usage statistics
   */
  private calculateUsageStats(
    devices: Device[],
    readings: Map<string, Reading[]>
  ): Record<string, number> {
    const stats: Record<string, number> = {
      totalDevices: devices.length,
      activeDevices: 0,
      totalReadings: 0,
      averageConsumption: 0,
    };

    let totalConsumption = 0;

    for (const device of devices) {
      const deviceReadings = readings.get(device.id) || [];
      if (deviceReadings.length > 0) {
        stats.activeDevices++;
        stats.totalReadings += deviceReadings.length;
        totalConsumption += deviceReadings.reduce((sum, r) => sum + r.value, 0);
      }
    }

    stats.averageConsumption =
      stats.activeDevices > 0 ? totalConsumption / stats.activeDevices : 0;

    return stats;
  }

  /**
   * Generates report summary
   */
  private generateSummary(devices: any[]): Record<string, any> {
    const totalConsumption = devices.reduce((sum, d) => sum + d.consumption, 0);
    const avgConsumption = devices.length > 0 ? totalConsumption / devices.length : 0;

    return {
      totalDevices: devices.length,
      totalConsumption,
      averageConsumption: avgConsumption,
      highestConsumer: devices.length > 0 ? devices[0] : null,
    };
  }

  /**
   * Generates a unique report ID
   */
  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculates report expiration date
   */
  private calculateExpirationDate(): string {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + this.reportRetentionDays);
    return expirationDate.toISOString();
  }

  /**
   * Formats report as PDF (placeholder)
   */
  async formatAsPDF(reportData: any): Promise<Buffer> {
    // This would use a library like PDFKit to generate PDF
    // For now, return a placeholder
    return Buffer.from('PDF content placeholder');
  }

  /**
   * Formats report as Excel (placeholder)
   */
  async formatAsExcel(reportData: any): Promise<Buffer> {
    // This would use a library like ExcelJS to generate Excel
    // For now, return a placeholder
    return Buffer.from('Excel content placeholder');
  }

  /**
   * Encrypts report data
   */
  encryptReport(data: Buffer): Buffer {
    // This would use a library like crypto to encrypt
    // For now, return the data as-is
    return data;
  }

  /**
   * Decrypts report data
   */
  decryptReport(data: Buffer): Buffer {
    // This would use a library like crypto to decrypt
    // For now, return the data as-is
    return data;
  }
}
