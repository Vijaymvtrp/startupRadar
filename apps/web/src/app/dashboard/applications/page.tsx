'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TrackedApplication {
  id: string;
  opportunityId: string;
  status: string;
  appliedAt?: string;
  followUpDate?: string;
  privateNotes?: string;
  opportunity: {
    id: string;
    slug: string;
    title: string;
    organizer?: string;
    category: string;
    applicationDeadline?: string;
    officialApplicationUrl?: string;
  };
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Stages' },
  { value: 'SAVED', label: 'Saved' },
  { value: 'APPLYING', label: 'Drafting Application' },
  { value: 'APPLIED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'INTERVIEW', label: 'Interview Scheduled' },
  { value: 'OFFERED', label: 'Grant / Award Offered' },
  { value: 'REJECTED', label: 'Not Selected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

export default function ApplicationsTrackerPage() {
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          const res = await fetch('/api/v1/me/application-tracking', {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setApplications(await res.json());
            setLoading(false);
            return;
          }
        }

        // Demo sample tracker for interactive preview
        setApplications([
          {
            id: 'app-demo-1',
            opportunityId: 'opp-1',
            status: 'APPLIED',
            appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            followUpDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            privateNotes: 'Submitted via DPIIT national single-window portal with MSME registration certificate.',
            opportunity: {
              id: 'opp-1',
              slug: 'startup-india-seed-fund-scheme-2026',
              title: 'Startup India Seed Fund Scheme (SISFS)',
              organizer: 'DPIIT, Ministry of Commerce & Industry',
              category: 'GOVERNMENT_SCHEME',
              applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
              officialApplicationUrl: 'https://seedfund.startupindia.gov.in',
            },
          },
          {
            id: 'app-demo-2',
            opportunityId: 'opp-2',
            status: 'UNDER_REVIEW',
            appliedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            privateNotes: 'Passed stage 1 screening. Awaiting technical evaluation committee feedback.',
            opportunity: {
              id: 'opp-2',
              slug: 'birac-big-biotech-grant-2026',
              title: 'BIRAC Biotechnology Ignition Grant (BIG)',
              organizer: 'BIRAC, Dept of Biotechnology',
              category: 'GRANT_FUNDING',
              applicationDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              officialApplicationUrl: 'https://birac.nic.in',
            },
          },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusChange = (appId: string, nextStatus: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: nextStatus } : app))
    );
    setStatusMessage('Application status updated.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveNotes = (appId: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, privateNotes: tempNotes } : app))
    );
    setEditingNotesId(null);
    setStatusMessage('Private notes updated.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const filteredApplications =
    statusFilter === 'ALL'
      ? applications
      : applications.filter((app) => app.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-950/80 text-blue-300 border-blue-700';
      case 'UNDER_REVIEW':
        return 'bg-amber-950/80 text-amber-300 border-amber-700';
      case 'INTERVIEW':
        return 'bg-purple-950/80 text-purple-300 border-purple-700';
      case 'OFFERED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
      case 'REJECTED':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'WITHDRAWN':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>📝</span> Private Application Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize and track your submissions, review stages, and follow-up reminders privately.
          </p>
        </div>

        <Link
          href="/opportunities"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-sm self-start md:self-auto"
        >
          + Track New Opportunity
        </Link>
      </div>

      {/* Confidentiality Privacy Banner */}
      <div className="mb-8 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/60 flex items-start gap-3">
        <span className="text-xl">🔒</span>
        <div className="text-xs text-indigo-200/90 leading-relaxed">
          <strong className="text-indigo-300">Strict Data Privacy Guaranteed:</strong> Your tracked applications, private notes, and follow-up milestones are accessible exclusively by you. They are never published, shared with organizers, or visible to other founders.
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-emerald-200 text-sm flex items-center gap-2">
          <span>✓</span> {statusMessage}
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
              statusFilter === opt.value
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading tracked applications...</div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <span className="text-4xl block mb-3">📋</span>
          <h3 className="text-lg font-bold text-slate-200">No applications in this category</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
            Track grant proposals, incubator admissions, and corporate tenders to stay on top of review schedules.
          </p>
          <button
            onClick={() => setStatusFilter('ALL')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            View All Applications
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusColor(app.status)}`}>
                    {app.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-400">
                    Category: <strong className="text-slate-300">{app.opportunity.category.replace(/_/g, ' ')}</strong>
                  </span>
                </div>

                <Link
                  href={`/opportunities/${app.opportunity.slug}`}
                  className="text-lg font-bold text-slate-100 hover:text-indigo-400 transition block"
                >
                  {app.opportunity.title}
                </Link>

                {app.opportunity.organizer && (
                  <p className="text-xs text-slate-400">
                    Organizer: <span className="text-slate-300 font-medium">{app.opportunity.organizer}</span>
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                  {app.appliedAt && (
                    <span>
                      📅 Applied on: <strong className="text-slate-300">{new Date(app.appliedAt).toLocaleDateString()}</strong>
                    </span>
                  )}
                  {app.followUpDate && (
                    <span className="text-amber-300/90 flex items-center gap-1 font-medium">
                      <span>⏰</span> Follow-up due: <strong>{new Date(app.followUpDate).toLocaleDateString()}</strong>
                    </span>
                  )}
                </div>

                {/* Private Notes Section */}
                <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <span>🔒</span> Private Notes
                    </span>
                    {editingNotesId !== app.id && (
                      <button
                        onClick={() => {
                          setEditingNotesId(app.id);
                          setTempNotes(app.privateNotes || '');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {editingNotesId === app.id ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="Write personal interview notes, contact references, or required documents..."
                        rows={2}
                        className="w-full text-xs p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveNotes(app.id)}
                          className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                        >
                          Save Notes
                        </button>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 italic">
                      {app.privateNotes || 'No notes added yet.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Update Dropdown & Portal CTA */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 min-w-[200px]">
                <div className="w-full">
                  <label className="text-[11px] text-slate-400 block mb-1">Update Status:</label>
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="w-full text-xs p-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    {STATUS_OPTIONS.filter((o) => o.value !== 'ALL').map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {app.opportunity.officialApplicationUrl && (
                  <a
                    href={app.opportunity.officialApplicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center text-xs font-bold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    View Official Portal ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
