
import React from 'react';
import { Link } from 'react-router-dom';
import { Icons, SUBSCRIPTION_LIMITS, ARTLAB_PRICING } from '../constants';
import { SubscriptionTier } from '../types';
import { motion } from 'motion/react';

export default function LandingPage() {
  const features = [
    {
      title: "Start free",
      description:
        `Get ${SUBSCRIPTION_LIMITS[SubscriptionTier.FREE].scansPerMonth} scans per month and store up to ${SUBSCRIPTION_LIMITS[SubscriptionTier.FREE].storageLimit} comics free. Try ComicVault on real books before you commit.`,
    },
    {
      title: "Scan with structure",
      description:
        "Review AI-assisted grading guidance, visible defect breakdowns, confidence indicators, and readiness signals designed to support smarter collecting decisions.",
    },
    {
      title: "Decide with more context",
      description:
        "Paid plans unlock MarketTrends by grade, premium grade results, and analysis certificates to help collectors evaluate books before buying, listing, or preparing next steps.",
    },
    {
      title: "Collect in one place",
      description:
        "Organize your collection, use digital slabs on top tier, track wanted books with wishlist alerts, and stay connected through community chat and marketplace activity.",
    },
  ];

  const pillars = [
    {
      title: "AI-Powered Grading",
      description: "Get instant, objective condition assessments using advanced computer vision.",
      icon: <Icons.GraduationCap className="w-6 h-6" />
    },
    {
      title: "Market Intelligence",
      description: "Real-time pricing data and trends for thousands of comic titles.",
      icon: <Icons.Sparkles className="w-6 h-6" />
    },
    {
      title: "Secure Marketplace",
      description: "Buy and sell with confidence using our verified collector network.",
      icon: <Icons.Cart className="w-6 h-6" />
    }
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        <div className="relative z-10 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-8xl font-black comic-font text-[#fbbf24] tracking-tighter uppercase leading-none drop-shadow-[4px_4px_0_rgba(220,38,36,1)]">
              YOUR COLLECTION,<br />EVOLVED.
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto font-medium uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            AI-Powered Grading. Real-Time Market Data. <br />The Ultimate Vault for Serious Collectors.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Link 
              to="/login" 
              className="px-10 py-5 bg-[#fbbf24] text-[#1a2332] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(251,191,36,0.3)]"
            >
              Enter the Vault
            </Link>
            <a 
              href="#pricing" 
              className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all"
            >
              View Plans
            </a>
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#dc2626]/10 rounded-full blur-[120px] -z-10" />
      </section>

      {/* Pillars Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {pillars.map((pillar, idx) => (
          <motion.div 
            key={idx}
            className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-4 hover:border-[#fbbf24]/50 transition-colors group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="w-12 h-12 bg-[#fbbf24]/20 rounded-2xl flex items-center justify-center text-[#fbbf24] group-hover:scale-110 transition-transform">
              {pillar.icon}
            </div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white">{pillar.title}</h3>
            <p className="text-gray-400 leading-relaxed">{pillar.description}</p>
          </motion.div>
        ))}
      </section>

      {/* Features Grid */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-black comic-font text-white uppercase tracking-tighter">Built for the Modern Collector</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              className="p-10 bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-[2rem] space-y-4"
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-black text-[#fbbf24] uppercase tracking-widest">{feature.title}</h3>
              <p className="text-gray-400 text-lg leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="space-y-16 pt-12">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-black comic-font text-white uppercase tracking-tighter">Choose Your Tier</h2>
          <p className="text-gray-400 uppercase tracking-widest font-bold">Flexible plans for every level of collecting</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-widest">Free</h3>
              <div className="text-4xl font-black text-[#fbbf24]">$0<span className="text-sm text-gray-500">/mo</span></div>
            </div>
            <ul className="flex-1 space-y-4">
              {SUBSCRIPTION_LIMITS[SubscriptionTier.FREE].perks.map((perk, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <Icons.CheckCircle className="w-5 h-5 text-[#fbbf24]" />
                  <span className="text-sm font-bold uppercase tracking-wider">{perk}</span>
                </li>
              ))}
              <li className="flex items-center gap-3 text-gray-500">
                <Icons.AlertCircle className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">{SUBSCRIPTION_LIMITS[SubscriptionTier.FREE].fee}% Selling Fee</span>
              </li>
            </ul>
            <Link to="/login" className="w-full py-4 bg-white/10 text-white text-center font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all">
              Get Started
            </Link>
          </div>

          {/* Collector Tier */}
          <div className="p-10 bg-[#fbbf24]/10 border-2 border-[#fbbf24] rounded-[2.5rem] flex flex-col space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#fbbf24] text-[#1a2332] px-6 py-1 font-black text-[10px] uppercase tracking-[0.2em] rounded-bl-xl">
              Most Popular
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#fbbf24] uppercase tracking-widest">Collector</h3>
              <div className="text-4xl font-black text-white">${SUBSCRIPTION_LIMITS[SubscriptionTier.COLLECTOR].priceMonthly}<span className="text-sm text-gray-500">/mo</span></div>
            </div>
            <ul className="flex-1 space-y-4">
              {SUBSCRIPTION_LIMITS[SubscriptionTier.COLLECTOR].perks.map((perk, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-200">
                  <Icons.CheckCircle className="w-5 h-5 text-[#fbbf24]" />
                  <span className="text-sm font-bold uppercase tracking-wider">{perk}</span>
                </li>
              ))}
              <li className="flex items-center gap-3 text-gray-300">
                <Icons.CheckCircle className="w-5 h-5 text-[#fbbf24]" />
                <span className="text-sm font-bold uppercase tracking-wider">{SUBSCRIPTION_LIMITS[SubscriptionTier.COLLECTOR].fee}% Selling Fee</span>
              </li>
            </ul>
            <Link to="/login" className="w-full py-4 bg-[#fbbf24] text-[#1a2332] text-center font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg">
              Go Collector
            </Link>
          </div>

          {/* Vault Elite Tier */}
          <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-widest">Vault Elite</h3>
              <div className="text-4xl font-black text-[#fbbf24]">${SUBSCRIPTION_LIMITS[SubscriptionTier.VAULT_ELITE].priceMonthly}<span className="text-sm text-gray-500">/mo</span></div>
            </div>
            <ul className="flex-1 space-y-4">
              {SUBSCRIPTION_LIMITS[SubscriptionTier.VAULT_ELITE].perks.map((perk, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <Icons.CheckCircle className="w-5 h-5 text-[#fbbf24]" />
                  <span className="text-sm font-bold uppercase tracking-wider">{perk}</span>
                </li>
              ))}
              <li className="flex items-center gap-3 text-gray-300">
                <Icons.CheckCircle className="w-5 h-5 text-[#fbbf24]" />
                <span className="text-sm font-bold uppercase tracking-wider">{SUBSCRIPTION_LIMITS[SubscriptionTier.VAULT_ELITE].fee}% Selling Fee</span>
              </li>
            </ul>
            <Link to="/login" className="w-full py-4 bg-white/10 text-white text-center font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all">
              Join Elite
            </Link>
          </div>
        </div>

        {/* ArtLab Add-on */}
        <div className="max-w-3xl mx-auto p-8 bg-gradient-to-r from-[#dc2626]/20 to-transparent border border-[#dc2626]/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
              <Icons.Sparkles className="w-6 h-6 text-[#fbbf24]" />
              ArtLab Pro Add-on
            </h4>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Unlimited AI Art Generation & High-Res Downloads</p>
          </div>
          <div className="text-center md:text-right">
            <div className="text-3xl font-black text-white">${ARTLAB_PRICING.priceMonthly}<span className="text-sm text-gray-500">/mo</span></div>
            <p className="text-[10px] text-[#dc2626] font-black uppercase tracking-widest">Included in Vault Elite</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#fbbf24] rounded-[3rem] text-center space-y-8 px-4">
        <h2 className="text-5xl md:text-7xl font-black comic-font text-[#1a2332] uppercase tracking-tighter leading-none">
          READY TO SECURE<br />YOUR LEGACY?
        </h2>
        <p className="text-xl text-[#1a2332]/80 font-black uppercase tracking-widest max-w-xl mx-auto">
          Join thousands of collectors using AI to protect and grow their collections.
        </p>
        <Link 
          to="/login" 
          className="inline-block px-12 py-6 bg-[#1a2332] text-[#fbbf24] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 transition-all shadow-2xl"
        >
          Create Your Vault
        </Link>
      </section>
    </div>
  );
}
