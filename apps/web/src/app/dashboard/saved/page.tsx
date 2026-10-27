'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SavedOpportunity {
  id: string;
  opportunityId: string;
  notes?: string;
  createdAt: string;
  opportunity: {
    id: string;
    slug: string;
    title: string;
    summary?: string;
    organizer?: string;
    category: string;
    benefitType: string;
    currency: string;
    benefitAmountMin?: number;
    benefitAmountMax?: number;
    applicationDeadline?: string;
    officialApplicationUrl?: string;
    verificationStatus: string;
  };
}

interface SavedPerk {
  id: string;
  perkProgramId: string;
  notes?: string;
  createdAt: string;
  perkProgram: {
    id: string;
    slug: string;
    programName: string;
    description?: string;
    benefitType: string;
    statedValueAmount?: number;
    currency: string;
    officialProgramUrl: string;
    applicationUrl?: string;
    status: string;
    verificationStatus: string;
    provider: {
      id: string;
      name: string;
      logoUrl?: string;
    };
  };
}

export default function SavedItemsPage() {
  const [activeTab, setActiveTab] = useState<'opportunities' | 'perks'>('opportunities');
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [savedPerks, setSavedPerks] = useState<SavedPerk[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    // Simulated demo data if unauthenticated, plus live API fetch attempt
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          const [oppRes, perkRes, prefRes] = await Promise.all([
            fetch('/api/v1/me/saved-opportunities', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/v1/me/saved-perks', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/v1/me/preferences', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } }),
          ]);
          if (oppRes.ok) setSavedOpportunities(await oppRes.json());
          if (perkRes.ok) setSavedPerks(await perkRes.json());
          if (prefRes.ok) {
            const pref = await prefRes.json();
            setEmailAlertsEnabled(pref.emailAlertsEnabled);
          }
        } else {
          // Provide default demo showcase for guest visitors
          setSavedOpportunities([
            {
              id: 'demo-saved-1',
              opportunityId: 'opp-1',
              notes: 'Focus on Section B eligibility checklist',
              createdAt: new Date().toISOString(),
              opportunity: {
                id: 'opp-1',
                slug: 'startup-india-seed-fund-scheme-2026',
                title: 'Startup India Seed Fund Scheme (SISFS)',
                summary: 'Financial assistance to startups for proof of concept, prototype development, product trials, and market entry.',
                organizer: 'DPIIT, Ministry of Commerce & Industry',
                category: 'GOVERNMENT_SCHEME',
                benefitType: 'GRANT',
                currency: 'INR',
                benefitAmountMin: 2000000,
                benefitAmountMax: 5000000,
                applicationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                officialApplicationUrl: 'https://seedfund.startupindia.gov.in',
                verificationStatus: 'OFFICIALLY_VERIFIED',
              },
            },
          ]);
          setSavedPerks([
            {
              id: 'demo-saved-perk-1',
              perkProgramId: 'perk-1',
              notes: 'Apply after MVP deployment',
              createdAt: new Date().toISOString(),
              perkProgram: {
                id: 'perk-1',
                slug: 'aws-activate-founders',
                programName: 'AWS Activate Founders Tier',
                description: 'Up to $10,000 USD in promotional credits and technical architecture support for bootstrapped and early-stage founders.',
                benefitType: 'CLOUD_CREDITS',
                statedValueAmount: 10000,
                currency: 'USD',
                officialProgramUrl: 'https://aws.amazon.com/activate',
                status: 'ACTIVE',
                verificationStatus: 'OFFICIALLY_VERIFIED',
                provider: {
                  id: 'prov-aws',
                  name: 'Amazon Web Services',
                },
              },
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleAlerts = async () => {
    const nextState = !emailAlertsEnabled;
    setEmailAlertsEnabled(nextState);
    setStatusMessage(`Email alerts ${nextState ? 'enabled' : 'paused'}.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRemoveOpportunity = (id: string) => {
    setSavedOpportunities((prev) => prev.filter((item) => item.id !== id));
    setStatusMessage('Opportunity removed from saved list.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRemovePerk = (id: string) => {
    setSavedPerks((prev) => prev.filter((item) => item.id !== id));
    setStatusMessage('Perk removed from saved list.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const getDeadlineBadge = (deadlineStr?: string) => {
    if (!deadlineStr) return { text: 'No fixed deadline', color: 'bg-slate-800 text-slate-400 border-slate-700' };
    const days = Math.ceil((new Date(deadlineStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: 'Closed', color: 'bg-red-950/60 text-red-400 border-red-800' };
    if (days <= 2) return { text: `🔥 Closing in ${days} days (Urgent)`, color: 'bg-rose-950/80 text-rose-300 border-rose-700' };
    if (days <= 7) return { text: `⏰ ${days} days remaining`, color: 'bg-amber-950/80 text-amber-300 border-amber-700' };
    return { text: `📅 ${days} days remaining`, color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>🔖</span> Saved Items & Alerts
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your shortlisted government schemes, grants, competitions, and startup perk packages in one place.
          </p>
        </div>

        {/* Email Alerts Toggle Card */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200">Deadline Alerts</span>
            <span className="text-[11px] text-slate-400">7-day & 48-hour reminders</span>
          </div>
          <button
            onClick={handleToggleAlerts}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition border ${
              emailAlertsEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {emailAlertsEnabled ? 'Active (ON)' : 'Paused (OFF)'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-3 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-indigo-200 text-sm flex items-center gap-2">
          <span>✓</span> {statusMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`pb-3 px-4 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'opportunities'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🎯</span> Saved Opportunities
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {savedOpportunities.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('perks')}
          className={`pb-3 px-4 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'perks'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🎁</span> Saved Perks & Credits
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {savedPerks.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading saved items...</div>
      ) : activeTab === 'opportunities' ? (
        savedOpportunities.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <span className="text-4xl block mb-3">📁</span>
            <h3 className="text-lg font-bold text-slate-200">No saved opportunities yet</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
              Browse grants, tenders, hackathons, and accelerators, then click "Save" to track deadlines automatically.
            </p>
            <Link
              href="/opportunities"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30"
            >
              Explore Opportunities Directory →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedOpportunities.map((item) => {
              const deadlineBadge = getDeadlineBadge(item.opportunity.applicationDeadline);
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-semibold border border-indigo-900/60">
                        {item.opportunity.category.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${deadlineBadge.color}`}>
                        {deadlineBadge.text}
                      </span>
                    </div>

                    <Link
                      href={`/opportunities/${item.opportunity.slug}`}
                      className="text-base font-bold text-slate-100 hover:text-indigo-300 transition line-clamp-2"
                    >
                      {item.opportunity.title}
                    </Link>

                    {item.opportunity.organizer && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <span>🏛️</span> {item.opportunity.organizer}
                      </p>
                    )}

                    {item.opportunity.summary && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {item.opportunity.summary}
                      </p>
                    )}

                    {item.notes && (
                      <div className="mt-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300/90">
                        <span className="font-semibold text-amber-400">Personal Note:</span> {item.notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Link
                      href="/dashboard/applications"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition flex items-center gap-1"
                    >
                      <span>📝</span> Track Application
                    </Link>

                    <button
                      onClick={() => handleRemoveOpportunity(item.id)}
                      className="text-xs text-slate-400 hover:text-rose-400 transition px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : savedPerks.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <span className="text-4xl block mb-3">🎁</span>
          <h3 className="text-lg font-bold text-slate-200">No saved perks or credits yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
            Explore cloud credits, SaaS discounts, and developer tooling packages, and bookmark eligible partner offers.
          </p>
          <Link
            href="/perks"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30"
          >
            Explore Perks Directory →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedPerks.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-semibold border border-amber-900/60">
                    {item.perkProgram.benefitType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                    {item.perkProgram.status}
                  </span>
                </div>

                <Link
                  href={`/perks/${item.perkProgram.slug}`}
                  className="text-base font-bold text-slate-100 hover:text-amber-300 transition line-clamp-2"
                >
                  {item.perkProgram.programName}
                </Link>

                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <span>🏢</span> {item.perkProgram.provider.name}
                </p>

                {item.perkProgram.statedValueAmount && (
                  <div className="mt-3 text-lg font-extrabold text-emerald-400">
                    ${item.perkProgram.statedValueAmount.toLocaleString()} {item.perkProgram.currency}
                  </div>
                )}

                {item.perkProgram.description && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {item.perkProgram.description}
                  </p>
                )}

                {item.notes && (
                  <div className="mt-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300/90">
                    <span className="font-semibold text-amber-400">Personal Note:</span> {item.notes}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <a
                  href={item.perkProgram.officialProgramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-950/70 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 transition flex items-center gap-1"
                >
                  <span>🚀</span> Open Official Portal
                </a>

                <button
                  onClick={() => handleRemovePerk(item.id)}
                  className="text-xs text-slate-400 hover:text-rose-400 transition px-2 py-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
