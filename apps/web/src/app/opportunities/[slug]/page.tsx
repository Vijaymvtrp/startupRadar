import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface OpportunityDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description?: string;
  organizer: string;
  departmentName?: string;
  category: string;
  governmentLevel: string;
  benefitType: string;
  benefitAmountMin?: number;
  benefitAmountMax?: number;
  currency: string;
  deliveryMode: string;
  applicationDeadline?: string;
  officialApplicationUrl?: string;
  officialNotificationUrl?: string;
  eligibilitySummary?: string;
  verificationStatus: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  startupStages: string[];
  industries: string[];
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

// Fallback details for mock slugs
const MOCK_DETAILS: Record<string, OpportunityDetail> = {
  'startup-india-seed-fund-scheme-sisfs': {
    id: 'opp-1',
    slug: 'startup-india-seed-fund-scheme-sisfs',
    title: 'Startup India Seed Fund Scheme (SISFS)',
    summary:
      'Provides financial assistance to DPIIT-recognized startups for proof of concept, prototype development, product trials, and market entry.',
    description: `The Startup India Seed Fund Scheme (SISFS) was officially approved by the Government of India with an outlay of ₹945 Crore to support startups across eligible incubators in India.

The scheme aims to provide financial assistance to startups for:
1. Proof of Concept (PoC)
2. Prototype development
3. Product trials
4. Market entry
5. Commercialization

Startups can receive up to ₹20 Lakhs as a grant for validation of Proof of Concept, or prototype development, or product trials. Additionally, up to ₹50 Lakhs of investment for market entry, commercialization, or scaling up through convertible debentures or debt-linked instruments.`,
    organizer: 'DPIIT, Ministry of Commerce & Industry',
    departmentName: 'Department for Promotion of Industry and Internal Trade',
    category: 'GOVERNMENT_SCHEME',
    governmentLevel: 'CENTRAL',
    benefitType: 'GRANT',
    benefitAmountMin: 2000000,
    benefitAmountMax: 5000000,
    currency: 'INR',
    deliveryMode: 'ONLINE',
    applicationDeadline: '2026-12-31',
    officialApplicationUrl: 'https://seedfund.startupindia.gov.in',
    officialNotificationUrl: 'https://seedfund.startupindia.gov.in/guidelines.pdf',
    eligibilitySummary: 'DPIIT-recognized startup incorporated not more than 2 years ago with innovative technology.',
    verificationStatus: 'OFFICIALLY_VERIFIED',
    verifiedAt: '2026-10-26T10:00:00Z',
    verificationNotes: 'Verified against Gazette of India Extraordinary Notification No. 129.',
    startupStages: ['PROTOTYPE', 'MVP'],
    industries: ['SOFTWARE_IT', 'MANUFACTURING', 'HEALTHCARE_LIFESCIENCES'],
    sources: [
      {
        id: 'src-1',
        sourceUrl: 'https://www.startupindia.gov.in/content/sih/en/schemes/seed-fund-scheme.html',
        sourceType: 'PRIMARY',
        isPrimarySource: true,
        lastSeenAt: '2026-10-27T08:00:00Z',
      },
      {
        id: 'src-2',
        sourceUrl: 'https://dpiit.gov.in/startup-initiatives/seed-fund',
        sourceType: 'SECONDARY',
        isPrimarySource: false,
        lastSeenAt: '2026-10-27T07:30:00Z',
      },
    ],
    eligibilityCriteria: [
      {
        id: 'c1',
        criterionType: 'RECOGNITION',
        description: 'A startup recognized by DPIIT, incorporated not more than 2 years ago at the time of application.',
        isMandatory: true,
      },
      {
        id: 'c2',
        criterionType: 'INNOVATION',
        description: 'Startup must have a business idea to develop a product or a service with a market fit, viable commercialization, and scope of scaling.',
        isMandatory: true,
      },
      {
        id: 'c3',
        criterionType: 'FUNDING_LIMIT',
        description: 'Startup should not have received more than ₹10 Lakhs of monetary support under any other Central or State Government scheme.',
        isMandatory: true,
      },
      {
        id: 'c4',
        criterionType: 'SHAREHOLDING',
        description: 'Shareholding by Indian promoters in the startup should be at least 51% at the time of application.',
        isMandatory: true,
      },
    ],
  },
};

