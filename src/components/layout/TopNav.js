import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../../services/api';
import UserDropdown from './UserDropdown';
import '../../styles/TopNav.css';

const TopNav = ({ toggleSidebar, user, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const searchRef = useRef(null);
  const userRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = searchQuery.trim();
    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError('');
      return undefined;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchService.search(query);
        setSearchResults(Array.isArray(results) ? results : []);
        setSearchError('');
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setSearchError('Recherche indisponible pour le moment.');
      } finally {
        setIsSearching(false);
      }
    }, 320);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    try {
      const results = await searchService.search(query);
      setSearchResults(Array.isArray(results) ? results : []);
      setIsSearchFocused(true);
      setSearchError('');
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSearchError('Recherche indisponible pour le moment.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (result) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);

    switch (result.type) {
      case 'employee':
        navigate(`/employees/${result.id}`);
        break;
      case 'contract':
        navigate('/contrats');
        break;
      case 'note':
        navigate('/service-notes');
        break;
      default:
        break;
    }
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'RH';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleUserProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUserDropdown(!showUserDropdown);
  };

  const handleSidebarToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSidebar();
  };

  const handleLogout = () => {
    setShowUserDropdown(false);
    if (onLogout) onLogout();
  };

  const rawName = user?.name || user?.nom || [user?.prenom, user?.nom].filter(Boolean).join(' ');
  const userName = rawName && rawName !== 'admin' ? rawName : 'Administrateur RH';
  const roleRaw = String(user?.role || user?.poste || user?.fonction || '').toLowerCase();
  const userRole =
    roleRaw === 'admin' || roleRaw === 'rh' || !roleRaw
      ? 'Ressources humaines'
      : (user?.poste || user?.fonction || 'Centre Diagnostic');

  const showResultsPanel =
    isSearchFocused &&
    (isSearching || searchError || searchResults.length > 0 || searchQuery.trim().length >= 2);

  return (
    <div className="top-nav-container">
      <nav className="top-nav" aria-label="Barre principale">
        <div className="top-nav-left">
          <button
            type="button"
            className="toggle-sidebar"
            onClick={handleSidebarToggle}
            title="Menu"
            aria-label="Ouvrir ou fermer le menu"
          >
            <i className="fas fa-bars" aria-hidden="true"></i>
          </button>

          <div className="top-nav-search" ref={searchRef}>
            <form onSubmit={handleSearch} role="search">
              <i className="fas fa-search search-leading-icon" aria-hidden="true"></i>
              <input
                type="search"
                className={`search-input ${isSearchFocused ? 'focused' : ''}`}
                placeholder="Rechercher…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                autoComplete="off"
                aria-label="Rechercher un collaborateur ou un contrat"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setSearchError('');
                  }}
                  aria-label="Effacer la recherche"
                >
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              )}
            </form>

            {showResultsPanel && (
              <div className="search-results-dropdown" role="listbox">
                {isSearching ? (
                  <div className="search-loading">
                    <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                    <span>Recherche…</span>
                  </div>
                ) : searchError ? (
                  <div className="search-no-results">
                    <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                    <span>{searchError}</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="search-results-list">
                    {searchResults.map((result) => (
                      <button
                        type="button"
                        key={`${result.type}-${result.id}`}
                        className="search-result-item"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <div className="search-result-icon">
                          <i
                            className={`fas ${
                              result.type === 'employee'
                                ? 'fa-user'
                                : result.type === 'contract'
                                ? 'fa-file-signature'
                                : 'fa-file-alt'
                            }`}
                            aria-hidden="true"
                          ></i>
                        </div>
                        <div className="search-result-content">
                          <div className="search-result-title">{result.name}</div>
                          <div className="search-result-subtitle">
                            {result.email || result.status || result.category || result.department}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="search-no-results">
                    <i className="fas fa-search" aria-hidden="true"></i>
                    <span>Aucun résultat pour « {searchQuery.trim()} »</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="top-nav-actions">
          <div className="user-menu-wrap" ref={userRef}>
            <button
              type="button"
              className="user-profile"
              id="userProfile"
              onClick={handleUserProfileClick}
              title="Compte"
              aria-expanded={showUserDropdown}
            >
              <div className="user-avatar" aria-hidden="true">
                {getInitials(userName)}
              </div>
              <div className="user-info">
                <div className="user-name">{userName}</div>
                <div className="user-title">{userRole}</div>
              </div>
              <i className="fas fa-chevron-down user-dropdown-arrow" aria-hidden="true"></i>
            </button>

            {showUserDropdown && (
              <UserDropdown user={user} onLogout={handleLogout} />
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default TopNav;
