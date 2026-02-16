<?php
// Include router to set page metadata (though metadata is set explicitly below)
require_once($_SERVER['DOCUMENT_ROOT'] . '/includes/router.php');

// Explicitly set the page metadata for this blog post
// These variables are used by public_header.php and for SEO tags
global $page_title, $page_description, $page_created, $page_updated, $page_author, $page_canonical_url, $page_image_url, $page_keywords, $page_article_section, $page_article_tags;

$page_title = 'Understanding Web Traffic: A Beginner\'s Guide';
$page_description = 'Learn the basics of web traffic, why it\'s important for your website, and how to understand different traffic sources. A beginner-friendly guide.';
$page_created = '2023-11-15';
$page_updated = '2023-11-15';
$page_author = 'Alex Chen';
$page_canonical_url = 'https://traffic-creator.com/blog/understanding-web-traffic-beginners-guide';
$page_image_url = 'https://traffic-creator.com/img/blog/understanding-web-traffic.webp';
$page_keywords = 'web traffic, website visitors, analytics, digital marketing basics, traffic sources';
$page_article_section = 'Web Fundamentals';
$page_article_tags = 'web traffic, website visitors, analytics, digital marketing basics, traffic sources';

// Include the main public header
include_once($_SERVER['DOCUMENT_ROOT'] . '/includes/components/public_header.php');
?>
<!-- Enhanced SEO Meta Tags for Google Search and AI Overviews -->
<meta name="keywords" content="<?php echo htmlspecialchars($page_keywords); ?>">
<meta name="author" content="<?php echo htmlspecialchars($page_author); ?>">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<meta name="googlebot" content="index, follow">
<link rel="canonical" href="<?php echo htmlspecialchars($page_canonical_url); ?>">

<!-- Open Graph Meta Tags (for Facebook, LinkedIn, etc.) -->
<meta property="og:title" content="<?php echo htmlspecialchars($page_title); ?>">
<meta property="og:description" content="<?php echo htmlspecialchars($page_description); ?>">
<meta property="og:type" content="article">
<meta property="og:url" content="<?php echo htmlspecialchars($page_canonical_url); ?>">
<meta property="og:image" content="<?php echo htmlspecialchars($page_image_url); ?>">
<meta property="og:site_name" content="Traffic Creator">
<meta property="article:author" content="<?php echo htmlspecialchars($page_author); ?>">
<meta property="article:published_time" content="<?php echo htmlspecialchars($page_created); ?>T09:00:00Z">
<meta property="article:modified_time" content="<?php echo htmlspecialchars($page_updated); ?>T09:00:00Z">
<meta property="article:section" content="<?php echo htmlspecialchars($page_article_section); ?>">
<?php
if (!empty($page_article_tags)) {
    $tags_array = explode(',', $page_article_tags);
    foreach ($tags_array as $tag) {
        echo '<meta property="article:tag" content="' . htmlspecialchars(trim($tag)) . '">' . "\n";
    }
}
?>

<!-- Twitter Card Meta Tags -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?php echo htmlspecialchars($page_title); ?>">
<meta name="twitter:description" content="<?php echo htmlspecialchars($page_description); ?>">
<meta name="twitter:image" content="<?php echo htmlspecialchars($page_image_url); ?>">

<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "<?php echo htmlspecialchars($page_title); ?>",
    "description": "<?php echo htmlspecialchars($page_description); ?>",
    "image": "<?php echo htmlspecialchars($page_image_url); ?>",
    "author": {
        "@type": "Person",
        "name": "<?php echo htmlspecialchars($page_author); ?>"
    },
    "publisher": {
        "@type": "Organization",
        "name": "Traffic Creator",
        "logo": {
            "@type": "ImageObject",
            "url": "https://traffic-creator.com/img/logo.png"
        }
    },
    "datePublished": "<?php echo htmlspecialchars($page_created); ?>T09:00:00Z",
    "dateModified": "<?php echo htmlspecialchars($page_updated); ?>T09:00:00Z",
    "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "<?php echo htmlspecialchars($page_canonical_url); ?>"
    },
    "articleSection": "<?php echo htmlspecialchars($page_article_section); ?>",
    "keywords": "<?php echo htmlspecialchars($page_keywords); ?>"
}
</script>

