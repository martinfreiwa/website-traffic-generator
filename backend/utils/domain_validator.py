"""
Domain validation utilities for preventing abuse on free/economy tier.
Blocks URL shorteners, free subdomain services, rotating links, private IPs, etc.
"""

import re
from urllib.parse import urlparse
from typing import Optional, List, Tuple

URL_SHORTENERS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "short.link",
    "rebrand.ly",
    "bl.ink",
    "tiny.cc",
    "lnkd.in",
    "db.tt",
    "qr.ae",
    "amzn.to",
    "ow.ly",
    "bit.do",
    "mcaf.ee",
    "twe.ly",
    "tr.im",
    "x.co",
    "v.gd",
    "clicky.me",
    "budurl.com",
    "shorturl.at",
    "cutt.ly",
    "rb.gy",
    "short.gy",
    "tiny.pl",
    "b.link",
    "u.to",
    "j.mp",
    "disq.us",
    "shrinkearn.com",
    "clk.sh",
    "sh.st",
    "fc.lc",
    "uii.io",
    "exe.io",
    "linkshort.pro",
    "link1s.net",
    "otolink.net",
    "adshort.pro",
    "adslink.pw",
    "d.link",
    "clk.ink",
    "123link.pw",
    "short.pe",
    "linkwi.ru",
    "mitly.us",
    "adfly.mobi",
    "clk.press",
    "uii.io",
    "exe.io",
    "we.tl",
    "send.cm",
    "drive.google.com",
    "docs.google.com",
    "forms.gle",
    "spreadsheets",
    "s.id",
    "linktr.ee",
    "lnk.bio",
    "beacons.ai",
    "campsite.bio",
    "milkshake.app",
    "withkoji.com",
    "bio.link",
    "cara.app",
    "creators",
    "g.page",
    "maps.app.goo.gl",
    "play.google.com",
    "apps.apple.com",
    "open.spotify.com",
    "music.apple.com",
    "podcasts.apple.com",
    "youtube.com",
    "youtu.be",
    "vm.tiktok.com",
    "instagram.com",
    "facebook.com",
    "fb.watch",
    "twitter.com",
    "x.com",
    "linkedin.com",
    "pinterest.com",
    "reddit.com",
    "tumblr.com",
    "medium.com",
    "substack.com",
    "patreon.com",
    "ko-fi.com",
    "buymeacoffee.com",
}

FREE_SUBDOMAIN_SERVICES = {
    "wix.com",
    "wixsite.com",
    "wordpress.com",
    "wordpress.org",
    "blogspot.com",
    "blogger.com",
    "tumblr.com",
    "weebly.com",
    "weeblysite.com",
    "squarespace.com",
    "square.site",
    "github.io",
    "gitlab.io",
    "vercel.app",
    "netlify.app",
    "netlify.com",
    "herokuapp.com",
    "heroku.com",
    "firebaseapp.com",
    "web.app",
    "pages.dev",
    "cloudflare.io",
    "surge.sh",
    "now.sh",
    "zeit.co",
    "glitch.me",
    "repl.co",
    "replit.com",
    "pythonanywhere.com",
    "000webhostapp.com",
    "infinityfree.com",
    "awardspace.com",
    "byethost.com",
    "hostinger.com",
    "000webhost.com",
    "neocities.org",
    "angelfire.com",
    "tripod.com",
    "geocities.com",
    " Angelfire.com",
    "homestead.com",
    "webs.com",
    "freehostia.com",
    "zoho.com",
    "zoho.eu",
    "zendesk.com",
    "freshdesk.com",
    "helpscout.com",
    "intercom.com",
    "crisp.chat",
    "tawk.to",
    "mailchimp.com",
    "campaign-archive.com",
    "campaign-archive1.com",
    "substack.com",
    "medium.com",
    "ghost.io",
    "posthaven.com",
    "typepad.com",
    "livejournal.com",
    "hatenablog.com",
    "carrd.co",
    "sites.google.com",
    "sites.google.com",
    "notion.site",
    "notion.so",
    "coda.io",
    "airtable.com",
    "swingbybio.com",
    "taplink.at",
    "linkbio.co",
    "linktr.ee",
    "milkshake.website",
    "about.me",
    "bio.site",
    "beacons.ai",
    "solo.to",
    "popshopamerica.com",
    "allmylinks.com",
    "myurls.bio",
    "haybio.link",
    "kroslinks.com",
    "linkhub.pro",
    "magiclink.bio",
}

ROTATING_LINK_SERVICES = {
    "clickmagick.com",
    "clickmagick.net",
    "clickmeter.com",
    "click.org",
    "clickperfect.com",
    "click.org",
    "prettylink.com",
    "prettylinks.com",
    "geniuslink.com",
    "fairlink.com",
    "linklockr.com",
    "improvemyurl.com",
    "adtrackzgold.com",
    "linktrackr.com",
    "hypertracker.com",
    "click.org",
    "adcrun.ch",
    "ity.im",
    "qrf.in",
    "1url.com",
    "viralurl.com",
    "viralhosts.com",
    "le-vel.com",
    "jvz3.com",
    "jvz4.com",
    "jvz6.com",
    "jvz7.com",
    "jvz8.com",
    "jvz9.com",
    "jvz10.com",
    "jvzoo.com",
    "warriorplus.com",
    "clickbank.net",
    "shareasale.com",
    "cj.com",
    "impact.com",
    "partnerize.com",
    "awin1.com",
    "tradedoubler.com",
    "zazzle.com",
}

