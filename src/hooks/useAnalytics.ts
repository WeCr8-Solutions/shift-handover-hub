import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  trackPageView,
  trackEvent,
  identifyUser,
  setUserProperties,
  trackPagePerformance,
  trackWebVitals,
  trackTimeOnPage,
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
 * Hook to automatically track page views and provide analytics functions
 */
export function useAnalytics() {
  const location = useLocation();
  const { user, profile } = useAuth();

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Identify user when authenticated
  useEffect(() => {
    if (user?.id) {
      identifyUser(user.id);
      
      // Set user properties
      setUserProperties({
        user_id: user.id,
        email_domain: user.email?.split('@')[1] || 'unknown',
        display_name: profile?.display_name || 'unknown',
      });
    }
  }, [user?.id, user?.email, profile?.display_name]);

  // Memoized event tracking functions
  const track = useCallback((eventName: string, params?: Record<string, string | number | boolean>) => {
    trackEvent(eventName, params);
  }, []);

  return {
    track,
    trackPageView,
    // Pre-defined event helpers
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

/**
 * Hook to initialize performance tracking (use once in App.tsx)
 */
export function usePerformanceTracking() {
  useEffect(() => {
    trackPagePerformance();
    trackWebVitals();
    trackTimeOnPage();
  }, []);
}

/**
 * Hook to track component render time (for performance debugging)
 */
export function useRenderTracking(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 100) {
        // Only log slow renders (> 100ms)
        trackEvent('slow_component_render', {
          component: componentName,
          render_time_ms: Math.round(renderTime),
        });
      }
    };
  }, [componentName]);
}

/**
 * Hook to track user engagement (scroll depth, clicks, etc.)
 */
export function useEngagementTracking() {
  useEffect(() => {
    let maxScrollDepth = 0;
    
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        
        // Track milestone scroll depths
        if ([25, 50, 75, 90, 100].includes(maxScrollDepth)) {
          trackEvent('scroll_depth', { 
            depth_percent: maxScrollDepth,
            page: window.location.pathname,
          });
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
}
