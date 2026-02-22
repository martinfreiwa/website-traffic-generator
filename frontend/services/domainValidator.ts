/**
 * Domain validation utilities for preventing abuse on free/economy tier.
 * Mirrors backend logic for real-time frontend validation.
 */

const URL_SHORTENERS = new Set([
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
    "short.link", "rebrand.ly", "bl.ink", "tiny.cc", "lnkd.in", "db.tt",
    "qr.ae", "amzn.to", "ow.ly", "bit.do", "mcaf.ee", "twe.ly", "tr.im",
    "x.co", "v.gd", "clicky.me", "budurl.com", "shorturl.at", "cutt.ly",
    "rb.gy", "short.gy", "tiny.pl", "b.link", "u.to", "j.mp", "disq.us",
    "shrinkearn.com", "clk.sh", "sh.st", "fc.lc", "uii.io", "exe.io",
    "linkshort.pro", "link1s.net", "otolink.net", "adshort.pro", "adslink.pw",
    "d.link", "clk.ink", "123link.pw", "short.pe", "linkwi.ru", "mitly.us",
    "adfly.mobi", "clk.press", "uii.io", "exe.io", "we.tl", "send.cm",
    "drive.google.com", "docs.google.com", "forms.gle", "spreadsheets",
    "s.id", "linktr.ee", "lnk.bio", "beacons.ai", "campsite.bio",
    "milkshake.app", "withkoji.com", "bio.link", "cara.app", "creators",
    "g.page", "maps.app.goo.gl", "play.google.com", "apps.apple.com",
    "open.spotify.com", "music.apple.com", "podcasts.apple.com",
    "youtube.com", "youtu.be", "vm.tiktok.com", "instagram.com",
    "facebook.com", "fb.watch", "twitter.com", "x.com", "linkedin.com",
    "pinterest.com", "reddit.com", "tumblr.com", "medium.com",
    "substack.com", "patreon.com", "ko-fi.com", "buymeacoffee.com",
]);

const FREE_SUBDOMAIN_SERVICES = new Set([
    "wix.com", "wixsite.com", "wordpress.com", "wordpress.org",
    "blogspot.com", "blogger.com", "tumblr.com", "weebly.com",
    "weeblysite.com", "squarespace.com", "square.site",
    "github.io", "gitlab.io", "vercel.app", "netlify.app", "netlify.com",
    "herokuapp.com", "heroku.com", "firebaseapp.com", "web.app",
    "pages.dev", "cloudflare.io", "surge.sh", "now.sh", "zeit.co",
    "glitch.me", "repl.co", "replit.com", "pythonanywhere.com",
    "000webhostapp.com", "infinityfree.com", "awardspace.com",
    "byethost.com", "hostinger.com", "000webhost.com",
    "neocities.org", "angelfire.com", "tripod.com", "geocities.com",
    "homestead.com", "webs.com", "freehostia.com",
    "zoho.com", "zoho.eu", "zendesk.com", "freshdesk.com",
    "helpscout.com", "intercom.com", "crisp.chat", "tawk.to",
    "mailchimp.com", "campaign-archive.com", "campaign-archive1.com",
    "substack.com", "medium.com", "ghost.io", "posthaven.com",
    "typepad.com", "livejournal.com", "hatenablog.com",
    "carrd.co", "sites.google.com",
    "notion.site", "notion.so", "coda.io", "airtable.com",
    "swingbybio.com", "taplink.at", "linkbio.co", "linktr.ee",
    "milkshake.website", "about.me", "bio.site", "beacons.ai",
    "solo.to", "popshopamerica.com", "allmylinks.com", "myurls.bio",
    "haybio.link", "kroslinks.com", "linkhub.pro", "magiclink.bio",
]);

const ROTATING_LINK_SERVICES = new Set([
    "clickmagick.com", "clickmagick.net", "clickmeter.com", "click.org",
    "clickperfect.com", "click.org", "prettylink.com", "prettylinks.com",
    "geniuslink.com", "fairlink.com", "linklockr.com", "improvemyurl.com",
    "adtrackzgold.com", "linktrackr.com", "hypertracker.com",
    "click.org", "adcrun.ch", "ity.im", "qrf.in", "1url.com",
    "viralurl.com", "viralhosts.com", "le-vel.com", "jvz3.com",
    "jvz4.com", "jvz6.com", "jvz7.com", "jvz8.com", "jvz9.com",
    "jvz10.com", "jvzoo.com", "warriorplus.com", "clickbank.net",
    "shareasale.com", "cj.com", "impact.com", "partnerize.com",
    "awin1.com", "tradedoubler.com", "zazzle.com",
]);

const PRIVATE_IP_PATTERNS = [
    /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^169\.254\./, /^::1$/, /^fc00:/, /^fd00:/, /^fe80:/,
    /^localhost$/i, /^0\.0\.0\.0$/, /^local\./i,
];

