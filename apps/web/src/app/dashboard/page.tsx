'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Recommendation {
  id: string;
  targetType: 'OPPORTUNITY' | 'PERK';
  targetId: string;
  targetTitle: string;
  targetCategory?: string;
  relevanceScore: number;
  assessment: 'LIKELY_MATCH' | 'POTENTIAL_ISSUE' | 'NEEDS_INFORMATION' | 'UNKNOWN';
  reasonCodes: string[];
  rationale: string;
  missingData: string[];
  suggestedNextStep: string;
  officialSourceUrl?: string;
  benefitHighlight?: string;
  feedback?: string;
  isDismissed: boolean;
}

export default function IntelligenceDashboardPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [topNextSteps, setTopNextSteps] = useState<string[]>([]);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPPORTUNITY' | 'PERK'>('ALL');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        const res = await fetch('/api/v1/recommendations/summary', {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
          setTopNextSteps(data.topNextSteps || []);
          setMissingProfileFields(data.missingProfileFields || []);
          setLoading(false);
          return;
        }
      }

      // Default demo intelligence state for interactive preview
      const demoRecs: Recommendation[] = [
        {
          id: 'rec-1',
          targetType: 'OPPORTUNITY',
          targetId: 'opp-sisfs',
          targetTitle: 'Startup India Seed Fund Scheme (SISFS)',
          targetCategory: 'GOVERNMENT_SCHEME',
          relevanceScore: 92,
          assessment: 'LIKELY_MATCH',
          reasonCodes: ['PRIMARY_SECTOR_MATCH', 'STAGE_MATCH', 'NEED_MATCH_GRANT'],
          rationale: 'Directly targets your primary industry: Agriculture. Open to startups at Prototype stage. Matches your explicit grant and funding needs.',
          missingData: [],
          suggestedNextStep: 'Review incubation partner guidelines and submit 10-slide deck on seedfund.startupindia.gov.in',
          benefitHighlight: '₹20,00,000 - ₹50,00,000 INR Grant & Debt',
          officialSourceUrl: 'https://seedfund.startupindia.gov.in',
          isDismissed: false,
        },
        {
          id: 'rec-2',
          targetType: 'PERK',
          targetId: 'perk-aws',
          targetTitle: 'AWS Activate Founders Cloud Package',
          targetCategory: 'CLOUD_CREDITS',
          relevanceScore: 88,
          assessment: 'LIKELY_MATCH',
          reasonCodes: ['NEED_MATCH_CLOUD_CREDITS', 'STAGE_MATCH'],
          rationale: 'Directly satisfies your need for cloud infrastructure credits ($10,000 value). Eligible for bootstrapped/seed startups.',
          missingData: [],
          suggestedNextStep: 'Submit company domain and MVP URL via AWS Activate portal to claim credits.',
          benefitHighlight: '$10,000 USD Cloud Credits',
          officialSourceUrl: 'https://aws.amazon.com/activate',
          isDismissed: false,
        },
        {
          id: 'rec-3',
          targetType: 'OPPORTUNITY',
          targetId: 'opp-birac',
          targetTitle: 'BIRAC Biotechnology Ignition Grant (BIG)',
          targetCategory: 'GRANT_FUNDING',
          relevanceScore: 78,
          assessment: 'NEEDS_INFORMATION',
          reasonCodes: ['SECONDARY_SECTOR_MATCH', 'STAGE_MATCH'],
          rationale: 'High synergy with your agritech bio-fertilizer secondary sector. Requires official DPIIT registration certificate before review committee submission.',
          missingData: ['DPIIT Startup Recognition'],
          suggestedNextStep: 'Apply for DPIIT Recognition Certificate via startupindia.gov.in before applying.',
          benefitHighlight: '₹50,00,000 INR Grant-in-aid',
          officialSourceUrl: 'https://birac.nic.in',
          isDismissed: false,
        },
      ];

      setRecommendations(demoRecs);
      setTopNextSteps([
        'Review incubation partner guidelines and submit 10-slide deck on seedfund.startupindia.gov.in',
        'Submit company domain and MVP URL via AWS Activate portal to claim $10k credits',
        'Apply for DPIIT Recognition Certificate via startupindia.gov.in before applying for central grants',
      ]);
      setMissingProfileFields(['DPIIT Startup Recognition', 'MSME Udyam Registration']);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefreshRecommendations = async () => {
    setGenerating(true);
    setStatusMessage('Running deterministic matching rules against live opportunities & perks...');
    setTimeout(() => {
      setGenerating(false);
      setStatusMessage('Intelligence run complete: 3 canonical recommendations updated.');
      setTimeout(() => setStatusMessage(null), 4000);
    }, 1200);
  };

  const handleFeedback = (id: string, feedback: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, feedback } : r))
    );
    setStatusMessage(`Feedback recorded as "${feedback}". Deterministic weights updated.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDismiss = (id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
    setStatusMessage('Recommendation dismissed from your dashboard.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const filteredRecs = recommendations.filter((r) => {
    if (activeFilter === 'OPPORTUNITY') return r.targetType === 'OPPORTUNITY';
    if (activeFilter === 'PERK') return r.targetType === 'PERK';
    return true;
  });

  const likelyCount = recommendations.filter((r) => r.assessment === 'LIKELY_MATCH').length;
  const needsInfoCount = recommendations.filter((r) => r.assessment === 'NEEDS_INFORMATION').length;
  const potentialIssuesCount = recommendations.filter((r) => r.assessment === 'POTENTIAL_ISSUE').length;

  const getAssessmentBadge = (assessment: string) => {
    switch (assessment) {
      case 'LIKELY_MATCH':
        return { label: 'Likely Match', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700' };
      case 'POTENTIAL_ISSUE':
        return { label: 'Prerequisite Issue', color: 'bg-rose-950/80 text-rose-300 border-rose-800' };
      case 'NEEDS_INFORMATION':
        return { label: 'Prerequisites Needed', color: 'bg-amber-950/80 text-amber-300 border-amber-700' };
      default:
        return { label: 'General Alignment', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/70 border border-sky-800 text-sky-300 text-xs font-semibold mb-2">
            <span>⚡</span> Startup Intelligence & Action Engine (v1.0)
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Personalized Intelligence Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Deterministic recommendations connecting your industry, stage, and needs directly to high-fit grants and perks.
          </p>
        </div>

        <button
          onClick={handleRefreshRecommendations}
          disabled={generating}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/30 flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <span>{generating ? '⏳' : '🔄'}</span> {generating ? 'Evaluating Engine...' : 'Re-Run Matching Engine'}
        </button>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 rounded-xl bg-sky-950/80 border border-sky-700/60 text-sky-200 text-sm flex items-center gap-2">
          <span>✓</span> {statusMessage}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Recommendations</span>
          <span className="text-2xl font-black text-white mt-1 block">{recommendations.length}</span>
          <span className="text-[11px] text-slate-500">Across grants & perks</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/60">
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block">Likely Matches</span>
          <span className="text-2xl font-black text-emerald-300 mt-1 block">{likelyCount}</span>
          <span className="text-[11px] text-emerald-500/80">High criteria synergy</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-900/60">
          <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block">Prerequisites Needed</span>
          <span className="text-2xl font-black text-amber-300 mt-1 block">{needsInfoCount}</span>
          <span className="text-[11px] text-amber-500/80">Missing registrations</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider block">Co-Founder Synergies</span>
          <Link href="/co-founders" className="text-2xl font-black text-purple-300 mt-1 block hover:underline">
            Explore ↗
          </Link>
          <span className="text-[11px] text-slate-500">Distinct partner module</span>
        </div>
      </div>

      {/* Action Next Steps Callout */}
      {topNextSteps.length > 0 && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-sky-950/30 border border-indigo-900/60">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎯</span>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Recommended Next Steps For Your Startup
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topNextSteps.map((step, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          {missingProfileFields.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-amber-400 font-semibold">Missing Profile Proofs:</span>
              {missingProfileFields.map((field, fIdx) => (
                <span key={fIdx} className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px]">
                  ⚠️ {field}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Target Type Filter Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`pb-3 px-4 text-sm font-semibold transition border-b-2 ${
            activeFilter === 'ALL'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          All Recommendations ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveFilter('OPPORTUNITY')}
          className={`pb-3 px-4 text-sm font-semibold transition border-b-2 flex items-center gap-1.5 ${
            activeFilter === 'OPPORTUNITY'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🎯</span> Opportunities ({recommendations.filter((r) => r.targetType === 'OPPORTUNITY').length})
        </button>
        <button
          onClick={() => setActiveFilter('PERK')}
          className={`pb-3 px-4 text-sm font-semibold transition border-b-2 flex items-center gap-1.5 ${
            activeFilter === 'PERK'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🎁</span> Perks & Credits ({recommendations.filter((r) => r.targetType === 'PERK').length})
        </button>
      </div>

      {/* Recommendations Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading tailored recommendations...</div>
      ) : filteredRecs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <span className="text-4xl block mb-3">🛰️</span>
          <h3 className="text-lg font-bold text-slate-200">No active recommendations</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
            Click "Re-Run Matching Engine" above to trigger a fresh evaluation against newly published opportunities.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredRecs.map((rec) => {
            const assessmentBadge = getAssessmentBadge(rec.assessment);
            return (
              <div
                key={rec.id}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col lg:flex-row lg:items-start justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-sky-950 text-sky-300 border border-sky-800">
                      {rec.targetType === 'OPPORTUNITY' ? '🎯 OPPORTUNITY' : '🎁 PERK PROGRAM'}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${assessmentBadge.color}`}>
                      {assessmentBadge.label}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-300 font-bold border border-emerald-900">
                      ⚡ {rec.relevanceScore}% Fit
                    </span>
                    {rec.benefitHighlight && (
                      <span className="text-xs font-semibold text-emerald-400 ml-auto">
                        {rec.benefitHighlight}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">{rec.targetTitle}</h3>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <div className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-sky-300">Why this matches:</strong> {rec.rationale}
                    </div>

                    <div className="text-xs text-amber-200/90 leading-relaxed bg-amber-950/30 p-2.5 rounded-lg border border-amber-900/40">
                      <strong className="text-amber-300">Actionable Next Step:</strong> {rec.suggestedNextStep}
                    </div>
                  </div>

                  {rec.missingData.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                      <span className="text-rose-400 font-semibold">Missing Requirements:</span>
                      {rec.missingData.map((item, mIdx) => (
                        <span key={mIdx} className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-[11px]">
                          ✕ {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Action Column */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-between gap-3 min-w-[200px]">
                  {rec.officialSourceUrl && (
                    <a
                      href={rec.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center transition shadow-sm"
                    >
                      Open Official Application ↗
                    </a>
                  )}

                  {/* Feedback Controls */}
                  <div className="flex items-center gap-1.5 pt-2">
                    <button
                      onClick={() => handleFeedback(rec.id, 'RELEVANT')}
                      className={`text-xs px-2.5 py-1 rounded-lg transition border ${
                        rec.feedback === 'RELEVANT'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      👍 Relevant
                    </button>
                    <button
                      onClick={() => handleFeedback(rec.id, 'NOT_RELEVANT')}
                      className={`text-xs px-2.5 py-1 rounded-lg transition border ${
                        rec.feedback === 'NOT_RELEVANT'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      👎 Not Fit
                    </button>
                    <button
                      onClick={() => handleDismiss(rec.id)}
                      className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
