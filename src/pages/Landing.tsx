import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { ShiftHandoffDemo } from "@/components/landing/ShiftHandoffDemo";
import { SupportJoblineModal } from "@/components/SupportJoblineModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { trackEvent, DemoEvents } from "@/lib/analytics";
import { getUtmParams } from "@/lib/utm";
import demoVideo from "@/assets/jobline-demo-video.mp4";
import { 
  ArrowRight, 
  Zap, 
  Users, 
  Clock, 
  BarChart3, 
  ChevronRight,
  Play,
  Wrench,
  Factory,
  Gauge,
  FileText,
  Bell,
  Lock,
  Smartphone,
  Globe,
  ArrowUpRight,
  Menu,
  X,
  Heart,
  Lightbulb,
  CheckCircle2,
  Camera,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import joblineLogo from "@/assets/jobline-logo.png";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "/pricing", label: "Pricing", isRoute: true },
  { href: "#testimonials", label: "Testimonials" },
];

const features = [
  {
    icon: Clock,
    title: "Real-Time Handoffs",
    description: "Seamless shift transitions with live status updates. Never miss critical information between shifts again.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    link: "/features/shift-handoff-software",
    cta: "Explore Handoffs",
  },
  {
    icon: Gauge,
    title: "Station Monitoring",
    description: "Track every CNC, lathe, and work center in real-time. Instant visibility into machine status and job progress.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    link: "/features/production-control",
    cta: "See Production Control",
  },
  {
    icon: FileText,
    title: "Work Order Tracking",
    description: "Kanban boards, priority queues, and multi-step routing. Manage your production queue from anywhere.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    link: "/features/work-order-tracking",
    cta: "Explore Work Orders",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Organize operators by teams, assign roles, and onboard with QR codes. Built for multi-shift operations.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    link: "/features/team-collaboration",
    cta: "See Team Features",
  },
  {
    icon: BarChart3,
    title: "Digital Expeditor",
    description: "Replace clipboard expeditors with real-time digital oversight. See every job, machine, and operator instantly.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    link: "/features/digital-expeditor",
    cta: "Learn About Expediting",
  },
  {
    icon: Bell,
    title: "Quality & Alerts",
    description: "Track quality holds, scrap rates, and inspection results. Get notified about issues before they cascade.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    link: "/features/quality-management",
    cta: "Explore Quality Tools",
  },
  {
    icon: Wrench,
    title: "Machine Shop Software",
    description: "Purpose-built for CNC, lathe, mill, and grinder operations. Track equipment condition, parts, and performance.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    link: "/features/machine-shop-software",
    cta: "See Machine Shop Tools",
  },
  {
    icon: Factory,
    title: "Manufacturing Oversight",
    description: "Role-based dashboards for owners, managers, and supervisors. Complete visibility across your entire operation.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    link: "/features/manufacturing-oversight",
    cta: "Explore Oversight",
  },
  {
    icon: Globe,
    title: "Downtime Tracking",
    description: "Log downtime events, track reason codes, analyze trends, and reduce unplanned stoppages across your shop.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    link: "/features/downtime-tracking",
    cta: "Track Downtime",
  },
  {
    icon: Sparkles,
    title: "AI Planning Assistant",
    description: "Ask questions about scheduling, rerouting, and priorities. AI analyzes your live production data and gives actionable answers.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    link: "/features/ai-planning-assistant",
    cta: "Meet Your AI Planner",
  },
];

const stats = [
  { value: "47%", label: "Faster Handoffs" },
  { value: "2.3x", label: "Better Visibility" },
  { value: "99.9%", label: "Uptime" },
  { value: "< 5min", label: "Setup Time" },
];

