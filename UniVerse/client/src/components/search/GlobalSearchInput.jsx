import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../../api/searchApi';
import {
  Search,
  X,
  Calendar,
  Bell,
  Users,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

const GlobalSearchInput = ({ isMobile = false, onCloseMobile = () => {} }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [counts, setCounts] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setCounts(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchApi.searchGlobal({ q: query.trim(), limit: 5 });
        if (res && res.results) {
          setResults(res.results.slice(0, 5));
          setCounts(res.counts);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search preview error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      setIsOpen(false);
      onCloseMobile();
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleItemClick = (url) => {
    setIsOpen(false);
    setQuery('');
    onCloseMobile();
    navigate(url);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    onCloseMobile();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-3.5 h-3.5 text-blue-500" />;
      case 'announcement':
        return <Bell className="w-3.5 h-3.5 text-amber-500" />;
      case 'group':
        return <Users className="w-3.5 h-3.5 text-emerald-500" />;
      case 'discussion':
        return <MessageSquare className="w-3.5 h-3.5 text-purple-500" />;
      case 'issue':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Search className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className={`relative ${isMobile ? 'w-full' : 'w-full'}`} ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder="Search campus..."
          className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200/80 dark:border-[#334155] focus:border-brand-500 focus:bg-white dark:focus:bg-[#172033] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition z-10"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
          {loading ? (
            <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
              Searching campus...
            </div>
          ) : results.length === 0 ? (
            <div className="py-5 text-center px-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No matching campus results found
              </p>
            </div>
          ) : (
            <div>
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                Quick Results ({counts?.all || results.length})
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-60 overflow-y-auto">
                {results.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleItemClick(item.url)}
                    className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 capitalize">
                        {item.type} • {item.category || 'General'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="w-full text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center justify-center gap-1 transition py-1"
                >
                  View all results for "{query}"
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchInput;
