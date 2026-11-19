import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clubApi } from '../../api/clubApi';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import {
  Shield,
  Users,
  Calendar,
  GraduationCap,
  Award,
  PlusCircle,
  Mail,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  UserCheck,
  UserX,
} from 'lucide-react';

const ClubDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isMainAdmin } = useAuth();

  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); 
  const [actionLoading, setActionLoading] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: 'Clubs',
    venue: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxCapacity: '',
  });
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventError, setEventError] = useState('');

  const fetchClubData = async () => {
    try {
      setLoading(true);
      const res = await clubApi.getClubById(id);
      if (res && res.club) {
        setClub(res.club);
      }

      const [membersRes, eventsRes] = await Promise.all([
        clubApi.getClubMembers(id).catch(() => ({ members: [] })),
        clubApi.getClubEvents(id).catch(() => ({ events: [] })),
      ]);

      if (membersRes && membersRes.members) setMembers(membersRes.members);
      if (eventsRes && eventsRes.events) setEvents(eventsRes.events);
    } catch (err) {
      console.error('Error fetching club data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, [id]);

  const handleJoinClub = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setActionLoading(true);
      await clubApi.joinClub(id);
      await fetchClubData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to join club');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!window.confirm('Are you sure you want to leave this club?')) return;
    try {
      setActionLoading(true);
      await clubApi.leaveClub(id);
      await fetchClubData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to leave club');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setEventError('');
    try {
      setEventSubmitting(true);
      await clubApi.createClubEvent(id, eventData);
      setEventModalOpen(false);
      setEventData({
        title: '',
        description: '',
        category: 'Clubs',
        venue: '',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        maxCapacity: '',
      });
      await fetchClubData();
      setActiveTab('events');
    } catch (err) {
      setEventError(err.response?.data?.message || err.message || 'Failed to publish club event');
    } finally {
      setEventSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Club Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The requested official college club does not exist or may have been unchartered.
        </p>
        <Link
          to="/clubs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clubs Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Link to="/clubs" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
          Official Clubs
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 dark:text-slate-200 font-bold truncate">{club.name}</span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="h-48 sm:h-64 bg-gradient-to-r from-navy-950 via-brand-900 to-navy-900 relative">
          {club.coverImage ? (
            <img src={club.coverImage} alt={club.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20 text-white">
              <Award className="w-24 h-24" />
            </div>
          )}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase bg-white/90 dark:bg-slate-900/90 text-brand-700 dark:text-brand-300 backdrop-blur-md shadow-xs flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Official College Club</span>
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            <div className="flex items-start sm:items-end gap-5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-slate-800 p-1.5 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
                {club.logo ? (
                  <img src={club.logo} alt={club.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-brand-600 text-white font-extrabold text-3xl flex items-center justify-center rounded-2xl">
                    {club.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  {club.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {club.name}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                  <span>{club.memberCount || 1} Registered Members</span>
                  <span>•</span>
                  <span>{events.length} Campus Events</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {club.canManageClub && (
                <button
                  type="button"
                  onClick={() => setEventModalOpen(true)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs transition border border-brand-200 dark:border-brand-800"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Propose Event</span>
                </button>
              )}

              {club.isMember ? (
                <button
                  type="button"
                  onClick={handleLeaveClub}
                  disabled={actionLoading}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
                >
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>Member (Leave)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleJoinClub}
                  disabled={actionLoading}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Join Official Club</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex border-t border-slate-100 dark:border-slate-800 px-6 sm:px-8 overflow-x-auto scrollbar-none gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Overview & Leadership
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`py-4 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'events'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Club Events</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
              {events.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`py-4 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Member Directory</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
              {members.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Charter Rules & Contact
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>About {club.name}</span>
              </h2>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                {club.description}
              </p>

              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white pt-2">
                Objectives & Mission
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                {club.objectives}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Official Student Leadership Structure</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500 text-white">
                    Secretary General
                  </span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {club.leadership?.secretaryGeneral?.name || 'Nominee Assigned'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {club.leadership?.secretaryGeneral?.department || 'Student Head'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-600 text-white">
                    General Secretary
                  </span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {club.leadership?.generalSecretary?.name || 'To Be Appointed'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {club.leadership?.generalSecretary?.department || 'Operations & Coordination'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-600 text-white">
                    Joint Secretary
                  </span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {club.leadership?.jointSecretary?.name || 'To Be Appointed'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {club.leadership?.jointSecretary?.department || 'Activities & Logistics'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-brand-600 text-white">
                    Executive Board
                  </span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {club.leadership?.executiveMembers?.length || 0} Executive Members
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Elected club committee representatives
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-brand-600 dark:text-brand-400">
                <GraduationCap className="w-4 h-4" />
                <span>Appointed Faculty Advisor</span>
              </div>

              <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/60 space-y-2 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md">
                  {club.facultyAdvisor?.name?.charAt(0) || 'F'}
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {club.facultyAdvisor?.name}
                </h3>
                <p className="text-xs text-brand-700 dark:text-brand-300 font-semibold">
                  {club.facultyAdvisor?.designation || 'Faculty Advisor'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {club.facultyAdvisor?.department}
                </p>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                <p>
                  Every official college club operates under the institutional guidance and mentorship of its Faculty Advisor.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Official Club Events ({events.length})
            </h2>
            {club.canManageClub && (
              <button
                type="button"
                onClick={() => setEventModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl hover:bg-brand-700 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish New Event</span>
              </button>
            )}
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No events scheduled yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check back soon for workshops, competitions, and guest sessions organized by {club.name}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => (
                <div
                  key={ev._id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-xs hover:shadow-md transition flex flex-col"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold uppercase text-[10px]">
                      {ev.category}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(ev.startDate).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{ev.venue}</span>
                  </div>

                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Link
                      to={`/events/${ev._id}`}
                      className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      View Event Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Public Club Roster ({members.length})
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Only public student profiles are displayed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {members.map((m) => (
              <div
                key={m._id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                  {m.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    {m.user?.name || 'Student Member'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {m.user?.department || 'Student'}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                    {m.position?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Charter Guidelines & Regulations
          </h2>
          {club.rules?.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside leading-relaxed">
              {club.rules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Members of {club.name} are expected to follow official campus student conduct policies and university ethics guidelines.
            </p>
          )}

          {club.contactEmail && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-800 dark:text-white">Official Contact Email: </span>
              <a href={`mailto:${club.contactEmail}`} className="text-brand-600 dark:text-brand-400 hover:underline">
                {club.contactEmail}
              </a>
            </div>
          )}
        </div>
      )}

      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Publish Official Club Event
            </h3>

            {eventError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {eventError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={eventData.title}
                  onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                  placeholder="e.g. Annual Robotics Hackathon 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  placeholder="Event details, prerequisites, and schedule..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Venue / Room *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventData.venue}
                    onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
                    placeholder="Auditorium B / Lab 304"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    value={eventData.maxCapacity}
                    onChange={(e) => setEventData({ ...eventData, maxCapacity: e.target.value })}
                    placeholder="Unlimited if empty"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventData.startDate}
                    onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventData.endDate}
                    onChange={(e) => setEventData({ ...eventData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eventSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-xs disabled:opacity-50"
                >
                  {eventSubmitting ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDetailsPage;