PRIVATE_IP_PATTERNS = [
    r"^127\.",
    r"^10\.",
    r"^192\.168\.",
    r"^172\.(1[6-9]|2[0-9]|3[01])\.",
    r"^169\.254\.",
    r"^::1$",
    r"^fc00:",
    r"^fd00:",
    r"^fe80:",
    r"^localhost$",
    r"^0\.0\.0\.0$",
    r"^local\.",
]

INVALID_PROTOCOLS = [
    "file://",
    "data:",
    "javascript:",
    "about:",
    "vbscript:",
    "mailto:",
]


def normalize_domain(domain: str) -> str:
    if not domain:
        return ""
    domain = domain.lower().strip()
    if domain.startswith("www."):
        domain = domain[4:]
    try:
        import idna

        domain = idna.encode(domain).decode("ascii")
    except Exception:
        pass
    return domain


def extract_domain_from_url(url: str) -> str:
    if not url:
        return ""
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        if ":" in domain:
            domain = domain.split(":")[0]
        return normalize_domain(domain)
    except Exception:
        return normalize_domain(url)


def extract_root_domain(domain: str) -> str:
    domain = normalize_domain(domain)
    if not domain:
        return ""
    parts = domain.split(".")
    if len(parts) >= 2:
        if len(parts[-1]) == 2 and len(parts) >= 3:
            return ".".join(parts[-3:])
        return ".".join(parts[-2:])
    return domain


def is_url_shortener(domain: str) -> bool:
    domain = normalize_domain(domain)
    root = extract_root_domain(domain)
    return domain in URL_SHORTENERS or root in URL_SHORTENERS


def is_free_subdomain(domain: str) -> bool:
    domain = normalize_domain(domain)
    parts = domain.split(".")
    if len(parts) >= 3:
        potential_service = ".".join(parts[-2:])
        if potential_service in FREE_SUBDOMAIN_SERVICES:
            return True
        full_domain = ".".join(parts[-3:])
        if full_domain in FREE_SUBDOMAIN_SERVICES:
            return True
    return False


def is_rotating_link_service(domain: str) -> bool:
    domain = normalize_domain(domain)
    root = extract_root_domain(domain)
    return domain in ROTATING_LINK_SERVICES or root in ROTATING_LINK_SERVICES


def is_private_ip(url: str) -> bool:
    if not url:
        return False
    url_lower = url.lower().strip()
    for protocol in INVALID_PROTOCOLS:
        if url_lower.startswith(protocol):
            return True
    domain = extract_domain_from_url(url)
    for pattern in PRIVATE_IP_PATTERNS:
        if re.match(pattern, domain, re.IGNORECASE):
            return True
    return False


def is_valid_protocol(url: str) -> bool:
    if not url:
        return False
    url_lower = url.lower().strip()
    for protocol in INVALID_PROTOCOLS:
        if url_lower.startswith(protocol):
            return False
    return True


def validate_domain_for_economy(
    url: str, additional_blocked: Optional[List[str]] = None
) -> Tuple[bool, Optional[str]]:
    """
    Validate a URL for economy/free tier usage.

    Returns:
        Tuple of (is_valid: bool, error_message: str | None)
    """
    if not url:
        return False, "URL is required"

    url = url.strip()

    if not is_valid_protocol(url):
        return False, "Invalid URL protocol. Use http:// or https://"

    if is_private_ip(url):
        return False, "Private or local addresses are not allowed"

    domain = extract_domain_from_url(url)
    if not domain:
        return False, "Could not parse domain from URL"

    if is_url_shortener(domain):
        return (
            False,
            "URL shorteners are not allowed on free tier. Please use your full website URL.",
        )

    if is_free_subdomain(domain):
        return (
            False,
            "Free website hosts are not allowed on free tier. Please use a custom domain or upgrade to a paid plan.",
        )

    if is_rotating_link_service(domain):
        return (
            False,
            "Rotating or redirect link services are not allowed. Please use a direct URL to your website.",
        )

    if additional_blocked:
        normalized_blocked = [normalize_domain(d) for d in additional_blocked]
        root_domain = extract_root_domain(domain)
        if domain in normalized_blocked or root_domain in normalized_blocked:
            return (
                False,
                "This domain is not allowed on free tier. Please upgrade or use a different website.",
            )

    return True, None


def parse_urls_from_input(url_input: str) -> List[str]:
    """
    Parse multiple URLs from input (newline or comma separated).
    Returns list of individual URLs.
    """
    if not url_input:
        return []

    urls = []
    for line in url_input.replace(",", "\n").split("\n"):
        url = line.strip()
        if url:
            urls.append(url)

    return urls


def validate_urls_for_economy(
    url_input: str, additional_blocked: Optional[List[str]] = None
) -> Tuple[bool, Optional[str]]:
    """
    Validate multiple URLs for economy/free tier usage.

    Returns:
        Tuple of (is_valid: bool, error_message: str | None)
    """
    urls = parse_urls_from_input(url_input)

    for url in urls:
        is_valid, error = validate_domain_for_economy(url, additional_blocked)
        if not is_valid:
            return False, error

    return True, None
