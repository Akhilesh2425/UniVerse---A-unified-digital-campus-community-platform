import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  Calendar,
  Bell,
  User,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Sparkles,
  BookmarkCheck,
  Users,
  MessagesSquare,
  Bookmark,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2.5 text-base font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-8">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Uni<span className="text-indigo-600">Verse</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 -mt-1">
                  Campus Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    <Compass className="w-4 h-4" />
                    Dashboard
                  </NavLink>
                  <NavLink to="/events" className={navLinkClass}>
                    <Calendar className="w-4 h-4" />
                    Events
                  </NavLink>
                  {!isAdmin && (
                    <NavLink to="/my-events" className={navLinkClass}>
                      <BookmarkCheck className="w-4 h-4" />
                      My Events
                    </NavLink>
                  )}
                  <NavLink to="/groups" className={navLinkClass}>
                    <Users className="w-4 h-4" />
                    Groups
                  </NavLink>
                  <NavLink to="/discussions" className={navLinkClass}>
                    <MessagesSquare className="w-4 h-4" />
                    Discussions
                  </NavLink>
                  {!isAdmin && (
                    <NavLink to="/my-groups" className={navLinkClass}>
                      <Users className="w-4 h-4 text-indigo-500" />
                      My Groups
                    </NavLink>
                  )}
                  <NavLink to="/announcements" className={navLinkClass}>
                    <Bell className="w-4 h-4" />
                    Announcements
                  </NavLink>

                  {/* Admin links in main bar */}
                  {isAdmin && (
                    <>
                      <div className="h-4 w-px bg-slate-200 mx-2" />
                      <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) =>
                          `inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isActive
                              ? 'bg-amber-100 text-amber-900 font-semibold'
                              : 'text-amber-800 hover:bg-amber-50'
                          }`
                        }
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        Admin Panel
                      </NavLink>
                    </>
                  )}
                </>
              ) : (
                <>
                  <NavLink to="/events" className={navLinkClass}>
                    <Calendar className="w-4 h-4" />
                    Browse Events
                  </NavLink>
                  <NavLink to="/groups" className={navLinkClass}>
                    <Users className="w-4 h-4" />
                    Campus Groups
                  </NavLink>
                  <NavLink to="/discussions" className={navLinkClass}>
                    <MessagesSquare className="w-4 h-4" />
                    Discussions
                  </NavLink>
                  <NavLink to="/announcements" className={navLinkClass}>
                    <Bell className="w-4 h-4" />
                    Campus Notices
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Right Side: Auth controls */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                  aria-expanded={profileDropdownOpen}
                >
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium capitalize">
                      {user.role} • {user.department || 'Student'}
                    </p>
                  </div>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs ${
                      user.avatarUrl ? 'hidden' : 'flex'
                    }`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>

                {/* Profile dropdown */}
                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white p-2 shadow-xl border border-slate-100 z-20">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-indigo-50 text-indigo-700">
                          {user.role}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>

                      <Link
                        to="/discussions/my-posts"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                      >
                        <MessagesSquare className="w-4 h-4 text-slate-400" />
                        My Discussions
                      </Link>

                      <Link
                        to="/discussions/saved"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                      >
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        Saved Discussions
                      </Link>

                      <Link
                        to="/my-groups"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                      >
                        <Users className="w-4 h-4 text-slate-400" />
                        My Groups
                      </Link>

                      {isAdmin && (
                        <>
                          <Link
                            to="/moderation/reports"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-800 hover:bg-amber-50 rounded-lg transition"
                          >
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            Moderation Queue
                          </Link>

                          <Link
                            to="/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-800 hover:bg-amber-50 rounded-lg transition"
                          >
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            Admin Console
                          </Link>
                        </>
                      )}

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition text-left"
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
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition"
                >
                  Join Campus
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="px-3 py-2 bg-slate-50 rounded-xl mb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>

              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Compass className="w-5 h-5 text-indigo-600" />
                Dashboard
              </NavLink>
              <NavLink
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Calendar className="w-5 h-5 text-indigo-600" />
                Events
              </NavLink>
              {!isAdmin && (
                <NavLink
                  to="/my-events"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavLinkClass}
                >
                  <BookmarkCheck className="w-5 h-5 text-indigo-600" />
                  My Registered Events
                </NavLink>
              )}
              <NavLink
                to="/groups"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Users className="w-5 h-5 text-indigo-600" />
                Campus Groups
              </NavLink>
              <NavLink
                to="/discussions"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <MessagesSquare className="w-5 h-5 text-indigo-600" />
                Discussions
              </NavLink>
              {!isAdmin && (
                <>
                  <NavLink
                    to="/my-groups"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <Users className="w-5 h-5 text-indigo-600" />
                    My Groups
                  </NavLink>
                  <NavLink
                    to="/discussions/my-posts"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <MessagesSquare className="w-5 h-5 text-indigo-600" />
                    My Discussions
                  </NavLink>
                  <NavLink
                    to="/discussions/saved"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <Bookmark className="w-5 h-5 text-indigo-600" />
                    Saved Discussions
                  </NavLink>
                </>
              )}
              <NavLink
                to="/announcements"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Bell className="w-5 h-5 text-indigo-600" />
                Announcements
              </NavLink>
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <User className="w-5 h-5 text-indigo-600" />
                My Profile
              </NavLink>

              {isAdmin && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs uppercase font-bold text-amber-700 px-3 mb-1">
                    Administrator
                  </p>
                  <NavLink
                    to="/moderation/reports"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    Moderation Queue
                  </NavLink>
                  <NavLink
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass}
                  >
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    Admin Console
                  </NavLink>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-base font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
                <Calendar className="w-5 h-5 text-indigo-600" />
                Browse Events
              </NavLink>
              <NavLink
                to="/groups"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Users className="w-5 h-5 text-indigo-600" />
                Campus Groups
              </NavLink>
              <NavLink
                to="/discussions"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <MessagesSquare className="w-5 h-5 text-indigo-600" />
                Discussions
              </NavLink>
              <NavLink
                to="/announcements"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Bell className="w-5 h-5 text-indigo-600" />
                Announcements
              </NavLink>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
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
