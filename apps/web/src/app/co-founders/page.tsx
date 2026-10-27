'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface FounderSkill {
  id?: string;
  skillName: string;
  skillType: 'OFFERED' | 'SEEKING';
  proficiency: string;
}

interface FounderProfile {
  id: string;
  userId: string;
  displayName: string;
  headline?: string;
  bio?: string;
  currentRole?: string;
  desiredRole?: string;
  stage: string;
  primarySector: string;
  locationCity?: string;
  locationState?: string;
  countryCode: string;
  commitment: string;
  workLocation: string;
  status: string;
  linkedinUrl?: string;
  githubUrl?: string;
  skills: FounderSkill[];
}

interface CoFounderRecommendation {
  candidateProfile: FounderProfile;
  matchScore: number;
  matchReasons: string[];
  complementarySkills: string[];
  sharedSectors: string[];
  synergies: string[];
}

const SECTOR_OPTIONS = [
  'ALL',
  'AGRICULTURE',
  'HEALTHCARE_LIFESCIENCES',
  'CLEAN_ENERGY_CLIMATE',
  'FINTECH',
  'SOFTWARE_IT',
  'MANUFACTURING',
  'DEFENSE_AEROSPACE',
  'EDUCATION_EDTECH',
];

export default function CoFoundersDirectoryPage() {
  const [profiles, setProfiles] = useState<FounderProfile[]>([]);
  const [recommendations, setRecommendations] = useState<CoFounderRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'recommendations'>('discover');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [commitmentFilter, setCommitmentFilter] = useState('ALL');
  const [workLocationFilter, setWorkLocationFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectingProfileId, setConnectingProfileId] = useState<string | null>(null);
  const [introMessage, setIntroMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          const [profRes, recRes] = await Promise.all([
            fetch('/api/v1/founders', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/v1/founders/me/recommendations', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } }),
          ]);
          if (profRes.ok) {
            const data = await profRes.json();
            setProfiles(data.data || []);
          }
          if (recRes.ok) {
            setRecommendations(await recRes.json());
          }
          setLoading(false);
          return;
        }

        // Demo profiles for public visitors
        const demoProfiles: FounderProfile[] = [
          {
            id: 'fp-1',
            userId: 'user-1',
            displayName: 'Aravind Venkat',
            headline: 'Ex-ISRO Robotics Lead building autonomous agri-spraying drones',
            bio: '10 years embedded systems and robotics experience. Seeking a commercial / business co-founder with B2B distribution and farming FPO network experience.',
            currentRole: 'CTO / Hardware Architect',
            desiredRole: 'Co-Founder (Business & Operations)',
            stage: 'PROTOTYPE',
            primarySector: 'AGRICULTURE',
            locationCity: 'Bengaluru',
            locationState: 'Karnataka',
            countryCode: 'IN',
            commitment: 'FULL_TIME',
            workLocation: 'HYBRID',
            status: 'ACTIVE',
            skills: [
              { skillName: 'Robotics & Embedded Systems', skillType: 'OFFERED', proficiency: 'EXPERT' },
              { skillName: 'Computer Vision', skillType: 'OFFERED', proficiency: 'INTERMEDIATE' },
              { skillName: 'B2B Sales & FPO Partnerships', skillType: 'SEEKING', proficiency: 'EXPERT' },
              { skillName: 'Fundraising & Grants', skillType: 'SEEKING', proficiency: 'INTERMEDIATE' },
            ],
          },
          {
            id: 'fp-2',
            userId: 'user-2',
            displayName: 'Pooja Sundaram',
            headline: 'HealthTech Product Strategist & Regulatory Specialist',
            bio: 'Former clinical trial coordinator with deep ties across private hospital networks in South India. Seeking an AI / Machine Learning co-founder to build diagnostic imaging tools.',
            currentRole: 'Head of Product Strategy',
            desiredRole: 'Technical Co-Founder (AI/ML)',
            stage: 'EXPLORING_IDEA',
            primarySector: 'HEALTHCARE_LIFESCIENCES',
            locationCity: 'Chennai',
            locationState: 'Tamil Nadu',
            countryCode: 'IN',
            commitment: 'FULL_TIME',
            workLocation: 'REMOTE',
            status: 'ACTIVE',
            skills: [
              { skillName: 'Clinical Trials & CDSCO Compliance', skillType: 'OFFERED', proficiency: 'EXPERT' },
              { skillName: 'Hospital Sales & Pilots', skillType: 'OFFERED', proficiency: 'EXPERT' },
              { skillName: 'PyTorch & Medical Imaging Models', skillType: 'SEEKING', proficiency: 'EXPERT' },
              { skillName: 'Full-stack Web Architecture', skillType: 'SEEKING', proficiency: 'INTERMEDIATE' },
            ],
          },
          {
            id: 'fp-3',
            userId: 'user-3',
            displayName: 'Karan Mehra',
            headline: 'FinTech Growth Operator & Lending Infra Builder',
            bio: 'Scaled NBFC debt products to ₹120Cr AUM. Looking for a full-stack engineering lead to co-found an MSME invoice discounting protocol.',
            currentRole: 'VP of Growth & Lending',
            desiredRole: 'Technical Co-Founder (CTO)',
            stage: 'MVP',
            primarySector: 'FINTECH',
            locationCity: 'Mumbai',
            locationState: 'Maharashtra',
            countryCode: 'IN',
            commitment: 'FULL_TIME',
            workLocation: 'HYBRID',
            status: 'ACTIVE',
            skills: [
              { skillName: 'Risk Underwriting & Credit Policies', skillType: 'OFFERED', proficiency: 'EXPERT' },
              { skillName: 'RBI Compliance', skillType: 'OFFERED', proficiency: 'EXPERT' },
              { skillName: 'Distributed Systems & Microservices', skillType: 'SEEKING', proficiency: 'EXPERT' },
            ],
          },
        ];

        setProfiles(demoProfiles);
        setRecommendations([
          {
            candidateProfile: demoProfiles[0],
            matchScore: 92,
            matchReasons: [
              'Offers Robotics & Computer Vision matching your seeking requirements',
              'Both committed to Full-time hybrid collaboration in India',
              'Committed to Seed-stage prototype development in Agriculture',
            ],
            complementarySkills: ['Robotics', 'Computer Vision'],
            sharedSectors: ['AGRICULTURE'],
            synergies: ['Mutual FULL_TIME commitment', 'Hardware + Business complementary skillset'],
          },
          {
            candidateProfile: demoProfiles[1],
            matchScore: 84,
            matchReasons: [
              'Offers Clinical Trial & Hospital Distribution expertise',
              'Seeking Technical AI/ML Lead which matches your skillset',
            ],
            complementarySkills: ['Clinical Trials', 'Hospital Distribution'],
            sharedSectors: ['HEALTHCARE_LIFESCIENCES'],
            synergies: ['Remote friendly collaboration'],
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

  const handleSendConnection = (profileId: string) => {
    setConnectingProfileId(null);
    setIntroMessage('');
    setStatusMessage('Connection request sent! Private contact details will be shared once they accept.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const filteredProfiles = profiles.filter((p) => {
    if (sectorFilter !== 'ALL' && p.primarySector !== sectorFilter) return false;
    if (commitmentFilter !== 'ALL' && p.commitment !== commitmentFilter) return false;
    if (workLocationFilter !== 'ALL' && p.workLocation !== workLocationFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.displayName.toLowerCase().includes(q);
      const matchHeadline = p.headline?.toLowerCase().includes(q);
      const matchCity = p.locationCity?.toLowerCase().includes(q);
      const matchSkill = p.skills.some((s) => s.skillName.toLowerCase().includes(q));
      if (!matchName && !matchHeadline && !matchCity && !matchSkill) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-800 text-purple-300 text-xs font-semibold mb-3">
          <span>🤝</span> Co-Founder Matching MVP
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Find Your Ideal Co-Founder in India
        </h1>
        <p className="text-slate-400 text-sm mt-3 leading-relaxed">
          Discover compatible, high-intent founders across all sectors based on complementary skills, startup stage, commitment, and working style.
        </p>
      </div>

      {/* Privacy Notice Banner */}
      <div className="mb-8 p-4 rounded-2xl bg-slate-900/90 border border-purple-900/50 flex items-start gap-3">
        <span className="text-2xl">🔒</span>
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-purple-300">Privacy & Consent by Design:</strong> Direct contact details (email and phone number) are strictly protected. They are exchanged only after both founders mutually accept a connection request. Unsolicited bulk messaging is prevented.
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-sm flex items-center gap-2">
          <span>✓</span> {statusMessage}
        </div>
      )}

      {/* Directory vs Smart Recommendations Switch */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('discover')}
          className={`pb-3 px-5 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'discover'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔍</span> Discover Founders
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {filteredProfiles.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`pb-3 px-5 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'recommendations'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>💡</span> Smart Recommendations
          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-950 text-purple-300 border border-purple-800">
            {recommendations.length} Matches
          </span>
        </button>
      </div>

      {activeTab === 'discover' ? (
        <>
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, role, skill, or city (e.g., Computer Vision, B2B Sales, Bengaluru)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={commitmentFilter}
                  onChange={(e) => setCommitmentFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Commitment</option>
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="EXPLORING">Exploring</option>
                </select>

                <select
                  value={workLocationFilter}
                  onChange={(e) => setWorkLocationFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Locations</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="IN_PERSON">In-Person</option>
                </select>
              </div>
            </div>

            {/* Sector filter pills */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
              {SECTOR_OPTIONS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSectorFilter(sec)}
                  className={`text-xs px-3 py-1 rounded-lg transition font-medium border ${
                    sectorFilter === sec
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {sec === 'ALL' ? 'All Sectors' : sec.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Profiles Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading founder profiles...</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
              <span className="text-4xl block mb-3">🔍</span>
              <h3 className="text-lg font-bold text-slate-200">No matching founders found</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
                Try broadening your sector or skill filters to explore more potential partners across India.
              </p>
              <button
                onClick={() => {
                  setSectorFilter('ALL');
                  setCommitmentFilter('ALL');
                  setWorkLocationFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((p) => {
                const offeredSkills = p.skills.filter((s) => s.skillType === 'OFFERED');
                const seekingSkills = p.skills.filter((s) => s.skillType === 'SEEKING');

                return (
                  <div
                    key={p.id}
                    className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between hover:border-purple-900/80 transition"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-purple-950/80 text-purple-300 border border-purple-800">
                          {p.primarySector.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {p.commitment.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white tracking-tight">{p.displayName}</h3>

                      {p.headline && (
                        <p className="text-xs text-purple-300 font-medium mt-1 leading-snug">
                          {p.headline}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                        {p.locationCity && <span>📍 {p.locationCity}, {p.locationState || p.countryCode}</span>}
                        <span>•</span>
                        <span className="text-slate-300">{p.workLocation}</span>
                      </div>

                      {p.bio && (
                        <p className="text-xs text-slate-400 mt-3 line-clamp-3 leading-relaxed">
                          {p.bio}
                        </p>
                      )}

                      {/* Offered Skills */}
                      {offeredSkills.length > 0 && (
                        <div className="mt-4">
                          <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 block mb-1.5">
                            Offers Skills:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {offeredSkills.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900"
                              >
                                {s.skillName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Seeking Skills */}
                      {seekingSkills.length > 0 && (
                        <div className="mt-3">
                          <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 block mb-1.5">
                            Seeking Co-Founder with:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {seekingSkills.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-900"
                              >
                                {s.skillName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Area */}
                    <div className="pt-4 mt-6 border-t border-slate-800">
                      {connectingProfileId === p.id ? (
                        <div className="space-y-2">
                          <textarea
                            placeholder="Add a polite intro on why your skills and startup vision align..."
                            rows={2}
                            value={introMessage}
                            onChange={(e) => setIntroMessage(e.target.value)}
                            className="w-full text-xs p-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSendConnection(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex-1"
                            >
                              Send Request
                            </button>
                            <button
                              onClick={() => setConnectingProfileId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConnectingProfileId(p.id)}
                          className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <span>💬</span> Connect with Founder
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Smart Recommendations View */
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <strong className="text-purple-300">Deterministic Recommendation Engine:</strong> Compatibility is calculated deterministically by evaluating complementary skill matches, industry focus, commitment level, and stage alignment.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900 border border-purple-900/60 hover:border-purple-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                      <span>⚡</span> {rec.matchScore}% Match
                    </span>
                    <span className="text-xs text-slate-400">
                      {rec.candidateProfile.locationCity}, {rec.candidateProfile.locationState}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{rec.candidateProfile.displayName}</h3>
                  <p className="text-xs text-purple-300 font-medium mt-0.5">{rec.candidateProfile.headline}</p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">
                      Why this match fits:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {rec.matchReasons.map((reason, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 text-sm">✓</span> {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {rec.complementarySkills.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-semibold">Complementary:</span>
                      {rec.complementarySkills.map((skill, sIdx) => (
                        <span key={sIdx} className="text-[11px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-6 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setActiveTab('discover');
                      setSearchQuery(rec.candidateProfile.displayName);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    View Full Profile & Send Request →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
