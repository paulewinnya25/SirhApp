import React, { useState, useEffect } from 'react';
import '../../styles/AdminLoginHistory.css';
import { FaHistory, FaSearch, FaFilter, FaDownload, FaCheckCircle, FaTimesCircle, FaUser, FaClock } from 'react-icons/fa';
import api from '../../services/api';

const AdminLoginHistory = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUserType, setFilterUserType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState<any>({ start: '', end: '' });

  const fetchLoginHistory = React.useCallback(async () => {
    try {
      setLoading(true);
      let url = 'admin/login-history?limit=500';
      
      if (filterUserType !== 'all') {
        url += `&userType=${filterUserType}`;
      }

      console.log('📥 Récupération de l\'historique de connexion depuis:', url);
      const response = await api.get(url);
      let data = response.data || [];
      console.log('✅ Données reçues:', data.length, 'entrées');
      console.log('📊 Première entrée:', data[0]);

      // Filtrer par statut côté client
      if (filterStatus !== 'all') {
        data = data.filter(item => item.login_status === filterStatus);
      }

      // Filtrer par date - utiliser created_at si login_time n'existe pas
      if (filterDateRange.start) {
        data = data.filter(item => {
          const date = item.login_time || item.created_at;
          return date && new Date(date) >= new Date(filterDateRange.start);
        });
      }
      if (filterDateRange.end) {
        data = data.filter(item => {
          const date = item.login_time || item.created_at;
          return date && new Date(date) <= new Date(filterDateRange.end);
        });
      }

      console.log('📊 Données après filtrage:', data.length, 'entrées');
      setHistory(data);
    } catch (error) {
      console.error('Error fetching login history:', error);
    } finally {
      setLoading(false);
    }
  }, [filterUserType, filterStatus, filterDateRange]);

  useEffect(() => {
    fetchLoginHistory();
  }, [fetchLoginHistory]);

  const filteredHistory = history.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.email && item.email.toLowerCase().includes(searchLower)) ||
      (item.matricule && item.matricule.toLowerCase().includes(searchLower)) ||
      (item.user_id && item.user_id.toLowerCase().includes(searchLower)) ||
      (item.ip_address && item.ip_address.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusIcon = (status) => {
    return status === 'success' ? (
      <FaCheckCircle className="status-icon success" />
    ) : (
      <FaTimesCircle className="status-icon failed" />
    );
  };

  const getUserTypeBadge = (userType) => {
    const badges = {
      'rh': { label: 'RH', class: 'badge-rh' },
      'employee': { label: 'Employé', class: 'badge-employee' },
      'admin': { label: 'Admin', class: 'badge-admin' }
    };
    const badge = badges[userType] || { label: userType, class: 'badge-default' };
    return <span className={`user-type-badge ${badge.class}`}>{badge.label}</span>;
  };

  return (
    <div className="admin-login-history">
      <div className="admin-page-header">
        <h1>
          <FaHistory /> Historique de Connexion
        </h1>
        <button className="btn-secondary" onClick={fetchLoginHistory}>
          <FaDownload /> Exporter
        </button>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Rechercher par email, matricule, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <FaFilter />
          <select value={filterUserType} onChange={(e) => setFilterUserType(e.target.value)}>
            <option value="all">Tous les types</option>
            <option value="rh">RH</option>
            <option value="employee">Employé</option>
            <option value="admin">Admin</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tous les statuts</option>
            <option value="success">Succès</option>
            <option value="failed">Échec</option>
            <option value="blocked">Bloqué</option>
          </select>

          <input
            type="date"
            placeholder="Date début"
            value={filterDateRange.start}
            onChange={(e) => setFilterDateRange({ ...filterDateRange, start: e.target.value })}
          />

          <input
            type="date"
            placeholder="Date fin"
            value={filterDateRange.end}
            onChange={(e) => setFilterDateRange({ ...filterDateRange, end: e.target.value })}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Chargement...</div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date/Heure</th>
                <th>Type</th>
                <th>Utilisateur</th>
                <th>Identifiant</th>
                <th>IP</th>
                <th>Statut</th>
                <th>Raison</th>
                <th>Durée Session</th>
                <th>Navigateur</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="no-data">Aucun historique trouvé</td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="date-cell">
                        <FaClock /> {formatDate(item.login_time || item.created_at)}
                      </div>
                    </td>
                    <td>{getUserTypeBadge(item.user_type)}</td>
                    <td>
                      <div className="user-cell">
                        <FaUser /> {item.email || item.matricule || item.user_id}
                      </div>
                    </td>
                    <td>
                      {item.email && <span className="identifier">{item.email}</span>}
                      {item.matricule && <span className="identifier">{item.matricule}</span>}
                    </td>
                    <td className="ip-address">{item.ip_address || '-'}</td>
                    <td>
                      <div className="status-cell">
                        {getStatusIcon(item.login_status)}
                        <span className={`status-text status-${item.login_status}`}>
                          {item.login_status === 'success' ? 'Succès' : 
                           item.login_status === 'failed' ? 'Échec' : 'Bloqué'}
                        </span>
                      </div>
                    </td>
                    <td className="failure-reason">
                      {item.failure_reason || '-'}
                    </td>
                    <td>
                      {item.session_duration ? formatDuration(item.session_duration) : '-'}
                    </td>
                    <td className="user-agent" title={item.user_agent}>
                      {item.user_agent ? 
                        item.user_agent.substring(0, 50) + (item.user_agent.length > 50 ? '...' : '') 
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-value">{filteredHistory.filter(h => h.login_status === 'success').length}</div>
          <div className="stat-label">Connexions réussies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{filteredHistory.filter(h => h.login_status === 'failed').length}</div>
          <div className="stat-label">Échecs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{filteredHistory.filter(h => h.user_type === 'rh').length}</div>
          <div className="stat-label">Connexions RH</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{filteredHistory.filter(h => h.user_type === 'employee').length}</div>
          <div className="stat-label">Connexions Employés</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginHistory;

