import { useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  trackPageView,
  identifyUser,
  setUserProperties,
  trackPagePerformance,
  trackWebVitals,
  trackTimeOnPage,
  enableDebugMode,
} from '@/lib/analytics';
import { captureUtmParams } from '@/lib/utm';

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Analytics Provider Component
 * Wraps the app to provide automatic page tracking and performance monitoring
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const location = useLocation();
  const { user, profile } = useAuth();

  // Enable debug mode in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      enableDebugMode();
    }
  }, []);

  // Initialize performance tracking once
  useEffect(() => {
    trackPagePerformance();
    trackWebVitals();
    trackTimeOnPage();
  }, []);

  // Track page views on route change
  useEffect(() => {
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
    trackPageView(location.pathname + location.search, title, utm as Record<string, string>);
  }, [location.pathname, location.search]);

  // Identify user when authenticated
  useEffect(() => {
    if (user?.id) {
      identifyUser(user.id);
      
      // Set user properties for segmentation
      setUserProperties({
        user_id: user.id,
        email_domain: user.email?.split('@')[1] || 'unknown',
        display_name: profile?.display_name || 'unknown',
        has_avatar: !!profile?.avatar_url,
      });
    }
  }, [user?.id, user?.email, profile?.display_name, profile?.avatar_url]);

  return <>{children}</>;
}
