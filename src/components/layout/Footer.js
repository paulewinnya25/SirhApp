import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <img
            src="https://res.cloudinary.com/dd64mwkl2/image/upload/v1723636014/Centre_Diagnostic_logo_coucleur_ie6ywu.png"
            alt="Centre Diagnostic"
            className="app-footer-logo"
          />
          <div>
            <p className="app-footer-name">Centre Diagnostic</p>
            <p className="app-footer-tagline">Portail des ressources humaines</p>
          </div>
        </div>

        <nav className="app-footer-nav" aria-label="Liens pied de page">
          <Link to="/">Tableau de bord</Link>
          <Link to="/employees">Employés</Link>
          <Link to="/leave-management">Congés</Link>
          <Link to="/service-notes">Notes de service</Link>
        </nav>

        <div className="app-footer-meta">
          <p>© {year} Centre Diagnostic. Tous droits réservés.</p>
          <p className="app-footer-support">Support RH · Accès sécurisé</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
