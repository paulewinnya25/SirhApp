import React from 'react';
import { Navigate } from 'react-router-dom';
import adminAuthService from '../../services/adminAuthService';
import MedicalAuthService from '../../services/medicalAuthService';

const PrivateRoute = ({ children, medicalAuth = false }: any) => {
    // Vérifier l'authentification
    const isAuthenticated = medicalAuth 
        ? MedicalAuthService.isMedecinAuthenticated()
        : adminAuthService.isAuthenticated();

    // Rediriger vers la page de connexion appropriée si non authentifié
    if (!isAuthenticated) {
        return <Navigate 
            to={medicalAuth ? '/medical-login' : '/login'} 
            replace 
        />;
    }

    // Rendre les enfants si authentifié
    return children;
};

export default PrivateRoute;
