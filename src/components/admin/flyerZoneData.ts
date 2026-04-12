/**
 * San Diego County flyer drop campaign — zone master data.
 * NOT exported via /public. Admin-only import.
 *
 * Campaign: san_diego_drop  |  22 zones  |  190+ target businesses
 * utm_source=flyer  utm_medium=print  utm_campaign=san_diego_drop
 */

export interface FlyerZone {
  zoneNumber: number;
  zoneName: string;
  city: string;
  utmContent: string;
  fullUtmUrl: string;
  bitlyBackHalf: string;
  bitlyShortUrl: string;
  qrFilename: string;
}

const UTM_BASE =
  "https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=";

function zone(
  n: number,
  name: string,
  city: string,
  slug: string,
  bitlyHalf: string,
): FlyerZone {
  return {
    zoneNumber: n,
    zoneName: name,
    city,
    utmContent: slug,
    fullUtmUrl: `${UTM_BASE}${slug}`,
    bitlyBackHalf: bitlyHalf,
    bitlyShortUrl: `https://bit.ly/${bitlyHalf}`,
    qrFilename: `qr_${slug}.png`,
  };
}

export const FLYER_ZONES: FlyerZone[] = [
  zone(1,  "Wheatlands / Abraham Way",                   "Santee",         "z01_santee_wheatlands",    "jl-z01"),
  zone(2,  "Prospect / Buena Vista / Kenney",             "Santee",         "z02_santee_prospect",      "jl-z02"),
  zone(3,  "Cuyamaca / Pathway / Woodside",               "Santee",         "z03_santee_cuyamaca",      "jl-z03"),
  zone(4,  "Magnolia Ave Industrial",                     "El Cajon",       "z04_elcajon_magnolia",     "jl-z04"),
  zone(5,  "Raleigh / Vernon / Marshall",                 "El Cajon",       "z05_elcajon_raleigh",      "jl-z05"),
  zone(6,  "Bradley / Greenfield / Pioneer",              "El Cajon",       "z06_elcajon_bradley",      "jl-z06"),
  zone(7,  "Gillespie Field Aerospace",                   "El Cajon",       "z07_elcajon_gillespie",    "jl-z07"),
  zone(8,  "Bond / Olde Hwy 80 / East El Cajon",         "El Cajon",       "z08_elcajon_bond",         "jl-z08"),
  zone(9,  "Woodside / Riverside / Winter Gardens / Maine Ave", "Lakeside", "z09_lakeside",             "jl-z09"),
  zone(10, "La Mesa — Auto / CNC / Gunsmiths",            "La Mesa",        "z10_lamesa",               "jl-z10"),
  zone(11, "Spring Valley / Rancho San Diego",            "Spring Valley",  "z11_springvalley",         "jl-z11"),
  zone(12, "Poway Industrial Corridor",                   "Poway",          "z12_poway",                "jl-z12"),
  zone(13, "Miramar / Mira Mesa CNC & Manufacturing",     "San Diego",      "z13_miramar",              "jl-z13"),
  zone(14, "Firearms / Gunsmiths — Regional",             "San Diego County","z14_firearms_regional",   "jl-z14"),
  zone(15, "Mission Gorge / Railroad — Santee North",     "Santee",         "z15_santee_missiongorge",  "jl-z15"),
  zone(16, "Lemon Grove",                                 "Lemon Grove",    "z16_lemongrove",           "jl-z16"),
  zone(17, "National City Industrial Corridor",           "National City",  "z17_nationalcity",         "jl-z17"),
  zone(18, "Chula Vista",                                 "Chula Vista",    "z18_chulavista",           "jl-z18"),
  zone(19, "Kearny Mesa / Convoy / Mission Valley",       "San Diego",      "z19_kearnymesa",           "jl-z19"),
  zone(20, "Mid-City / South Park / Imperial Ave",        "San Diego",      "z20_midcity",              "jl-z20"),
  zone(21, "Point Loma / Ocean Beach",                    "San Diego",      "z21_pointloma",            "jl-z21"),
  zone(22, "Sorrento Valley / Mesa Rim",                  "San Diego",      "z22_sorrentovalley",       "jl-z22"),
];

export const ZONE_BY_NUMBER = Object.fromEntries(
  FLYER_ZONES.map(z => [z.zoneNumber, z]),
) as Record<number, FlyerZone>;

export const ZONE_BY_UTM = Object.fromEntries(
  FLYER_ZONES.map(z => [z.utmContent, z]),
) as Record<string, FlyerZone>;

/** CSV export string — for printer/external use, generated on-demand in the browser */
export function exportZonesToCsv(): string {
  const header = "Zone #,Zone Name,City / Area,UTM Content,Full UTM URL,Bitly Back-Half,Bitly Short URL,QR Filename";
  const rows = FLYER_ZONES.map(z =>
    [z.zoneNumber, `"${z.zoneName}"`, `"${z.city}"`, z.utmContent, z.fullUtmUrl, z.bitlyBackHalf, z.bitlyShortUrl, z.qrFilename].join(","),
  );
  return [header, ...rows].join("\n");
}
