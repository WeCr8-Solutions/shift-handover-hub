import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  GraduationCap,
  Award,
  Wrench,
  Users,
  BarChart3,
  Eye,
  ArrowRight,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const items = [
  { label: "G-Code Academy", to: "/gcode-academy", Icon: GraduationCap, key: "gca" },
  { label: "Operator Acceptance Program", to: "/oap", Icon: Award, key: "oap" },
  { label: "Shift Handoffs Solved", to: "/features/shift-handoff", Icon: Zap, key: "handoff" },
  { label: "Manufacturing Visibility", to: "/manufacturing-visibility", Icon: Eye, key: "visibility" },
  { label: "Speed & Feed Calculator", to: "/tools/speed-feed", Icon: Wrench, key: "speedfeed" },
  { label: "Talent Network", to: "/talent", Icon: Users, key: "talent" },
  { label: "Production Analytics", to: "/features/production-control", Icon: BarChart3, key: "analytics" },
];

export function RotatingHeroBadge() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const item = items[index];
  const { Icon } = item;

  return (
    <div className="mb-3 sm:mb-4 flex justify-center">
      <Link
        to={item.to}
        onClick={() =>
          trackEvent("hero_badge_click", {
            destination: item.to,
            label: item.label,
            key: item.key,
          })
        }
        aria-label={`Explore ${item.label}`}
        className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm transition-all hover:border-primary/60 hover:bg-primary/10"
      >
        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary flex-shrink-0" />
        <span
          key={item.key}
          className="animate-fade-in font-medium text-foreground"
        >
          {item.label}
        </span>
        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/70 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
