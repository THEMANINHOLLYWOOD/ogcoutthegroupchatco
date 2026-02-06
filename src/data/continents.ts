export interface Country {
  name: string;
  code: string;
  flag: string;
}

export interface Continent {
  name: string;
  countries: Country[];
}

export const continents: Continent[] = [
  {
    name: 'Africa',
    countries: [
      { name: 'Egypt', code: 'EG', flag: '🇪🇬' },
      { name: 'Kenya', code: 'KE', flag: '🇰🇪' },
      { name: 'Morocco', code: 'MA', flag: '🇲🇦' },
      { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
      { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
      { name: 'Tanzania', code: 'TZ', flag: '🇹🇿' },
      { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
      { name: 'Ethiopia', code: 'ET', flag: '🇪🇹' },
      { name: 'Senegal', code: 'SN', flag: '🇸🇳' },
      { name: 'Tunisia', code: 'TN', flag: '🇹🇳' },
    ],
  },
  {
    name: 'Asia',
    countries: [
      { name: 'China', code: 'CN', flag: '🇨🇳' },
      { name: 'India', code: 'IN', flag: '🇮🇳' },
      { name: 'Japan', code: 'JP', flag: '🇯🇵' },
      { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
      { name: 'Thailand', code: 'TH', flag: '🇹🇭' },
      { name: 'Vietnam', code: 'VN', flag: '🇻🇳' },
      { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
      { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
      { name: 'Malaysia', code: 'MY', flag: '🇲🇾' },
      { name: 'Philippines', code: 'PH', flag: '🇵🇭' },
      { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
      { name: 'Israel', code: 'IL', flag: '🇮🇱' },
      { name: 'Turkey', code: 'TR', flag: '🇹🇷' },
    ],
  },
  {
    name: 'Europe',
    countries: [
      { name: 'France', code: 'FR', flag: '🇫🇷' },
      { name: 'Germany', code: 'DE', flag: '🇩🇪' },
      { name: 'Italy', code: 'IT', flag: '🇮🇹' },
      { name: 'Spain', code: 'ES', flag: '🇪🇸' },
      { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
      { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
      { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
      { name: 'Greece', code: 'GR', flag: '🇬🇷' },
      { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
      { name: 'Austria', code: 'AT', flag: '🇦🇹' },
      { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
      { name: 'Sweden', code: 'SE', flag: '🇸🇪' },
      { name: 'Norway', code: 'NO', flag: '🇳🇴' },
      { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
      { name: 'Ireland', code: 'IE', flag: '🇮🇪' },
      { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿' },
      { name: 'Poland', code: 'PL', flag: '🇵🇱' },
      { name: 'Croatia', code: 'HR', flag: '🇭🇷' },
    ],
  },
  {
    name: 'North America',
    countries: [
      { name: 'Canada', code: 'CA', flag: '🇨🇦' },
      { name: 'Costa Rica', code: 'CR', flag: '🇨🇷' },
      { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
      { name: 'United States', code: 'US', flag: '🇺🇸' },
      { name: 'Jamaica', code: 'JM', flag: '🇯🇲' },
      { name: 'Cuba', code: 'CU', flag: '🇨🇺' },
      { name: 'Dominican Republic', code: 'DO', flag: '🇩🇴' },
      { name: 'Panama', code: 'PA', flag: '🇵🇦' },
    ],
  },
  {
    name: 'South America',
    countries: [
      { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
      { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
      { name: 'Chile', code: 'CL', flag: '🇨🇱' },
      { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
      { name: 'Peru', code: 'PE', flag: '🇵🇪' },
      { name: 'Ecuador', code: 'EC', flag: '🇪🇨' },
      { name: 'Uruguay', code: 'UY', flag: '🇺🇾' },
    ],
  },
  {
    name: 'Oceania',
    countries: [
      { name: 'Australia', code: 'AU', flag: '🇦🇺' },
      { name: 'Fiji', code: 'FJ', flag: '🇫🇯' },
      { name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
      { name: 'Papua New Guinea', code: 'PG', flag: '🇵🇬' },
    ],
  },
];

export const getCountryFlag = (countryName: string): string => {
  for (const continent of continents) {
    const country = continent.countries.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    );
    if (country) return country.flag;
  }
  return '🌍';
};

export const getContinentForCountry = (countryName: string): string | null => {
  for (const continent of continents) {
    const country = continent.countries.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    );
    if (country) return continent.name;
  }
  return null;
};

export const getAllCountries = (): Country[] => {
  return continents.flatMap((c) => c.countries).sort((a, b) => a.name.localeCompare(b.name));
};