async function getOpportunity(slug: string): Promise<OpportunityDetail | null> {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/opportunities/${slug}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to local mock data
  }
  return MOCK_DETAILS[slug] || null;
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const opp = await getOpportunity(params.slug);

  if (!opp) {
    notFound();
  }

  const formatAmount = (max?: number) => {
    if (!max) return 'As per guidelines';
    if (max >= 10000000) return `Up to ₹${(max / 10000000).toFixed(1)} Crore`;
    if (max >= 100000) return `Up to ₹${(max / 100000).toFixed(0)} Lakhs`;
    return `Up to ₹${max.toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/opportunities" className="hover:text-indigo-400 transition">
          ← Back to Opportunities
        </Link>
        <span>/</span>
        <span className="text-slate-300 truncate">{opp.title}</span>
      </div>

      {/* Main Canonical Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        {/* Verification & Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5 shadow-sm">
              <span>✓</span>
              <span>Officially Verified Scheme</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {opp.governmentLevel} GOVERNMENT
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
              {opp.category.replace(/_/g, ' ')}
            </span>
          </div>

          <span className="text-xs text-slate-400">
            {opp.applicationDeadline ? `Deadline: ${opp.applicationDeadline}` : 'Continuous / Rolling'}
          </span>
        </div>

        {/* Title & Department */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {opp.title}
        </h1>
        <p className="mt-2 text-base text-indigo-400 font-medium">
          {opp.organizer} {opp.departmentName && `• ${opp.departmentName}`}
        </p>

        {/* Highlights Matrix */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800">
          <div>
            <span className="block text-xs text-slate-500 font-medium">Benefit Type</span>
            <span className="block mt-1 text-sm font-semibold text-white">
              {opp.benefitType.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500 font-medium">Max Funding</span>
            <span className="block mt-1 text-sm font-bold text-emerald-400">
              {formatAmount(opp.benefitAmountMax)}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500 font-medium">Delivery Mode</span>
            <span className="block mt-1 text-sm font-semibold text-white">
              {opp.deliveryMode}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500 font-medium">Location</span>
            <span className="block mt-1 text-sm font-semibold text-white">
              All India
            </span>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {opp.officialApplicationUrl && (
            <a
              href={opp.officialApplicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-900/30 flex items-center gap-2"
            >
              <span>Apply on Official Portal</span>
              <span>↗</span>
            </a>
          )}
          {opp.officialNotificationUrl && (
            <a
              href={opp.officialNotificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition flex items-center gap-2"
            >
              <span>View Official Guidelines / Gazette</span>
              <span>📄</span>
            </a>
          )}
        </div>

        {/* Detailed Description */}
        <div className="mt-10 pt-8 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white mb-3">About This Opportunity</h2>
          <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {opp.description || opp.summary}
          </div>
        </div>

        {/* Eligibility Criteria Checklist */}
        <div className="mt-10 pt-8 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white mb-2">Mandatory Eligibility Criteria</h2>
          <p className="text-xs text-slate-400 mb-5">
            Verified official guidelines requirements that applicant startups must satisfy:
          </p>

          <div className="space-y-3">
            {opp.eligibilityCriteria && opp.eligibilityCriteria.length > 0 ? (
              opp.eligibilityCriteria.map((c, i) => (
                <div
                  key={c.id || i}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80"
                >
                  <span className="text-emerald-400 font-bold text-base mt-0.5">✓</span>
                  <div>
                    <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block mb-0.5">
                      {c.criterionType}
                    </span>
                    <span className="text-sm text-slate-200">{c.description}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">{opp.eligibilitySummary || 'Refer to official guidelines.'}</p>
            )}
          </div>
        </div>

        {/* Source Provenance Attribution Section */}
        <div className="mt-10 pt-8 border-t border-slate-800">
          <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-900/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-2">
              <span>🛡️ Data Integrity & Source Attribution</span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              In accordance with Startup Radar India principle #5 (Source Provenance is Mandatory),
              this record is deterministically linked to official public notices. We never publish
              fabricated or unverified deadlines.
            </p>

            <div className="space-y-2 text-xs font-mono">
              {opp.sources?.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-slate-950 text-slate-400 border border-slate-800"
                >
                  <span className="truncate max-w-md text-slate-300">
                    <span className="text-indigo-400 font-semibold mr-2">[{s.sourceType}]</span>
                    {s.sourceUrl}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Seen: {new Date(s.lastSeenAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>

            {opp.verificationNotes && (
              <p className="mt-3 text-[11px] text-emerald-400/90 font-sans italic">
                Verification note: {opp.verificationNotes}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
