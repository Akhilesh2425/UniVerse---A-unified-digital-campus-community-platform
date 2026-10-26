import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/userApi';
import Spinner from '../../components/common/Spinner';
import {
  User,
  Mail,
  Building,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Tag,
  Camera,
} from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Information Technology',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Business Administration',
  'Sciences & Humanities',
  'Campus Administration',
];

const ACADEMIC_YEARS = [
  '1st Year (Freshman)',
  '2nd Year (Sophomore)',
  '3rd Year (Junior)',
  '4th Year (Senior)',
  'Graduate / Master’s',
  'Faculty / Staff',
];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || DEPARTMENTS[0],
    academicYear: user?.academicYear || ACADEMIC_YEARS[0],
    interests: Array.isArray(user?.interests) ? user.interests.join(', ') : '',
    avatarUrl: user?.avatarUrl || '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.department.trim() || !formData.academicYear.trim()) {
      setErrorMessage('Full name, department, and academic year are required.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        name: formData.name.trim(),
        department: formData.department.trim(),
        academicYear: formData.academicYear.trim(),
        interests: formData.interests,
        avatarUrl: formData.avatarUrl.trim(),
      };

      const res = await userApi.updateProfile(payload);
      if (res && res.user) {
        updateUser(res.user);
        setSuccessMessage('Your profile has been updated successfully.');
        setIsEditing(false);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your verified identity and academic credentials on UniVerse
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsEditing(!isEditing);
            setSuccessMessage('');
            setErrorMessage('');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            isEditing
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
          }`}
        >
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
        {/* Avatar & Role Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-slate-100">
          <div className="relative">
            {formData.avatarUrl ? (
              <img
                src={formData.avatarUrl}
                alt={user?.name}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-50"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white items-center justify-center font-extrabold text-3xl shadow-lg shadow-indigo-100 ${
                formData.avatarUrl ? 'hidden' : 'flex'
              }`}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{user?.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                {user?.role}
              </span>
            </div>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="text-xs text-slate-400">
              {user?.department} • {user?.academicYear}
            </p>
          </div>
        </div>

        {/* View / Edit Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name
              </label>
              {isEditing ? (
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-800 py-2.5 px-3 bg-slate-50 rounded-xl">
                  {user?.name}
                </p>
              )}
            </div>

            {/* Email (Read Only per specification) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Campus Email (Read-Only)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Department
              </label>
              {isEditing ? (
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-800 py-2.5 px-3 bg-slate-50 rounded-xl">
                  {user?.department}
                </p>
              )}
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Academic Year
              </label>
              {isEditing ? (
                <div className="relative">
                  <GraduationCap className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {ACADEMIC_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-800 py-2.5 px-3 bg-slate-50 rounded-xl">
                  {user?.academicYear}
                </p>
              )}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Interests & Campus Activities {isEditing && '(comma-separated)'}
            </label>
            {isEditing ? (
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="interests"
                  value={formData.interests}
                  onChange={handleChange}
                  placeholder="e.g. Artificial Intelligence, Robotics, Hackathons, Basketball"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 py-2">
                {user?.interests && user.interests.length > 0 ? (
                  user.interests.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No interests specified yet.</span>
                )}
              </div>
            )}
          </div>

          {/* Avatar URL */}
          {isEditing && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Profile Avatar Picture URL
              </label>
              <div className="relative">
                <Camera className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {isEditing && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="border-white" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
