import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../notifications/NotificationBell';
import GlobalSearchInput from '../search/GlobalSearchInput';
import {
  Compass,
  Calendar,
  Bell,
  User,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  BookmarkCheck,
  Users,
  MessagesSquare,
  Bookmark,
  Sun,
  Moon,
  AlertTriangle,
  Wrench,
  Search,
  Settings,
  ShieldCheck,
  History,
  Award,
  FileText,
  ChevronDown,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isMainAdmin, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const moreDropdownRef = useRef(null);

  useEffect(() => {
    setMoreDropdownOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap ${
      isActive
        ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 font-bold border-b-2 border-brand-600 dark:border-brand-400'
        : 'text-slate-600 dark:text-[#A8B4C7] hover:text-[#172554] dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#1E293B]/70'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
      isActive
        ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 font-bold border-l-4 border-brand-600'
        : 'text-slate-700 dark:text-[#A8B4C7] hover:bg-slate-100/80 dark:hover:bg-[#1E293B]/70'
    }`;

  const isMoreActive =
    location.pathname.startsWith('/forms') ||
    location.pathname.startsWith('/announcements') ||
    location.pathname.startsWith('/discover');

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#172033]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#334155] shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 xl:gap-4">
          <div className="flex items-center gap-2 xl:gap-4 min-w-0">
            <Link to={isAuthenticated ? '/dashboard' : '/events'} className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 shadow-xs border border-slate-200/80 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                <img
                  src="/logo.jpeg"
                  alt="UniVerse Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#172554] dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  Uni<span className="text-brand-600 dark:text-brand-400">Verse</span>
                </span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-[#A8B4C7] -mt-1">
                  Campus Platform
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    <Compass className="w-3.5 h-3.5" />
                    Dashboard
                  </NavLink>
                  <NavLink to="/events" className={navLinkClass}>
                    <Calendar className="w-3.5 h-3.5" />
                    Events
                  </NavLink>
                  <NavLink to="/groups" className={navLinkClass}>
                    <Users className="w-3.5 h-3.5" />
                    Groups
                  </NavLink>
                  <NavLink to="/discussions" className={navLinkClass}>
                    <MessagesSquare className="w-3.5 h-3.5" />
                    Discussions
                  </NavLink>
                  <NavLink to="/issues" className={navLinkClass}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Issues
                  </NavLink>

                  <div className="relative" ref={moreDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setMoreDropdownOpen((prev) => !prev)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        isMoreActive
                          ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 font-bold border-b-2 border-brand-600'
                          : 'text-slate-600 dark:text-[#A8B4C7] hover:text-[#172554] dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#1E293B]/70'
                      }`}
                    >
                      More
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${moreDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {moreDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-52 rounded-xl bg-white dark:bg-[#1E293B] p-1.5 shadow-xl border border-slate-200 dark:border-[#334155] z-50 animate-in fade-in slide-in-from-top-1">
                        <NavLink
                          to="/clubs"
                          onClick={() => setMoreDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition"
                        >
                          <Award className="w-3.5 h-3.5 text-indigo-500" />
                          Official Clubs
                        </NavLink>
                        <NavLink
                          to="/forms"
                          onClick={() => setMoreDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-500" />
                          Forms & Opportunities
                        </NavLink>
                        <NavLink
                          to="/announcements"
                          onClick={() => setMoreDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition"
                        >
                          <Bell className="w-3.5 h-3.5 text-rose-500" />
                          Campus Notices
                        </NavLink>
                        <NavLink
                          to="/discover"
                          onClick={() => setMoreDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033] rounded-lg transition"
                        >
                          <Compass className="w-3.5 h-3.5 text-brand-500" />
                          Discover Campus
                        </NavLink>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <NavLink to="/events" className={navLinkClass}>
                    <Calendar className="w-3.5 h-3.5" />
                    Browse Events
                  </NavLink>
                  <NavLink to="/groups" className={navLinkClass}>
                    <Users className="w-3.5 h-3.5" />
                    Campus Groups
                  </NavLink>
                  <NavLink to="/clubs" className={navLinkClass}>
                    <Award className="w-3.5 h-3.5" />
                    Official Clubs
                  </NavLink>
                  <NavLink to="/discussions" className={navLinkClass}>
                    <MessagesSquare className="w-3.5 h-3.5" />
                    Discussions
                  </NavLink>
                  <NavLink to="/issues" className={navLinkClass}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Issues
                  </NavLink>
                  <NavLink to="/announcements" className={navLinkClass}>
                    <Bell className="w-3.5 h-3.5" />
                    Notices
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto z-10">
            {isAdmin && (
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl border transition shrink-0 ${
                    isActive
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-2xs'
                      : 'bg-amber-50/90 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/90 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                  }`
                }
                title="UniVerse Administrator Command Center"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Admin
              </NavLink>
            )}
            <Link
              to="/search"
              aria-label="Search UniVerse"
              title="Search UniVerse"
              className="p-2 rounded-xl text-slate-500 dark:text-[#A8B4C7] hover:bg-slate-100 dark:hover:bg-[#1E293B] border border-transparent hover:border-slate-200 dark:hover:border-[#334155] transition flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </Link>

            {isAuthenticated && <NotificationBell />}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl text-slate-700 dark:text-amber-400 bg-slate-100/90 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/90 dark:border-[#334155] transition flex items-center justify-center shadow-2xs"
            >
              {isDark ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 sm:p-1.5 rounded-full border border-slate-200/90 dark:border-[#334155] hover:border-brand-500 dark:hover:border-brand-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition shadow-2xs"
                  aria-expanded={profileDropdownOpen}
                  aria-label="User Profile"
                  title="My Profile & Settings"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-[#F1F5F9] hidden xl:inline-block max-w-[95px] truncate pl-1">
                    {user?.name}
                  </span>
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user?.name || 'Profile'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/30"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-8 h-8 rounded-full bg-brand-600 dark:bg-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-brand-400/20 ${
                      user?.avatarUrl ? 'hidden' : 'flex'
                    }`}
                  >
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                </button>

                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#1E293B] p-2 shadow-2xl border border-slate-200 dark:border-[#334155] z-20 transition-all animate-in fade-in slide-in-from-top-1">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-[#334155] mb-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                          {user.role}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#172033] rounded-xl transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>

                      <Link
                        to="/discussions/my-posts"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#172033] rounded-xl transition"
                      >
                        <MessagesSquare className="w-4 h-4 text-slate-400" />
                        My Discussions
                      </Link>

                      <Link
                        to="/discussions/saved"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#172033] rounded-xl transition"
                      >
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        Saved Discussions
                      </Link>

                      <Link
                        to="/my-groups"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#172033] rounded-xl transition"
                      >
                        <Users className="w-4 h-4 text-slate-400" />
                        My Groups
                      </Link>

                      <Link
                        to="/issues/my-reports"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#172033] rounded-xl transition"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        My Campus Reports
                      </Link>

                      <Link
                        to="/forms/wishlist"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#172033] rounded-xl transition"
                      >
                        <Bookmark className="w-4 h-4 text-emerald-500" />
                        My Forms Wishlist
                      </Link>

                      <Link
                        to="/notifications"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#172033] rounded-xl transition"
                      >
                        <Bell className="w-4 h-4 text-brand-500" />
                        Notification Center
                      </Link>

                      <Link
                        to="/settings/notifications"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#172033] rounded-xl transition"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Notification Settings
                      </Link>

                      {isAdmin && (
                        <>
                          <div className="my-1 border-t border-slate-100 dark:border-[#334155]" />
                          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 px-3 py-1">
                            Platform Admin
                          </p>
                          <Link
                            to="/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition font-medium"
                          >
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            Admin Console
                          </Link>
                          <Link
                            to="/admin/events"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition font-medium"
                          >
                            <Calendar className="w-4 h-4 text-amber-600" />
                            Campus Events (Create / Manage)
                          </Link>
                          <Link
                            to="/admin/announcements"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition font-medium"
                          >
                            <Bell className="w-4 h-4 text-amber-600" />
                            Campus Announcements
                          </Link>
                          <Link
                            to="/admin/users"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition"
                          >
                            <Users className="w-4 h-4 text-amber-600" />
                            User Directory
                          </Link>
                          <Link
                            to="/admin/audit-logs"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition"
                          >
                            <History className="w-4 h-4 text-amber-600" />
                            Audit Trail
                          </Link>
                          <Link
                            to="/admin/clubs"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition"
                          >
                            <Award className="w-4 h-4 text-amber-600" />
                            Club Proposals
                          </Link>
                          <Link
                            to="/admin/issues"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition"
                          >
                            <Wrench className="w-4 h-4 text-amber-600" />
                            Issues Workspace
                          </Link>
                          <Link
                            to="/moderation/reports"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                            Moderation Queue
                          </Link>
                        </>
                      )}

                      <div className="my-1 border-t border-slate-100 dark:border-[#334155]" />

                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs shadow-brand-600/30 transition"
                >
                  Join Campus
                </Link>
              </div>
            )}
          </div>

          <div className="flex lg:hidden items-center ml-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] px-4 pt-3 pb-6 space-y-2 transition-colors">
          <div className="mb-3">
            <GlobalSearchInput isMobile={true} onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>

          {isAuthenticated ? (
            <>
              <div className="px-3.5 py-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl mb-3 flex items-center gap-3 border border-slate-100 dark:border-slate-700/60">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
              </div>

              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Compass className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Dashboard
              </NavLink>
              <NavLink
                to="/discover"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Compass className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Discover Campus
              </NavLink>
              <NavLink
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Notifications
              </NavLink>
              <NavLink
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Events
              </NavLink>
              {!isAdmin && (
                <NavLink
                  to="/my-events"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavLinkClass}
                >
                  <BookmarkCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  My Registered Events
                </NavLink>
              )}
              <NavLink
                to="/groups"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Campus Groups
              </NavLink>
              <NavLink
                to="/clubs"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Award className="w-5 h-5 text-amber-500" />
                Official Clubs
              </NavLink>
              <NavLink
                to="/forms"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <FileText className="w-5 h-5 text-emerald-500" />
                Campus Forms & Opportunities
              </NavLink>
              <NavLink
                to="/discussions"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <MessagesSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Discussions
              </NavLink>
              <NavLink
                to="/issues"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Campus Issues
              </NavLink>
              {!isAdmin && (
                <>
                  <NavLink
                    to="/issues/my-reports"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <BookmarkCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    My Campus Reports
                  </NavLink>
                  <NavLink
                    to="/my-groups"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    My Groups
                  </NavLink>
                  <NavLink
                    to="/discussions/my-posts"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <MessagesSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    My Discussions
                  </NavLink>
                  <NavLink
                    to="/discussions/saved"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <Bookmark className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    Saved Discussions
                  </NavLink>
                </>
              )}
              <NavLink
                to="/announcements"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Announcements
              </NavLink>
              <NavLink
                to="/settings/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Settings className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Notification Settings
              </NavLink>
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                My Profile
              </NavLink>

              {isAdmin && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs uppercase font-bold text-amber-700 dark:text-amber-400 px-3 mb-1">
                    Platform Administrator
                  </p>
                  <NavLink
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    Admin Console
                  </NavLink>
                  <NavLink
                    to="/admin/events"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <Calendar className="w-5 h-5 text-amber-600" />
                    Campus Events (Create / Manage)
                  </NavLink>
                  <NavLink
                    to="/admin/announcements"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <Bell className="w-5 h-5 text-amber-600" />
                    Campus Announcements
                  </NavLink>
                  <NavLink
                    to="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <Users className="w-5 h-5 text-amber-600" />
                    User Directory
                  </NavLink>
                  <NavLink
                    to="/admin/audit-logs"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <History className="w-5 h-5 text-amber-600" />
                    Audit Trail
                  </NavLink>
                  <NavLink
                    to="/admin/issues"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <Wrench className="w-5 h-5 text-amber-600" />
                    Issues Workspace
                  </NavLink>
                  <NavLink
                    to="/moderation/reports"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    Moderation Queue
                  </NavLink>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-base font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <NavLink
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Browse Events
              </NavLink>
              <NavLink
                to="/groups"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Campus Groups
              </NavLink>
              <NavLink
                to="/clubs"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Award className="w-5 h-5 text-amber-500" />
                Official Clubs
              </NavLink>
              <NavLink
                to="/forms"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <FileText className="w-5 h-5 text-emerald-500" />
                Campus Forms & Opportunities
              </NavLink>
              <NavLink
                to="/discussions"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <MessagesSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Discussions
              </NavLink>
              <NavLink
                to="/issues"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Campus Issues
              </NavLink>
              <NavLink
                to="/announcements"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Announcements
              </NavLink>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700"
                >
                  Join Campus
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
