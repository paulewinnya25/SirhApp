import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Sidebar.css';

const Sidebar = ({ collapsed }: any) => {
  const location = useLocation();
  const [activeMenus, setActiveMenus] = useState<any>({});
  
  // Define menu structure - ORIGINAL COMPLETE STRUCTURE
  const menuItems = useMemo(() => [
    {
      title: 'Tableau de bord',
      icon: 'fas fa-home',
      path: '/dashboard',
      subMenu: null
    },
    {
      title: 'Entreprises',
      icon: 'fas fa-building',
      path: '#',
      subMenu: [
        { title: 'Centre Diagnostic', path: '#' },
        { title: 'Optikah', path: '#' },
        { title: 'Centre Wellness', path: '#' },
        { title: 'Café Walhya', path: '#' }
      ]
    },
    {
      title: 'Intégration & départ',
      icon: 'fas fa-exchange-alt',
      path: '#',
      subMenu: [
        { title: 'Onboarding', path: '/onboarding' },
        { title: 'Offboarding', path: '/offboarding' }
      ]
    },
    {
      title: 'Collaborateurs',
      icon: 'fas fa-users',
      path: '#',
      subMenu: [
        { title: 'Nouvel employé', path: '/new-employee' },
        { title: 'Effectif', path: '/employees' },
        { title: 'Alertes contrats', path: '/contract-alerts' }
      ]
    },
    {
      title: 'Temps & absences',
      icon: 'fas fa-calendar-alt',
      path: '#',
      subMenu: [
        { title: 'Congés', path: '/leave-management' },
        { title: 'Absences', path: '/absences' }
      ]
    },
    {
      title: 'Contrats',
      icon: 'fas fa-file-signature',
      path: '#',
      subMenu: [
        { title: 'Tous les contrats', path: '/contrats' }
      ]
    },
    {
      title: 'Vie de l’entreprise',
      icon: 'fas fa-briefcase',
      path: '#',
      subMenu: [
        { title: 'Sanctions', path: '/sanctions' },
        { title: 'Performance', path: '/performance-management' },
        { title: 'Notes de service', path: '/service-notes' }
      ]
    },
    {
      title: 'Recrutement',
      icon: 'fas fa-user-tie',
      path: '#',
      subMenu: [
        { title: 'Historique recrutement', path: '/recruitment-history' },
        { title: 'Historique départs', path: '/departure-history' },
        { title: 'Visites médicales', path: '/medical-visits' },
        { title: 'Entretiens', path: '/interviews' },
        { title: 'Tâches', path: '/tasks' }
      ]
    },
    {
      title: 'Événements',
      icon: 'fas fa-calendar-check',
      path: '#',
      subMenu: [
        { title: 'Calendrier', path: '/events' }
      ]
    },
    {
      title: 'Analyses',
      icon: 'fas fa-chart-bar',
      path: '#',
      subMenu: [
        { title: 'Graphiques RH', path: '/charts' }
      ]
    }
  ], []);

  // Handle menu toggling
  const toggleMenu = (index) => {
    setActiveMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Check if a menu item should be active based on current path
  const isActiveMenuItem = (item) => {
    if (item.path === location.pathname) return true;
    if (item.subMenu) {
      return item.subMenu.some(subItem => subItem.path === location.pathname);
    }
    return false;
  };

  // Initialize active menu based on current path
  useEffect(() => {
    const newActiveMenus = {};
    
    menuItems.forEach((item, index) => {
      if (item.subMenu && item.subMenu.some(subItem => subItem.path === location.pathname)) {
        newActiveMenus[index] = true;
      }
    });
    
    setActiveMenus(newActiveMenus);
  }, [location.pathname, menuItems]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <img 
          src="https://res.cloudinary.com/dd64mwkl2/image/upload/v1723636014/Centre_Diagnostic_logo_coucleur_ie6ywu.png" 
          alt="Centre Diagnostic" 
        />
        {!collapsed && (
          <span className="sidebar-brand-label">Portail RH</span>
        )}
      </div>
      
      <ul className="nav-menu">
        {menuItems.map((item, index) => (
          <li 
            key={index} 
            className={`nav-item ${activeMenus[index] ? 'active' : ''} ${isActiveMenuItem(item) ? 'current' : ''}`}
          >
            {item.subMenu ? (
              // Menu with submenu
              <>
                <button 
                  className={`nav-link ${isActiveMenuItem(item) ? 'active' : ''}`} 
                  onClick={() => toggleMenu(index)}
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                >
                  <div className="nav-icon"><i className={item.icon}></i></div>
                  <span className="nav-text">{item.title}</span>
                  {item.subMenu && <i className="fas fa-chevron-right nav-arrow"></i>}
                </button>
                
                {item.subMenu && (
                  <ul className="sub-menu">
                    {item.subMenu.map((subItem, subIndex) => (
                      <li key={subIndex}>
                        <Link 
                          to={subItem.path} 
                          className={`sub-menu-link ${location.pathname === subItem.path ? 'active' : ''}`}
                        >
                          {subItem.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              // Menu without submenu
              <Link 
                to={item.path === '#' ? '/dashboard' : item.path} 
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <div className="nav-icon"><i className={item.icon}></i></div>
                <span className="nav-text">{item.title}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;