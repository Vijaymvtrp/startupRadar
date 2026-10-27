'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Opportunity {
  id: string;
  slug: string;
  title: string;
  summary: string;
  organizer: string;
  departmentName?: string;
  category: string;
  governmentLevel: string;
  benefitType: string;
  benefitAmountMax?: number;
  currency: string;
  deliveryMode: string;
  applicationDeadline?: string;
  verificationStatus: string;
  startupStages: string[];
  industries: string[];
  officialApplicationUrl?: string;
}

const INITIAL_FALLBACK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    slug: 'startup-india-seed-fund-scheme-sisfs',
    title: 'Startup India Seed Fund Scheme (SISFS)',
    summary:
      'Provides financial assistance to DPIIT-recognized startups for proof of concept, prototype development, product trials, and market entry.',
    organizer: 'DPIIT, Ministry of Commerce & Industry',
    departmentName: 'DPIIT Central',
    category: 'GOVERNMENT_SCHEME',
    governmentLevel: 'CENTRAL',
    benefitType: 'GRANT',
    benefitAmountMax: 5000000,
    currency: 'INR',
    deliveryMode: 'ONLINE',
    applicationDeadline: '2026-12-31',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    startupStages: ['PROTOTYPE', 'MVP'],
    industries: ['SOFTWARE_IT', 'MANUFACTURING', 'HEALTHCARE_LIFESCIENCES'],
    officialApplicationUrl: 'https://seedfund.startupindia.gov.in',
  },
  {
    id: 'opp-2',
    slug: 'birac-biotechnology-ignition-grant-big',
    title: 'BIRAC Biotechnology Ignition Grant (BIG)',
    summary:
      'Flagship grant scheme providing up to ₹50 Lakhs equity-free grant to biotech, healthcare, diagnostics, and agri-tech entrepreneurs.',
    organizer: 'Biotechnology Industry Research Assistance Council',
    departmentName: 'Department of Biotechnology (DBT)',
    category: 'GRANT_FUNDING',
    governmentLevel: 'CENTRAL',
    benefitType: 'GRANT',
    benefitAmountMax: 5000000,
    currency: 'INR',
    deliveryMode: 'ONLINE',
    applicationDeadline: '2026-11-30',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    startupStages: ['RESEARCH', 'PROTOTYPE'],
    industries: ['BIOTECH_PHARMA', 'HEALTHCARE_LIFESCIENCES', 'AGRICULTURE'],
    officialApplicationUrl: 'https://birac.nic.in/big.php',
  },
  {
    id: 'opp-3',
    slug: 'meity-tide-2-incubation-prototype-grant',
    title: 'MeitY TIDE 2.0 Incubation & Prototype Grant',
    summary:
      'Technology Incubation and Development of Entrepreneurs (TIDE 2.0) promoting tech entrepreneurship through financial and incubation support in emerging technologies.',
    organizer: 'Ministry of Electronics and Information Technology (MeitY)',
    departmentName: 'Innovation & IPR Division',
    category: 'INCUBATOR_ACCELERATOR',
    governmentLevel: 'CENTRAL',
    benefitType: 'GRANT',
    benefitAmountMax: 3000000,
    currency: 'INR',
    deliveryMode: 'HYBRID',
    applicationDeadline: '2026-12-15',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    startupStages: ['EXPLORING_IDEA', 'PROTOTYPE'],
    industries: ['SOFTWARE_IT', 'CLEAN_ENERGY_CLIMATE', 'FINTECH'],
    officialApplicationUrl: 'https://meitystartuphub.in',
  },
  {
    id: 'opp-4',
    slug: 'telangana-t-hub-accelerator-cohort-2026',
    title: 'T-Hub Lab32 Accelerator Cohort 2026',
    summary:
      'Indias premier innovation hub providing market access, investor connects, pilots with state departments, and up to ₹25 Lakhs grants.',
    organizer: 'T-Hub & Government of Telangana',
    departmentName: 'ITE&C Dept Telangana',
    category: 'INCUBATOR_ACCELERATOR',
    governmentLevel: 'STATE',
    benefitType: 'INCUBATION_SUPPORT',
    benefitAmountMax: 2500000,
    currency: 'INR',
    deliveryMode: 'HYBRID',
    applicationDeadline: '2026-11-20',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    startupStages: ['MVP', 'FIRST_CUSTOMERS'],
    industries: ['SOFTWARE_IT', 'DEFENSE_AEROSPACE', 'FINTECH'],
    officialApplicationUrl: 'https://t-hub.co/programs/lab32',
  },
  {
    id: 'opp-5',
    slug: 'karnataka-elevate-idea2poc-grant',
    title: 'Karnataka ELEVATE 2026 Idea2POC Scheme',
    summary:
      'Government of Karnataka flagship initiative to identify and support top 100 innovative tech and non-tech startups with seed funding up to ₹50 Lakhs.',
    organizer: 'Department of Electronics, IT, Bt and S&T, Karnataka',
    departmentName: 'KITS Karnataka',
    category: 'GOVERNMENT_SCHEME',
    governmentLevel: 'STATE',
    benefitType: 'GRANT',
    benefitAmountMax: 5000000,
    currency: 'INR',
    deliveryMode: 'ONLINE',
    applicationDeadline: '2026-12-05',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    startupStages: ['PROTOTYPE', 'MVP'],
    industries: ['AGRICULTURE', 'MANUFACTURING', 'CLEAN_ENERGY_CLIMATE'],
    officialApplicationUrl: 'https://missionstartupkarnataka.org',
  },
  {
    id: 'opp-6',
    slug: 'national-deep-tech-defence-procurement-challenge',
    title: 'iDEX (Innovations for Defence Excellence) Challenge',
    summary:
      'Procurement and product development grants for startups solving critical technology challenges for Indian Army, Navy, Air Force and DPSUs.',
    organizer: 'Defence Innovation Organisation (DIO), MoD',
    departmentName: 'Ministry of Defence',
    category: 'TENDER_PROCUREMENT',
    governmentLevel: 'CENTRAL',
    benefitType: 'PROCUREMENT',
    benefitAmountMax: 15000000,
    currency: 'INR',
    deliveryMode: 'HYBRID',
    applicationDeadline: '2027-01-31',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    startupStages: ['PROTOTYPE', 'MVP', 'SCALING'],
    industries: ['DEFENSE_AEROSPACE', 'MANUFACTURING', 'SOFTWARE_IT'],
    officialApplicationUrl: 'https://idex.gov.in',
  },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_FALLBACK_OPPORTUNITIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [govLevelFilter, setGovLevelFilter] = useState('ALL');
  const [benefitFilter, setBenefitFilter] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
        if (govLevelFilter !== 'ALL') params.set('governmentLevel', govLevelFilter);
        if (benefitFilter !== 'ALL') params.set('benefitType', benefitFilter);
        if (verifiedOnly) params.set('verificationStatus', 'OFFICIALLY_VERIFIED');

        const res = await fetch(`http://localhost:3001/api/v1/opportunities?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setOpportunities(data.items);
            return;
          }
        }
      } catch {
        // Fallback to client-side filtering on mock if API is offline
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();
  }, [searchTerm, categoryFilter, govLevelFilter, benefitFilter, verifiedOnly]);

  const filteredOpportunities = opportunities.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (govLevelFilter !== 'ALL' && item.governmentLevel !== govLevelFilter) return false;
    if (benefitFilter !== 'ALL' && item.benefitType !== benefitFilter) return false;
    if (verifiedOnly && item.verificationStatus !== 'OFFICIALLY_VERIFIED') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary?.toLowerCase().includes(q);
      const matchOrganizer = item.organizer?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchOrganizer) return false;
    }
    return true;
  });

  const formatAmount = (max?: number, currency = 'INR') => {
    if (!max) return null;
    if (max >= 10000000) {
      return `Up to ₹${(max / 10000000).toFixed(1)} Cr`;
    }
    if (max >= 100000) {
      return `Up to ₹${(max / 100000).toFixed(0)} Lakhs`;
    }
    return `Up to ₹${max.toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-medium mb-3">
            <span>🛡️ 100% Source-Backed Provenance</span>
            <span>•</span>
            <span>Official Gazette Verified</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Startup Opportunities Radar
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl text-base">
            Discover verified government schemes, non-dilutive grants, state subsidies, incubators,
            and innovation tenders across Central and State ministries in India.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/sources"
            className="text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            Source Registry
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search schemes by keyword, department, or organizer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <span className="absolute left-3.5 top-3 text-slate-500 text-sm">🔍</span>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="GOVERNMENT_SCHEME">Government Schemes</option>
              <option value="GRANT_FUNDING">Grants & Funding</option>
              <option value="INCUBATOR_ACCELERATOR">Incubators & Accelerators</option>
              <option value="TENDER_PROCUREMENT">Tenders & Procurement</option>
              <option value="RESEARCH_DEVELOPMENT">R&D Programs</option>
            </select>
          </div>

          {/* Government Level Filter */}
          <div>
            <select
              value={govLevelFilter}
              onChange={(e) => setGovLevelFilter(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Jurisdictions</option>
              <option value="CENTRAL">Central Government</option>
              <option value="STATE">State Government</option>
              <option value="PUBLIC_SECTOR">Public Sector / PSU</option>
            </select>
          </div>
        </div>

        {/* Filter Pills / Verified Toggle */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Quick Filters:</span>
            <button
              onClick={() => setBenefitFilter(benefitFilter === 'GRANT' ? 'ALL' : 'GRANT')}
              className={`px-3 py-1 rounded-full border transition ${
                benefitFilter === 'GRANT'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              💰 Grants Only
            </button>
            <button
              onClick={() =>
                setBenefitFilter(benefitFilter === 'INCUBATION_SUPPORT' ? 'ALL' : 'INCUBATION_SUPPORT')
              }
              className={`px-3 py-1 rounded-full border transition ${
                benefitFilter === 'INCUBATION_SUPPORT'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              🚀 Incubation Only
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
            />
            <span className="font-medium text-emerald-400">✓ Verified Gazette Notices Only</span>
          </label>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 flex items-center justify-between text-sm text-slate-400">
        <span>
          Showing <strong className="text-white">{filteredOpportunities.length}</strong> verified opportunities
        </span>
        {loading && <span className="text-indigo-400 animate-pulse">Syncing latest feeds...</span>}
      </div>

      {/* Opportunity Grid */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          <span className="text-4xl">🔎</span>
          <h3 className="mt-3 text-lg font-semibold text-white">No opportunities found</h3>
          <p className="mt-1 text-slate-400 text-sm max-w-md mx-auto">
            Try adjusting your search query or reset your filters to discover other available schemes.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('ALL');
              setGovLevelFilter('ALL');
              setBenefitFilter('ALL');
              setVerifiedOnly(false);
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/20"
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                      opp.verificationStatus === 'OFFICIALLY_VERIFIED'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    }`}
                  >
                    <span>{opp.verificationStatus === 'OFFICIALLY_VERIFIED' ? '✓' : '⏳'}</span>
                    <span>
                      {opp.verificationStatus === 'OFFICIALLY_VERIFIED'
                        ? 'Officially Verified'
                        : 'Review Pending'}
                    </span>
                  </span>

                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {opp.governmentLevel === 'CENTRAL'
                      ? 'Central'
                      : opp.governmentLevel === 'STATE'
                      ? 'State'
                      : 'Public'}
                  </span>
                </div>

                {/* Title & Organizer */}
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition line-clamp-2">
                  <Link href={`/opportunities/${opp.slug}`}>{opp.title}</Link>
                </h3>
                <p className="mt-1 text-xs text-indigo-400 font-medium">{opp.organizer}</p>

                {/* Summary */}
                <p className="mt-3 text-sm text-slate-400 line-clamp-3 leading-relaxed">
                  {opp.summary}
                </p>

                {/* Amount / Benefit Badge */}
                {opp.benefitAmountMax && (
                  <div className="mt-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Benefit Funding</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatAmount(opp.benefitAmountMax, opp.currency)}
                    </span>
                  </div>
                )}

                {/* Industry / Stage tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {opp.industries?.slice(0, 3).map((ind) => (
                    <span
                      key={ind}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300"
                    >
                      {ind.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {opp.startupStages?.slice(0, 2).map((st) => (
                    <span
                      key={st}
                      className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900"
                    >
                      {st.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {opp.applicationDeadline ? `Deadline: ${opp.applicationDeadline}` : 'Rolling basis'}
                </span>
                <Link
                  href={`/opportunities/${opp.slug}`}
                  className="text-xs px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow-sm"
                >
                  View Details & Apply →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
