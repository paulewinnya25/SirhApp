import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { evenementService, noteService } from '../../services/api';
import employeeService from '../../services/employeeService';
import { usePendingRequestsCount } from '../../hooks/usePendingRequestsCount';
import EventsComponent from '../common/EventsComponent';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [employeeCount, setEmployeeCount] = useState(null);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [notesError, setNotesError] = useState(null);
  const { pendingCount } = usePendingRequestsCount();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, employeesData] = await Promise.all([
          evenementService.getUpcoming().catch(() => []),
          employeeService.getAll().catch(() => null)
        ]);

        setEvents(Array.isArray(eventsData) ? eventsData : []);

        if (Array.isArray(employeesData)) {
          setEmployeeCount(employeesData.length);
        } else if (employeesData?.data && Array.isArray(employeesData.data)) {
          setEmployeeCount(employeesData.data.length);
        } else if (typeof employeesData?.count === 'number') {
          setEmployeeCount(employeesData.count);
        }

        setLoadingNotes(true);
        try {
          const notesData = await noteService.getPublicNotes();
          setNotes(Array.isArray(notesData) ? notesData : []);
          setNotesError(null);
        } catch (noteError) {
          console.error('Error fetching public notes:', noteError);
          setNotesError('Les notes de service sont temporairement indisponibles.');
          setNotes([]);
        } finally {
          setLoadingNotes(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      value: employeeCount ?? '—',
      label: 'Collaborateurs',
      icon: 'fas fa-users',
      color: 'blue'
    },
    {
      value: pendingCount ?? 0,
      label: 'Demandes en attente',
      icon: 'fas fa-inbox',
      color: 'green'
    },
    {
      value: 4,
      label: 'Entités du groupe',
      icon: 'fas fa-building',
      color: 'orange'
    },
    {
      value: events.length,
      label: 'Événements à venir',
      icon: 'fas fa-calendar-day',
      color: 'red'
    }
  ];

  const tools = [
    {
      title: 'Notes de service',
      description: 'Communications internes',
      icon: 'fas fa-bullhorn',
      path: '/service-notes'
    },
    {
      title: 'Contrats',
      description: 'Suivi et renouvellements',
      icon: 'fas fa-file-signature',
      path: '/contrats'
    },
    {
      title: 'Sanctions',
      description: 'Dossiers disciplinaires',
      icon: 'fas fa-balance-scale',
      path: '/sanctions'
    },
    {
      title: 'Demandes',
      description: 'Attestations & documents',
      icon: 'fas fa-folder-open',
      path: '/employee-requests',
      notificationCount: pendingCount
    }
  ];

  const hrCards = [
    {
      title: 'Congés et absences',
      icon: 'fas fa-calendar-alt',
      text: pendingCount > 0
        ? `${pendingCount} demande${pendingCount > 1 ? 's' : ''} à traiter.`
        : 'Aucune demande urgente pour le moment.',
      buttonText: 'Gérer les congés',
      buttonIcon: 'far fa-calendar-check',
      buttonPath: '/leave-management',
      buttonVariant: 'outline-primary'
    },
    {
      title: 'Effectif',
      icon: 'fas fa-users',
      count: employeeCount ?? '—',
      countLabel: employeeCount === 1 ? 'collaborateur' : 'collaborateurs',
      buttons: [
        {
          text: 'Nouvel employé',
          icon: 'fas fa-user-plus',
          path: '/new-employee',
          variant: 'primary'
        },
        {
          text: 'Historique des départs',
          icon: 'fas fa-user-minus',
          path: '/departure-history',
          variant: 'outline-danger'
        }
      ]
    }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryClass = (category) => {
    switch (category) {
      case 'Information':
        return 'category-info';
      case 'Organisation':
        return 'category-organisation';
      case 'Rappel':
        return 'category-reminder';
      case 'Procédure':
        return 'category-procedure';
      case 'Évènement':
      case 'Événement':
        return 'category-event';
      case 'Recrutement':
        return 'category-recruitment';
      default:
        return 'category-other';
    }
  };

  const StatCard = ({ value, label, icon, color, delay = 0.1 }) => (
    <div className="stat-card fade-in-up" style={{ animationDelay: `${delay}s` }}>
      <div className={`stat-icon-wrapper stat-icon-${color}`}>
        <i className={icon}></i>
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );

  const ToolCard = ({ title, description, icon, path, notificationCount }) => (
    <Link to={path} className="tool-card">
      <div className="tool-icon">
        <i className={icon}></i>
        {notificationCount > 0 && (
          <span className="tool-notification-badge">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </div>
      <div>
        <h3 className="tool-title">{title}</h3>
        {description && <p className="tool-desc">{description}</p>}
      </div>
    </Link>
  );

  const HRCard = ({
    title,
    icon,
    text,
    count,
    countLabel,
    buttonText,
    buttonIcon,
    buttonPath,
    buttonVariant = 'primary',
    buttons
  }) => (
    <div className="hr-card">
      <div className="hr-icon">
        <i className={icon}></i>
      </div>
      <h3 className="hr-title">{title}</h3>
      {text && <p className="hr-text">{text}</p>}
      {count !== undefined && (
        <div className="hr-count">
          {count} <span>{countLabel}</span>
        </div>
      )}
      {buttonText && buttonPath && (
        <Link to={buttonPath} className={`btn btn-${buttonVariant}`}>
          {buttonIcon && <i className={`${buttonIcon} btn-icon`}></i>}
          {buttonText}
        </Link>
      )}
      {buttons && buttons.length > 0 && (
        <div className="d-grid gap-2">
          {buttons.map((button, index) => (
            <Link
              key={index}
              to={button.path}
              className={`btn btn-${button.variant} ${index > 0 ? 'mt-2' : ''}`}
            >
              {button.icon && <i className={`${button.icon} btn-icon`}></i>}
              {button.text}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <p className="dashboard-kicker">{todayLabel}</p>
        <h1>{greeting}, voici votre activité RH</h1>
        <p>
          Pilotez l’effectif, les demandes et les communications du Centre Diagnostic
          depuis un tableau de bord unique.
        </p>
      </header>

      <div className="stats-row">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            value={stat.value}
            label={stat.label}
            icon={stat.icon}
            color={stat.color}
            delay={0.05 * (index + 1)}
          />
        ))}
      </div>

      <div className="tools-section">
        <div className="section-header">
          <h2 className="section-title">Accès rapides</h2>
        </div>
        <div className="tools-grid">
          {tools.map((tool) => (
            <ToolCard key={tool.path} {...tool} />
          ))}
        </div>
      </div>

      <div className="main-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-icon">
              <i className="fas fa-bolt"></i>
            </div>
            <h3 className="card-title">À traiter en priorité</h3>
          </div>
          <div className="card-body">
            <div className="welcome-wrapper">
              <div className="welcome-image welcome-image-fallback" aria-hidden="true">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <div className="welcome-content">
                <h4 className="welcome-title">Gagnez du temps sur vos dossiers</h4>
                <p className="welcome-text">
                  Créez un collaborateur, validez une demande ou consultez les contrats
                  arrivant à échéance.
                </p>
                <div className="action-buttons">
                  <Link to="/new-employee" className="btn btn-primary">
                    <i className="fas fa-user-plus btn-icon"></i>
                    Nouvel employé
                  </Link>
                  <Link to="/employee-requests" className="btn btn-outline-primary">
                    Demandes
                    {pendingCount > 0 ? ` (${pendingCount})` : ''}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <EventsComponent />
      </div>

      <div className="notes-section">
        <div className="section-header">
          <h2 className="section-title">Notes de service</h2>
          <Link to="/service-notes" className="btn-link-all">Toutes les notes</Link>
        </div>

        <div className="card note-card">
          <div className="card-body">
            {loadingNotes ? (
              <div className="text-center p-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : notesError ? (
              <div className="alert alert-warning" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {notesError}
              </div>
            ) : notes && notes.length > 0 ? (
              <ul className="note-list list-unstyled">
                {notes.slice(0, 3).map((note) => (
                  <li key={note.id} className="note-item">
                    <div className="note-meta">
                      <span className="note-meta-date">
                        <i className="far fa-calendar-alt me-1"></i> {formatDate(note.created_at)}
                      </span>
                      <span className={`note-meta-category ${getCategoryClass(note.category)}`}>
                        {note.category}
                      </span>
                    </div>
                    <div className="note-number">{note.full_note_number}</div>
                    <h4 className="note-title">{note.title}</h4>
                    <p className="note-content">
                      {note.content.length > 150
                        ? `${note.content.substring(0, 150)}…`
                        : note.content}
                    </p>
                    <Link to={`/service-notes/${note.id}`} className="btn btn-sm btn-outline-primary">
                      Lire
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-notes">
                <i className="fas fa-file-alt empty-icon"></i>
                <p className="empty-text">Aucune note publiée pour l’instant.</p>
                <Link to="/service-notes" className="btn btn-sm btn-outline-primary mt-2">
                  Créer une note
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hr-section">
        <div className="section-header">
          <h2 className="section-title">Modules RH</h2>
        </div>
        <div className="hr-grid">
          {hrCards.map((card) => (
            <HRCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
