import { eq } from "drizzle-orm";

import { db } from "../db";
import {
  continents,
  countries,
  countriesContinents,
} from "../schema/geography";

const countryData = [
  {
    name: "Afghanistan",
    iso2: "AF",
    iso3: "AFG",
    continents: ["asia"],
  },
  {
    name: "Albania",
    iso2: "AL",
    iso3: "ALB",
    continents: ["europe"],
  },
  {
    name: "Algeria",
    iso2: "DZ",
    iso3: "DZA",
    continents: ["africa"],
  },
  {
    name: "Andorra",
    iso2: "AD",
    iso3: "AND",
    continents: ["europe"],
  },
  {
    name: "Angola",
    iso2: "AO",
    iso3: "AGO",
    continents: ["africa"],
  },
  {
    name: "Antigua and Barbuda",
    iso2: "AG",
    iso3: "ATG",
    continents: ["north-america"],
  },
  {
    name: "Argentina",
    iso2: "AR",
    iso3: "ARG",
    continents: ["south-america"],
  },
  {
    name: "Armenia",
    iso2: "AM",
    iso3: "ARM",
    continents: ["asia"],
  },
  {
    name: "Australia",
    iso2: "AU",
    iso3: "AUS",
    continents: ["oceania"],
  },
  {
    name: "Austria",
    iso2: "AT",
    iso3: "AUT",
    continents: ["europe"],
  },
  {
    name: "Azerbaijan",
    iso2: "AZ",
    iso3: "AZE",
    continents: ["asia", "europe"],
  },
  {
    name: "The Bahamas",
    iso2: "BS",
    iso3: "BHS",
    continents: ["north-america"],
  },
  {
    name: "Bahrain",
    iso2: "BH",
    iso3: "BHR",
    continents: ["asia"],
  },
  {
    name: "Bangladesh",
    iso2: "BD",
    iso3: "BGD",
    continents: ["asia"],
  },
  {
    name: "Barbados",
    iso2: "BB",
    iso3: "BRB",
    continents: ["north-america"],
  },
  {
    name: "Belarus",
    iso2: "BY",
    iso3: "BLR",
    continents: ["europe"],
  },
  {
    name: "Belgium",
    iso2: "BE",
    iso3: "BEL",
    continents: ["europe"],
  },
  {
    name: "Belize",
    iso2: "BZ",
    iso3: "BLZ",
    continents: ["north-america"],
  },
  {
    name: "Benin",
    iso2: "BJ",
    iso3: "BEN",
    continents: ["africa"],
  },
  {
    name: "Bhutan",
    iso2: "BT",
    iso3: "BTN",
    continents: ["asia"],
  },
  {
    name: "Bolivia",
    iso2: "BO",
    iso3: "BOL",
    continents: ["south-america"],
  },
  {
    name: "Bosnia and Herzegovina",
    iso2: "BA",
    iso3: "BIH",
    continents: ["europe"],
  },
  {
    name: "Botswana",
    iso2: "BW",
    iso3: "BWA",
    continents: ["africa"],
  },
  {
    name: "Brazil",
    iso2: "BR",
    iso3: "BRA",
    continents: ["south-america"],
  },
  {
    name: "Brunei",
    iso2: "BN",
    iso3: "BRN",
    continents: ["asia"],
  },
  {
    name: "Bulgaria",
    iso2: "BG",
    iso3: "BGR",
    continents: ["europe"],
  },
  {
    name: "Burkina Faso",
    iso2: "BF",
    iso3: "BFA",
    continents: ["africa"],
  },
  {
    name: "Burundi",
    iso2: "BI",
    iso3: "BDI",
    continents: ["africa"],
  },
  {
    name: "Cambodia",
    iso2: "KH",
    iso3: "KHM",
    continents: ["asia"],
  },
  {
    name: "Cameroon",
    iso2: "CM",
    iso3: "CMR",
    continents: ["africa"],
  },
  {
    name: "Canada",
    iso2: "CA",
    iso3: "CAN",
    continents: ["north-america"],
  },
  {
    name: "Cape Verde",
    iso2: "CV",
    iso3: "CPV",
    continents: ["africa"],
  },
  {
    name: "Central African Republic",
    iso2: "CF",
    iso3: "CAF",
    continents: ["africa"],
  },
  {
    name: "Chad",
    iso2: "TD",
    iso3: "TCD",
    continents: ["africa"],
  },
  {
    name: "Chile",
    iso2: "CL",
    iso3: "CHL",
    continents: ["south-america"],
  },
  {
    name: "China",
    iso2: "CN",
    iso3: "CHN",
    continents: ["asia"],
  },
  {
    name: "Colombia",
    iso2: "CO",
    iso3: "COL",
    continents: ["south-america"],
  },
  {
    name: "Comoros",
    iso2: "KM",
    iso3: "COM",
    continents: ["africa"],
  },
  {
    name: "Republic of the Congo",
    iso2: "CG",
    iso3: "COG",
    continents: ["africa"],
  },
  {
    name: "Democratic Republic of the Congo",
    iso2: "CD",
    iso3: "COD",
    continents: ["africa"],
  },
  {
    name: "Costa Rica",
    iso2: "CR",
    iso3: "CRI",
    continents: ["north-america"],
  },
  {
    name: "Côte d'Ivoire",
    iso2: "CI",
    iso3: "CIV",
    continents: ["africa"],
  },
  {
    name: "Croatia",
    iso2: "HR",
    iso3: "HRV",
    continents: ["europe"],
  },
  {
    name: "Cuba",
    iso2: "CU",
    iso3: "CUB",
    continents: ["north-america"],
  },
  {
    name: "Cyprus",
    iso2: "CY",
    iso3: "CYP",
    continents: ["asia", "europe"],
  },
  {
    name: "Czechia",
    iso2: "CZ",
    iso3: "CZE",
    continents: ["europe"],
  },
  {
    name: "Denmark",
    iso2: "DK",
    iso3: "DNK",
    continents: ["europe"],
  },
  {
    name: "Djibouti",
    iso2: "DJ",
    iso3: "DJI",
    continents: ["africa"],
  },
  {
    name: "Dominica",
    iso2: "DM",
    iso3: "DMA",
    continents: ["north-america"],
  },
  {
    name: "Dominican Republic",
    iso2: "DO",
    iso3: "DOM",
    continents: ["north-america"],
  },
  {
    name: "Timor-Leste",
    iso2: "TL",
    iso3: "TLS",
    continents: ["asia"],
  },
  {
    name: "Ecuador",
    iso2: "EC",
    iso3: "ECU",
    continents: ["south-america"],
  },
  {
    name: "Egypt",
    iso2: "EG",
    iso3: "EGY",
    continents: ["africa", "asia"],
  },
  {
    name: "El Salvador",
    iso2: "SV",
    iso3: "SLV",
    continents: ["north-america"],
  },
  {
    name: "Equatorial Guinea",
    iso2: "GQ",
    iso3: "GNQ",
    continents: ["africa"],
  },
  {
    name: "Eritrea",
    iso2: "ER",
    iso3: "ERI",
    continents: ["africa"],
  },
  {
    name: "Estonia",
    iso2: "EE",
    iso3: "EST",
    continents: ["europe"],
  },
  {
    name: "Eswatini",
    iso2: "SZ",
    iso3: "SWZ",
    continents: ["africa"],
  },
  {
    name: "Ethiopia",
    iso2: "ET",
    iso3: "ETH",
    continents: ["africa"],
  },
  {
    name: "Fiji",
    iso2: "FJ",
    iso3: "FJI",
    continents: ["oceania"],
  },
  {
    name: "Finland",
    iso2: "FI",
    iso3: "FIN",
    continents: ["europe"],
  },
  {
    name: "France",
    iso2: "FR",
    iso3: "FRA",
    continents: ["europe"],
  },
  {
    name: "Gabon",
    iso2: "GA",
    iso3: "GAB",
    continents: ["africa"],
  },
  {
    name: "The Gambia",
    iso2: "GM",
    iso3: "GMB",
    continents: ["africa"],
  },
  {
    name: "Georgia",
    iso2: "GE",
    iso3: "GEO",
    continents: ["asia", "europe"],
  },
  {
    name: "Germany",
    iso2: "DE",
    iso3: "DEU",
    continents: ["europe"],
  },
  {
    name: "Ghana",
    iso2: "GH",
    iso3: "GHA",
    continents: ["africa"],
  },
  {
    name: "Greece",
    iso2: "GR",
    iso3: "GRC",
    continents: ["europe"],
  },
  {
    name: "Grenada",
    iso2: "GD",
    iso3: "GRD",
    continents: ["north-america"],
  },
  {
    name: "Guatemala",
    iso2: "GT",
    iso3: "GTM",
    continents: ["north-america"],
  },
  {
    name: "Guinea",
    iso2: "GN",
    iso3: "GIN",
    continents: ["africa"],
  },
  {
    name: "Guinea-Bissau",
    iso2: "GW",
    iso3: "GNB",
    continents: ["africa"],
  },
  {
    name: "Guyana",
    iso2: "GY",
    iso3: "GUY",
    continents: ["south-america"],
  },
  {
    name: "Haiti",
    iso2: "HT",
    iso3: "HTI",
    continents: ["north-america"],
  },
  {
    name: "Honduras",
    iso2: "HN",
    iso3: "HND",
    continents: ["north-america"],
  },
  {
    name: "Hungary",
    iso2: "HU",
    iso3: "HUN",
    continents: ["europe"],
  },
  {
    name: "Iceland",
    iso2: "IS",
    iso3: "ISL",
    continents: ["europe"],
  },
  {
    name: "India",
    iso2: "IN",
    iso3: "IND",
    continents: ["asia"],
  },
  {
    name: "Indonesia",
    iso2: "ID",
    iso3: "IDN",
    continents: ["asia"],
  },
  {
    name: "Iran",
    iso2: "IR",
    iso3: "IRN",
    continents: ["asia"],
  },
  {
    name: "Iraq",
    iso2: "IQ",
    iso3: "IRQ",
    continents: ["asia"],
  },
  {
    name: "Ireland",
    iso2: "IE",
    iso3: "IRL",
    continents: ["europe"],
  },
  {
    name: "Israel",
    iso2: "IL",
    iso3: "ISR",
    continents: ["asia"],
  },
  {
    name: "Italy",
    iso2: "IT",
    iso3: "ITA",
    continents: ["europe"],
  },
  {
    name: "Jamaica",
    iso2: "JM",
    iso3: "JAM",
    continents: ["north-america"],
  },
  {
    name: "Japan",
    iso2: "JP",
    iso3: "JPN",
    continents: ["asia"],
  },
  {
    name: "Jordan",
    iso2: "JO",
    iso3: "JOR",
    continents: ["asia"],
  },
  {
    name: "Kazakhstan",
    iso2: "KZ",
    iso3: "KAZ",
    continents: ["asia", "europe"],
  },
  {
    name: "Kenya",
    iso2: "KE",
    iso3: "KEN",
    continents: ["africa"],
  },
  {
    name: "Kiribati",
    iso2: "KI",
    iso3: "KIR",
    continents: ["oceania"],
  },
  {
    name: "North Korea",
    iso2: "KP",
    iso3: "PRK",
    continents: ["asia"],
  },
  {
    name: "South Korea",
    iso2: "KR",
    iso3: "KOR",
    continents: ["asia"],
  },
  {
    name: "Kosovo",
    iso2: "XK",
    iso3: "XKX",
    continents: ["europe"],
  },
  {
    name: "Kuwait",
    iso2: "KW",
    iso3: "KWT",
    continents: ["asia"],
  },
  {
    name: "Kyrgyzstan",
    iso2: "KG",
    iso3: "KGZ",
    continents: ["asia"],
  },
  {
    name: "Laos",
    iso2: "LA",
    iso3: "LAO",
    continents: ["asia"],
  },
  {
    name: "Latvia",
    iso2: "LV",
    iso3: "LVA",
    continents: ["europe"],
  },
  {
    name: "Lebanon",
    iso2: "LB",
    iso3: "LBN",
    continents: ["asia"],
  },
  {
    name: "Lesotho",
    iso2: "LS",
    iso3: "LSO",
    continents: ["africa"],
  },
  {
    name: "Liberia",
    iso2: "LR",
    iso3: "LBR",
    continents: ["africa"],
  },
  {
    name: "Libya",
    iso2: "LY",
    iso3: "LBY",
    continents: ["africa"],
  },
  {
    name: "Liechtenstein",
    iso2: "LI",
    iso3: "LIE",
    continents: ["europe"],
  },
  {
    name: "Lithuania",
    iso2: "LT",
    iso3: "LTU",
    continents: ["europe"],
  },
  {
    name: "Luxembourg",
    iso2: "LU",
    iso3: "LUX",
    continents: ["europe"],
  },
  {
    name: "North Macedonia",
    iso2: "MK",
    iso3: "MKD",
    continents: ["europe"],
  },
  {
    name: "Madagascar",
    iso2: "MG",
    iso3: "MDG",
    continents: ["africa"],
  },
  {
    name: "Malawi",
    iso2: "MW",
    iso3: "MWI",
    continents: ["africa"],
  },
  {
    name: "Malaysia",
    iso2: "MY",
    iso3: "MYS",
    continents: ["asia"],
  },
  {
    name: "Maldives",
    iso2: "MV",
    iso3: "MDV",
    continents: ["asia"],
  },
  {
    name: "Mali",
    iso2: "ML",
    iso3: "MLI",
    continents: ["africa"],
  },
  {
    name: "Malta",
    iso2: "MT",
    iso3: "MLT",
    continents: ["europe"],
  },
  {
    name: "Marshall Islands",
    iso2: "MH",
    iso3: "MHL",
    continents: ["oceania"],
  },
  {
    name: "Mauritania",
    iso2: "MR",
    iso3: "MRT",
    continents: ["africa"],
  },
  {
    name: "Mauritius",
    iso2: "MU",
    iso3: "MUS",
    continents: ["africa"],
  },
  {
    name: "Mexico",
    iso2: "MX",
    iso3: "MEX",
    continents: ["north-america"],
  },
  {
    name: "Federated States of Micronesia",
    iso2: "FM",
    iso3: "FSM",
    continents: ["oceania"],
  },
  {
    name: "Moldova",
    iso2: "MD",
    iso3: "MDA",
    continents: ["europe"],
  },
  {
    name: "Monaco",
    iso2: "MC",
    iso3: "MCO",
    continents: ["europe"],
  },
  {
    name: "Mongolia",
    iso2: "MN",
    iso3: "MNG",
    continents: ["asia"],
  },
  {
    name: "Montenegro",
    iso2: "ME",
    iso3: "MNE",
    continents: ["europe"],
  },
  {
    name: "Morocco",
    iso2: "MA",
    iso3: "MAR",
    continents: ["africa"],
  },
  {
    name: "Mozambique",
    iso2: "MZ",
    iso3: "MOZ",
    continents: ["africa"],
  },
  {
    name: "Myanmar",
    iso2: "MM",
    iso3: "MMR",
    continents: ["asia"],
  },
  {
    name: "Namibia",
    iso2: "NA",
    iso3: "NAM",
    continents: ["africa"],
  },
  {
    name: "Naoero",
    iso2: "NR",
    iso3: "NRO",
    continents: ["oceania"],
  },
  {
    name: "Nepal",
    iso2: "NP",
    iso3: "NPL",
    continents: ["asia"],
  },
  {
    name: "Netherlands",
    iso2: "NL",
    iso3: "NLD",
    continents: ["europe"],
  },
  {
    name: "New Zealand",
    iso2: "NZ",
    iso3: "NZL",
    continents: ["oceania"],
  },
  {
    name: "Nicaragua",
    iso2: "NI",
    iso3: "NIC",
    continents: ["north-america"],
  },
  {
    name: "Niger",
    iso2: "NE",
    iso3: "NER",
    continents: ["africa"],
  },
  {
    name: "Nigeria",
    iso2: "NG",
    iso3: "NGA",
    continents: ["africa"],
  },
  {
    name: "Norway",
    iso2: "NO",
    iso3: "NOR",
    continents: ["europe"],
  },
  {
    name: "Oman",
    iso2: "OM",
    iso3: "OMN",
    continents: ["asia"],
  },
  {
    name: "Pakistan",
    iso2: "PK",
    iso3: "PAK",
    continents: ["asia"],
  },
  {
    name: "Palau",
    iso2: "PW",
    iso3: "PLW",
    continents: ["oceania"],
  },
  {
    name: "Palestine",
    iso2: "PS",
    iso3: "PSE",
    continents: ["asia"],
  },
  {
    name: "Panama",
    iso2: "PA",
    iso3: "PAN",
    continents: ["north-america"],
  },
  {
    name: "Papua New Guinea",
    iso2: "PG",
    iso3: "PNG",
    continents: ["oceania"],
  },
  {
    name: "Paraguay",
    iso2: "PY",
    iso3: "PRY",
    continents: ["south-america"],
  },
  {
    name: "Peru",
    iso2: "PE",
    iso3: "PER",
    continents: ["south-america"],
  },
  {
    name: "Philippines",
    iso2: "PH",
    iso3: "PHL",
    continents: ["asia"],
  },
  {
    name: "Poland",
    iso2: "PL",
    iso3: "POL",
    continents: ["europe"],
  },
  {
    name: "Portugal",
    iso2: "PT",
    iso3: "PRT",
    continents: ["europe"],
  },
  {
    name: "Qatar",
    iso2: "QA",
    iso3: "QAT",
    continents: ["asia"],
  },
  {
    name: "Romania",
    iso2: "RO",
    iso3: "ROU",
    continents: ["europe"],
  },
  {
    name: "Russia",
    iso2: "RU",
    iso3: "RUS",
    continents: ["europe", "asia"],
  },
  {
    name: "Rwanda",
    iso2: "RW",
    iso3: "RWA",
    continents: ["africa"],
  },
  {
    name: "Saint Kitts and Nevis",
    iso2: "KN",
    iso3: "KNA",
    continents: ["north-america"],
  },
  {
    name: "Saint Lucia",
    iso2: "LC",
    iso3: "LCA",
    continents: ["north-america"],
  },
  {
    name: "Saint Vincent and the Grenadines",
    iso2: "VC",
    iso3: "VCT",
    continents: ["north-america"],
  },
  {
    name: "Samoa",
    iso2: "WS",
    iso3: "WSM",
    continents: ["oceania"],
  },
  {
    name: "San Marino",
    iso2: "SM",
    iso3: "SMR",
    continents: ["europe"],
  },
  {
    name: "São Tomé and Príncipe",
    iso2: "ST",
    iso3: "STP",
    continents: ["africa"],
  },
  {
    name: "Saudi Arabia",
    iso2: "SA",
    iso3: "SAU",
    continents: ["asia"],
  },
  {
    name: "Senegal",
    iso2: "SN",
    iso3: "SEN",
    continents: ["africa"],
  },
  {
    name: "Serbia",
    iso2: "RS",
    iso3: "SRB",
    continents: ["europe"],
  },
  {
    name: "Seychelles",
    iso2: "SC",
    iso3: "SYC",
    continents: ["africa"],
  },
  {
    name: "Sierra Leone",
    iso2: "SL",
    iso3: "SLE",
    continents: ["africa"],
  },
  {
    name: "Singapore",
    iso2: "SG",
    iso3: "SGP",
    continents: ["asia"],
  },
  {
    name: "Slovakia",
    iso2: "SK",
    iso3: "SVK",
    continents: ["europe"],
  },
  {
    name: "Slovenia",
    iso2: "SI",
    iso3: "SVN",
    continents: ["europe"],
  },
  {
    name: "Solomon Islands",
    iso2: "SB",
    iso3: "SLB",
    continents: ["oceania"],
  },
  {
    name: "Somalia",
    iso2: "SO",
    iso3: "SOM",
    continents: ["africa"],
  },
  {
    name: "South Africa",
    iso2: "ZA",
    iso3: "ZAF",
    continents: ["africa"],
  },
  {
    name: "South Sudan",
    iso2: "SS",
    iso3: "SSD",
    continents: ["africa"],
  },
  {
    name: "Spain",
    iso2: "ES",
    iso3: "ESP",
    continents: ["europe"],
  },
  {
    name: "Sri Lanka",
    iso2: "LK",
    iso3: "LKA",
    continents: ["asia"],
  },
  {
    name: "Sudan",
    iso2: "SD",
    iso3: "SDN",
    continents: ["africa"],
  },
  {
    name: "Suriname",
    iso2: "SR",
    iso3: "SUR",
    continents: ["south-america"],
  },
  {
    name: "Sweden",
    iso2: "SE",
    iso3: "SWE",
    continents: ["europe"],
  },
  {
    name: "Switzerland",
    iso2: "CH",
    iso3: "CHE",
    continents: ["europe"],
  },
  {
    name: "Syria",
    iso2: "SY",
    iso3: "SYR",
    continents: ["asia"],
  },
  {
    name: "Taiwan",
    iso2: "TW",
    iso3: "TWN",
    continents: ["asia"],
  },
  {
    name: "Tajikistan",
    iso2: "TJ",
    iso3: "TJK",
    continents: ["asia"],
  },
  {
    name: "Tanzania",
    iso2: "TZ",
    iso3: "TZA",
    continents: ["africa"],
  },
  {
    name: "Thailand",
    iso2: "TH",
    iso3: "THA",
    continents: ["asia"],
  },
  {
    name: "Togo",
    iso2: "TG",
    iso3: "TGO",
    continents: ["africa"],
  },
  {
    name: "Tonga",
    iso2: "TO",
    iso3: "TON",
    continents: ["oceania"],
  },
  {
    name: "Trinidad and Tobago",
    iso2: "TT",
    iso3: "TTO",
    continents: ["north-america"],
  },
  {
    name: "Tunisia",
    iso2: "TN",
    iso3: "TUN",
    continents: ["africa"],
  },
  {
    name: "Türkiye",
    iso2: "TR",
    iso3: "TUR",
    continents: ["asia", "europe"],
  },
  {
    name: "Turkmenistan",
    iso2: "TM",
    iso3: "TKM",
    continents: ["asia"],
  },
  {
    name: "Tuvalu",
    iso2: "TV",
    iso3: "TUV",
    continents: ["oceania"],
  },
  {
    name: "Uganda",
    iso2: "UG",
    iso3: "UGA",
    continents: ["africa"],
  },
  {
    name: "Ukraine",
    iso2: "UA",
    iso3: "UKR",
    continents: ["europe"],
  },
  {
    name: "United Arab Emirates",
    iso2: "AE",
    iso3: "ARE",
    continents: ["asia"],
  },
  {
    name: "United Kingdom",
    iso2: "GB",
    iso3: "GBR",
    continents: ["europe"],
  },
  {
    name: "United States of America",
    iso2: "US",
    iso3: "USA",
    continents: ["north-america"],
  },

  {
    name: "Uruguay",
    iso2: "UY",
    iso3: "URY",
    continents: ["south-america"],
  },
  {
    name: "Uzbekistan",
    iso2: "UZ",
    iso3: "UZB",
    continents: ["asia"],
  },
  {
    name: "Vanuatu",
    iso2: "VU",
    iso3: "VUT",
    continents: ["oceania"],
  },
  {
    name: "Vatican City",
    iso2: "VA",
    iso3: "VAT",
    continents: ["europe"],
  },
  {
    name: "Venezuela",
    iso2: "VE",
    iso3: "VEN",
    continents: ["south-america"],
  },
  {
    name: "Vietnam",
    iso2: "VN",
    iso3: "VNM",
    continents: ["asia"],
  },
  {
    name: "Yemen",
    iso2: "YE",
    iso3: "YEM",
    continents: ["asia"],
  },
  {
    name: "Zambia",
    iso2: "ZM",
    iso3: "ZMB",
    continents: ["africa"],
  },
  {
    name: "Zimbabwe",
    iso2: "ZW",
    iso3: "ZWE",
    continents: ["africa"],
  },
];

