import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { clubApi } from '../../api/clubApi';
import Spinner from '../../components/common/Spinner';
import ImageUploadPicker from '../../components/common/ImageUploadPicker';
import {
  Award,
  ArrowLeft,
  Building,
  Mail,
  User,
  FileText,
  Compass,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Image as ImageIcon,
} from 'lucide-react';

const CLUB_CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Academic',
  'Arts & Media',
  'Social Impact',
  'Entrepreneurship',
  'Other',
];

const ProposeClubPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    category: 'Technical',
    coverImage: '',
    facultyAdvisorName: '',
    facultyAdvisorEmail: '',
    facultyAdvisorDepartment: '',
    facultyAdvisorDesignation: 'Faculty Advisor / Professor',
    presidentName: '',
    presidentEmail: '',
    vicePresidentName: '',
    vicePresidentEmail: '',
    plannedActivities: '',
    constitutionOrCharter: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.facultyAdvisorName.trim() || !formData.facultyAdvisorEmail.trim()) {
      setErrorMsg('Please complete all required fields including club name, description, and faculty advisor contact.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload = {
        name: formData.name.trim(),
        tagline: formData.tagline.trim(),
        description: formData.description.trim(),
        category: formData.category,
        coverImage: formData.coverImage ? formData.coverImage.trim() : '',
        facultyAdvisor: {
          name: formData.facultyAdvisorName.trim(),
          email: formData.facultyAdvisorEmail.trim(),
          department: formData.facultyAdvisorDepartment.trim(),
          designation: formData.facultyAdvisorDesignation.trim(),
        },
        initialLeadership: [
          ...(formData.presidentName ? [{
            role: 'Secretary General (President)',
            name: formData.presidentName.trim(),
            email: formData.presidentEmail.trim(),
          }] : []),
          ...(formData.vicePresidentName ? [{
            role: 'General Secretary (Vice President)',
            name: formData.vicePresidentName.trim(),
            email: formData.vicePresidentEmail.trim(),
          }] : []),
        ],
        plannedActivities: formData.plannedActivities.split('\n').filter((a) => a.trim().length > 0),
        constitutionOrCharter: formData.constitutionOrCharter.trim(),
      };

      await clubApi.proposeClub(payload);
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit club proposal. Please review your input.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Proposal Submitted Successfully!</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6">
            Your charter proposal for <strong className="text-slate-900 dark:text-white font-semibold">"{formData.name}"</strong> has been forwarded to the Main College Administrator and Faculty Advisor for formal review.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/clubs"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition"
            >
              Browse Campus Clubs
            </Link>
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/clubs" className="hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Official Clubs
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-10 transition-colors">
        <div className="flex items-start gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Propose an Official College Club</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Submit a formal charter request to the Main College Administrator. Official clubs receive college endorsement, faculty advisory, verified badges, and campus event authorization.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              1. Basic Charter Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Official Club Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. UniVerse Artificial Intelligence Society"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                >
                  {CLUB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="e.g. Pioneering Student Research & Intelligence"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Mission & Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the club's objectives, proposed value to campus students, and long-term vision..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <ImageUploadPicker
                value={formData.coverImage}
                onChange={(url) => setFormData((prev) => ({ ...prev, coverImage: url }))}
                title={formData.name}
                namePrefix="club"
                label="Club Cover Banner & Visual Branding"
                subLabel="Upload a club banner from your device, capture via camera, or choose a curated theme."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              2. Faculty Advisor Nomination
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              All official college clubs require an assigned institutional faculty advisor approved by the Main College Administrator.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Faculty Advisor Name *
                </label>
                <input
                  type="text"
                  name="facultyAdvisorName"
                  required
                  value={formData.facultyAdvisorName}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Advisor Campus Email *
                </label>
                <input
                  type="email"
                  name="facultyAdvisorEmail"
                  required
                  value={formData.facultyAdvisorEmail}
                  onChange={handleChange}
                  placeholder="e.g. jsmith@universe.edu"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Advisor Department
                </label>
                <input
                  type="text"
                  name="facultyAdvisorDepartment"
                  value={formData.facultyAdvisorDepartment}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Designation
                </label>
                <input
                  type="text"
                  name="facultyAdvisorDesignation"
                  value={formData.facultyAdvisorDesignation}
                  onChange={handleChange}
                  placeholder="e.g. Professor & Head of Department"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              3. Proposed Student Leadership
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Proposed President / Secretary General
                </label>
                <input
                  type="text"
                  name="presidentName"
                  value={formData.presidentName}
                  onChange={handleChange}
                  placeholder="Student Full Name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition mb-2"
                />
                <input
                  type="email"
                  name="presidentEmail"
                  value={formData.presidentEmail}
                  onChange={handleChange}
                  placeholder="president@universe.edu"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Proposed VP / General Secretary
                </label>
                <input
                  type="text"
                  name="vicePresidentName"
                  value={formData.vicePresidentName}
                  onChange={handleChange}
                  placeholder="Student Full Name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition mb-2"
                />
                <input
                  type="email"
                  name="vicePresidentEmail"
                  value={formData.vicePresidentEmail}
                  onChange={handleChange}
                  placeholder="vp@universe.edu"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              4. Proposed Activities & Charter Constitution
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Planned Activities (one per line)
                </label>
                <textarea
                  name="plannedActivities"
                  rows={3}
                  value={formData.plannedActivities}
                  onChange={handleChange}
                  placeholder="e.g.&#10;Weekly Artificial Intelligence hands-on workshop&#10;Annual Inter-College Hackathon&#10;Guest lectures with campus alumni"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Constitution / Bylaws Summary
                </label>
                <textarea
                  name="constitutionOrCharter"
                  rows={3}
                  value={formData.constitutionOrCharter}
                  onChange={handleChange}
                  placeholder="Brief summary of membership criteria, meeting schedule, and democratic leadership elections..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to="/clubs"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm shadow-md shadow-brand-600/30 transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="border-white" />
                  <span>Submitting Proposal...</span>
                </>
              ) : (
                <span>Submit Club Proposal</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposeClubPage;
