import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/api';
import '../../styles/EmployeeLogin.css';

const EmployeeLogin = ({ onLogin }: any) => {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const isValidMatricule = (matricule) => {
    // Format: CDL-YYYY-XXXX (ex: CDL-2024-0001)
    const regex = /^CDL-\d{4}-\d{4}$/;
    return regex.test(matricule.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🔐 Début de la tentative de connexion...');
    console.log('🏷️ Matricule saisi:', matricule);
    console.log('🔑 Mot de passe saisi:', password);

    // Validation de base
    if (!matricule.trim()) {
      setError('Veuillez saisir votre matricule');
      setIsLoading(false);
      return;
    }

    if (!isValidMatricule(matricule)) {
      setError('Veuillez entrer un matricule valide (format: CDL-YYYY-XXXX)');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Veuillez saisir votre mot de passe');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🚀 Appel de l\'API d\'authentification...');
      
      // Appeler l'API pour authentifier l'employé
      const response = await employeeService.authenticate(matricule, password);
      
      console.log('📡 Réponse de l\'API reçue:', response);
      
      // Si l'authentification réussit, stocker les informations de l'employé
      if (response && response.success) {
        console.log('✅ Authentification réussie !');
        console.log('👤 Données employé:', response.employee);
        
        // Stockage des données dans sessionStorage
        sessionStorage.setItem('employeeUser', JSON.stringify(response.employee));
        console.log('💾 Données stockées dans sessionStorage');
        
        // Appeler la fonction onLogin pour mettre à jour l'état de l'application
        if (onLogin) {
          console.log('🔄 Appel de la fonction onLogin...');
          onLogin(response.employee);
          console.log('✅ Fonction onLogin exécutée');
        } else {
          console.log('⚠️ Fonction onLogin non disponible');
        }
        
        console.log('🔄 Redirection vers /EmployeePortal...');
        // Rediriger vers le portail employé
        navigate('/EmployeePortal');
        console.log('✅ Redirection effectuée');
      } else {
        console.log('❌ Authentification échouée:', response);
        setError('Matricule ou mot de passe incorrect');
      }
    } catch (err) {
      console.error('💥 Erreur d\'authentification:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      console.log('🏁 Fin du processus de connexion');
    }
  };

  return (
    <div className="login-container animated fadeInUp">
      <div className="login-header">
        <img 
          src="https://res.cloudinary.com/dd64mwkl2/image/upload/v1723636014/Centre_Diagnostic_logo_coucleur_ie6ywu.png" 
          alt="Centre Diagnostic Logo" 
          className="login-logo" 
        />
        <h2 className="login-title">Portail Employé</h2>
        <p className="login-subtitle">Connectez-vous pour accéder à votre espace personnel</p>
      </div>
      
      <div className="login-form">
        {error && (
          <div className="alert alert-danger animated shake">
            <i className="fas fa-exclamation-circle me-2"></i>{error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} id="loginForm">
          <div className="form-group">
                    <label htmlFor="matricule" className="form-label">Matricule</label>
        <div className="input-group">
          <i className="fas fa-id-card input-icon"></i>
          <input
            type="text"
            id="matricule"
            className="form-control input-with-icon"
            placeholder="Votre matricule (ex: CDL-2024-0001)"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Mot de passe</label>
            <div className="input-group">
              <i className="fas fa-lock input-icon"></i>
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                className="form-control input-with-icon" 
                placeholder="Votre mot de passe" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={isLoading}
              />
              <i 
                className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>
          
          <div className="d-flex justify-content-between mb-4">
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="rememberMe" 
              />
              <label className="form-check-label" htmlFor="rememberMe">
                Se souvenir de moi
              </label>
            </div>
            <a href="#forgot-password" className="text-primary">Mot de passe oublié ?</a>
          </div>
          
          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Connexion en cours...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt me-2"></i>Se connecter
              </>
            )}
          </button>
        </form>
      </div>
      
      <div className="login-footer">
        <p>Vous n'avez pas de compte ? <a href="#register">Demandez un accès</a></p>
        <p className="mt-2">© 2025 Centre Diagnostic. Tous droits réservés.</p>
      </div>
    </div>
  );
};

export default EmployeeLogin;