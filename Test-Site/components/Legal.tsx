
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalProps {
  type: 'privacy' | 'terms' | 'impressum' | 'agb' | 'refund' | 'delivery';
  onBack: () => void;
}

const Legal: React.FC<LegalProps> = ({ type, onBack }) => {
  
  const getTitle = () => {
      switch(type) {
          case 'privacy': return 'Privacy Policy';
          case 'terms': return 'Terms of Service';
          case 'impressum': return 'Impressum (Imprint)';
          case 'agb': return 'AGB (General Terms)';
          case 'refund': return 'Refund Policy';
          case 'delivery': return 'Delivery Policy';
          default: return 'Legal Document';
      }
  }

  const renderContent = () => {
      switch(type) {
          case 'impressum':
              return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Angaben gemäß § 5 TMG</h3>
                            <p className="font-bold text-gray-900">Traffic Creator Inc.</p>
                            <p>Tech Park Avenue 12</p>
                            <p>10115 Berlin</p>
                            <p>Germany</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Contact</h3>
                            <p><span className="font-bold">Phone:</span> +49 (0) 30 1234 5678</p>
                            <p><span className="font-bold">Email:</span> support@traffic-creator.com</p>
                            <p><span className="font-bold">Web:</span> www.traffic-creator.com</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Represented By</h3>
                            <p>John Doe, CEO</p>
                            <p>Jane Smith, CTO</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Register Entry</h3>
                            <p>Entry in the Handelsregister.</p>
                            <p>Registering Court: Amtsgericht Berlin-Charlottenburg</p>
                            <p>Registration Number: HRB 123456</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">VAT ID</h3>
                            <p>Sales tax identification number according to § 27 a Umsatzsteuergesetz:</p>
                            <p className="font-mono">DE 123 456 789</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Dispute Resolution</h3>
                            <p className="text-sm text-gray-500">We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>
                        </div>
                    </div>
                  </>
              );
          case 'agb':
              return (
                  <>
                    <p className="font-bold text-gray-900 mb-8">Allgemeine Geschäftsbedingungen (AGB) for Traffic Creator</p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Scope of Application</h3>
                    <p>These General Terms and Conditions (AGB) apply to all business relationships between Traffic Creator Inc. (hereinafter: Provider) and its customers (hereinafter: Customer). The version valid at the time of the conclusion of the contract is authoritative.</p>

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
                    <p className="font-bold text-gray-900 mb-8">Last Updated: October 24, 2025</p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. General Refund Policy</h3>
                    <p>We strive to provide the highest quality traffic services. However, if you are not satisfied with our service, you may be eligible for a refund under specific conditions.</p>

                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Non-Delivery of Service</h3>
                    <p>If we fail to deliver the purchased traffic within 72 hours of the scheduled start time, you are entitled to a full refund of the undelivered portion of your order.</p>

                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Technical Issues</h3>
                    <p>If technical issues on our end prevent the delivery of traffic, we will pause the campaign and attempt to resolve the issue. If the issue cannot be resolved, a pro-rated refund will be issued to your wallet balance or original payment method.</p>

                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Non-Refundable Circumstances</h3>
                    <p>Refunds are not granted if the traffic was delivered but did not result in sales, leads, or other specific user actions on your website. We guarantee visitors, not conversions.</p>
                    <p className="mt-4">Furthermore, if your URL is taken offline or blocks our traffic source during the campaign, no refund will be issued.</p>
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
                    <p className="font-bold text-gray-900">Last Updated: October 24, 2025</p>
                    <p>At Traffic Creator, we take your privacy seriously. This Privacy Policy describes how we collect, use, and protect your personal information.</p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h3>
                    <p>We collect information you provide directly to us, such as when you create an account, purchase credits, or communicate with our support team. This may include your name, email address, payment information, and website URLs.</p>

                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h3>
                    <p>We use the information we collect to operate, maintain, and improve our services, to process your transactions, and to communicate with you about your account and our services.</p>

                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Data Security</h3>
                    <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet is 100% secure.</p>
                </>
              );
          case 'terms':
              return (
                <>
                    <p className="font-bold text-gray-900">Last Updated: October 24, 2025</p>
                    <p>Please read these Terms of Service carefully before using Traffic Creator. By accessing or using our services, you agree to be bound by these terms.</p>

                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Acceptable Use</h3>
                    <p>You agree not to use our services for any unlawful purpose or in any way that violates these Terms. You are responsible for ensuring that your target URLs comply with all applicable laws and regulations.</p>

                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Payment and Refunds</h3>
                    <p>All payments are final. Credits purchased are non-refundable unless the service is not delivered as described. We reserve the right to change our pricing at any time.</p>

                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Limitation of Liability</h3>
                    <p>Traffic Creator shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
                </>
              );
          default:
              return <p>Content not available.</p>;
      }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#ff4d00] transition-colors text-xs font-bold uppercase tracking-wider">
                <ArrowLeft size={16} /> Back
            </button>
            <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#ff4d00] tracking-tight">TRAFFIC</span>
                <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wide">Creator</span>
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
            <div className="text-xl font-black text-white tracking-tight">TRAFFIC CREATOR</div>
            <div className="text-xs text-gray-600">
                © 2025 Traffic Creator Inc.
            </div>
        </div>
      </footer>
    </div>
  );
};

export default Legal;