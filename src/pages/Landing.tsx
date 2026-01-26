import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  Users, 
  Clock, 
  BarChart3, 
  CheckCircle2,
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
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Clock,
    title: "Real-Time Handoffs",
    description: "Seamless shift transitions with live status updates. Never miss critical information between shifts again.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Gauge,
    title: "Station Monitoring",
    description: "Track every CNC, lathe, and work center in real-time. Instant visibility into machine status and job progress.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: FileText,
    title: "Performance Updates",
    description: "Operators submit improvements, setup changes, and adjustments with photo attachments. Continuous improvement built-in.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Organize operators by teams, assign roles, and manage permissions. Built for multi-shift operations.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track parts produced, scrap rates, cycle times, and handoff efficiency. Data-driven decision making.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified about machine issues, quality holds, and pending reviews. Stay ahead of problems.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
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
  const { user } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Factory className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              JobLine<span className="text-primary">.ai</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate("/dashboard")} className="gap-2">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden sm:flex">
                  Sign In
                </Button>
                <Button onClick={() => navigate("/auth")} className="gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/30 bg-primary/5">
              <Zap className="w-3.5 h-3.5 mr-2 text-primary" />
              Built for Manufacturing Teams
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Shift Handoffs.
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Finally Solved.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              The intelligent job tracking platform that makes shift transitions seamless. 
              Real-time visibility, zero information loss, better production outcomes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 text-base px-8 h-12">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="text-center p-4">
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="relative max-w-6xl mx-auto">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-blue-500/20 to-primary/20 rounded-2xl blur-2xl opacity-50" />
            
            {/* Mock Dashboard */}
            <div className="relative bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Window Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-background/50 rounded-lg text-xs text-muted-foreground font-mono">
                    jobline.ai/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard Content */}
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Factory className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Production Floor</h3>
                      <p className="text-xs text-muted-foreground">Day Shift • 12 Active Stations</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                    All Systems Operational
                  </Badge>
                </div>
                
                {/* Station Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: "CNC-01", status: "running", part: "PN-4521", progress: 78 },
                    { id: "CNC-02", status: "running", part: "PN-8832", progress: 45 },
                    { id: "LATHE-01", status: "setup", part: "PN-1127", progress: 0 },
                    { id: "MILL-03", status: "running", part: "PN-9943", progress: 92 },
                  ].map((station) => (
                    <div key={station.id} className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-medium">{station.id}</span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          station.status === "running" ? "bg-green-400" : "bg-amber-400"
                        )} />
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{station.part}</div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${station.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <br />
              <span className="text-primary">Run Better Shifts</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Purpose-built for manufacturing operations. No more spreadsheets, whiteboards, or lost information.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", feature.bg)}>
                  <feature.icon className={cn("w-6 h-6", feature.color)} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
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
              <div key={i} className="flex gap-6 mb-12 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-bold">
                    {item.step}
                  </div>
                  {i < 3 && <div className="w-0.5 h-full bg-border mt-4" />}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <item.icon className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Trusted by
              <br />
              <span className="text-primary">Manufacturing Leaders</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-card border border-border rounded-2xl p-8 md:p-12">
              <div className="absolute top-8 left-8 text-6xl text-primary/20 font-serif">"</div>
              
              <div className="relative">
                {testimonials.map((testimonial, i) => (
                  <div
                    key={i}
                    className={cn(
                      "transition-all duration-500",
                      activeTestimonial === i ? "opacity-100" : "opacity-0 absolute inset-0"
                    )}
                  >
                    <blockquote className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">
                      {testimonial.quote}
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {testimonial.author.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      activeTestimonial === i ? "bg-primary w-6" : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className="py-20 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Enterprise Security</h3>
              <p className="text-sm text-muted-foreground">SOC 2 compliant. Your data is encrypted at rest and in transit.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Works Everywhere</h3>
              <p className="text-sm text-muted-foreground">Access from any device. Desktop, tablet, or shop floor terminal.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">99.9% Uptime</h3>
              <p className="text-sm text-muted-foreground">Reliable infrastructure. Your production never stops, neither do we.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="relative max-w-4xl mx-auto text-center">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/10 to-primary/10 rounded-3xl blur-3xl" />
            
            <div className="relative bg-card border border-border rounded-2xl p-8 md:p-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to Transform
                <br />
                Your Shift Handoffs?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join hundreds of manufacturing teams already using JobLine.ai. 
                Start your free trial today—no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 text-base px-8 h-12">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12">
                  Schedule Demo
                  <ArrowUpRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Factory className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                JobLine<span className="text-primary">.ai</span>
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2026 JobLine.ai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
