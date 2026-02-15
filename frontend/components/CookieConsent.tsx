import React, { useState, useEffect } from 'react';
import CookieConsent from 'react-cookie-consent';
import { Cookie, X } from 'lucide-react';

const CookieConsentBanner: React.FC = () => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <>
            <CookieConsent
                location="bottom"
                buttonText="Accept All"
                declineButtonText="Decline"
                manageCookieUseUrl="#"
                onAccept={(acceptedByScrolling) => {
                    if (acceptedByScrolling) {
                        console.log('Cookie accepted by scrolling');
                    } else {
                        console.log('Cookie accepted by button');
                    }
                }}
                enableDeclineButton
                flipButtons
                cookieName="trafficgen_cookie_consent"
                expires={365}
                style={{
                    background: '#1a1a1a',
                    color: '#ffffff',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '15px',
                    fontSize: '14px',
                    zIndex: 9999,
                }}
                buttonStyle={{
                    background: '#ff4d00',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}
                declineButtonStyle={{
                    background: 'transparent',
                    color: '#999999',
                    border: '1px solid #666666',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}
                overlay
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                    <Cookie size={24} color="#ff4d00" />
                    <div>
                        <strong style={{ color: '#ff4d00', fontSize: '15px' }}>🍪 Cookie Consent</strong>
                        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#cccccc' }}>
                            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                            By clicking "Accept All", you consent to our use of cookies.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowDetails(!showDetails)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff4d00',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textDecoration: 'underline',
                        marginTop: '10px'
                    }}
                >
                    {showDetails ? 'Hide Details' : 'Learn More'}
                </button>
                
                {showDetails && (
                    <div style={{ 
                        marginTop: '15px', 
                        padding: '15px', 
                        background: '#2a2a2a', 
                        borderRadius: '4px',
                        width: '100%',
                        fontSize: '12px'
                    }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#ff4d00' }}>Cookie Categories</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#cccccc' }}>
                            <li><strong>Essential:</strong> Required for the website to function properly</li>
                            <li><strong>Analytics:</strong> Help us understand how visitors interact with our website</li>
                            <li><strong>Marketing:</strong> Used to track visitors across websites for ad targeting</li>
                        </ul>
                        <p style={{ marginTop: '10px', color: '#999999' }}>
                            You can manage your cookie preferences at any time by clicking "Decline" or clearing your browser cookies.
                        </p>
                    </div>
                )}
            </CookieConsent>
        </>
    );
};

export default CookieConsentBanner;
