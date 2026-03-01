/**
 * Analytics & Tracking Utilities
 * Provides comprehensive tracking for page views, user actions, and performance metrics
 *
 * GA4 CONVERSION EVENTS (mark as Conversions in GA4 Admin > Events):
 *   - signup_complete
 *   - lead_captured
 *   - demo_open
 *   - cta_click (micro-conversion)
 */

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-FDFFDKQS0Q';

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

/**
 * Returns true when analytics should be suppressed.
 * Covers: server-side rendering, headless/automation, Lovable preview
 * environments, and explicitly disabled self-hosted / ITAR deployments.
 *
 * Set VITE_DISABLE_ANALYTICS=true in .env (or the build environment) to
 * suppress all telemetry — required for ITAR self-hosted deployments.
 */
function shouldSkipTracking(): boolean {
  if (typeof window === 'undefined') return true;
  // Explicitly disabled via build-time env var (ITAR / self-hosted deployments)
  if (import.meta.env.VITE_DISABLE_ANALYTICS === 'true') return true;
  // Skip headless browsers / automation
  if (navigator.webdriver) return true;
  // Skip Lovable preview environments
  const host = window.location.hostname;
  if (host.includes('preview--') || host.includes('lovableproject.com')) return true;
  return false;
}

// ============================================
// Core Analytics Functions
// ============================================

/**
 * Track a page view (with optional UTM attribution)
 */
export function trackPageView(path: string, title?: string, utmParams?: Record<string, string>) {
  if (shouldSkipTracking() || !window.gtag) return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title || document.title,
    ...utmParams,
  });
  
  if (import.meta.env.DEV) {
    console.log('[Analytics] Page View:', { path, title, ...utmParams });
  }
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (shouldSkipTracking() || !window.gtag) return;
  window.gtag('event', eventName, params);
  
  if (import.meta.env.DEV) {
    console.log('[Analytics] Event:', eventName, params);
  }
}

/**
 * Set user properties for analytics
 */
export function setUserProperties(properties: Record<string, string | number | boolean>) {
  if (shouldSkipTracking()) return;
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', properties);
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] User Properties:', properties);
    }
  }
}

/**
 * Identify a user (for cross-session tracking)
 */
export function identifyUser(userId: string) {
  if (shouldSkipTracking()) return;
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId,
    });
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] User Identified:', userId);
    }
  }
}

// ============================================
// Pre-defined Event Tracking Functions
// ============================================

// Authentication Events
export const AuthEvents = {
  signUp: (method: 'email' | 'google' | 'github' = 'email') => 
    trackEvent('sign_up', { method }),
  
  login: (method: 'email' | 'google' | 'github' = 'email') => 
    trackEvent('login', { method }),
  
  logout: () => 
    trackEvent('logout'),
  
  passwordReset: () => 
    trackEvent('password_reset_requested'),
};

// Organization Events
export const OrgEvents = {
  created: (orgName: string) => 
    trackEvent('organization_created', { organization_name: orgName }),
  
  memberInvited: (role: string) => 
    trackEvent('member_invited', { role }),
  
  memberJoined: (method: 'invite_code' | 'direct_invite') => 
    trackEvent('member_joined', { method }),
};

// Team Events
export const TeamEvents = {
  created: (teamName: string) => 
    trackEvent('team_created', { team_name: teamName }),
  
  memberAdded: (role: string) => 
    trackEvent('team_member_added', { role }),
  
  stationAdded: (stationType: string) => 
    trackEvent('station_added', { station_type: stationType }),
};

// Work Order Events
export const WorkOrderEvents = {
  created: (priority: string, itemType: string) => 
    trackEvent('work_order_created', { priority, item_type: itemType }),
  
  statusChanged: (fromStatus: string, toStatus: string) => 
    trackEvent('work_order_status_changed', { from_status: fromStatus, to_status: toStatus }),
  
  assigned: () => 
    trackEvent('work_order_assigned'),
  
  completed: (durationMinutes?: number) => 
    trackEvent('work_order_completed', { duration_minutes: durationMinutes || 0 }),
};

// Handoff Events
export const HandoffEvents = {
  created: (shift: string, workCenter: string) => 
    trackEvent('handoff_created', { shift, work_center: workCenter }),
  
  viewed: () => 
    trackEvent('handoff_viewed'),
};

// Performance Update Events
export const PerformanceUpdateEvents = {
  submitted: (updateType: string, priority: string) => 
    trackEvent('performance_update_submitted', { update_type: updateType, priority }),
  
  reviewed: (status: 'approved' | 'rejected' | 'implemented') => 
    trackEvent('performance_update_reviewed', { status }),
};

// Feature Usage Events
export const FeatureEvents = {
  featureUsed: (featureName: string) => 
    trackEvent('feature_used', { feature_name: featureName }),
  
  filterApplied: (filterType: string, filterValue: string) => 
    trackEvent('filter_applied', { filter_type: filterType, filter_value: filterValue }),
  
  searchPerformed: (searchLocation: string, hasResults: boolean) => 
    trackEvent('search_performed', { location: searchLocation, has_results: hasResults }),
  
  viewChanged: (viewType: 'list' | 'kanban' | 'calendar') => 
    trackEvent('view_changed', { view_type: viewType }),
  
  exportPerformed: (exportType: string) => 
    trackEvent('export_performed', { export_type: exportType }),
};

