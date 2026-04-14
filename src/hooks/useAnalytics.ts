import { useCallback } from 'react';
import {
  trackEvent,
  AuthEvents,
  OrgEvents,
  TeamEvents,
  WorkOrderEvents,
  HandoffEvents,
  PerformanceUpdateEvents,
  FeatureEvents,
  ErrorEvents,
} from '@/lib/analytics';

/**
 * Hook that provides memoised analytics helpers.
 *
 * Page-view tracking and user identification are handled exclusively
 * by <AnalyticsProvider> — this hook does NOT duplicate those concerns.
 */
export function useAnalytics() {
  const track = useCallback((eventName: string, params?: Record<string, string | number | boolean>) => {
    trackEvent(eventName, params);
  }, []);

  return {
    track,
    AuthEvents,
    OrgEvents,
    TeamEvents,
    WorkOrderEvents,
    HandoffEvents,
    PerformanceUpdateEvents,
    FeatureEvents,
    ErrorEvents,
  };
}
