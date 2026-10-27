import React from 'react';
import {
  IndustrySector,
  StartupStage,
  BusinessModel,
  StartupNeed,
} from '@startup-radar/shared-types';

export default function HomePage() {
  const coreFeatures = [
    {
      icon: '🏛️',
      title: 'Startup Opportunities',
      badge: 'Verified Sources',
      description:
        'Discover, track, and verify central & state government schemes, grants, subsidies, tenders, incubators, accelerators, and hackathons with official provenance.',
      stats: '10+ Categories • Official Source Audit',
    },
    {
      icon: '🎁',
      title: 'Startup Perks & Credits',
      badge: 'Real Values',
      description:
        'Official cloud infrastructure credits, AI/API vouchers, developer tools, and SaaS offers. Separates real credits from trials; no misleading math.',
      stats: 'Cloud, AI, DevTools & SaaS',
    },
    {
      icon: '🤝',
      title: 'Co-Founder Matching',
      badge: 'Privacy-First',
      description:
        'Connect with compatible potential co-founders based on complementary skills, commitment, and stage. Exchange contacts only on mutual consent.',
      stats: 'Mutual Consent • No Cold Spam',
    },
    {
      icon: '🧭',
      title: 'Intelligence & Action Engine',
      badge: 'Explainable AI',
      description:
        'Personalize recommendations for your startup profile. Understand exactly why an opportunity fits, spot missing eligibility criteria, and know what to do next.',
      stats: 'Deterministic Matching • Next Step Guidance',
    },
  ];

  const industrySamples = [
    'Agriculture',
    'Manufacturing',
    'Healthcare & Life Sciences',
    'Food & Beverage',
    'Clean Energy',
    'Software & IT',
    'Biotech',
    'Fintech',
    'Defense & Aerospace',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-xs font-semibold text-indigo-300">
          <span>🇮🇳 India-First • Industry-Agnostic Platform</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Discover opportunities. Unlock perks. Find your co-founder.{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Know your next move.
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Built for all founders in India—from agriculture and manufacturing to deep-tech and software.
          No unverified noise. Only high-signal, source-backed opportunities.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <a
            href="#profile"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            Create Founder Profile
          </a>
          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
          >
            Explore API (Swagger)
          </a>
        </div>
      </section>

      {/* 4 Core Features Grid */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Four Core Modules</h2>
          <p className="text-slate-400 text-sm mt-1">
            A cohesive architecture designed for trust, accuracy, and actionable guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coreFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{feat.icon}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                  {feat.badge}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.description}</p>
              <div className="pt-2 text-xs font-semibold text-indigo-400 border-t border-slate-800/80">
                {feat.stats}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Industry Agnostic Section */}
      <section className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/80 to-indigo-950/40 border border-slate-800 space-y-6">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-white">Not Just Another Software Directory</h2>
          <p className="text-slate-400 text-sm mt-2">
            Most platforms assume every startup is an AI or SaaS app. Startup Radar India supports 17+ sectors
            with configurable criteria for grants, machinery subsidies, incubation, and government procurement.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {industrySamples.map((ind, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs font-medium text-slate-300"
            >
              {ind}
            </span>
          ))}
          <span className="px-3 py-1.5 rounded-lg bg-indigo-950 border border-indigo-800/60 text-xs font-medium text-indigo-300">
            + 8 more sectors
          </span>
        </div>
      </section>

      {/* Interactive Profile Architecture Preview */}
      <section id="profile" className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Milestone 1: Startup Profile & Taxonomy API</h2>
          <p className="text-slate-400 text-sm mt-1">
            Registered via NestJS API. Supports multiple industries, stages, and current needs without claiming false company registrations.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 max-w-3xl mx-auto text-left font-mono text-xs text-slate-300 overflow-x-auto">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
            <span>GET /api/v1/startup-profile/me</span>
            <span className="text-emerald-400">200 OK</span>
          </div>
          <pre>{`{
  "profile": {
    "startupName": "AgroSense India",
    "primaryIndustry": "AGRICULTURE",
    "secondaryIndustries": ["CLEAN_ENERGY_CLIMATE", "SOFTWARE_IT"],
    "businessModel": "B2B",
    "stage": "PROTOTYPE",
    "countryCode": "IN",
    "stateCode": "KA",
    "city": "Bengaluru",
    "isRegisteredCompany": false,
    "dpiitRecognized": false,
    "needs": ["GRANTS", "INCUBATION", "CLOUD_CREDITS", "TESTING_CERTIFICATION"]
  }
}`}</pre>
        </div>
      </section>
    </div>
  );
}
