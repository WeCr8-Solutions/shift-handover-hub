import { useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  trackPageView,
  identifyUser,
  clearUserId,
  setUserProperties,
  trackPagePerformance,
  trackWebVitals,
  trackTimeOnPage,
  enableDebugMode,
} from '@/lib/analytics';
import { captureUtmParams, captureTrafficSource } from '@/lib/utm';

interface AnalyticsProviderProps {
  children: ReactNode;
}

// Analytics is disabled when VITE_DISABLE_ANALYTICS=true (ITAR / self-hosted deployments).
const ANALYTICS_ENABLED = import.meta.env.VITE_DISABLE_ANALYTICS !== 'true';

/**
 * Analytics Provider Component — SINGLE source of page-view tracking,
 * user identification, and performance monitoring.
 *
 * No other component or hook should duplicate these responsibilities.
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const location = useLocation();
  const { user, profile } = useAuth();

  // Enable debug mode in development
  useEffect(() => {
    if (import.meta.env.DEV && ANALYTICS_ENABLED) {
      enableDebugMode();
    }
  }, []);

  // Initialize performance tracking once (idempotent — guarded internally)
  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    trackPagePerformance();
    trackWebVitals();
    trackTimeOnPage();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    const pageTitles: Record<string, string> = {
      '/': 'Home - JobLine.ai',
      '/dashboard': 'Dashboard - JobLine.ai',
      '/auth': 'Sign In - JobLine.ai',
      '/teams': 'Teams - JobLine.ai',
      '/profile': 'Profile - JobLine.ai',
      '/admin': 'Admin Panel - JobLine.ai',
      '/testing': 'Testing Dashboard - JobLine.ai',
      '/queue': 'Work Queue - JobLine.ai',
      '/setup': 'Setup - JobLine.ai',
      '/pricing': 'Pricing - JobLine.ai',
      '/settings': 'Settings - JobLine.ai',
      '/demo': 'Book a Demo - JobLine.ai',
      '/start': 'Get Started - JobLine.ai',
    };

    const title = pageTitles[location.pathname] || `${location.pathname} - JobLine.ai`;
    const utm = captureUtmParams();
    const traffic_source = captureTrafficSource() || 'unknown';
    trackPageView(location.pathname + location.search, title, {
      ...(utm as Record<string, string>),
      traffic_source,
    });
  }, [location.pathname, location.search]);

  // Identify user when authenticated; clear on sign-out (per GA4 user_id guidance).
  // Only sends `null` if the user was previously signed in during this session —
  // never for users who have never signed in.
  const wasSignedInRef = useRef(false);
  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    if (user?.id) {
      wasSignedInRef.current = true;
      identifyUser(user.id);

      setUserProperties({
        user_id: user.id,
        email_domain: user.email?.split('@')[1] || 'unknown',
        display_name: profile?.display_name || 'unknown',
        has_avatar: !!profile?.avatar_url,
      });
    } else if (wasSignedInRef.current) {
      // User signed out
      clearUserId();
    }
  }, [user?.id, user?.email, profile?.display_name, profile?.avatar_url]);

  return <>{children}</>;
}