const territoryData = [
  {
    name: "American Samoa",
    iso2: "AS",
    iso3: "ASM",
    continents: ["oceania"],
    parentCountry: "US",
  },
  {
    name: "Anguilla",
    iso2: "AI",
    iso3: "AIA",
    continents: ["north-america"],
    parentCountry: "GB",
  },
  {
    name: "Aruba",
    iso2: "AW",
    iso3: "ABW",
    continents: ["north-america"],
    parentCountry: "NL",
  },
  {
    name: "Bermuda",
    iso2: "BM",
    iso3: "BMU",
    continents: ["north-america"],
    parentCountry: "GB",
  },
  {
    name: "British Virgin Islands",
    iso2: "VG",
    iso3: "VGB",
    continents: ["north-america"],
    parentCountry: "GB",
  },
  {
    name: "Cayman Islands",
    iso2: "KY",
    iso3: "CYM",
    continents: ["north-america"],
    parentCountry: "GB",
  },
  {
    name: "Cook Islands",
    iso2: "CK",
    iso3: "COK",
    continents: ["oceania"],
    parentCountry: "NZ",
  },
  {
    name: "Falkland Islands",
    iso2: "FK",
    iso3: "FLK",
    continents: ["south-america"],
    parentCountry: "GB",
  },
  {
    name: "Faroe Islands",
    iso2: "FO",
    iso3: "FRO",
    continents: ["europe"],
    parentCountry: "DK",
  },
  {
    name: "French Guiana",
    iso2: "GF",
    iso3: "GUF",
    continents: ["south-america"],
    parentCountry: "FR",
  },
  {
    name: "French Polynesia",
    iso2: "PF",
    iso3: "PYF",
    continents: ["oceania"],
    parentCountry: "FR",
  },
  {
    name: "Gibraltar",
    iso2: "GI",
    iso3: "GIB",
    continents: ["europe"],
    parentCountry: "GB",
  },
  {
    name: "Greenland",
    iso2: "GL",
    iso3: "GRL",
    continents: ["north-america"],
    parentCountry: "DK",
  },
  {
    name: "Guadeloupe",
    iso2: "GP",
    iso3: "GLP",
    continents: ["north-america"],
    parentCountry: "FR",
  },
  {
    name: "Guam",
    iso2: "GU",
    iso3: "GUM",
    continents: ["oceania"],
    parentCountry: "US",
  },
  {
    name: "Hong Kong",
    iso2: "HK",
    iso3: "HKG",
    continents: ["asia"],
    parentCountry: "CN",
  },
  {
    name: "Isle of Man",
    iso2: "IM",
    iso3: "IMN",
    continents: ["europe"],
    parentCountry: "GB",
  },
  {
    name: "Jersey",
    iso2: "JE",
    iso3: "JEY",
    continents: ["europe"],
    parentCountry: "GB",
  },
  {
    name: "Macau",
    iso2: "MO",
    iso3: "MAC",
    continents: ["asia"],
    parentCountry: "CN",
  },
  {
    name: "Martinique",
    iso2: "MQ",
    iso3: "MTQ",
    continents: ["north-america"],
    parentCountry: "FR",
  },
  {
    name: "Mayotte",
    iso2: "YT",
    iso3: "MYT",
    continents: ["africa"],
    parentCountry: "FR",
  },
  {
    name: "Montserrat",
    iso2: "MS",
    iso3: "MSR",
    continents: ["north-america"],
    parentCountry: "GB",
  },
  {
    name: "New Caledonia",
    iso2: "NC",
    iso3: "NCL",
    continents: ["oceania"],
    parentCountry: "FR",
  },
  {
    name: "Niue",
    iso2: "NU",
    iso3: "NIU",
    continents: ["oceania"],
    parentCountry: "NZ",
  },
  {
    name: "Northern Mariana Islands",
    iso2: "MP",
    iso3: "MNP",
    continents: ["oceania"],
    parentCountry: "US",
  },
  {
    name: "Puerto Rico",
    iso2: "PR",
    iso3: "PRI",
    continents: ["north-america"],
    parentCountry: "US",
  },
  {
    name: "Réunion",
    iso2: "RE",
    iso3: "REU",
    continents: ["africa"],
    parentCountry: "FR",
  },
  {
    name: "Saint Barthélemy",
    iso2: "BL",
    iso3: "BLM",
    continents: ["north-america"],
    parentCountry: "FR",
  },
  {
    name: "Saint Martin",
    iso2: "MF",
    iso3: "MAF",
    continents: ["north-america"],
    parentCountry: "FR",
  },
  {
    name: "Saint Pierre and Miquelon",
    iso2: "PM",
    iso3: "SPM",
    continents: ["north-america"],
    parentCountry: "FR",
  },
  {
    name: "Sint Maarten",
    iso2: "SX",
    iso3: "SXM",
    continents: ["north-america"],
    parentCountry: "NL",
  },
  {
    name: "Tokelau",
    iso2: "TK",
    iso3: "TKL",
    continents: ["oceania"],
    parentCountry: "NZ",
  },
  {
    name: "Turks and Caicos Islands",
    iso2: "TC",
    iso3: "TCA",
    continents: ["north-america"],
    parentCountry: "GB",
  },
  {
    name: "United States Virgin Islands",
    iso2: "VI",
    iso3: "VIR",
    continents: ["north-america"],
    parentCountry: "US",
  },
  {
    name: "Wallis and Futuna",
    iso2: "WF",
    iso3: "WLF",
    continents: ["oceania"],
    parentCountry: "FR",
  },
];

