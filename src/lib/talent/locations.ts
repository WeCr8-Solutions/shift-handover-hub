// Reference data for talent profile location dropdowns + autocomplete.

export const COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "IE", name: "Ireland" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "TW", name: "Taiwan" },
  { code: "SG", name: "Singapore" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
];

export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
  { code: "DC", name: "District of Columbia" },
];

export const CA_PROVINCES: { code: string; name: string }[] = [
  { code: "AB", name: "Alberta" }, { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" }, { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" }, { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" }, { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" }, { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" }, { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
];

// Top US manufacturing-hub cities for autocomplete suggestions.
export const SUGGESTED_CITIES = [
  "Los Angeles", "San Diego", "San Jose", "Phoenix", "Tucson",
  "Houston", "Dallas", "Austin", "San Antonio", "El Paso",
  "Chicago", "Rockford", "Milwaukee", "Detroit", "Grand Rapids",
  "Cleveland", "Cincinnati", "Columbus", "Indianapolis", "Louisville",
  "Pittsburgh", "Philadelphia", "New York", "Buffalo", "Rochester",
  "Boston", "Worcester", "Hartford", "Charlotte", "Greenville",
  "Atlanta", "Nashville", "Knoxville", "Birmingham", "Huntsville",
  "Minneapolis", "St. Paul", "Des Moines", "Omaha", "Wichita",
  "Denver", "Salt Lake City", "Boise", "Seattle", "Portland",
  "Toronto", "Mississauga", "Montreal", "Vancouver", "Calgary",
];

export const SUGGESTED_HEADLINES = [
  "Senior CNC Machinist · Mazak / Haas / Doosan",
  "CNC Programmer & Setup — 5-axis Mill",
  "Swiss Lathe Operator (Citizen / Star)",
  "Lead Manufacturing Engineer — Aerospace",
  "Quality Inspector · CMM / FAIR / AS9102",
  "Manual Mill & Lathe Machinist — Tool & Die",
  "EDM Specialist — Wire & Sinker",
  "Production Supervisor · Job Shop",
  "CMM Programmer (PC-DMIS / Calypso)",
  "Apprentice Machinist — Open to Learn",
];

export function getRegionsForCountry(country: string) {
  if (country === "US") return US_STATES;
  if (country === "CA") return CA_PROVINCES;
  return null;
}
