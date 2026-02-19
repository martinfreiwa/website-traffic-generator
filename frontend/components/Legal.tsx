import React from 'react';
import SEO from './SEO';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LegalProps {
    type: 'privacy' | 'terms' | 'impressum' | 'agb' | 'refund' | 'delivery';
    onBack: () => void;
}

const Legal: React.FC<LegalProps> = ({ type, onBack }) => {

    const getSEOTitle = () => {
        switch (type) {
            case 'privacy': return 'Privacy Policy | Traffic Creator - Secure Website Traffic';
            case 'terms': return 'Terms of Use | Service Agreement - Traffic Creator';
            case 'impressum': return 'Impressum & Legal Imprint - EasyTrafficBot UG';
            case 'agb': return 'General Terms and Conditions (AGB) - Traffic Creator';
            case 'refund': return 'Refund & Cancellation Policy - Traffic Creator';
            case 'delivery': return 'Service Delivery Standards | Digital fulfillment';
            default: return 'Legal Documentation - Traffic Creator';
        }
    }

    const getSEODescription = () => {
        switch (type) {
            case 'privacy': return 'Learn how Traffic Creator collects, uses, and protects your personal data in accordance with GDPR and international privacy standards.';
            case 'terms': return 'Our Terms of Use outline the legal agreement between you and Traffic Creator regarding your use of our website and services.';
            case 'impressum': return 'Official legal imprint and corporate information for EasyTrafficBot UG, the parent company of Traffic Creator.';
            case 'agb': return 'Read our General Terms and Conditions (AGB) for a detailed overview of our service agreements, pricing, and liability policies.';
            case 'refund': return 'Information about our refund policy, satisfaction guarantees, and the process for requesting a refund at Traffic Creator.';
            case 'delivery': return 'Understand our digital service delivery standards, including campaign activation times and fulfillment processes.';
            default: return 'Official legal documentation for Traffic Creator services and website usage.';
        }
    }

    const getTitle = () => {
        switch (type) {
            case 'privacy': return 'Privacy Policy';
            case 'terms': return 'Terms of Use';
            case 'impressum': return 'Impressum (Imprint)';
            case 'agb': return 'AGB (General Terms)';
            case 'refund': return 'Refund Policy';
            case 'delivery': return 'Delivery Policy';
            default: return 'Legal Document';
        }
    }

    const renderContent = () => {
        switch (type) {
            case 'impressum':
                return (
                    <>
                        <p className="font-bold text-gray-900 mb-8">Last modified: February 06, 2024</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm text-gray-600">
                            <div>
                                <h3 className="font-bold uppercase tracking-widest text-[#ff4d00] mb-4">Information according to § 5 TMG</h3>
                                <p className="font-bold text-gray-900">EasyTrafficBot UG</p>
                                <p>Arrenbergsche Höfe 6</p>
                                <p>Building 44</p>
                                <p>42117 Wuppertal</p>
                                <p className="mt-2 text-xs">Commercial Register: HRB 30863</p>
                                <p className="text-xs">Registration Court: Amtsgericht Wuppertal</p>
                            </div>
                            <div>
                                <h3 className="font-bold uppercase tracking-widest text-[#ff4d00] mb-4">Contact</h3>
                                <p><span className="font-bold">Phone:</span> +84373832085</p>
                                <p><span className="font-bold">Fax:</span> +49 (0) 123 44 55 99</p>
                                <p><span className="font-bold">E-Mail:</span> support@traffic-creator.com</p>
                            </div>
                            <div>
                                <h3 className="font-bold uppercase tracking-widest text-[#ff4d00] mb-4">Represented by</h3>
                                <p>Martin Freiwald</p>
                            </div>
                            <div>
                                <h3 className="font-bold uppercase tracking-widest text-[#ff4d00] mb-4">EU Dispute Resolution</h3>
                                <p>The European Commission provides a platform for online dispute resolution (ODR):</p>
                                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-[#ff4d00] hover:underline break-all">https://ec.europa.eu/consumers/odr/</a>
                                <p className="mt-2 italic">You can find our e-mail address above in the imprint.</p>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="font-bold uppercase tracking-widest text-[#ff4d00] mb-4">Consumer dispute resolution/Universal arbitration board</h3>
                                <p>We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>
                            </div>
                        </div>
                    </>
                );
            case 'agb':
                return (
                    <>
                        <p className="font-bold text-gray-900 mb-8">General Terms and Conditions (AGB) for Traffic Bot</p>

                        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Scope of Application</h3>
                        <p>These General Terms and Conditions (AGB) apply to all business relationships between EasyTrafficBot UG (hereinafter: Provider) and its customers (hereinafter: Customer). The version valid at the time of the conclusion of the contract is authoritative.</p>

                        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Conclusion of Contract</h3>
                        <p>The presentation of services on the website does not constitute a legally binding offer but an invitation to order. By clicking the "Order" or "Pay" button, the Customer places a binding order for the services contained in the shopping cart.</p>

                        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Services</h3>
                        <p>The Provider delivers website traffic to the URLs specified by the Customer. The Provider guarantees the delivery of the purchased number of visitors but does not guarantee specific actions by these visitors (e.g., sales, sign-ups) unless explicitly stated otherwise.</p>

                        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Prices and Payment</h3>
                        <p>All prices are final prices and include the statutory value-added tax (VAT) unless the Customer is based outside the EU or has a valid VAT ID. Payments are due immediately upon conclusion of the contract.</p>

                        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Warranty and Liability</h3>
                        <p>The Provider is liable for defects in accordance with the statutory provisions. Liability for slight negligence is excluded, provided that no essential contractual obligations are violated.</p>
                    </>
                );
            case 'refund':
                return (
                    <>
                        <p className="font-bold text-gray-900 mb-8">Last modified: September 25, 2024</p>
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">1. Right of Withdrawal</h3>
                                <p>As a consumer based in the European Union, you have the right to withdraw from this contract within 14 days without giving any reason. The withdrawal period will expire after 14 days from the day of the conclusion of the contract.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">2. Effects of Withdrawal</h3>
                                <p>If you withdraw from this contract, we shall reimburse to you all payments received from you, including the costs of delivery (with the exception of the supplementary costs resulting from your choice of a type of delivery other than the least expensive type of standard delivery offered by us), without undue delay and in any event not later than 14 days from the day on which we are informed about your decision to withdraw from this contract.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">3. Exceptions to the Right of Withdrawal</h3>
                                <p>The right of withdrawal does not apply to:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>The supply of digital content which is not supplied on a tangible medium if the performance has begun with your prior express consent and acknowledgment that you thereby lose your right of withdrawal.</li>
                                    <li>Services that have been fully performed if the performance has begun with your prior express consent, and with acknowledgment that you will lose your right of withdrawal once the contract has been fully performed.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">4. How to Exercise Your Right of Withdrawal</h3>
                                <p>To exercise your right of withdrawal, you must inform us of your decision to withdraw from this contract by an unequivocal statement (e.g., a letter sent by post or email). You may use the attached model withdrawal form, but it is not obligatory.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">5. Refunds for Defective Products or Services</h3>
                                <p>If the product or service you received is defective or not as described, you are entitled to a repair, replacement, or refund. Please contact our customer service team to initiate this process.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">6. Subscription Services</h3>
                                <p>You may cancel your subscription at any time. Refunds for the remaining unused period will be provided on a pro-rata basis. If you cancel within the first 30 days of your subscription ("trial period"), you are eligible for a full refund.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">7. Non-Refundable Items and Situations</h3>
                                <p>The following items, services, or situations are non-refundable:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Custom or personalized services</li>
                                    <li>Downloadable software or digital products that have been accessed or downloaded</li>
                                    <li>Services that have already been fully performed</li>
                                    <li>Traffic creation services where the failure to deliver traffic is due to factors beyond our control</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">8. Traffic Delivery Issues Outside Our Control</h3>
                                <p>Refunds will not be issued in cases where the failure to deliver traffic is due to factors beyond our control, including but not duration to:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Changes in search engine algorithms or policies</li>
                                    <li>Changes in social media platform algorithms or policies</li>
                                    <li>Restrictions or bans imposed on the client's website by third-party platforms</li>
                                    <li>Client's website being offline or experiencing technical issues</li>
                                    <li>Content on the client's website violating our terms of service or the terms of service of traffic sources</li>
                                    <li>Force majeure events (e.g., natural disasters, global pandemics, significant internet outages)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">9. Refund Processing Time</h3>
                                <p>Refunds will be processed within 5-10 business days of approval. The time it takes for the refund to appear in your account may vary depending on your payment method and financial institution.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">10. Contact Us</h3>
                                <p>If you have any questions about our refund policy or wish to request a refund, please contact us at: support@traffic-creator.com</p>
                            </div>
                        </div>
                    </>
                );
            case 'delivery':
                return (
                    <>
                        <p className="font-bold text-gray-900 mb-8">Service Delivery Standards</p>

                        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Delivery Timeframe</h3>
                        <p>Traffic campaigns typically start within 5 to 15 minutes after payment confirmation and campaign approval. In some cases, such as manual reviews for sensitive categories, activation may take up to 24 hours.</p>

                        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Method of Delivery</h3>
                        <p>Services are delivered digitally. No physical products are shipped. You will receive a confirmation email once your campaign is active, and you can monitor progress in real-time via the Dashboard.</p>

                        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Campaign Completion</h3>
                        <p>A campaign is considered complete when the total number of purchased visitors has been delivered to the target URL. Delivery speed is determined by your campaign settings.</p>
                    </>
                );
            case 'privacy':
                return (
                    <>
                        <p className="font-bold text-gray-900 mb-8">Last Updated: October 27, 2023</p>
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight uppercase">1. Interpretation and Definitions</h3>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800">Interpretation</h4>
                                    <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
                                    <h4 className="font-bold text-gray-800">Definitions</h4>
                                    <p>For the purposes of this Privacy Policy:</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</li>
                                        <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to EasyTrafficBot UG, Arrenbergsche Höfe 6, 42117.</li>
                                        <li><strong>Cookies</strong> are small files that are placed on Your computer, mobile device or any other device by a website...</li>
                                        <li><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.</li>
                                        <li><strong>Service</strong> refers to the Website.</li>
                                        <li><strong>Usage Data</strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself.</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight uppercase">2. Collecting and Using Your Personal Data</h3>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800 underline">Types of Data Collected</h4>
                                    <p><strong>Personal Data:</strong> While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to: Email address, First name and last name, Usage Data.</p>
                                    <p><strong>Usage Data:</strong> Usage Data is collected automatically when using the Service. It may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight uppercase">3. Tracking Technologies and Cookies</h3>
                                <p>We use Cookies and similar tracking technologies to track the activity on Our Service and store certain information. Tracking technologies used are beacons, tags, and scripts to collect and track information and to improve and analyze Our Service.</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2">
                                    <li><strong>Necessary / Essential Cookies:</strong> These Cookies are essential to provide You with services available through the Website.</li>
                                    <li><strong>Cookies Policy / Notice Acceptance Cookies:</strong> These Cookies identify if users have accepted the use of cookies on the Website.</li>
                                    <li><strong>Functionality Cookies:</strong> These Cookies allow us to remember choices You make when You use the Website.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight uppercase">4. Use of Your Personal Data</h3>
                                <p>The Company may use Personal Data for the following purposes:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2">
                                    <li>To provide and maintain our Service.</li>
                                    <li>To manage Your Account.</li>
                                    <li>For the performance of a contract.</li>
                                    <li>To contact You.</li>
                                    <li>To provide You with news, special offers and general information.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight uppercase">5. Delete Your Personal Data</h3>
                                <p>You have the right to delete or request that We assist in deleting the Personal Data that We have collected about You. Our Service may give You the ability to delete certain information about You from within the Service.</p>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight uppercase">6. Contact Us</h3>
                                <p>If you have any questions about this Privacy Policy, You can contact us by email: support@traffic-creator.com</p>
                            </div>
                        </div>
                    </>
                );
            case 'terms':
                return (
                    <>
                        <p className="font-bold text-gray-900 mb-8">Last modified: September 25, 2024</p>
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">1. Introduction</h3>
                                <p>Welcome to Traffic Bot. These Terms of Use (the 'Terms') constitute a legally binding agreement between you ('the User') and Traffic Bot ('we', 'our', or 'us') regarding your access to and use of our website and services. By accessing or using our services, you confirm your acceptance of these Terms in full.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">2. User Obligations</h3>
                                <p>When using our services, you agree to:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Provide accurate and complete information (such as your name, email, etc.) when creating an account</li>
                                    <li>Maintain the security of your account credentials</li>
                                    <li>Use our services only for lawful purposes and in accordance with these Terms</li>
                                    <li>Not attempt to interfere with or disrupt our services or servers</li>
                                    <li>Not use our services to distribute malware or other harmful code</li>
                                    <li>Notify us immediately of any unauthorized access to or use of your account</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">3. Privacy Policy</h3>
                                <p>We respect your privacy and are committed to protecting your personal data. Our Privacy Policy outlines how we collect, use, and protect your personal information.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">4. Intellectual Property Rights</h3>
                                <p>All content, features, and functionality of our services are owned by Traffic Bot and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, modify, distribute, or otherwise exploit any intellectual property belonging to Traffic Bot without our express written consent.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h3>
                                <p>To the fullest extent permitted by law, Traffic Bot shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use or inability to use our services.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">6. Termination</h3>
                                <p>We reserve the right to terminate or suspend your account at our sole discretion, without prior notice, for reasons including but not limited to violations of these Terms, illegal activity, or prolonged periods of inactivity.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">7. Governing Law</h3>
                                <p>These Terms shall be governed by the laws of Germany, without reference to conflict of law principles. Any legal disputes shall be exclusively resolved in the courts of Wuppertal.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">8. Dispute Resolution</h3>
                                <p>Any disputes arising out of or related to these Terms or our services shall first be attempted to be resolved through good-faith negotiations. If such negotiations fail, both parties agree to resolve the dispute through binding arbitration.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">9. Amendments to Terms</h3>
                                <p>We may modify these Terms from time to time. Material changes will be communicated via email, through a notice on our website, or other appropriate methods. Your continued use of our services following the posting of changes will confirm your acceptance of such changes.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">10. Acceptance of Terms</h3>
                                <p>By accessing or using our services, you confirm that you have read, understood, and agree to be bound by these Terms of Use. If you do not agree, you must not use our services.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">11. Severability</h3>
                                <p>If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">12. Third-Party Services</h3>
                                <p>Our services may contain links to third-party websites or services that are not owned or controlled by Traffic Bot. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">13. Contact Us</h3>
                                <p>If you have any questions about these Terms of Use, please contact us at: support@traffic-creator.com</p>
                            </div>
                        </div>
                    </>
                );
            default:
                return <p>Content not available.</p>;
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <SEO
                title={getSEOTitle()}
                description={getSEODescription()}
                keywords={`traffic bot ${type}, website traffic ${type}, seo traffic legal, easytrafficbot ug documentation`}
                type="article"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "publisher": {
                        "@type": "Organization",
                        "name": "Traffic Creator",
                        "logo": "https://traffic-creator.com/logo.png"
                    }
                }}
            />
            {/* Header */}
            <div className="border-b border-gray-100 bg-white sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-[#ff4d00] transition-colors text-xs font-bold uppercase tracking-wider">
                        <ArrowLeft size={16} /> Back
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#ff4d00] tracking-tight">TRAFFIC</span>
                        <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wide">Bot</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-20">
                <h1 className="text-4xl font-black text-gray-900 mb-12 uppercase tracking-tight">
                    {getTitle()}
                </h1>

                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed font-sans">
                    {renderContent()}
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-black text-white py-12 px-6 mt-20">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-xl font-black text-white tracking-tight">TRAFFIC BOT</div>
                    <div className="text-xs text-gray-600">
                        © 2024 EasyTrafficBot UG
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Legal;