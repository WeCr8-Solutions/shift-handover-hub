import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Image as ImageIcon,
  Quote,
  Clock,
  MapPin,
  Download,
  ExternalLink,
} from "lucide-react";
import type {
  ServiceItem,
  GalleryItem,
  TestimonialItem,
  BusinessHours,
} from "@/lib/talent/miniSiteTypes";
import { DAY_LABELS } from "@/lib/talent/miniSiteTypes";
import { downloadVCard, type VCardInput } from "@/lib/talent/vcard";

/** Services offered (for freelancers / job-shop operators / consultants). */
export function ServicesSection({ services }: { services: ServiceItem[] }) {
  if (!services?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" /> Services
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((s) => (
            <div key={s.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm leading-tight">{s.title}</p>
                {s.price && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {s.price}
                  </Badge>
                )}
              </div>
              {s.description && (
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {s.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Photo / portfolio gallery with lightbox-ish click-to-open. */
export function GallerySection({ items }: { items: GalleryItem[] }) {
  if (!items?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" /> Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((g) => (
            <a
              key={g.id}
              href={g.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square overflow-hidden rounded-md border bg-muted/50 group"
            >
              <img
                src={g.url}
                alt={g.caption ?? "Portfolio item"}
                loading="lazy"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Customer / supervisor testimonials. */
export function TestimonialsSection({ items }: { items: TestimonialItem[] }) {
  if (!items?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Quote className="w-5 h-5 text-primary" /> Testimonials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((t) => (
          <figure key={t.id} className="rounded-lg border bg-muted/30 p-4">
            <blockquote className="text-sm leading-relaxed italic">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-xs text-muted-foreground">
              — <strong>{t.author}</strong>
              {t.role ? `, ${t.role}` : ""}
            </figcaption>
          </figure>
        ))}
      </CardContent>
    </Card>
  );
}

/** Business hours grid. */
export function BusinessHoursSection({ hours }: { hours: BusinessHours | null }) {
  if (!hours) return null;
  const anyOpen = DAY_LABELS.some(({ key }) => hours[key]);
  if (!anyOpen && !hours.notes) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-sm">
          {DAY_LABELS.map(({ key, label }) => {
            const slot = hours[key] as { open: string; close: string } | null;
            return (
              <div key={key} className="flex justify-between gap-3">
                <dt className="font-medium text-foreground">{label}</dt>
                <dd className="text-muted-foreground">
                  {slot ? `${slot.open}–${slot.close}` : "Closed"}
                </dd>
              </div>
            );
          })}
        </dl>
        {hours.notes && (
          <p className="mt-3 text-xs text-muted-foreground italic">{hours.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Static map link (OpenStreetMap) — no API key needed. */
export function LocationMapSection({
  city,
  region,
  country,
  latitude,
  longitude,
}: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const labelParts = [city, region, country].filter(Boolean);
  if (!labelParts.length && latitude == null) return null;
  const label = labelParts.join(", ") || `${latitude}, ${longitude}`;
  const mapUrl =
    latitude != null && longitude != null
      ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent(label)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" /> Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">{label}</p>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Open in maps <ExternalLink className="w-3 h-3" />
        </a>
      </CardContent>
    </Card>
  );
}

/** Save-contact (vCard) call-to-action. */
export function SaveContactButton({
  vcard,
  label = "Save contact",
  className,
}: {
  vcard: VCardInput;
  label?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => downloadVCard(vcard)}
      className={`gap-2 ${className ?? ""}`}
    >
      <Download className="w-4 h-4" /> {label}
    </Button>
  );
}
