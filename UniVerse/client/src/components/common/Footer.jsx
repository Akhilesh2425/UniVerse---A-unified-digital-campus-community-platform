import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Uni<span className="text-indigo-400">Verse</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
              A unified digital campus platform connecting students through authenticated campus events, real-time announcements, and verified student engagement.
            </p>
            <div className="text-xs text-slate-500">
              Full-Stack Lab Project • Built on MERN & MongoDB Atlas
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Campus Hub
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/events" className="hover:text-white transition">
                  Discover Events
                </Link>
              </li>
              <li>
                <Link to="/announcements" className="hover:text-white transition">
                  Campus Notices
                </Link>
              </li>
              <li>
                <Link to="/my-events" className="hover:text-white transition">
                  My Registrations
                </Link>
              </li>
            </ul>
          </div>

          {/* System & Architecture */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Modules
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Module 1: Auth & Profiles</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Module 2: Events & Notices</span>
              </li>
              <li className="text-xs text-slate-500 pt-2">
                Strict Scope Enforced (Lab Specification)
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} UniVerse Campus Platform. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for College Students
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
