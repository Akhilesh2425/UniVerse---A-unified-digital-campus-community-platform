import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { formApi } from '../../api/formApi';
import Spinner from '../../components/common/Spinner';
import {
  FileText,
  ArrowLeft,
  Calendar,
  Link as LinkIcon,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

const CATEGORIES = [
  'Scholarship',
  'Hackathon',
  'Internship',
  'Competition',
  'Grant',
  'Survey',
  'Admissions',
  'Workshop',
  'Other',
];

const CreateFormPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Scholarship',
    deadline: '',
    linkUrl: '',
    department: '',
    eligibility: '',
    isFeatured: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.deadline || !formData.linkUrl.trim()) {
      setErrorMsg('Please complete all required fields (title, description, deadline, link URL).');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await formApi.createForm({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        linkUrl: formData.linkUrl.trim(),
        department: formData.department.trim(),
        eligibility: formData.eligibility.trim(),
      });
      navigate('/forms');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to publish opportunity form.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/forms" className="hover:text-brand-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Opportunities
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-10 transition-colors">
        <div className="flex items-start gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Publish Campus Opportunity Form</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Publish student applications, hackathon registrations, scholarships, or surveys. UniVerse will automatically notify students and track daily deadlines.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Opportunity Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Campus Innovation Fund & Seed Grant 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Application Deadline *
              </label>
              <input
                type="date"
                name="deadline"
                required
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Direct Application / Form URL *
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="url"
                name="linkUrl"
                required
                value={formData.linkUrl}
                onChange={handleChange}
                placeholder="https://forms.google.com/... or https://opportunity.link"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Organizing Department / Office
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Dean of Student Affairs / Innovation Cell"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Eligibility Criteria
              </label>
              <input
                type="text"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                placeholder="e.g. All 2nd and 3rd year engineering students"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Detailed Description & Requirements *
            </label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Outline what students need to apply, funding amounts, deliverables, and selection process..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <label htmlFor="isFeatured" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Highlight as Featured Campus Opportunity on Discover feed
            </label>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to="/forms"
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
                  <span>Publishing Form...</span>
                </>
              ) : (
                <span>Publish Opportunity</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFormPage;
