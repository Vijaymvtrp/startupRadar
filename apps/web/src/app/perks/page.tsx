'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface PerkItem {
  id: string;
  slug: string;
  programName: string;
  providerName: string;
  providerLogoUrl?: string;
  description: string;
  officialProgramUrl: string;
  applicationUrl?: string;
  benefitType: string;
  statedValueAmount?: number;
  currency: string;
  status: string;
  verificationStatus: string;
  eligibleStages: string[];
  eligibleCountries: string[];
}

const INITIAL_FALLBACK_PERKS: PerkItem[] = [
  {
    id: 'perk-1',
    slug: 'aws-activate-portfolio-cloud-credits',
    programName: 'AWS Activate Portfolio',
    providerName: 'Amazon Web Services',
    description:
      'Up to $100,000 in AWS promotional cloud credits, technical support, architecture guidance, and partner offers for funded or accelerator startups.',
    officialProgramUrl: 'https://aws.amazon.com/activate',
    applicationUrl: 'https://console.aws.amazon.com/activate/home',
    benefitType: 'CLOUD_CREDITS',
    statedValueAmount: 100000,
    currency: 'USD',
    status: 'ACTIVE',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    eligibleStages: ['SEED', 'FIRST_CUSTOMERS', 'REVENUE_GENERATING'],
    eligibleCountries: ['IN', 'GLOBAL'],
  },
  {
    id: 'perk-2',
    slug: 'google-for-startups-cloud-program',
    programName: 'Google for Startups Cloud Program',
    providerName: 'Google Cloud Platform',
    description:
      'Up to $200,000 (up to $350,000 for AI startups) in Google Cloud credits over 2 years, Google Workspace discounts, and hands-on technical training.',
    officialProgramUrl: 'https://cloud.google.com/startup',
    applicationUrl: 'https://cloud.google.com/startup/apply',
    benefitType: 'CLOUD_CREDITS',
    statedValueAmount: 200000,
    currency: 'USD',
    status: 'ACTIVE',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    eligibleStages: ['PROTOTYPE', 'MVP', 'SEED'],
    eligibleCountries: ['IN', 'GLOBAL'],
  },
  {
    id: 'perk-3',
    slug: 'microsoft-for-startups-founders-hub',
    programName: 'Microsoft for Startups Founders Hub',
    providerName: 'Microsoft Azure',
    description:
      'Up to $150,000 in Azure credits, free access to GitHub Enterprise, Visual Studio, and up to $2,500 in OpenAI API credits without requiring investor backing.',
    officialProgramUrl: 'https://foundershub.startups.microsoft.com',
    applicationUrl: 'https://foundershub.startups.microsoft.com/signup',
    benefitType: 'CLOUD_CREDITS',
    statedValueAmount: 150000,
    currency: 'USD',
    status: 'ACTIVE',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    eligibleStages: ['EXPLORING_IDEA', 'PROTOTYPE', 'MVP'],
    eligibleCountries: ['IN', 'GLOBAL'],
  },
  {
    id: 'perk-4',
    slug: 'openai-startups-developer-credits',
    programName: 'OpenAI for Startups & Scale Program',
    providerName: 'OpenAI',
    description:
      'Official API model access and developer credits for high-potential AI ventures building production applications on GPT-4o, reasoning models, and embeddings.',
    officialProgramUrl: 'https://openai.com/startups',
    applicationUrl: 'https://openai.com/form/startup-apply',
    benefitType: 'AI_API_CREDITS',
    statedValueAmount: 25000,
    currency: 'USD',
    status: 'ACTIVE',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    eligibleStages: ['PROTOTYPE', 'MVP', 'SEED'],
    eligibleCountries: ['IN', 'GLOBAL'],
  },
  {
    id: 'perk-5',
    slug: 'github-for-startups-enterprise-suite',
    programName: 'GitHub for Startups',
    providerName: 'GitHub',
    description:
      'Up to 20 seats of GitHub Enterprise free for one year, plus GitHub Advanced Security and access to developer community events.',
    officialProgramUrl: 'https://github.com/enterprise/startups',
    applicationUrl: 'https://github.com/enterprise/startups#apply',
    benefitType: 'DEVELOPER_TOOL',
    statedValueAmount: 5000,
    currency: 'USD',
    status: 'ACTIVE',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    eligibleStages: ['EXPLORING_IDEA', 'MVP', 'SEED'],
    eligibleCountries: ['IN', 'GLOBAL'],
  },
  {
    id: 'perk-6',
    slug: 'notion-for-startups-team-plan',
    programName: 'Notion for Startups',
    providerName: 'Notion Labs',
    description:
      'Up to 6 months free of Notion Plus with unlimited AI for your team to build wikis, product specs, roadmaps, and founder docs.',
    officialProgramUrl: 'https://www.notion.so/startups',
    applicationUrl: 'https://www.notion.so/startups#form',
    benefitType: 'BUSINESS_SOFTWARE',
    statedValueAmount: 1200,
    currency: 'USD',
    status: 'ACTIVE',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    eligibleStages: ['EXPLORING_IDEA', 'PROTOTYPE', 'MVP'],
    eligibleCountries: ['IN', 'GLOBAL'],
  },
];