const testimonials = [
  {
    quote: "JobLine.ai transformed our shift handoffs. What used to take 30 minutes now takes 5.",
    author: "Mike Rodriguez",
    role: "Production Manager",
    company: "Precision CNC Works",
  },
  {
    quote: "Finally, a system built by people who understand manufacturing. Not another generic SaaS.",
    author: "Sarah Chen",
    role: "Operations Director",
    company: "Apex Machining",
  },
  {
    quote: "The performance update feature alone saved us $200K in scrap reduction last quarter.",
    author: "James Wilson",
    role: "Plant Manager",
    company: "Delta Manufacturing",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => {
        const next = (prev + 1) % testimonials.length;
        trackEvent('testimonial_auto_rotated', {
          from_index: prev,
          to_index: next
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Track scroll depth on landing page
  useEffect(() => {
    let maxScrollDepth = 0;
    const sections = ['hero', 'features', 'how-it-works', 'testimonials', 'cta'];
    
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        
        // Track milestone scroll depths
        if ([25, 50, 75, 100].includes(maxScrollDepth)) {
          trackEvent('landing_scroll_depth', { 
            depth_percent: maxScrollDepth,
            page: 'landing'
          });
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string, isRoute?: boolean, label?: string) => {
    trackEvent('landing_nav_click', {
      nav_item: label || href,
      is_route: isRoute || false
    });
    setMobileMenuOpen(false);
    if (isRoute) {
      navigate(href);
      return;
    }
    // Small delay to allow sheet to close before scrolling
    setTimeout(() => {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCtaClick = (ctaName: string, location: string) => {
    trackEvent('landing_cta_click', {
      cta_name: ctaName,
      location: location
    });
  };

  const handleDemoModalOpen = () => {
    trackEvent('landing_demo_modal_opened', { source: 'hero_section' });
    DemoEvents.demoModalOpen(location.pathname, getUtmParams() as Record<string, string>);
    setDemoModalOpen(true);
  };

  const handleDemoModalClose = () => {
    trackEvent('landing_demo_modal_closed', {});
    setDemoModalOpen(false);
  };

  const handleFeatureView = (featureName: string) => {
    trackEvent('landing_feature_hover', {
      feature_name: featureName
    });
  };

  const handleFeatureClick = (featureName: string) => {
    trackEvent('landing_feature_clicked', {
      feature_name: featureName
    });
  };

  const handleTestimonialChange = (index: number, method: 'auto' | 'click') => {
    if (method === 'click') {
      trackEvent('testimonial_dot_clicked', {
        testimonial_index: index,
        author: testimonials[index].author
      });
    }
    setActiveTestimonial(index);
  };

  const handleFooterLinkClick = (linkName: string) => {
    trackEvent('landing_footer_link_clicked', {
      link_name: linkName
    });
  };

  const handleMobileMenuOpen = () => {
    trackEvent('mobile_menu_opened', {
      page: 'landing'
    });
    setMobileMenuOpen(true);
  };

  const handleMobileMenuCtaClick = (ctaName: string) => {
    trackEvent('mobile_menu_cta_clicked', {
      cta_name: ctaName
    });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEOHead
        title="Digital Expeditor & Smart Shift Handoff System"
        description="Streamline CNC manufacturing operations with JobLine.ai. Track work orders, manage shift handoffs, coordinate routing, and improve production floor communication. Built for machine shops and fabrication teams."
        keywords="manufacturing software, shift handoff, work order tracking, CNC machining, production management, machine shop software, manufacturing execution system, MES, digital expeditor, production scheduling, production control, shop floor management, shift change software"
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "JobLine.ai",
          "url": "https://joblineai.lovable.app",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web Browser",
          "description": "Digital expeditor and smart shift handoff system for CNC manufacturing operations.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "description": "Free trial available" },
          "audience": { "@type": "Audience", "audienceType": "Manufacturing Professionals" }
        }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src={joblineLogo} alt="JobLine.ai" className="h-6 sm:h-8 w-auto" />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              link.isRoute ? (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href, link.isRoute, link.label)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </button>
              ) : (
                <a 
                  key={link.href}
                  href={link.href} 
                  onClick={() => trackEvent('landing_nav_click', { nav_item: link.label, is_route: false })}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              )
            ))}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                trackEvent('landing_cta_click', { cta_name: 'try_digital_handoff', location: 'nav_header' });
                document.querySelector('#handoff-demo')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10"
            >
              <Zap className="w-3.5 h-3.5" />
              Try Digital Handoff
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Button onClick={() => {
                handleCtaClick('go_to_dashboard', 'nav_header');
                navigate("/dashboard");
              }} size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <span className="hidden xs:inline">Go to </span>Dashboard
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => {
                  handleCtaClick('sign_in', 'nav_header');
                  navigate("/auth");
                }} size="sm" className="hidden sm:flex text-xs sm:text-sm">
                  Sign In
                </Button>
                <Button onClick={() => {
                  handleCtaClick('get_started', 'nav_header');
                  navigate("/auth");
                }} size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <span className="hidden xs:inline">Get </span>Started
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={(open) => {
              if (open) {
                handleMobileMenuOpen();
              } else {
                setMobileMenuOpen(false);
              }
            }}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <img src={joblineLogo} alt="JobLine.ai" className="h-6 w-auto" />
                  </div>
                  
                  {/* Mobile Menu Links */}
                  <div className="flex-1 overflow-y-auto py-4">
                    <nav className="flex flex-col gap-1 px-3">
                      {navLinks.map((link) => (
                        <button
                          key={link.href}
                          onClick={() => handleNavClick(link.href, link.isRoute)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-secondary transition-colors text-left"
                        >
                          {link.label}
                        </button>
                      ))}
                    </nav>
                  </div>
                  
                  {/* Mobile Menu Footer */}
                  <div className="p-4 border-t border-border space-y-3">
                    {user ? (
                      <Button 
                        onClick={() => {
                          handleMobileMenuCtaClick('go_to_dashboard');
                          navigate("/dashboard");
                        }} 
                        className="w-full gap-2"
                      >
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={() => {
                            handleMobileMenuCtaClick('get_started');
                            navigate("/auth");
                          }} 
                          className="w-full gap-2"
                        >
                          Get Started
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            handleMobileMenuCtaClick('sign_in');
                            navigate("/auth");
                          }} 
                          className="w-full"
                        >
                          Sign In
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-12 sm:pt-28 sm:pb-16 md:pt-36 md:pb-24 lg:pt-40 lg:pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-primary/20 rounded-full blur-[80px] sm:blur-[100px] md:blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-blue-500/10 rounded-full blur-[80px] sm:blur-[100px] md:blur-[128px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] md:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo above hero text */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <img src={joblineLogo} alt="JobLine.ai" className="h-16 sm:h-24 md:h-32 lg:h-40 w-auto" />
            </div>
            
            <Badge variant="outline" className="mb-4 sm:mb-6 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm border-primary/30 bg-primary/5">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 text-primary" />
              Built for Manufacturing Teams
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight">
              Shift Handoffs.
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Finally Solved.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl sm:max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              The intelligent job tracking platform that makes shift transitions seamless. 
              Real-time visibility, zero information loss, better production outcomes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
              <Button size="lg" onClick={() => {
                handleCtaClick('start_free_trial', 'hero_section');
                navigate("/auth");
              }} className="gap-2 text-sm sm:text-base px-6 sm:px-8 h-10 sm:h-12 w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => {
                  handleCtaClick('try_digital_handoff', 'hero_section');
                  document.querySelector('#handoff-demo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="gap-2 text-sm sm:text-base px-6 sm:px-8 h-10 sm:h-12 w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                Try Digital Handoff
              </Button>
              <Button 
                size="lg" 
                variant="ghost" 
                onClick={handleDemoModalOpen}
                className="gap-2 text-sm sm:text-base px-6 sm:px-8 h-10 sm:h-12 w-full sm:w-auto"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 lg:gap-8 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="text-center p-2 sm:p-4">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-0.5 sm:mb-1">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="relative max-w-6xl mx-auto">
            {/* Glow Effect */}
            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-primary/20 via-blue-500/20 to-primary/20 rounded-xl sm:rounded-2xl blur-xl sm:blur-2xl opacity-50" />
            
            {/* Mock Dashboard */}
            <div className="relative bg-card border border-border rounded-lg sm:rounded-xl shadow-2xl overflow-hidden">
              {/* Window Chrome */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-secondary/50 border-b border-border">
                <div className="flex gap-1 sm:gap-1.5">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500/70" />
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-2 sm:px-4 py-0.5 sm:py-1 bg-background/50 rounded-md sm:rounded-lg text-[10px] sm:text-xs text-muted-foreground font-mono">
                    jobline.ai/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard Content */}
              <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Factory className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">Production Floor</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Day Shift • 12 Active Stations</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-[10px] sm:text-xs self-start sm:self-auto">
                    All Systems Operational
                  </Badge>
                </div>

                {/* KPI Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                  {[
                    { label: "Running", value: 9, total: 12, color: "bg-green-500", textColor: "text-green-400" },
                    { label: "Down", value: 1, total: 12, color: "bg-red-500", textColor: "text-red-400" },
                    { label: "In Setup", value: 1, total: 12, color: "bg-amber-500", textColor: "text-amber-400" },
                    { label: "Waiting", value: 1, total: 12, color: "bg-blue-500", textColor: "text-blue-400" },
                    { label: "Handoffs", value: 6, color: "bg-primary", textColor: "text-primary" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-secondary/30 rounded-md p-2 border border-border/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={cn("w-2 h-2 rounded-full", kpi.color)} />
                        <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
                      </div>
                      <span className={cn("text-base sm:text-lg font-bold font-mono", kpi.textColor)}>
                        {kpi.value}
                        {kpi.total && <span className="text-[10px] text-muted-foreground font-normal">/{kpi.total}</span>}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                  {/* Bar Chart Mock */}
                  <div className="bg-secondary/20 rounded-md sm:rounded-lg p-2.5 sm:p-3 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">Output by Station</span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0">Today</Badge>
                    </div>
                    <div className="flex items-end gap-1.5" style={{ height: '5rem' }}>
                      {[
                        { h: 75, label: "CNC-01" },
                        { h: 58, label: "CNC-02" },
                        { h: 90, label: "CNC-03" },
                        { h: 40, label: "LTH-01" },
                        { h: 65, label: "LTH-02" },
                        { h: 85, label: "MIL-01" },
                        { h: 20, label: "MIL-02" },
                        { h: 70, label: "GRD-01" },
                      ].map((bar) => (
                        <div key={bar.label} className="flex-1 flex flex-col justify-end items-center h-full">
                          <div className="w-full rounded-t-sm bg-primary/80" style={{ height: `${bar.h}%` }} />
                          <span className="text-[6px] sm:text-[7px] text-muted-foreground font-mono truncate w-full text-center mt-0.5">{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Donut Chart Mock */}
                  <div className="bg-secondary/20 rounded-md sm:rounded-lg p-2.5 sm:p-3 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">Shift Utilization</span>
                      <span className="text-lg sm:text-xl font-bold text-primary font-mono">87%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* SVG Donut */}
                      <svg viewBox="0 0 36 36" className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="87 13" strokeDashoffset="25" strokeLinecap="round" />
                      </svg>
                      <div className="flex-1 space-y-1">
                        {[
                          { label: "Running", pct: "75%", color: "bg-green-500" },
                          { label: "Setup", pct: "8%", color: "bg-amber-500" },
                          { label: "Idle", pct: "13%", color: "bg-muted" },
                          { label: "Down", pct: "4%", color: "bg-red-500" },
                        ].map((s) => (
                          <div key={s.label} className="flex items-center gap-1.5">
                            <div className={cn("w-1.5 h-1.5 rounded-full", s.color)} />
                            <span className="text-[9px] text-muted-foreground flex-1">{s.label}</span>
                            <span className="text-[9px] font-mono font-medium">{s.pct}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Station List */}
                <div className="bg-secondary/20 rounded-md sm:rounded-lg border border-border/50 overflow-hidden">
                  <div className="px-2.5 py-1.5 border-b border-border/50 bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">Active Stations</span>
                      <span className="text-[9px] text-muted-foreground">Updated 4s ago</span>
                    </div>
                  </div>
                  <div className="divide-y divide-border/30">
                    {[
                      { id: "CNC-01", operator: "Mike R.", part: "PN-4521", wo: "WO-0847", progress: 78, status: "running" },
                      { id: "CNC-02", operator: "Sarah C.", part: "PN-8832", wo: "WO-0851", progress: 45, status: "running" },
                      { id: "LATHE-01", operator: "James W.", part: "PN-1127", wo: "WO-0849", progress: 12, status: "setup" },
                      { id: "MILL-03", operator: "Lisa M.", part: "PN-9943", wo: "WO-0853", progress: 92, status: "running" },
                    ].map((station) => (
                      <div key={station.id} className="flex items-center gap-2 px-2.5 py-1.5">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full flex-shrink-0",
                          station.status === "running" ? "bg-green-400" : "bg-amber-400"
                        )} />
                        <span className="text-[10px] font-mono font-medium w-14 flex-shrink-0">{station.id}</span>
                        <span className="text-[10px] text-muted-foreground w-14 truncate flex-shrink-0">{station.operator}</span>
                        <span className="text-[10px] font-mono text-primary w-14 flex-shrink-0">{station.wo}</span>
                        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", station.status === "running" ? "bg-green-500" : "bg-amber-500")} style={{ width: `${station.progress}%` }} />
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground w-8 text-right">{station.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Sections */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">See It In Action</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Built for the Shop Floor
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Queue Preview */}
            <div 
              className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all group"
              onClick={() => { trackEvent('landing_preview_click', { preview: 'work_order_queue' }); navigate('/features/work-order-tracking'); }}
            >
              <div className="px-4 py-3 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Work Order Queue</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { wo: "WO-2024-0847", part: "Bracket Assembly", qty: 150, status: "In Progress", priority: "high", station: "CNC-01" },
                  { wo: "WO-2024-0851", part: "Shaft Housing", qty: 75, status: "Queued", priority: "urgent", station: "LATHE-02" },
                  { wo: "WO-2024-0849", part: "Motor Mount", qty: 200, status: "Queued", priority: "normal", station: "MILL-03" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/50">
                    <div className={cn(
                      "w-1 h-10 rounded-full flex-shrink-0",
                      item.priority === "urgent" ? "bg-red-500" : 
                      item.priority === "high" ? "bg-amber-500" : "bg-blue-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-primary">{item.wo}</span>
                        <Badge variant="outline" className={cn(
                          "text-[10px] px-1.5 py-0",
                          item.status === "In Progress" ? "border-green-500/50 text-green-400" : "border-muted-foreground/30"
                        )}>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium truncate">{item.part}</div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>Qty: {item.qty}</span>
                        <span>•</span>
                        <span>{item.station}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Handoff Preview */}
            <div 
              className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all group"
              onClick={() => { trackEvent('landing_preview_click', { preview: 'recent_handoffs' }); navigate('/features/shift-handoff-software'); }}
            >
              <div className="px-4 py-3 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Recent Handoffs</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { station: "CNC-01", from: "Mike R.", to: "Sarah C.", time: "2:03 PM", state: "Running", parts: "127/150" },
                  { station: "LATHE-02", from: "James W.", to: "Tom B.", time: "2:00 PM", state: "Setup", parts: "0/75" },
                  { station: "MILL-03", from: "Lisa M.", to: "Dave K.", time: "1:58 PM", state: "Running", parts: "45/200" },
                ].map((handoff, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/20 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-medium">{handoff.station}</span>
                      <span className="text-[10px] text-muted-foreground">{handoff.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <span className="text-muted-foreground">{handoff.from}</span>
                      <ArrowRight className="w-3 h-3 text-primary" />
                      <span className="font-medium">{handoff.to}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <Badge variant="outline" className={cn(
                        "px-1.5 py-0",
                        handoff.state === "Running" ? "border-green-500/50 text-green-400" : "border-amber-500/50 text-amber-400"
                      )}>
                        {handoff.state}
                      </Badge>
                      <span className="text-muted-foreground">Parts: {handoff.parts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Routing Preview - Full Width */}
          <div className="max-w-6xl mx-auto mt-6 md:mt-8">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Work Order Routing</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">WO-2024-0847</Badge>
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  {[
                    { step: 1, name: "Material Receiving", status: "complete" },
                    { step: 2, name: "Incoming Inspection", status: "complete" },
                    { step: 3, name: "CNC Machining", status: "active" },
                    { step: 4, name: "Deburr", status: "pending" },
                    { step: 5, name: "Heat Treat", status: "pending", outside: true },
                    { step: 6, name: "Final Inspection", status: "pending" },
                    { step: 7, name: "Ship", status: "pending" },
                  ].map((step, i, arr) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={cn(
                        "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border min-w-[100px]",
                        step.status === "complete" ? "bg-green-500/10 border-green-500/30" :
                        step.status === "active" ? "bg-primary/10 border-primary/50" :
                        "bg-secondary/30 border-border/50"
                      )}>
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                          step.status === "complete" ? "bg-green-500 text-white" :
                          step.status === "active" ? "bg-primary text-white" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {step.status === "complete" ? "✓" : step.step}
                        </div>
                        <span className={cn(
                          "text-[10px] text-center leading-tight",
                          step.status === "active" ? "font-medium" : "text-muted-foreground"
                        )}>
                          {step.name}
                        </span>
                        {step.outside && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-amber-500/50 text-amber-400">
                            Outside
                          </Badge>
                        )}
                      </div>
                      {i < arr.length - 1 && (
                        <div className={cn(
                          "w-4 h-0.5",
                          step.status === "complete" ? "bg-green-500" : "bg-border"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Continuous Improvement Preview - Full Width */}
          <div className="max-w-6xl mx-auto mt-6 md:mt-8">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-amber-500/10">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="font-medium text-sm">Continuous Improvement Tracking</span>
                  <Badge variant="outline" className="ml-auto text-[10px] border-amber-500/50 text-amber-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Kaizen
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Performance Update Cards */}
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-2">Recent Operator Submissions</p>
                    {[
                      { 
                        title: "Tool offset adjustment for better finish", 
                        type: "setup_change", 
                        author: "Mike R.", 
                        station: "CNC-01",
                        status: "approved",
                        priority: "high",
                        hasImage: true
                      },
                      { 
                        title: "Coolant flow rate optimization", 
                        type: "improvement", 
                        author: "Sarah C.", 
                        station: "LATHE-02",
                        status: "pending",
                        priority: "normal",
                        hasImage: false
                      },
                      { 
                        title: "Fixture clamp position change", 
                        type: "adjustment", 
                        author: "James W.", 
                        station: "MILL-03",
                        status: "implemented",
                        priority: "critical",
                        hasImage: true
                      },
                    ].map((update, i) => (
                      <div key={i} className="p-3 rounded-lg bg-secondary/20 border border-border/50">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full flex-shrink-0",
                              update.priority === "critical" ? "bg-red-500" :
                              update.priority === "high" ? "bg-amber-500" : "bg-blue-500"
                            )} />
                            <span className="text-sm font-medium leading-tight">{update.title}</span>
                          </div>
                          {update.hasImage && (
                            <Camera className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{update.author}</span>
                            <span>•</span>
                            <span className="font-mono">{update.station}</span>
                          </div>
                          <Badge variant="outline" className={cn(
                            "px-1.5 py-0 text-[9px]",
                            update.status === "approved" ? "border-blue-500/50 text-blue-400" :
                            update.status === "implemented" ? "border-green-500/50 text-green-400" :
                            "border-amber-500/50 text-amber-400"
                          )}>
                            {update.status === "implemented" && <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />}
                            {update.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-muted-foreground/30">
                            {update.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Impact Metrics */}
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-2">Improvement Impact</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Updates This Month", value: "47", trend: "+12%", color: "text-amber-400" },
                        { label: "Implemented", value: "34", trend: "72%", color: "text-green-400" },
                        { label: "Cycle Time Saved", value: "14h", trend: "-8%", color: "text-blue-400" },
                        { label: "Quality Impact", value: "23", trend: "issues prevented", color: "text-purple-400" },
                      ].map((stat, i) => (
                        <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border/50 text-center">
                          <div className={cn("text-xl sm:text-2xl font-bold", stat.color)}>{stat.value}</div>
                          <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                          <div className="text-[9px] text-muted-foreground/60 mt-1">{stat.trend}</div>
                        </div>
                      ))}
                    </div>

                    {/* Feature Highlights */}
                    <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        How It Works
                      </h4>
                      <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>Operators submit setup changes, adjustments & improvements</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>Attach photos & mark impact areas (quality, safety, cycle time)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>Supervisors review, approve & track implementation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>Build a knowledge base of proven improvements</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Shift Handoff Demo */}
      <ShiftHandoffDemo />

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">Features</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Everything You Need to
              <br />
              <span className="text-primary">Run Better Shifts</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">
              Purpose-built for manufacturing operations. No more spreadsheets, whiteboards, or lost information.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group relative p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onMouseEnter={() => handleFeatureView(feature.title)}
                onClick={() => {
                  handleFeatureClick(feature.title);
                  navigate(feature.link);
                  window.scrollTo(0, 0);
                }}
              >
                <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4", feature.bg)}>
                  <feature.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", feature.color)} />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">{feature.description}</p>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
                  {feature.cta}
                  <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              </div>
            ))}
          </div>

          {/* Additional Feature Links */}
          <div className="flex flex-wrap justify-center gap-3 mt-8 sm:mt-12 max-w-4xl mx-auto">
            {[
              { label: "Production Scheduling", link: "/features/production-scheduling" },
              { label: "CNC Operator Tools", link: "/features/cnc-operator-tools" },
              { label: "Continuous Improvement", link: "/features/quality-management" },
              { label: "AI Planning Assistant", link: "/features/ai-planning-assistant" },
            ].map((extra, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => {
                  trackEvent('landing_feature_link_click', { feature: extra.label });
                  navigate(extra.link);
                }}
                className="gap-1.5 border-border/50 hover:border-primary/50 text-xs sm:text-sm"
              >
                {extra.label}
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Placement - between features and how-it-works */}
      <AdPlacement format="horizontal" className="py-4" />

      {/* Lead Capture */}
      <LeadCaptureBar sourcePage="landing" className="py-6" />

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-24 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">How It Works</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              From Chaos to
              <br />
              <span className="text-primary">Clarity in Minutes</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Set Up Your Floor",
                description: "Add your work centers, machines, and stations. Organize by team or department. Takes less than 5 minutes.",
                icon: Wrench,
              },
              {
                step: "02",
                title: "Log Handoffs in Real-Time",
                description: "Operators complete digital handoffs at shift change. Job status, machine condition, quality notes—all captured.",
                icon: FileText,
              },
              {
                step: "03",
                title: "Gain Visibility",
                description: "Supervisors and incoming shifts see everything instantly. No hunting for information. No lost context.",
                icon: Gauge,
              },
              {
                step: "04",
                title: "Improve Continuously",
                description: "Track performance, identify patterns, and implement operator suggestions. Data-driven manufacturing.",
                icon: BarChart3,
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-bold text-sm sm:text-base flex-shrink-0">
                    {item.step}
                  </div>
                  {i < 3 && <div className="w-0.5 h-full bg-border mt-2 sm:mt-4" />}
                </div>
                <div className="flex-1 pb-4 sm:pb-6 md:pb-8">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">Testimonials</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Trusted by
              <br />
              <span className="text-primary">Manufacturing Leaders</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-card border border-border rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-12">
              <div className="absolute top-4 left-4 sm:top-8 sm:left-8 text-4xl sm:text-5xl md:text-6xl text-primary/20 font-serif">"</div>
              
              <div className="relative pt-6 sm:pt-4">
                {testimonials.map((testimonial, i) => (
                  <div
                    key={i}
                    className={cn(
                      "transition-all duration-500",
                      activeTestimonial === i ? "opacity-100" : "opacity-0 absolute inset-0"
                    )}
                  >
                    <blockquote className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                      {testimonial.quote}
                    </blockquote>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm sm:text-lg font-bold text-primary">
                          {testimonial.author.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-sm sm:text-base">{testimonial.author}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-6 sm:mt-8">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleTestimonialChange(i, 'click')}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      activeTestimonial === i ? "bg-primary w-5 sm:w-6" : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className="py-12 sm:py-16 md:py-24 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">Enterprise Security</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">SOC 2 compliant. Your data is encrypted at rest and in transit.</p>
            </div>
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">Works Everywhere</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Access from any device. Desktop, tablet, or shop floor terminal.</p>
            </div>
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">99.9% Uptime</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Reliable infrastructure. Your production never stops, neither do we.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Placement - before final CTA */}
      <AdPlacement format="horizontal" className="py-4" />

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-4xl mx-auto text-center">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/10 to-primary/10 rounded-2xl sm:rounded-3xl blur-2xl sm:blur-3xl" />
            
            <div className="relative bg-card border border-border rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-12 lg:p-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                Ready to Transform
                <br />
                Your Shift Handoffs?
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-5 sm:mb-6 md:mb-8 max-w-xl mx-auto px-2">
                Join hundreds of manufacturing teams already using JobLine.ai. 
                Start your free trial today—no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Button size="lg" onClick={() => {
                  handleCtaClick('start_free_trial', 'bottom_cta_section');
                  navigate("/auth");
                }} className="gap-2 text-sm sm:text-base px-6 sm:px-8 h-10 sm:h-12 w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => {
                  handleCtaClick('view_pricing', 'bottom_cta_section');
                  navigate("/pricing");
                }} className="gap-2 text-sm sm:text-base px-6 sm:px-8 h-10 sm:h-12 w-full sm:w-auto">
                  View Pricing
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <img src={joblineLogo} alt="JobLine.ai" className="h-6 sm:h-8 w-auto mb-3" />
              <p className="text-xs text-muted-foreground">Digital expeditor & smart shift handoff system for manufacturing.</p>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Features</h4>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <button onClick={() => navigate('/features/shift-handoff-software')} className="text-left hover:text-foreground transition-colors">Shift Handoffs</button>
                <button onClick={() => navigate('/features/work-order-tracking')} className="text-left hover:text-foreground transition-colors">Work Order Tracking</button>
                <button onClick={() => navigate('/features/digital-expeditor')} className="text-left hover:text-foreground transition-colors">Digital Expeditor</button>
                <button onClick={() => navigate('/features/production-control')} className="text-left hover:text-foreground transition-colors">Production Control</button>
                <button onClick={() => navigate('/features/manufacturing-oversight')} className="text-left hover:text-foreground transition-colors">Manufacturing Oversight</button>
              </div>
            </div>

            {/* More Features */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Solutions</h4>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <button onClick={() => navigate('/features/machine-shop-software')} className="text-left hover:text-foreground transition-colors">Machine Shop Software</button>
                <button onClick={() => navigate('/features/quality-management')} className="text-left hover:text-foreground transition-colors">Quality Management</button>
                <button onClick={() => navigate('/features/cnc-operator-tools')} className="text-left hover:text-foreground transition-colors">CNC Operator Tools</button>
                <button onClick={() => navigate('/features/team-collaboration')} className="text-left hover:text-foreground transition-colors">Team Collaboration</button>
                <button onClick={() => navigate('/features/downtime-tracking')} className="text-left hover:text-foreground transition-colors">Downtime Tracking</button>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <button onClick={() => navigate('/pricing')} className="text-left hover:text-foreground transition-colors">Pricing</button>
                <a href="#" onClick={() => handleFooterLinkClick('privacy')} className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" onClick={() => handleFooterLinkClick('terms')} className="hover:text-foreground transition-colors">Terms</a>
                <a href="#" onClick={() => handleFooterLinkClick('contact')} className="hover:text-foreground transition-colors">Contact</a>
                <SupportJoblineModal 
                  trigger={
                    <button 
                      onClick={() => handleFooterLinkClick('support_jobline')}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors text-left"
                    >
                      <Heart className="w-3 h-3 text-red-500" />
                      Support JobLine
                    </button>
                  }
                />
              </div>
            </div>
          </div>
            
          <div className="border-t border-border pt-6 flex flex-col items-center gap-2 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              © 2026 JobLine.ai. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              A product of{" "}
              <a 
                href="https://www.wecr8.info" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                WeCr8 Solutions LLC
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Demo Video Modal */}
      <Dialog open={demoModalOpen} onOpenChange={(open) => {
        if (!open) handleDemoModalClose();
        else setDemoModalOpen(true);
      }}>
        <DialogContent className="sm:max-w-4xl p-0 bg-black border-border overflow-hidden">
          <div className="relative w-full aspect-video">
            {/* Close button overlay */}
            <button
              onClick={handleDemoModalClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Product Demo Video */}
            <video 
              src={demoVideo}
              className="w-full h-full object-cover"
              controls
              autoPlay
              playsInline
              onPlay={() => trackEvent('demo_video_played', { source: 'modal' })}
              onEnded={() => trackEvent('demo_video_completed', { source: 'modal' })}
            >
              Your browser does not support the video tag.
            </video>
            
            {/* 
              To embed an actual video, replace the placeholder div above with:
              
              YouTube:
              <iframe 
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1" 
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              
              Vimeo:
              <iframe 
                src="https://player.vimeo.com/video/YOUR_VIDEO_ID?autoplay=1"
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            */}
          </div>
        </DialogContent>
      </Dialog>
      <LeadCaptureModal />
    </div>
  );
}
