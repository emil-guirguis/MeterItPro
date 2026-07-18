import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMeterSelection } from '../contexts/MeterSelectionContext';
import { meterReadingService } from '../services/meterReadingService';
import type { HomeSummary, HomeSummaryFavorite } from '../services/meterReadingService';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types/notifications';
import './HomePage.css';

const ONLINE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // last reading within 2h = online

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function todayLine(): string {
  return new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function formatKWh(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: value >= 100 ? 0 : 1 });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

type MeterStatus = 'online' | 'warning' | 'offline';

function favoriteStatus(favorite: HomeSummaryFavorite, alertMeterIds: Set<number>): MeterStatus {
  if (alertMeterIds.has(Number(favorite.meter_id))) return 'warning';
  if (favorite.last_reading_at && Date.now() - new Date(favorite.last_reading_at).getTime() < ONLINE_THRESHOLD_MS) {
    return 'online';
  }
  return 'offline';
}

const STATUS_LABELS: Record<MeterStatus, string> = {
  online: 'Online',
  warning: 'Warning',
  offline: 'Offline',
};

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setSelectedMeter, setSelectedElement } = useMeterSelection();

  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alertTotal, setAlertTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [summaryData, notificationData] = await Promise.all([
          meterReadingService.getHomeSummary(),
          notificationService.listNotifications(20).catch(() => null),
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        if (notificationData) {
          setNotifications(notificationData.notifications);
          setAlertTotal(notificationData.total);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load home data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFavoriteClick = useCallback((favorite: HomeSummaryFavorite) => {
    const meterId = String(favorite.meter_id);
    const elementId = String(favorite.meter_element_id);
    setSelectedMeter(meterId, favorite.meter_name || undefined);

    const params = new URLSearchParams();
    params.set('meterId', meterId);
    if (favorite.meter_element_id === 0) {
      setSelectedElement('0', favorite.favorite_name, undefined);
      params.set('virtual', 'true');
    } else {
      setSelectedElement(elementId, favorite.favorite_name, undefined);
      params.set('elementId', elementId);
      if (favorite.favorite_name) params.set('elementName', favorite.favorite_name);
      params.set('gridType', 'simple');
    }
    navigate(`/meter-readings?${params.toString()}`);
  }, [navigate, setSelectedMeter, setSelectedElement]);

  const firstName = (user?.name || '').split(' ')[0] || 'there';
  const energyToday = summary?.energy_today_kwh ?? 0;
  const energyYesterday = summary?.energy_yesterday_kwh ?? 0;
  const deltaPct = energyYesterday > 0 ? ((energyToday - energyYesterday) / energyYesterday) * 100 : null;
  const newAlertsToday = notifications.filter((n) => isToday(n.created_at)).length;

  // Meters with an open alert render a Warning chip in the favorites list
  const alertMeterIds = new Set<number>(
    notifications.filter((n) => n.meter_id != null).map((n) => Number(n.meter_id))
  );

  const severityClass = (severity: string): string => {
    if (severity === 'error') return 'home-dot-error';
    if (severity === 'warning') return 'home-dot-warning';
    return 'home-dot-info';
  };

  return (
    <div className="home-page" data-testid="home-page">
      <div className="home-header">
        <h1 className="home-greeting">{greeting()}, {firstName}</h1>
        <p className="home-subtitle">{todayLine()} · Here's what's happening across your sites today.</p>
      </div>

      {error && <div className="home-error">{error}</div>}

      <div className="home-stats">
        <div className="home-stat-card">
          <div className="home-stat-label">Energy Today</div>
          <div className="home-stat-value">{formatKWh(energyToday)} <span className="home-stat-unit">kWh</span></div>
          {deltaPct !== null ? (
            <div className={`home-stat-caption ${deltaPct >= 0 ? 'home-caption-up' : 'home-caption-down'}`}>
              {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}% vs yesterday
            </div>
          ) : (
            <div className="home-stat-caption">no data for yesterday</div>
          )}
        </div>

        <div className="home-stat-card">
          <div className="home-stat-label">Peak Demand</div>
          <div className="home-stat-value">
            {summary?.peak_kw != null ? formatKWh(summary.peak_kw) : '—'} <span className="home-stat-unit">kW</span>
          </div>
          <div className="home-stat-caption">
            {summary?.peaked_at
              ? `at ${new Date(summary.peaked_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
              : 'no readings today'}
          </div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-label">Active Meters</div>
          <div className="home-stat-value">{summary?.active_meters ?? '—'}</div>
          <div className="home-stat-caption">of {summary?.total_meters ?? '—'} total</div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-label">Open Alerts</div>
          <div className="home-stat-value">{alertTotal}</div>
          <div className={`home-stat-caption ${newAlertsToday > 0 ? 'home-caption-alert' : ''}`}>
            {newAlertsToday > 0 ? `${newAlertsToday} new today` : 'none new today'}
          </div>
        </div>
      </div>

      <div className="home-columns">
        <div className="home-card home-activity">
          <h2 className="home-card-title">Recent activity</h2>
          {loading ? (
            <div className="home-empty">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="home-empty">No recent activity.</div>
          ) : (
            <ul className="home-activity-list">
              {notifications.slice(0, 6).map((n) => (
                <li key={n.id} className="home-activity-item">
                  <span className={`home-dot ${severityClass(n.severity)}`} />
                  <span className="home-activity-text">{n.title}</span>
                  <span className="home-activity-time">{relativeTime(n.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="home-card home-favorites">
          <h2 className="home-card-title">Your favorites</h2>
          {loading ? (
            <div className="home-empty">Loading…</div>
          ) : !summary || summary.favorites.length === 0 ? (
            <div className="home-empty">No favorites yet. Star a meter in the sidebar to pin it here.</div>
          ) : (
            <ul className="home-favorites-list">
              {summary.favorites.map((favorite) => {
                const status = favoriteStatus(favorite, alertMeterIds);
                return (
                  <li
                    key={favorite.favorite_id}
                    className="home-favorite-item"
                    onClick={() => handleFavoriteClick(favorite)}
                  >
                    <span className="home-favorite-avatar" />
                    <span className="home-favorite-info">
                      <span className="home-favorite-name">{favorite.favorite_name}</span>
                      {favorite.meter_name && favorite.element_name && (
                        <span className="home-favorite-sub">{favorite.meter_name}</span>
                      )}
                    </span>
                    <span className={`home-status-chip home-status-${status}`}>{STATUS_LABELS[status]}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
