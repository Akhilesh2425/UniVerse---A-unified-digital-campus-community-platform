import React from 'react';
import { Heart, Calendar, Users, MessagesSquare, Bell, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#172554] dark:bg-[#0F172A] text-slate-300 dark:text-[#A8B4C7] border-t border-blue-900/40 dark:border-[#334155] mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.jpeg"
                  alt="UniVerse Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Uni<span className="text-brand-400">Verse</span>
                </span>
                <span className="text-[10px] text-blue-200 dark:text-[#A8B4C7] font-medium">
                  A unified digital campus community platform
                </span>
              </div>
            </div>
            <p className="text-sm text-blue-100/80 dark:text-[#A8B4C7] max-w-md mb-5 leading-relaxed">
              Connecting students across campus through authenticated event registrations, verified administrative notices, interactive student community hubs, and campus discussions.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="px-2.5 py-1 rounded-full bg-blue-950/60 dark:bg-[#1E293B] text-blue-200 dark:text-[#F1F5F9] border border-blue-800/60 dark:border-[#334155] font-medium">
                MERN Stack
              </span>
              <span className="px-2.5 py-1 rounded-full bg-blue-950/60 dark:bg-[#1E293B] text-blue-200 dark:text-[#F1F5F9] border border-blue-800/60 dark:border-[#334155] font-medium">
                MongoDB Atlas
              </span>
              <span className="px-2.5 py-1 rounded-full bg-blue-950/60 dark:bg-[#1E293B] text-blue-200 dark:text-[#F1F5F9] border border-blue-800/60 dark:border-[#334155] font-medium">
                Tailwind CSS
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Campus Hub
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/events" className="hover:text-white transition flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-brand-400" />
                  Campus Events
                </Link>
              </li>
              <li>
                <Link to="/groups" className="hover:text-white transition flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-brand-400" />
                  Student Groups
                </Link>
              </li>
              <li>
                <Link to="/discussions" className="hover:text-white transition flex items-center gap-2">
                  <MessagesSquare className="w-3.5 h-3.5 text-brand-400" />
                  Discussions
                </Link>
              </li>
              <li>
                <Link to="/announcements" className="hover:text-white transition flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-brand-400" />
                  Campus Notices
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Integrated Modules
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Module 1: Auth & Profiles</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Module 2: Events & Notices</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Module 3: Groups & Communities</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Module 4: Discussions & Content</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} UniVerse. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1.5">
            Designed with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for the UniVerse Campus Community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