<!-- ========== MAIN CONTENT ========== -->
<main id="content" role="main">
    <div class="container content-space-t-3 content-space-t-lg-4 content-space-b-2 content-space-b-lg-3">
        <div class="row">
            <div class="col-lg-8">
                <article class="article" itemscope itemtype="https://schema.org/BlogPosting">
                    <header class="blog-header mb-5">
                        <h1 class="display-4" itemprop="headline"><?php echo htmlspecialchars($page_title); ?></h1>
                        <p class="lead" itemprop="description"><?php echo htmlspecialchars($page_description); ?></p>
                        <ul class="list-inline list-separator text-muted small">
                            <li class="list-inline-item" itemprop="author" itemscope itemtype="https://schema.org/Person">
                                By <span itemprop="name"><?php echo htmlspecialchars($page_author); ?></span>
                            </li>
                            <li class="list-inline-item">
                                Published: <time itemprop="datePublished" datetime="<?php echo htmlspecialchars($page_created); ?>T09:00:00Z"><?php echo date("F j, Y", strtotime($page_created)); ?></time>
                            </li>
                            <li class="list-inline-item">
                                Updated: <time itemprop="dateModified" datetime="<?php echo htmlspecialchars($page_updated); ?>T09:00:00Z"><?php echo date("F j, Y", strtotime($page_updated)); ?></time>
                            </li>
                        </ul>
                    </header>

                    <?php if (!empty($page_image_url)): ?>
                        <figure class="mb-4">
                            <img class="img-fluid rounded-2" src="<?php echo htmlspecialchars($page_image_url); ?>" alt="<?php echo htmlspecialchars($page_title); ?>" itemprop="image">
                        </figure>
                    <?php endif; ?>

                    <!-- Table of Contents -->
                    <div class="toc mb-4">
                        <h4 class="toc-title"><i class="bi bi-list-ul"></i> Table of Contents</h4>
                        <ul class="toc-list">
                            <li><a href="#what-is-web-traffic">What is Web Traffic?</a></li>
                            <li><a href="#why-is-web-traffic-important">Why is Web Traffic Important?</a></li>
                            <li><a href="#common-types-of-traffic-sources">Common Types of Traffic Sources</a>
                                <ul>
                                    <li><a href="#organic-traffic">1. Organic Traffic</a></li>
                                    <li><a href="#direct-traffic">2. Direct Traffic</a></li>
                                    <li><a href="#referral-traffic">3. Referral Traffic</a></li>
                                    <li><a href="#paid-traffic">4. Paid Traffic</a></li>
                                    <li><a href="#social-traffic">5. Social Traffic</a></li>
                                </ul>
                            </li>
                            <li><a href="#conclusion">Conclusion</a></li>
                        </ul>
                    </div>

                    <section itemprop="articleBody">
                        <h2 id="what-is-web-traffic">What is Web Traffic?</h2>
                        <p>Web traffic refers to the number of visitors who come to your website. Think of it like foot traffic in a physical store – the more people who visit, the more opportunities you have to make a sale, share information, or achieve your website\'s goals. Each visitor interaction, like viewing a page or clicking a link, contributes to your site\'s traffic data.</p>

                        <h2 id="why-is-web-traffic-important">Why is Web Traffic Important?</h2>
                        <p>Understanding and analyzing web traffic is crucial for several reasons:</p>
                        <ul>
                            <li><strong>Gauge Marketing Effectiveness:</strong> See which campaigns (SEO, social media, paid ads) are driving visitors.</li>
                            <li><strong>Improve User Experience:</strong> Identify popular pages and content, as well as areas where users might be dropping off.</li>
                            <li><strong>Achieve Business Goals:</strong> More relevant traffic generally leads to more conversions, whether that\'s sales, sign-ups, or ad revenue.</li>
                            <li><strong>SEO Insights:</strong> Traffic data can provide clues about your search engine ranking and keyword performance.</li>
                        </ul>

                        <h2 id="common-types-of-traffic-sources">Common Types of Traffic Sources</h2>
                        <p>Web traffic can come from various sources. Here are some of the most common:</p>

                        <h3 id="organic-traffic">1. Organic Traffic</h3>
                        <p>Visitors who find your website through a search engine like Google or Bing (excluding paid search ads). This is often a result of good Search Engine Optimization (SEO).</p>

                        <h3 id="direct-traffic">2. Direct Traffic</h3>
                        <p>Visitors who type your website\'s URL directly into their browser or use a bookmark. This often indicates brand awareness.</p>

                        <h3 id="referral-traffic">3. Referral Traffic</h3>
                        <p>Visitors who arrive at your site by clicking a link on another website.</p>

                        <h3 id="paid-traffic">4. Paid Traffic</h3>
                        <p>Visitors who come from paid advertisements, such as Google Ads or social media ads.</p>

                        <h3 id="social-traffic">5. Social Traffic</h3>
                        <p>Visitors who find your website through links shared on social media platforms like Facebook, Twitter, or LinkedIn.</p>

                        <h2 id="conclusion">Conclusion</h2>
                        <p>Understanding your web traffic is the first step towards growing your online presence. By regularly monitoring your analytics and learning about your visitors, you can make informed decisions to improve your website and achieve your digital marketing objectives.</p>
                    </section>

                    <hr class="my-5">
                    <div class="d-flex align-items-center">
                        <div>
                            <h4 class="mb-1">About <?php echo htmlspecialchars($page_author); ?></h4>
                            <p class="small text-muted mb-0">Alex Chen is a content writer specializing in web technologies and digital marketing strategies, helping businesses understand complex topics.</p>
                        </div>
                    </div>
                </article>
            </div>

            <div class="col-lg-4 ps-lg-5">
                <div class="sticky-top" style="top: 80px;">
                    <div class="card shadow-sm mb-4">
                        <div class="card-body">
                            <h5 class="card-title mb-3">Popular Posts</h5>
                            <div class="d-flex align-items-center mb-3">
                                <div>
                                    <a class="text-dark fw-medium" href="/blog/posts/best-traffic-bot-tools-2025">Best Traffic Bot Tools for 2025</a>
                                    <p class="small text-muted mb-0">Complete guide and top rankings...</p>
                                </div>
                            </div>
                            <div class="d-flex align-items-center mb-3">
                                <div>
                                    <a class="text-dark fw-medium" href="/blog/posts/seo-strategies">10 Proven SEO Strategies for 2025</a>
                                    <p class="small text-muted mb-0">Boost your search rankings with these effective techniques.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card shadow-sm mb-4">
                        <div class="card-body">
                            <h5 class="card-title mb-3">Categories</h5>
                            <ul class="list-unstyled">
                                <li class="mb-1"><a href="/blog/category/web-fundamentals" class="text-body">Web Fundamentals</a> <span class="text-muted float-end">(1)</span></li>
                                <li class="mb-1"><a href="/blog/category/seo" class="text-body">SEO</a> <span class="text-muted float-end">(Replace with actual count)</span></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="card shadow-sm mb-4 bg-primary-soft border-0">
                        <div class="card-body">
                            <h5 class="card-title">Get Traffic Generation Tips</h5>
                            <p class="card-text">Subscribe to our newsletter for weekly tips on increasing website traffic and optimizing your online presence.</p>
                            <form>
                                <div class="mb-3">
                                    <input type="email" class="form-control" placeholder="Your email address" required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">Subscribe</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>
<!-- ========== END MAIN CONTENT ========== -->

<?php include_once($_SERVER['DOCUMENT_ROOT'] . '/includes/components/public_footer.php'); ?> 