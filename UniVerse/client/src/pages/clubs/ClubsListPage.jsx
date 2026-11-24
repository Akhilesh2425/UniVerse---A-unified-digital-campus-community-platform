import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clubApi } from '../../api/clubApi';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import {
  Shield,
  Search,
  PlusCircle,
  Users,
  Calendar,
  ArrowRight,
  Award,
  Layers,
  GraduationCap,
} from 'lucide-react';

const CLUB_CATEGORIES = [
  'All',
  'Coding & Development',
  'Robotics & Automation',
  'Literary & Debate',
  'Arts & Photography',
  'Music & Band',
  'Dance & Performing Arts',
  'Entrepreneurship & Innovation',
  'Cultural & Heritage',
  'Sports & Athletics',
  'Technical & Engineering',
  'Social Impact & Volunteering',
];

const ClubsListPage = () => {
  const { isAuthenticated, isMainAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('members');

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const params = {
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: search.trim() || undefined,
        sort: sortBy,
      };
      const res = await clubApi.getClubs(params);
      if (res && res.clubs) {
        setClubs(res.clubs);
      }
    } catch (err) {
      console.error('Failed to load official clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [selectedCategory, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClubs();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-850 p-1.5 rounded-2xl w-full sm:w-auto">
          <Link
            to="/groups"
            className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
          >
            Personal Groups
          </Link>
          <div className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/60 dark:border-slate-700">
            Official College Clubs
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {isAuthenticated && (
            <Link
              to="/clubs/propose"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Propose Official Club</span>
            </Link>
          )}

          {(isMainAdmin || isAdmin) && (
            <Link
              to="/admin/clubs"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold text-xs border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900 transition"
            >
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Review Proposals</span>
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#172033] border border-slate-200/90 dark:border-[#334155] p-6 sm:p-8 shadow-xs transition-colors duration-200">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold tracking-wider uppercase">
            <Award className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Student Leadership & Chartered Clubs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Official College Clubs
          </h1>
          <p className="text-slate-600 dark:text-[#A8B4C7] text-sm sm:text-base leading-relaxed">
            Discover student-led clubs officially recognized by college administration. Every chartered club is supported by an appointed Faculty Advisor, an established student leadership hierarchy, and verified campus activities.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search official clubs by name, mission, or keyword..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-2xl transition shadow-xs"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CLUB_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4 shadow-xs">
          <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No official clubs found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {search
              ? `No official clubs match your search "${search}". Try adjusting your keywords or category filter.`
              : 'No chartered clubs in this category yet. Be the first student to propose chartering this club!'}
          </p>
          {isAuthenticated && (
            <Link
              to="/clubs/propose"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Propose Club Charter</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <div
              key={club._id}
              className="bg-white dark:bg-[#172033] rounded-2xl border border-slate-200/90 dark:border-[#334155] overflow-hidden shadow-xs hover:border-brand-500/40 dark:hover:border-brand-500/40 transition flex flex-col group"
            >
              <div className="h-32 bg-gradient-to-r from-brand-700 to-navy-900 relative overflow-hidden">
                {club.coverImage ? (
                  <img
                    src={club.coverImage}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-30 text-white">
                    <Award className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-white/90 dark:bg-slate-900/90 text-brand-700 dark:text-brand-300 backdrop-blur-md shadow-xs">
                    {club.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="flex items-start gap-3 -mt-10">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 p-1 border-2 border-white dark:border-slate-800 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                    {club.logo ? (
                      <img src={club.logo} alt={club.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-extrabold text-lg flex items-center justify-center rounded-xl">
                        {club.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition leading-snug line-clamp-1">
                      {club.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <Shield className="w-3 h-3" />
                        Official Charter
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {club.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  {club.facultyAdvisor?.name && (
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <GraduationCap className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                      <span className="text-slate-400 dark:text-slate-500">Advisor:</span>
                      <span className="font-bold truncate">{club.facultyAdvisor.name}</span>
                    </div>
                  )}

                  {club.leadership?.secretaryGeneral?.name && (
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-slate-400 dark:text-slate-500">Sec. General:</span>
                      <span className="font-bold truncate">{club.leadership.secretaryGeneral.name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {club.memberCount || 1}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {club.eventCount || 0} events
                    </span>
                  </div>

                  <Link
                    to={`/clubs/${club._id}`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-600 hover:text-white text-brand-700 dark:text-brand-300 font-bold text-xs transition"
                  >
                    <span>View Club</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubsListPage;

