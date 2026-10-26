import React from 'react';

const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',

    // Specific category variants
    Technical: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Cultural: 'bg-purple-50 text-purple-700 border-purple-200',
    Sports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Workshops: 'bg-amber-50 text-amber-800 border-amber-200',
    Clubs: 'bg-teal-50 text-teal-700 border-teal-200',
    Competitions: 'bg-rose-50 text-rose-700 border-rose-200',
    Other: 'bg-slate-100 text-slate-700 border-slate-200',

    // Group Specific Categories
    'Coding & Competitive Programming': 'bg-violet-50 text-violet-700 border-violet-200',
    'Artificial Intelligence & Machine Learning': 'bg-cyan-50 text-cyan-800 border-cyan-200',
    'Academic & Research': 'bg-blue-50 text-blue-700 border-blue-200',
    'Sports & Fitness': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Entrepreneurship: 'bg-amber-50 text-amber-800 border-amber-200',
    'Arts & Photography': 'bg-pink-50 text-pink-700 border-pink-200',
    'Social Impact': 'bg-teal-50 text-teal-700 border-teal-200',

    // Group Roles
    owner: 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
    moderator: 'bg-blue-100 text-blue-800 border-blue-300 font-semibold',
    member: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',

    // Visibility
    public: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    private: 'bg-amber-50 text-amber-800 border-amber-200',

    // Announcement Categories
    Academic: 'bg-blue-50 text-blue-700 border-blue-200',
    Events: 'bg-violet-50 text-violet-700 border-violet-200',
    Administrative: 'bg-slate-100 text-slate-700 border-slate-200',
    'Campus Updates': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    General: 'bg-zinc-100 text-zinc-700 border-zinc-200',

    // Priorities
    important: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
    normal: 'bg-slate-100 text-slate-600 border-slate-200',

    // Module 4: Discussion Post Types
    question: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
    discussion: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
    resource: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    project: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',

    // Module 4: Discussion Categories
    Academics: 'bg-blue-50 text-blue-700 border-blue-200',
    'Programming & DSA': 'bg-violet-50 text-violet-700 border-violet-200',
    'Placements & Internships': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Career Guidance': 'bg-teal-50 text-teal-700 border-teal-200',
    'Campus Life': 'bg-pink-50 text-pink-700 border-pink-200',
    Technology: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    Research: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'General Discussion': 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const style = variantStyles[variant] || variantStyles.default;
  const sizeStyle = sizeStyles[size] || sizeStyles.sm;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${style} ${sizeStyle} ${className}`}
    >
      {variant === 'important' && (
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-600 animate-pulse"></span>
      )}
      {children}
    </span>
  );
};

export default Badge;
