import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clubApi } from '../../api/clubApi';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  Mail,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';

const AdminClubProposalsPage = () => {
  const { isMainAdmin } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposals'); 
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [actionType, setActionType] = useState('approve'); 
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [propRes, clubRes] = await Promise.all([
        clubApi.getClubProposals(),
        clubApi.getClubs(),
      ]);
      setProposals(propRes.proposals || []);
      setClubs(clubRes.clubs || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch club proposals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReview = (proposal, action) => {
    setSelectedProposal(proposal);
    setActionType(action);
    setReviewNotes('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedProposal) return;
    try {
      setSubmittingReview(true);
      setErrorMsg('');
      await clubApi.reviewClubProposal(selectedProposal._id, {
        action: actionType,
        reviewNotes: reviewNotes.trim(),
      });
      setSuccessMsg(
        actionType === 'approve'
          ? `Club "${selectedProposal.name}" has been approved and chartered successfully!`
          : `Proposal for "${selectedProposal.name}" has been rejected.`
      );
      setReviewModalOpen(false);
      setSelectedProposal(null);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || `Failed to ${actionType} proposal.`);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isMainAdmin) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Main Admin Authority Required</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
          Reviewing and chartering official college clubs is reserved strictly for the Level 1 Main College Administrator.
        </p>
        <Link
          to="/admin"
          className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition"
        >
          Return to Admin Console
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <Link to="/admin" className="hover:text-brand-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Admin Console
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-500" />
            Official College Club Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review student charter proposals, appoint approved faculty advisors, and manage institutional clubs.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('proposals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'proposals'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Proposals ({proposals.filter((p) => p.status === 'pending').length} Pending)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('active_clubs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'active_clubs'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Chartered Clubs ({clubs.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-2.5">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-xs text-slate-500 font-medium">Loading club registry & proposals...</p>
        </div>
      ) : activeTab === 'proposals' ? (
        proposals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No Proposals Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              There are currently no club charter applications submitted by students.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => {
              const isPending = proposal.status === 'pending';
              const isApproved = proposal.status === 'approved';
              return (
                <div
                  key={proposal._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{proposal.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {proposal.category}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                              : isApproved
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                          }`}
                        >
                          {proposal.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Proposed by{' '}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {proposal.proposedBy?.name || 'Student'}
                        </strong>{' '}
                        ({proposal.proposedBy?.email}) on {new Date(proposal.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(proposal, 'approve')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Charter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(proposal, 'reject')}
                          className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs transition flex items-center gap-1.5 border border-rose-200 dark:border-rose-800"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Description / Mission</p>
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-3">{proposal.description}</p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-600" /> Nominated Faculty Advisor
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {proposal.facultyAdvisor?.name || 'Not provided'}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {proposal.facultyAdvisor?.designation} • {proposal.facultyAdvisor?.department}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">{proposal.facultyAdvisor?.email}</p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Proposed Student Leaders</p>
                      {proposal.initialLeadership?.length > 0 ? (
                        <div className="space-y-1">
                          {proposal.initialLeadership.map((leader, idx) => (
                            <p key={idx} className="text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-slate-900 dark:text-white">{leader.role}:</span>{' '}
                              {leader.name} ({leader.email})
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400">None specified</p>
                      )}
                    </div>
                  </div>

                  {proposal.reviewNotes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-900 dark:text-white">Admin Notes: </span>
                      {proposal.reviewNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubs.map((club) => (
            <div
              key={club._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    {club.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {club.memberCount || 0} Members
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{club.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{club.description}</p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-4 text-xs">
                  <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> Faculty Advisor
                  </p>
                  <p className="text-slate-900 dark:text-white font-medium">{club.facultyAdvisor?.name || 'Assigned'}</p>
                  <p className="text-slate-500">{club.facultyAdvisor?.email}</p>
                </div>
              </div>

              <Link
                to={`/clubs/${club._id}`}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>View Club Workspace</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {actionType === 'approve' ? 'Approve & Charter Club' : 'Reject Club Proposal'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {actionType === 'approve'
                ? `Approving will immediately create the official college club "${selectedProposal?.name}" in MongoDB Atlas with the assigned Faculty Advisor and leadership.`
                : `Rejecting will mark the proposal as rejected and provide your explanatory notes to the student.`}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Review Notes & Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add comments or charter conditions..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleSubmitReview}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-2 ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                }`}
              >
                {submittingReview ? (
                  <>
                    <Spinner size="sm" className="border-white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClubProposalsPage;
