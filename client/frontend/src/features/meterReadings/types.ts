/**
 * Meter Reading Form - Type Definitions
 * 
 * Core TypeScript interfaces for the meter reading form feature
 */

/**
 * GraphDataPoint represents a single data point in a consumption/demand/emissions graph
 */
export interface GraphDataPoint {
  timestamp: Date;
  value: number;
  unit: string;
}

/**
 * MeterElement represents a logical grouping within a meter
 * (e.g., Total Consumption)
 */
export interface MeterElement {
  id: string;
  meterId: string;
  name: string;
  type: 'consumption' | 'generation';
}

/**
 * Meter represents a physical device that measures energy consumption/generation
 */
export interface Meter {
  id: string;
  driver: string;
  description: string;
  serialNumber: string;
  elements: MeterElement[];
  meterName?: string;
  elementName?: string;
  elementNumber?: string | number;
}

/**
 * ReadingMetric represents a single metric value with phase breakdowns
 */
export interface ReadingMetric {
  overall: number | null;
  phase1: number | null;
  phase2: number | null;
  phase3: number | null;
  unit: string;
}

/**
 * ReadingSection represents a logical section of reading values
 * (e.g., Total Consumption)
 */
export interface ReadingSection {
  name: string;
  metrics: {
    [metricName: string]: ReadingMetric;
  };
}

/**
 * MeterReading represents a snapshot of values from a meter element at a specific time
 */
export interface MeterReading {
  id: string;
  meterElementId: string;
  timestamp: Date;
  frequency: number; // Hz
  sections: {
    [sectionName: string]: {
      [metricName: string]: ReadingMetric;
    };
  };
}

/**
 * MeterReadingFormState represents the internal state of the MeterReadingForm component
 */
export interface MeterReadingFormState {
  lastReading: MeterReading | null;
  graphData: GraphDataPoint[];
  selectedTimePeriod: 'today' | 'weekly' | 'monthly' | 'yearly';
  selectedGraphType: 'consumption' | 'demand' ;
  isLoading: boolean;
  error: Error | null;
}

/**
 * MeterReadingFormProps represents the props for the MeterReadingForm component
 */
export interface MeterReadingFormProps {
  meterElementId: string;
  onNavigateToList?: () => void;
}
