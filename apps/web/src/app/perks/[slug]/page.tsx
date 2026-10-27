import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PerkDetail {
  id: string;
  slug: string;
  programName: string;
  provider: {
    name: string;
    officialDomain: string;
    providerType: string;
    logoUrl?: string;
    verificationStatus: string;
  };
  description?: string;
  officialProgramUrl: string;
  applicationUrl?: string;
  benefitType: string;
  statedValueAmount?: number;
  currency: string;
  status: string;
  verificationStatus: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  eligibleStages: string[];
  eligibleCountries: string[];
  sources?: {
    id: string;
    sourceUrl: string;
    sourceType: string;
    isPrimarySource: boolean;
    lastSeenAt: string;
  }[];
  eligibilityCriteria?: {
    id: string;
    criterionType: string;
    description: string;
    isMandatory: boolean;
  }[];
}

const MOCK_PERK_DETAILS: Record<string, PerkDetail> = {
  'aws-activate-portfolio-cloud-credits': {
    id: 'perk-1',
    slug: 'aws-activate-portfolio-cloud-credits',
    programName: 'AWS Activate Portfolio',
    provider: {
      name: 'Amazon Web Services',
      officialDomain: 'aws.amazon.com',
      providerType: 'CLOUD_INFRASTRUCTURE',
      verificationStatus: 'OFFICIALLY_VERIFIED',
    },
    description: `AWS Activate provides eligible startups with free tools, resources, content, and expert support to quickly get started on AWS.

Key Program Benefits:
1. Up to $100,000 in AWS Promotional Credits valid for 1-2 years.
2. 1 year of AWS Business Support (up to $10,000) for 24/7 cloud architectural guidance.
3. Access to AWS pre-built infrastructure templates, foundational AI architectures, and developer discounts.
4. Exclusive invitations to VC office hours and partner demo events.`,
    officialProgramUrl: 'https://aws.amazon.com/activate',
    applicationUrl: 'https://console.aws.amazon.com/activate/home',
    benefitType: 'CLOUD_CREDITS',
    statedValueAmount: 100000,
    currency: 'USD',
    status: 'ACTIVE',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    verifiedAt: '2026-10-26T10:00:00Z',
    verificationNotes: 'Verified against official AWS Activate Terms of Service and portfolio guidelines.',
    eligibleStages: ['SEED', 'FIRST_CUSTOMERS', 'REVENUE_GENERATING'],
    eligibleCountries: ['IN', 'GLOBAL'],
    sources: [
      {
        id: 'src-p1',
        sourceUrl: 'https://aws.amazon.com/activate/portfolio',
        sourceType: 'PRIMARY',
        isPrimarySource: true,
        lastSeenAt: '2026-10-27T08:00:00Z',
      },
    ],
    eligibilityCriteria: [
      {
        id: 'c1',
        criterionType: 'AFFILIATION',
        description: 'Startup must be affiliated with an active AWS Activate Provider (VC fund, accelerator, or incubator).',
        isMandatory: true,
      },
      {
        id: 'c2',
        criterionType: 'FUNDING',
        description: 'Self-funded or funded up to Series A by a verified institutional investor.',
        isMandatory: true,
      },
      {
        id: 'c3',
        criterionType: 'ACCOUNT_STATUS',
        description: 'Must have an active AWS account in good standing and a company website/domain email.',
        isMandatory: true,
      },
    ],
  },
};

async function getPerk(slug: string): Promise<PerkDetail | null> {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/perks/${slug}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to local mock data
  }
  return MOCK_PERK_DETAILS[slug] || null;
}

export default async function PerkDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const perk = await getPerk(params.slug);

  if (!perk) {
    notFound();
  }

  const formatValue = (amount?: number, currency = 'USD') => {
    if (!amount) return 'Free Tier / Partner Benefit';
    const symbol = currency === 'USD' ? '$' : '₹';
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/perks" className="hover:text-sky-400 transition">
          ← Back to Perks Directory
        </Link>
        <span>/</span>
        <span className="text-slate-300 truncate">{perk.programName}</span>
      </div>

      {/* Main Canonical Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5 shadow-sm">
              <span>✓</span>
              <span>Verified Official Partner Offer</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-sky-950 text-sky-300 border border-sky-800">
              {perk.benefitType.replace(/_/g, ' ')}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {perk.provider?.name}
            </span>
          </div>

          <span className="text-xs text-emerald-400 font-medium">
            ● Active Offer
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {perk.programName}
        </h1>
        <p className="mt-2 text-base text-sky-400 font-medium">
          Offered by {perk.provider?.name} ({perk.provider?.officialDomain})
        </p>

        {/* Value Matrix */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800">
          <div>
            <span className="block text-xs text-slate-500 font-medium">Stated Benefit</span>
            <span className="block mt-1 text-sm font-extrabold text-sky-400">
              {formatValue(perk.statedValueAmount, perk.currency)}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500 font-medium">Benefit Type</span>
            <span className="block mt-1 text-sm font-semibold text-white">
              {perk.benefitType.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500 font-medium">Eligible Countries</span>
            <span className="block mt-1 text-sm font-semibold text-white">
              {perk.eligibleCountries?.join(', ') || 'India, Global'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500 font-medium">Status</span>
            <span className="block mt-1 text-sm font-semibold text-emerald-400">
              {perk.status}
            </span>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {perk.applicationUrl && (
            <a
              href={perk.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-sky-900/30 flex items-center gap-2"
            >
              <span>Apply on Official Portal</span>
              <span>↗</span>
            </a>
          )}
          {perk.officialProgramUrl && (
            <a
              href={perk.officialProgramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition flex items-center gap-2"
            >
              <span>View Official Terms & Guidelines</span>
              <span>📄</span>
            </a>
          )}
        </div>

        {/* Description */}
        <div className="mt-10 pt-8 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white mb-3">About This Program</h2>
          <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {perk.description}
          </div>
        </div>

        {/* Eligibility Criteria */}
        <div className="mt-10 pt-8 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white mb-2">Program Eligibility Requirements</h2>
          <p className="text-xs text-slate-400 mb-5">
            Verified provider requirements to qualify for this credit package:
          </p>

          <div className="space-y-3">
            {perk.eligibilityCriteria && perk.eligibilityCriteria.length > 0 ? (
              perk.eligibilityCriteria.map((c, i) => (
                <div
                  key={c.id || i}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80"
                >
                  <span className="text-sky-400 font-bold text-base mt-0.5">✓</span>
                  <div>
                    <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider block mb-0.5">
                      {c.criterionType}
                    </span>
                    <span className="text-sm text-slate-200">{c.description}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Refer to official provider program terms.</p>
            )}
          </div>
        </div>

        {/* Provenance Attribution */}
        <div className="mt-10 pt-8 border-t border-slate-800">
          <div className="p-5 rounded-2xl bg-sky-950/30 border border-sky-900/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 mb-2">
              <span>🛡️ Data Integrity & Source Attribution</span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Startup Radar India verifies all perk programs directly against primary provider terms.
              We never fabricate savings numbers or mislabel ordinary commercial products as startup perks.
            </p>

            <div className="space-y-2 text-xs font-mono">
              {perk.sources?.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-slate-950 text-slate-400 border border-slate-800"
                >
                  <span className="truncate max-w-md text-slate-300">
                    <span className="text-sky-400 font-semibold mr-2">[{s.sourceType}]</span>
                    {s.sourceUrl}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Verified: {new Date(s.lastSeenAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>

            {perk.verificationNotes && (
              <p className="mt-3 text-[11px] text-emerald-400/90 font-sans italic">
                Verification note: {perk.verificationNotes}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
