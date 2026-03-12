
import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../constants';

const LegalPage: React.FC<{ type: 'privacy' | 'terms' | 'disclaimer' }> = ({ type }) => {
  const content = {
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "March 8, 2026",
      sections: [
        {
          h: "1. Information We Collect",
          p: "We collect information you provide directly to us, including your email address, username, and images of comic books you upload for AI grading. We DO NOT collect or store any financial information, such as credit card numbers or bank account details."
        },
        {
          h: "2. How We Use Your Information",
          p: "Your comic images are processed using Google Gemini AI to provide grading estimates. Your email is used for account authentication and notifications. All payment transactions are handled securely by Stripe."
        },
        {
          h: "3. Financial Data & Third-Party Services",
          p: "We use Stripe for payment processing. When you make a purchase or subscribe, your financial data is collected and processed directly by Stripe. Comic Vault never sees, handles, or stores your sensitive financial information. We also use Supabase for general data storage and Google Gemini for AI analysis."
        },
        {
          h: "4. Data Security",
          p: "We implement industry-standard security measures to protect your 'Vault' data. However, no method of transmission over the internet is 100% secure."
        }
      ]
    },
    terms: {
      title: "Terms of Service",
      lastUpdated: "March 4, 2026",
      sections: [
        {
          h: "1. Acceptance of Terms",
          p: "By accessing Comic Vault, you agree to be bound by these terms. If you do not agree, please do not use the service."
        },
        {
          h: "2. Marketplace Conduct",
          p: "Comic Vault provides a venue for collectors. We are not responsible for the condition of physical items or the behavior of buyers and sellers. All sales are final unless otherwise stated by the seller."
        },
        {
          h: "3. Subscription Tiers",
          p: "Subscription fees are non-refundable. You may cancel your subscription at any time to prevent future billing."
        },
        {
          h: "4. Limitation of Liability",
          p: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, COMIC VAULT AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES, INCLUDING WITHOUT LIMITATION, ANY DEFAMATORY, OFFENSIVE, OR ILLEGAL CONDUCT OF OTHER USERS OR THIRD PARTIES; OR (C) ANY CONTENT OBTAINED FROM THE SERVICES."
        }
      ]
    },
    disclaimer: {
      title: "Legal Disclaimer",
      lastUpdated: "March 4, 2026",
      sections: [
        {
          h: "1. AI Grading Accuracy",
          p: "Comic Vault's AI grading is an automated visual assessment. It is intended for reference only and does NOT replace professional human grading services such as CGC, CBCS, or PGX. We do not guarantee that a professional grader will assign the same grade."
        },
        {
          h: "2. Valuation Estimates",
          p: "Estimated values are based on historical marketplace data and AI analysis. These are not formal appraisals. Actual market value may vary significantly based on demand and physical inspection."
        },
        {
          h: "3. No Financial Advice",
          p: "Information provided on this platform is for entertainment and hobbyist purposes only. It does not constitute financial or investment advice."
        }
      ]
    }
  };

  const active = content[type];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-fadeIn">
      <Link to="/" className="inline-flex items-center gap-2 text-[#fbbf24] hover:underline mb-8 font-bold uppercase text-xs tracking-widest">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Vault
      </Link>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#dc2626] via-[#fbbf24] to-[#dc2626]"></div>
        
        <header className="mb-12">
          <h1 className="text-4xl comic-font text-[#fbbf24] mb-2 uppercase tracking-widest">{active.title}</h1>
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Last Updated: {active.lastUpdated}</p>
        </header>

        <div className="space-y-10">
          {active.sections.map((section, idx) => (
            <section key={idx} className="space-y-3">
              <h2 className="text-lg font-black text-white uppercase tracking-tight">{section.h}</h2>
              <p className="text-gray-400 leading-relaxed text-sm">{section.p}</p>
            </section>
          ))}
        </div>

        <footer className="mt-16 pt-8 border-t border-white/10 text-center">
          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">
            © 2026 Comic Vault Interactive • All Rights Reserved
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LegalPage;