export async function seedCountries() {
  // Seed sovereign countries
  await db
    .insert(countries)
    .values(
      countryData.map(({ continents: _continents, ...country }) => country),
    )
    .onConflictDoNothing();

  // Fetch sovereign countries that were just seeded
  const sovereignCountries = await db
    .select({
      id: countries.id,
      iso2: countries.iso2,
    })
    .from(countries)
    .where(eq(countries.isSovereign, true));

  const soverignCountriesByIso2 = new Map(
    sovereignCountries.map((country) => [country.iso2, country.id]),
  );

  // Prepare territories
  const territoriesToInsert = territoryData.map(
    ({ continents: _continents, parentCountry, ...territory }) => {
      const sovereignCountryId = soverignCountriesByIso2.get(parentCountry);
      if (!sovereignCountryId) {
        throw new Error(
          `Could not find sovereign country ID for ${parentCountry}`,
        );
      }

      return {
        ...territory,
        isSovereign: false,
        sovereignCountryId,
      };
    },
  );

  // Seed territories
  await db.insert(countries).values(territoriesToInsert).onConflictDoNothing();

  // Fetch all countries and territories
  const allCountries = await db
    .select({
      id: countries.id,
      iso2: countries.iso2,
    })
    .from(countries);

  const countryByIso2 = new Map(
    allCountries.map((country) => [country.iso2, country.id]),
  );

  // Fetch continents
  const seededContinents = await db
    .select({
      id: continents.id,
      slug: continents.slug,
    })
    .from(continents);

  const continentBySlug = new Map(
    seededContinents.map((continent) => [continent.slug, continent.id]),
  );

  // Combine sovereign countries and territories
  const allCountryData = [...countryData, ...territoryData];

  // Build country-continent mappings
  const mappings = allCountryData.flatMap((country) =>
    country.continents.map((continentSlug, index) => {
      const countryId = countryByIso2.get(country.iso2);
      const continentId = continentBySlug.get(continentSlug);

      if (!countryId) {
        throw new Error(`Could not find country ID for ${country.name}`);
      }
      if (!continentId) {
        throw new Error(`Could not find continent ID for ${continentSlug}`);
      }

      return {
        countryId,
        continentId,
        isPrimary: index === 0,
      };
    }),
  );

  // Seed country-continent mappings
  await db.insert(countriesContinents).values(mappings).onConflictDoNothing();

  console.log(
    `Seeded ${countryData.length} countries and ${territoryData.length} territories.`,
  );
}
