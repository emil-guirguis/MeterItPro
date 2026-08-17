import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MeterCard from './MeterCard';
import type { Meter, MeterReading } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const meter: Meter = {
  meter_id: 1,
  name: 'Main Panel',
  device_id: 10,
  ip: '192.168.1.100',
  port: 47808,
  active: true,
  element: 'kwh',
};

const reading: MeterReading = {
  id: 1,
  meter_id: 1,
  timestamp: '2026-04-08T10:00:00.000Z',
  data_point: 'kwh',
  value: 123.45,
  unit: 'kWh',
  is_synchronized: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MeterCard', () => {
  it('renders the meter name', () => {
    render(<MeterCard meter={meter} isConnected={true} lastReading={undefined} readingCount={0} />);
    expect(screen.getByText('Main Panel')).toBeInTheDocument();
  });

  it('shows "Connected" chip when isConnected is true', () => {
    render(<MeterCard meter={meter} isConnected={true} lastReading={undefined} readingCount={0} />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows "Disconnected" chip when isConnected is false', () => {
    render(<MeterCard meter={meter} isConnected={false} lastReading={undefined} readingCount={0} />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('displays the BACnet IP address when provided', () => {
    render(<MeterCard meter={meter} isConnected={true} lastReading={undefined} readingCount={0} />);
    expect(screen.getByText(/192\.168\.1\.100/)).toBeInTheDocument();
  });

  it('does not display IP section when ip is null', () => {
    const noIpMeter = { ...meter, ip: null };
    render(<MeterCard meter={noIpMeter} isConnected={true} lastReading={undefined} readingCount={0} />);
    expect(screen.queryByText(/BACnet IP/)).not.toBeInTheDocument();
  });

  it('renders last reading value and unit when provided', () => {
    render(<MeterCard meter={meter} isConnected={true} lastReading={reading} readingCount={5} />);
    expect(screen.getByText(/123\.45/)).toBeInTheDocument();
    expect(screen.getByText(/kWh/)).toBeInTheDocument();
  });

  it('does not render the reading section when lastReading is undefined', () => {
    render(<MeterCard meter={meter} isConnected={true} lastReading={undefined} readingCount={0} />);
    expect(screen.queryByText(/Last Reading/)).not.toBeInTheDocument();
  });

  it('displays the 24h reading count', () => {
    render(<MeterCard meter={meter} isConnected={true} lastReading={reading} readingCount={42} />);
    expect(screen.getByText(/Readings \(24h\): 42/)).toBeInTheDocument();
  });

  it('displays count of 0 when no readings', () => {
    render(<MeterCard meter={meter} isConnected={false} lastReading={undefined} readingCount={0} />);
    expect(screen.getByText(/Readings \(24h\): 0/)).toBeInTheDocument();
  });
});