const INVALID_PROTOCOLS = ["file://", "data:", "javascript:", "about:", "vbscript:", "mailto:"];

export function normalizeDomain(domain: string): string {
    if (!domain) return "";
    domain = domain.toLowerCase().trim();
    if (domain.startsWith("www.")) {
        domain = domain.substring(4);
    }
    return domain;
}

export function extractDomainFromUrl(url: string): string {
    if (!url) return "";
    url = url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
    }
    try {
        const parsed = new URL(url);
        let domain = parsed.hostname || parsed.pathname;
        if (domain.includes(":")) {
            domain = domain.split(":")[0];
        }
        return normalizeDomain(domain);
    } catch {
        return normalizeDomain(url);
    }
}

export function extractRootDomain(domain: string): string {
    domain = normalizeDomain(domain);
    if (!domain) return "";
    const parts = domain.split(".");
    if (parts.length >= 2) {
        if (parts[parts.length - 1].length === 2 && parts.length >= 3) {
            return parts.slice(-3).join(".");
        }
        return parts.slice(-2).join(".");
    }
    return domain;
}

export function isUrlShortener(domain: string): boolean {
    const normalizedDomain = normalizeDomain(domain);
    const root = extractRootDomain(normalizedDomain);
    return URL_SHORTENERS.has(normalizedDomain) || URL_SHORTENERS.has(root);
}

export function isFreeSubdomain(domain: string): boolean {
    const normalizedDomain = normalizeDomain(domain);
    const parts = normalizedDomain.split(".");
    if (parts.length >= 3) {
        const potentialService = parts.slice(-2).join(".");
        if (FREE_SUBDOMAIN_SERVICES.has(potentialService)) {
            return true;
        }
        const fullDomain = parts.slice(-3).join(".");
        if (FREE_SUBDOMAIN_SERVICES.has(fullDomain)) {
            return true;
        }
    }
    return false;
}

export function isRotatingLinkService(domain: string): boolean {
    const normalizedDomain = normalizeDomain(domain);
    const root = extractRootDomain(normalizedDomain);
    return ROTATING_LINK_SERVICES.has(normalizedDomain) || ROTATING_LINK_SERVICES.has(root);
}

export function isPrivateIp(url: string): boolean {
    if (!url) return false;
    const urlLower = url.toLowerCase().trim();
    for (const protocol of INVALID_PROTOCOLS) {
        if (urlLower.startsWith(protocol)) {
            return true;
        }
    }
    const domain = extractDomainFromUrl(url);
    for (const pattern of PRIVATE_IP_PATTERNS) {
        if (pattern.test(domain)) {
            return true;
        }
    }
    return false;
}

export function isValidProtocol(url: string): boolean {
    if (!url) return false;
    const urlLower = url.toLowerCase().trim();
    for (const protocol of INVALID_PROTOCOLS) {
        if (urlLower.startsWith(protocol)) {
            return false;
        }
    }
    return true;
}

export interface ValidationResult {
    isValid: boolean;
    errorMessage: string | null;
}

export function validateDomainForEconomy(
    url: string,
    additionalBlocked?: string[]
): ValidationResult {
    if (!url) {
        return { isValid: false, errorMessage: "URL is required" };
    }

    url = url.trim();

    if (!isValidProtocol(url)) {
        return { isValid: false, errorMessage: "Invalid URL protocol. Use http:// or https://" };
    }

    if (isPrivateIp(url)) {
        return { isValid: false, errorMessage: "Private or local addresses are not allowed" };
    }

    const domain = extractDomainFromUrl(url);
    if (!domain) {
        return { isValid: false, errorMessage: "Could not parse domain from URL" };
    }

    if (isUrlShortener(domain)) {
        return { 
            isValid: false, 
            errorMessage: "URL shorteners are not allowed on free tier. Please use your full website URL." 
        };
    }

    if (isFreeSubdomain(domain)) {
        return { 
            isValid: false, 
            errorMessage: "Free website hosts are not allowed on free tier. Please use a custom domain or upgrade to a paid plan." 
        };
    }

    if (isRotatingLinkService(domain)) {
        return { 
            isValid: false, 
            errorMessage: "Rotating or redirect link services are not allowed. Please use a direct URL to your website." 
        };
    }

    if (additionalBlocked && additionalBlocked.length > 0) {
        const normalizedBlocked = additionalBlocked.map(d => normalizeDomain(d));
        const rootDomain = extractRootDomain(domain);
        if (normalizedBlocked.includes(domain) || normalizedBlocked.includes(rootDomain)) {
            return { 
                isValid: false, 
                errorMessage: "This domain is not allowed on free tier. Please upgrade or use a different website." 
            };
        }
    }

    return { isValid: true, errorMessage: null };
}
