export type TierId = 'economy' | 'professional' | 'expert';

export interface TierDefinition {
    id: TierId;
    name: string;
    factor: number;
    quality: string;
    popular?: boolean;
    features: string[];
    color: string;
}

export const TIERS: TierDefinition[] = [
    {
        id: 'economy',
        name: 'Economy',
        factor: 0.35,
        quality: '10% Quality',
        features: ['Residential IPs', 'Multiple Traffic Sources', 'Standard Proxy Pool', 'Geo Targeting Worldwide'],
        color: 'border-gray-200'
    },
    {
        id: 'professional',
        name: 'Professional',
        factor: 0.65,
        quality: '50% Quality',
        popular: true,
        features: ['Residential Geo IPs', 'Country Geo Targeting', 'RSS and Sitemap Support', 'URL Shorteners'],
        color: 'border-orange-300'
    },
    {
        id: 'expert',
        name: 'Expert',
        factor: 1.0,
        quality: '100% Quality',
        features: ['State & City Targeting', 'Night & Day Volume', 'Automatic Website Crawler', 'GA4 Natural Events'],
        color: 'border-[#ff4d00]'
    }
];

export const VOLUME_STEPS = [60000, 500000, 1000000, 10000000, 50000000] as const;

export const BULK_OPTIONS = [1, 6, 24] as const;

export const PRICING_MATRIX: Record<TierId, Record<number, Record<number, number>>> = {
    economy: {
        60000: { 1: 9.96, 6: 47.81, 24: 143.42 },
        500000: { 1: 57.96, 6: 278.21, 24: 834.62 },
        1000000: { 1: 99.96, 6: 479.81, 24: 1439.42 },
        10000000: { 1: 699.96, 6: 3359.81, 24: 10079.42 },
        50000000: { 1: 2799.96, 6: 13439.81, 24: 40319.42 },
    },
    professional: {
        60000: { 1: 19.96, 6: 95.81, 24: 287.42 },
        500000: { 1: 115.92, 6: 556.42, 24: 1669.25 },
        1000000: { 1: 199.96, 6: 959.81, 24: 2879.42 },
        10000000: { 1: 1399.96, 6: 6719.81, 24: 20159.42 },
        50000000: { 1: 5599.96, 6: 26879.81, 24: 80639.42 },
    },
    expert: {
        60000: { 1: 29.96, 6: 143.81, 24: 431.42 },
        500000: { 1: 173.96, 6: 835.01, 24: 2505.02 },
        1000000: { 1: 299.96, 6: 1439.81, 24: 4319.42 },
        10000000: { 1: 2099.96, 6: 10079.81, 24: 30239.42 },
        50000000: { 1: 8399.96, 6: 40319.81, 24: 120959.42 },
    }
};

export const getTierPrice = (tierId: TierId, volume: number, bulk: number = 1): number => {
    const tierPrices = PRICING_MATRIX[tierId];
    if (!tierPrices) return 0;
    const volumePrices = tierPrices[volume];
    if (!volumePrices) return 0;
    return volumePrices[bulk] || volumePrices[1] || 0;
};

export const getCPM = (tierId: TierId, volume: number, bulk: number = 1): number => {
    const price = getTierPrice(tierId, volume, bulk);
    const totalVisitors = volume * bulk;
    return (price / totalVisitors) * 1000;
};

export const formatPrice = (price: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(price);
};

export const formatCPM = (cpm: number): string => {
    return `€${cpm.toFixed(2)}`;
};

export const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
        return `${(volume / 1000000).toFixed(volume % 1000000 === 0 ? 0 : 1)}M`;
    }
    if (volume >= 1000) {
        return `${(volume / 1000).toFixed(volume % 1000 === 0 ? 0 : 0)}k`;
    }
    return volume.toString();
};

export const SUBSCRIPTION_PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: 29,
        yearlyPrice: 24,
        visitors: 5000,
        priceId: 'price_starter_monthly',
        yearlyPriceId: 'price_starter_yearly',
        features: ['5,000 visitors/month', 'Economy tier quality', 'Basic analytics', 'Email support']
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 79,
        yearlyPrice: 64,
        visitors: 25000,
        priceId: 'price_professional_monthly',
        yearlyPriceId: 'price_professional_yearly',
        popular: true,
        features: ['25,000 visitors/month', 'Professional tier quality', 'Advanced analytics', 'Priority support', 'Geo targeting']
    },
    {
        id: 'agency',
        name: 'Agency',
        price: 249,
        yearlyPrice: 199,
        visitors: 100000,
        priceId: 'price_agency_monthly',
        yearlyPriceId: 'price_agency_yearly',
        features: ['100,000 visitors/month', 'Expert tier quality', 'Full analytics suite', 'Dedicated support', 'All features unlocked', 'API access']
    }
];

export const CREDIT_PACKS = [
    { volume: 60000, label: '60k Hits' },
    { volume: 500000, label: '500k Hits' },
    { volume: 1000000, label: '1M Hits' },
    { volume: 10000000, label: '10M Hits' },
    { volume: 50000000, label: '50M Hits' }
];
