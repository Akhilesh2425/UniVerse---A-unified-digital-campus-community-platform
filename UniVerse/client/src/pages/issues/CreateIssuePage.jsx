import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { issueApi } from '../../api/issueApi';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import {
  AlertTriangle,
  Building,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Globe,
  ArrowLeft,
  EyeOff,
  Info,
  Check,
  Copy,
} from 'lucide-react';

const CATEGORIES = [
  'Infrastructure & Maintenance',
  'Electricity & Power',
  'Water Supply',
  'Internet & Wi-Fi',
  'Hostel Facilities',
  'Classroom & Laboratory',
  'Library Facilities',
  'Cleanliness & Sanitation',
  'Food & Canteen',
  'Transportation & Parking',
  'Safety & Security',
  'Accessibility',
  'Other',
];

const PRIORITIES = [
  {
    level: 'low',
    label: 'Low Priority',
    color: 'border-slate-300 dark:border-slate-700 hover:border-slate-400',
    activeColor: 'bg-slate-100 dark:bg-slate-800 border-slate-500 text-slate-800 dark:text-slate-100',
    description: 'Minor cosmetic flaw, slight inconvenience, or general maintenance suggestion.',
  },
  {
    level: 'medium',
    label: 'Medium Priority',
    color: 'border-sky-300 dark:border-sky-800 hover:border-sky-400',
    activeColor: 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-900 dark:text-sky-200',
    description: 'Normal operational issue causing periodic disruptions to campus amenities.',
  },
  {
    level: 'high',
    label: 'High Priority',
    color: 'border-amber-300 dark:border-amber-800 hover:border-amber-400',
    activeColor: 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200',
    description: 'Significant impediment affecting classes, lab equipment, or major utilities.',
  },
  {
    level: 'critical',
    label: 'Critical Priority',
    color: 'border-rose-300 dark:border-rose-800 hover:border-rose-400',
    activeColor: 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200',
    description: 'Urgent safety hazard, total power/water failure, or active risk to students.',
  },
];

const PHOTO_PRESETS = [
  {
    label: 'Projector / AV Fault',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Corridor Lighting',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Water Dispenser',
    url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Lab Workstation',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  },
];

const CreateIssuePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Classroom & Laboratory',
    description: '',
    location: '',
    building: '',
    room: '',
    priority: 'medium',
    visibility: 'public',
    isAnonymousToPublic: false,
    imageUrl: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters';
    } else if (formData.title.trim().length > 150) {
      errs.title = 'Title cannot exceed 150 characters';
    }

    if (!formData.description.trim()) {
      errs.description = 'Detailed description is required';
    } else if (formData.description.trim().length < 10) {
      errs.description = 'Please provide at least 10 characters describing the problem';
    }

    if (!formData.location.trim()) {
      errs.location = 'Campus location is required (e.g. Block B, Central Library)';
    }

    if (!formData.category) {
      errs.category = 'Please select an issue category';
    }

    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const payload = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        building: formData.building.trim(),
        room: formData.room.trim(),
        imageUrl: formData.imageUrl.trim(),
      };

      const res = await issueApi.createIssue(payload);
      if (res && res.issue) {
        setCreatedResult({
          referenceId: res.referenceId,
          issueId: res.issue._id,
          visibility: formData.visibility,
        });
      }
    } catch (err) {
      console.error('Failed to create issue:', err);
      setErrors({ form: err.message || 'Failed to submit issue. Please check your network connection.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = () => {
    if (createdResult?.referenceId) {
      navigator.clipboard.writeText(createdResult.referenceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (createdResult) {
    return (
      <div className="py-12 max-w-xl mx-auto px-4">
        <div className="bg-white dark:bg-[#0b1322] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Campus Issue Registered
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Your issue report has been recorded in the UniVerse campus registry and queued for administrative review.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Official Reference ID
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-brand-600 dark:text-brand-400 tracking-tight">
                {createdResult.referenceId}
              </span>
              <button
                type="button"
                onClick={handleCopyRef}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 transition"
                title="Copy Reference ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Save this reference number to track resolution progress or check with the helpdesk.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/issues/${createdResult.issueId}`}
              className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm"
            >
              View Issue Tracker
            </Link>
            <Link
              to="/issues/my-reports"
              className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition"
            >
              Go to My Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <Link
          to="/issues"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campus Issues Feed
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Module 5 • Student Reporting
        </span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Report a Campus Issue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Provide accurate details about the problem to help facilities teams inspect, prioritize, and resolve it swiftly.
        </p>
      </div>

      {errors.form && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              1. Issue Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Summarize what is broken, malfunctioning, or requires campus maintenance.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Issue Title <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {formData.title.length}/150
                </span>
              </div>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Faulty HDMI projector in Lecture Hall 204"
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition ${
                  errors.title
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-rose-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {formData.description.length}/5000
                </span>
              </div>
              <textarea
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe exactly what happens, how often it occurs, and how it impacts students or faculty..."
                className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition leading-relaxed ${
                  errors.description
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-rose-500">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              2. Campus Location
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pinpoint where the problem is located so maintenance teams can dispatch immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Campus Zone / Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Academic Complex Block B, Hostel 4, Cafeteria"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition ${
                    errors.location
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.location && (
                <p className="mt-1 text-xs text-rose-500">{errors.location}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Building or Block <span className="text-slate-400 text-xs font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  placeholder="e.g. Block B, Wing C, Ground Floor"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Room No. <span className="text-slate-400 text-xs font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleChange}
                placeholder="e.g. LH 204, Lab 3"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              3. Priority & Visibility Controls
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set the urgency level and control who can view and support this issue.
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Suggested Priority Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRIORITIES.map((p) => {
                const isSelected = formData.priority === p.level;
                return (
                  <div
                    key={p.level}
                    onClick={() => setFormData((prev) => ({ ...prev, priority: p.level }))}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 space-y-2 ${
                      isSelected ? p.activeColor : `${p.color} bg-slate-50/50 dark:bg-slate-900/40`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm">{p.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-600" />}
                    </div>
                    <p className="text-[11px] opacity-80 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Visibility Policy <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setFormData((prev) => ({ ...prev, visibility: 'public' }))}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2.5 ${
                  formData.visibility === 'public'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Public Campus Issue
                    </span>
                  </div>
                  {formData.visibility === 'public' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Appears in the public campus issues feed. Other students can support it, comment, and track resolution transparently.
                </p>
              </div>

              <div
                onClick={() => setFormData((prev) => ({ ...prev, visibility: 'private' }))}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2.5 ${
                  formData.visibility === 'private'
                    ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Private Confidential Issue
                    </span>
                  </div>
                  {formData.visibility === 'private' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Visible strictly to you and campus administrators. Hidden from the public feed, search results, and student discussions.
                </p>
              </div>
            </div>
          </div>

          {formData.visibility === 'public' && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="isAnonymousToPublic"
                  checked={formData.isAnonymousToPublic}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-slate-400" />
                    Submit Anonymously to Fellow Students
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your name will be displayed as "Campus Community Member" to other students. Authorized campus administrators will still verify your student account for accountability.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#0b1322] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-brand-600" />
              4. Supporting Photo Evidence
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A photograph of the defect helps technicians identify replacement parts before visiting.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Photo URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Or select a demonstration photo preset:
              </p>
              <div className="flex flex-wrap gap-2">
                {PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, imageUrl: preset.url }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      formData.imageUrl === preset.url
                        ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border-brand-500'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.imageUrl && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-md">
                <img
                  src={formData.imageUrl}
                  alt="Issue Preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/issues"
            className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-600/30 transition hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                Registering Issue...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit Campus Issue
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateIssuePage;
