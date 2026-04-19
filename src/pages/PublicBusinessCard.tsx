import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Phone,
  Globe,
  Linkedin,
  MapPin,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SaveContactButton } from "@/components/talent/MiniSiteSections";
import { useProfileViewTracker } from "@/hooks/useProfileViewTracker";
import { getPublicTalentUrl } from "@/lib/talent/publicHost";
import { withJoblineUtm } from "@/lib/talent/outboundLinks";

interface CardRow {
  user_id: string;
  card_slug: string;
  public_username: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  vcard_full_name: string | null;
  vcard_title: string | null;
  vcard_company: string | null;
  theme_color: string | null;
  accent_color: string | null;
  cta_label: string | null;
  cta_url: string | null;
  open_to_work: boolean;
  profile_visibility: string;
}

/**
 * Compact, mobile-first digital business card at /card/:slug.
 *
 * Designed to be scanned from a printed QR sticker and immediately tap-to-save.
 * Renders a vCard download button, contact actions, and a deep-link to the full
 * /talent/:username profile when one exists.
 */
export default function PublicBusinessCard() {
  const { slug } = useParams<{ slug: string }>();
  const [row, setRow] = useState<CardRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useProfileViewTracker("card", slug ?? null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("operator_profiles")
        .select(
          `user_id, card_slug, public_username, avatar_url, headline, bio,
           location_city, location_region, location_country,
           contact_email, contact_phone, linkedin_url, portfolio_url,
           vcard_full_name, vcard_title, vcard_company,
           theme_color, accent_color, cta_label, cta_url,
           open_to_work, profile_visibility`
        )
        .eq("card_slug", slug)
        .eq("profile_visibility", "public")
        .maybeSingle();
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
      } else {
        setRow(data as unknown as CardRow);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Skeleton className="h-[28rem] w-full max-w-md" />
      </main>
    );
  }

  if (notFound || !row) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <SEOHead title="Card not found" noindex canonical={`/card/${slug ?? ""}`} />
        <div className="text-center space-y-3 max-w-sm">
          <h1 className="text-2xl font-bold">Card not found</h1>
          <p className="text-sm text-muted-foreground">
            This business card is private or no longer published.
          </p>
          <Button asChild>
            <Link to="/">Back to JobLine</Link>
          </Button>
        </div>
      </main>
    );
  }

  const fullName = row.vcard_full_name ?? row.public_username ?? "JobLine member";
  const location = [row.location_city, row.location_region, row.location_country]
    .filter(Boolean)
    .join(", ");
  const cardUrl = `${typeof window !== "undefined" ? window.location.origin : "https://jobline.ai"}/card/${row.card_slug}`;

  // Theme via inline CSS variables — falls back to design tokens.
  const themeStyle: React.CSSProperties = {
    // Use the talent's chosen color as the page accent if provided.
    ...(row.theme_color ? { ["--card-theme" as string]: row.theme_color } : {}),
    ...(row.accent_color ? { ["--card-accent" as string]: row.accent_color } : {}),
  };

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40 flex items-center justify-center p-4"
      style={themeStyle}
    >
      <SEOHead
        title={`${fullName} — Digital Business Card`}
        description={row.headline ?? `Save ${fullName}'s contact info instantly via JobLine.`}
        canonical={`/card/${row.card_slug}`}
        ogType="profile"
        ogImage={row.avatar_url ?? undefined}
      />

      <Card className="w-full max-w-md overflow-hidden border-2 shadow-xl">
        <div
          className="h-20 w-full"
          style={{
            background: row.theme_color
              ? `linear-gradient(135deg, ${row.theme_color}, ${row.accent_color ?? row.theme_color})`
              : "hsl(var(--primary))",
          }}
          aria-hidden
        />

        <CardContent className="-mt-12 pb-6 space-y-4">
          <div className="flex items-end gap-3">
            <Avatar className="h-24 w-24 ring-4 ring-background">
              {row.avatar_url && <AvatarImage src={row.avatar_url} alt={fullName} />}
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {row.open_to_work && (
              <Badge className="mb-2 bg-success/15 text-success border-success/30">
                <Briefcase className="w-3 h-3 mr-1" /> Open to work
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold leading-tight">{fullName}</h1>
            {(row.vcard_title || row.headline) && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {row.vcard_title ?? row.headline}
              </p>
            )}
            {row.vcard_company && (
              <p className="text-xs text-muted-foreground mt-0.5">{row.vcard_company}</p>
            )}
          </div>

          <div className="space-y-1.5 text-sm">
            {row.contact_email && (
              <a
                href={`mailto:${row.contact_email}`}
                className="flex items-center gap-2 text-foreground hover:text-primary"
              >
                <Mail className="w-4 h-4" /> {row.contact_email}
              </a>
            )}
            {row.contact_phone && (
              <a
                href={`tel:${row.contact_phone}`}
                className="flex items-center gap-2 text-foreground hover:text-primary"
              >
                <Phone className="w-4 h-4" /> {row.contact_phone}
              </a>
            )}
            {row.portfolio_url && (
              <a
                href={withJoblineUtm(row.portfolio_url, "business_card")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-foreground hover:text-primary break-all"
              >
                <Globe className="w-4 h-4 shrink-0" /> {row.portfolio_url}
              </a>
            )}
            {row.linkedin_url && (
              <a
                href={withJoblineUtm(row.linkedin_url, "business_card")}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex items-center gap-2 text-foreground hover:text-primary break-all"
              >
                <Linkedin className="w-4 h-4 shrink-0" /> LinkedIn
              </a>
            )}
            {location && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" /> {location}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <SaveContactButton
              vcard={{
                fullName,
                title: row.vcard_title ?? row.headline,
                company: row.vcard_company,
                email: row.contact_email,
                phone: row.contact_phone,
                website: row.portfolio_url,
                addressCity: row.location_city,
                addressRegion: row.location_region,
                addressCountry: row.location_country,
                profileUrl: row.public_username
                  ? getPublicTalentUrl(row.public_username)
                  : cardUrl,
              }}
              className="w-full"
            />

            {row.cta_url && (
              <Button asChild className="w-full">
                <a href={row.cta_url} target="_blank" rel="noopener noreferrer">
                  {row.cta_label ?? "Get in touch"} <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
            )}

            {row.public_username && (
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link to={`/talent/${row.public_username}`}>
                  View full profile <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          <div className="pt-3 border-t flex items-center gap-3">
            <div className="rounded-md border p-1.5 bg-background">
              <QRCodeSVG
                value={cardUrl}
                size={64}
                level="M"
                fgColor="hsl(var(--foreground))"
                bgColor="transparent"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                Share this card — scan or copy
              </p>
              <p className="text-xs font-mono text-foreground break-all">{cardUrl}</p>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground pt-2">
            Powered by{" "}
            <Link to="/" className="text-primary hover:underline">
              JobLine.ai
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