// Demo / Conversion Events
export const DemoEvents = {
  demoModalOpen: (pagePath: string, utmParams?: Record<string, string>) =>
    trackEvent('demo_modal_open', { page_path: pagePath, ...utmParams }),

  demoFormSubmit: (pagePath: string, utmParams?: Record<string, string>) =>
    trackEvent('demo_form_submit', { page_path: pagePath, ...utmParams }),
};

// ============================================
// Standardized Conversion Events (GA4 Schema)
// ============================================

export const ConversionEvents = {
  /** Track any CTA button click across the site */
  ctaClick: (ctaId: string, ctaText: string, pagePath: string, section: string) =>
    trackEvent('cta_click', { cta_id: ctaId, cta_text: ctaText, page_path: pagePath, section }),

  /** Demo modal / video opened */
  demoOpen: (pagePath: string, trigger: string) =>
    trackEvent('demo_open', { page_path: pagePath, trigger }),

  /** User submitted signup form (before API call) */
  signupStart: (pagePath: string, method: string = 'email') =>
    trackEvent('signup_start', { page_path: pagePath, method }),

  /** User successfully created an account */
  signupComplete: (pagePath: string, method: string = 'email') =>
    trackEvent('signup_complete', { page_path: pagePath, method }),

  /** User successfully logged in */
  login: (pagePath: string, method: string = 'email') =>
    trackEvent('login', { page_path: pagePath, method }),

  /** Pricing page viewed */
  pricingView: (pagePath: string) =>
    trackEvent('pricing_view', { page_path: pagePath }),

  /** Video play / complete */
  videoPlay: (pagePath: string, source: string) =>
    trackEvent('video_play', { page_path: pagePath, source }),
  videoComplete: (pagePath: string, source: string) =>
    trackEvent('video_complete', { page_path: pagePath, source }),
};

// Error Tracking
export const ErrorEvents = {
  error: (errorType: string, errorMessage: string, componentName?: string) => 
    trackEvent('error_occurred', { 
      error_type: errorType, 
      error_message: errorMessage.substring(0, 100),
      component: componentName || 'unknown',
    }),
  
  apiError: (endpoint: string, statusCode: number) => 
    trackEvent('api_error', { endpoint, status_code: statusCode }),
};

// ============================================
// Performance Monitoring
// ============================================

/**
 * Track page load performance
 */
export function trackPagePerformance() {
  if (shouldSkipTracking()) return;
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Wait for page to fully load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (timing) {
          trackEvent('page_performance', {
            dns_lookup_ms: Math.round(timing.domainLookupEnd - timing.domainLookupStart),
            connection_ms: Math.round(timing.connectEnd - timing.connectStart),
            ttfb_ms: Math.round(timing.responseStart - timing.requestStart),
            dom_interactive_ms: Math.round(timing.domInteractive - timing.fetchStart),
            dom_complete_ms: Math.round(timing.domComplete - timing.fetchStart),
            load_complete_ms: Math.round(timing.loadEventEnd - timing.fetchStart),
          });
        }
      }, 0);
    });
  }
}

/**
 * Track Core Web Vitals (LCP, FID, CLS)
 */
export function trackWebVitals() {
  if (shouldSkipTracking()) return;
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        trackEvent('web_vital_lcp', { value_ms: Math.round(lastEntry.startTime) });
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          trackEvent('web_vital_fid', { value_ms: Math.round(fidEntry.processingStart - fidEntry.startTime) });
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
            clsValue += (entry as PerformanceEntry & { value?: number }).value || 0;
          }
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      
      // Report CLS on page hide
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          trackEvent('web_vital_cls', { value: Math.round(clsValue * 1000) / 1000 });
        }
      });
    } catch {
      // CLS not supported
    }
  }
}

/**
 * Track time spent on page
 */
export function trackTimeOnPage() {
  if (shouldSkipTracking()) return;
  if (typeof window !== 'undefined') {
    const startTime = Date.now();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        trackEvent('time_on_page', { 
          seconds: timeSpent,
          page: window.location.pathname,
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also track on beforeunload
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackEvent('time_on_page', { 
        seconds: timeSpent,
        page: window.location.pathname,
      });
    });
  }
}

// ============================================
// Developer Debug Mode
// ============================================

/**
 * Enable debug mode for development
 */
export function enableDebugMode() {
  if (typeof window !== 'undefined') {
    (window as Window & { analyticsDebug?: boolean }).analyticsDebug = true;
    console.log('[Analytics] Debug mode enabled. All events will be logged to console.');
  }
}

/**
 * Get all tracked events in debug mode
 */
export function getDebugLog(): unknown[] {
  if (typeof window !== 'undefined') {
    return window.dataLayer || [];
  }
  return [];
}