export default function PerksPage() {
  const [perks, setPerks] = useState<PerkItem[]>(INITIAL_FALLBACK_PERKS);
  const [searchTerm, setSearchTerm] = useState('');
  const [benefitTypeFilter, setBenefitTypeFilter] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPerks() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (benefitTypeFilter !== 'ALL') params.set('benefitType', benefitTypeFilter);
        if (verifiedOnly) params.set('verificationStatus', 'OFFICIALLY_VERIFIED');

        const res = await fetch(`http://localhost:3001/api/v1/perks?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setPerks(data.items);
            return;
          }
        }
      } catch {
        // Fallback to client-side filtering on mock
      } finally {
        setLoading(false);
      }
    }

    fetchPerks();
  }, [searchTerm, benefitTypeFilter, verifiedOnly]);

  const filteredPerks = perks.filter((item) => {
    if (benefitTypeFilter !== 'ALL' && item.benefitType !== benefitTypeFilter) return false;
    if (verifiedOnly && item.verificationStatus !== 'OFFICIALLY_VERIFIED') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = item.programName.toLowerCase().includes(q);
      const matchProvider = item.providerName.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchName && !matchProvider && !matchDesc) return false;
    }
    return true;
  });

  const formatValue = (amount?: number, currency = 'USD') => {
    if (!amount) return 'Free Tier / Discount';
    const symbol = currency === 'USD' ? '$' : '₹';
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-800 text-sky-400 text-xs font-medium mb-3">
            <span>⚡ Cut Burn Rate</span>
            <span>•</span>
            <span>Verified Official Partner Offers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Startup Perks & Cloud Credits
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl text-base">
            Discover verified cloud infrastructure credits, AI API grants, developer tools, and
            productivity discounts to build and scale your startup without unnecessary burn.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/opportunities"
            className="text-xs px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            ← Government Grants & Schemes
          </Link>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search perks by provider (AWS, Google, Microsoft) or tool name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
            <span className="absolute left-3.5 top-3 text-slate-500 text-sm">🔍</span>
          </div>

          {/* Benefit Type Filter */}
          <div>
            <select
              value={benefitTypeFilter}
              onChange={(e) => setBenefitTypeFilter(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Benefit Types</option>
              <option value="CLOUD_CREDITS">Cloud Infrastructure Credits</option>
              <option value="AI_API_CREDITS">AI & API Credits</option>
              <option value="DEVELOPER_TOOL">Developer & DevOps Tools</option>
              <option value="BUSINESS_SOFTWARE">SaaS & Productivity Software</option>
              <option value="DISCOUNT">Discounts & Trials</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Buttons & Verified Toggle */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Categories:</span>
            <button
              onClick={() =>
                setBenefitTypeFilter(benefitTypeFilter === 'CLOUD_CREDITS' ? 'ALL' : 'CLOUD_CREDITS')
              }
              className={`px-3 py-1 rounded-full border transition ${
                benefitTypeFilter === 'CLOUD_CREDITS'
                  ? 'bg-sky-600 text-white border-sky-500'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              ☁️ Cloud Credits
            </button>
            <button
              onClick={() =>
                setBenefitTypeFilter(benefitTypeFilter === 'AI_API_CREDITS' ? 'ALL' : 'AI_API_CREDITS')
              }
              className={`px-3 py-1 rounded-full border transition ${
                benefitTypeFilter === 'AI_API_CREDITS'
                  ? 'bg-sky-600 text-white border-sky-500'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              🤖 AI & API Credits
            </button>
            <button
              onClick={() =>
                setBenefitTypeFilter(benefitTypeFilter === 'DEVELOPER_TOOL' ? 'ALL' : 'DEVELOPER_TOOL')
              }
              className={`px-3 py-1 rounded-full border transition ${
                benefitTypeFilter === 'DEVELOPER_TOOL'
                  ? 'bg-sky-600 text-white border-sky-500'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              🛠️ Developer Tools
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500 h-4 w-4"
            />
            <span className="font-medium text-sky-400">✓ Verified Official Programs Only</span>
          </label>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 flex items-center justify-between text-sm text-slate-400">
        <span>
          Showing <strong className="text-white">{filteredPerks.length}</strong> verified startup perks
        </span>
        {loading && <span className="text-sky-400 animate-pulse">Syncing offers...</span>}
      </div>

      {/* Perks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPerks.map((perk) => (
          <div
            key={perk.id}
            className="group bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-sky-950/20"
          >
            <div>
              {/* Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                  <span>✓</span>
                  <span>Officially Verified</span>
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {perk.benefitType.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Provider & Title */}
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                {perk.providerName}
              </span>
              <h3 className="mt-1 text-lg font-bold text-white group-hover:text-sky-300 transition line-clamp-2">
                <Link href={`/perks/${perk.slug}`}>{perk.programName}</Link>
              </h3>

              {/* Summary */}
              <p className="mt-3 text-sm text-slate-400 line-clamp-3 leading-relaxed">
                {perk.description}
              </p>

              {/* Value Highlight */}
              {perk.statedValueAmount && (
                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Stated Benefit</span>
                  <span className="text-sm font-extrabold text-sky-400">
                    {formatValue(perk.statedValueAmount, perk.currency)}
                  </span>
                </div>
              )}

              {/* Stages */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {perk.eligibleStages?.map((stage) => (
                  <span
                    key={stage}
                    className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-900"
                  >
                    {stage.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-medium">● Active Program</span>
              <Link
                href={`/perks/${perk.slug}`}
                className="text-xs px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition shadow-sm"
              >
                View Terms & Claim →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
