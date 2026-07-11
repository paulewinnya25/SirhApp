import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import unifiedAuthService from '../../services/unifiedAuthService';
import adminAuthService from '../../services/adminAuthService';
import '../../styles/UnifiedLogin.css';

const UnifiedLogin = () => {
  const { setUserDirectly } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState(null); // 'rh', 'employee', or null
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();

  // Détecter automatiquement le type d'utilisateur basé sur l'identifiant
  useEffect(() => {
    if (identifier.trim()) {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      // Vérifier d'abord si c'est un admin
      if (adminAuthService.isAdminEmail(normalizedIdentifier)) {
        setUserType('admin');
      } else {
        const detectedType = unifiedAuthService.detectUserType(identifier);
        setUserType(detectedType);
      }
    } else {
      setUserType(null);
    }
  }, [identifier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Récupérer les valeurs directement depuis le formulaire pour éviter les problèmes de synchronisation
    const form = e.target;
    const formIdentifier = form.identifier?.value || identifier;
    const formPassword = form.password?.value || password;

    console.log('📝 Données du formulaire:', { 
      formIdentifier, 
      formPassword: formPassword ? '***' : 'vide',
      stateIdentifier: identifier,
      statePassword: password ? '***' : 'vide'
    });

    // Validation de base
    if (!formIdentifier.trim()) {
      setError('Veuillez saisir votre identifiant (email ou matricule)');
      setIsLoading(false);
      return;
    }

    if (!formPassword || !formPassword.trim()) {
      setError('Veuillez saisir votre mot de passe');
      setIsLoading(false);
      return;
    }

    try {
      // Vérifier d'abord si c'est un identifiant administrateur
      const normalizedIdentifier = formIdentifier.trim().toLowerCase();
      console.log('🔍 Vérification type utilisateur pour:', normalizedIdentifier);
      const isAdminEmail = adminAuthService.isAdminEmail(normalizedIdentifier);
      console.log('🔍 Résultat vérification admin:', isAdminEmail);
      
      if (isAdminEmail) {
        // Authentification admin avec le service dédié
        console.log('🔐 Détection admin, utilisation de adminAuthService');
        console.log('🔑 Password dans handleSubmit:', formPassword ? 'présent' : 'absent', 'Longueur:', formPassword?.length);
        const adminResult = await adminAuthService.login(normalizedIdentifier, formPassword);
        
        if (adminResult && adminResult.success && adminResult.admin) {
          console.log('✅ Connexion admin réussie via UnifiedLogin');
          
          // Stocker les données admin
          const adminData = {
            ...adminResult.admin,
            id: adminResult.admin.id || `admin_${normalizedIdentifier}`,
            email: normalizedIdentifier,
            role: 'super_admin',
            isAdmin: true,
            isSuperAdmin: true
          };
          
          sessionStorage.setItem('adminUser', JSON.stringify(adminData));
          sessionStorage.setItem('adminToken', adminResult.token || 'admin-token');
          
          // Se souvenir de l'utilisateur si demandé
          if (rememberMe) {
            localStorage.setItem('rememberedAdmin', normalizedIdentifier);
          }
          
          // Rediriger vers le portail admin
          console.log('🔄 Redirection vers /admin-portal...');
          console.log('💾 Vérification sessionStorage:', sessionStorage.getItem('adminUser') ? 'présent' : 'absent');
          
          // Le composant AdminPortalRoute vérifie maintenant périodiquement le sessionStorage
          // Donc navigate() devrait fonctionner, mais utilisons window.location.href pour forcer le rechargement
          // et garantir que le composant se monte avec les bonnes valeurs du sessionStorage
          window.location.href = '/admin-portal';
          return;
        } else {
          setError(adminResult?.error || 'Identifiants administrateur incorrects');
          setIsLoading(false);
          return;
        }
      }
      
      // Utiliser le service d'authentification unifié pour RH et Employés
      const result = await unifiedAuthService.login(formIdentifier.trim(), formPassword);

      if (result.success) {
        if (result.userType === 'rh') {
          // Connexion RH - utiliser directement les données du service unifié
          if (result.user) {
            // S'assurer que l'utilisateur a un ID
            if (!result.user.id) {
              result.user.id = result.user.email || identifier.trim();
            }
            
            // Utiliser setUserDirectly pour mettre à jour le contexte directement
            setUserDirectly(result.user);
            
            // Stocker le token si disponible
            if (result.token) {
              sessionStorage.setItem('token', result.token);
            }
            
            // Se souvenir de l'utilisateur si demandé
            if (rememberMe) {
              unifiedAuthService.rememberUser(identifier.trim(), 'rh');
            }
            
            // Naviguer vers le dashboard RH
            navigate('/dashboard');
          } else {
            setError('Erreur lors de la connexion');
          }
        } else if (result.userType === 'employee') {
          // Connexion Employé
          if (result.employee) {
            console.log('✅ Authentification employé réussie:', result.employee);
            
            // Stocker les données dans sessionStorage
            sessionStorage.setItem('employeeUser', JSON.stringify(result.employee));
            console.log('💾 Données employé stockées dans sessionStorage');
            
            // Se souvenir de l'utilisateur si demandé
            if (rememberMe) {
              unifiedAuthService.rememberUser(identifier.trim().toUpperCase(), 'employee');
            }
            
            // Utiliser window.location pour forcer la navigation et le rechargement
            // Cela garantit que App.js détecte correctement l'authentification
            console.log('🔄 Redirection vers /EmployeePortal...');
            window.location.href = '/EmployeePortal';
          } else {
            setError('Erreur lors de la connexion');
          }
        }
      } else {
        setError(result.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger l'identifiant mémorisé au chargement
  useEffect(() => {
    const remembered = unifiedAuthService.getRememberedUser();
    
    if (remembered.identifier) {
      setIdentifier(remembered.identifier);
      setUserType(remembered.userType);
    }
  }, []);

  // Déterminer le placeholder et l'icône selon le type d'utilisateur
  const getInputConfig = () => {
    if (userType === 'admin') {
      return {
        placeholder: 'Votre email administrateur (ex: admin@system.ga)',
        icon: 'fa-user-shield',
        label: 'Email Administrateur'
      };
    } else if (userType === 'rh') {
      return {
        placeholder: 'Votre adresse email',
        icon: 'fa-envelope',
        label: 'Adresse email'
      };
    } else if (userType === 'employee') {
      return {
        placeholder: 'Votre matricule (ex: CDL-2024-0001)',
        icon: 'fa-id-card',
        label: 'Matricule'
      };
    } else {
      return {
        placeholder: 'Email (RH/Admin) ou Matricule (Employé)',
        icon: 'fa-user',
        label: 'Identifiant'
      };
    }
  };

  const inputConfig = getInputConfig();

  return (
    <div className="unified-login-page">
      <aside className="unified-login-brand" aria-hidden="false">
        <div className="unified-login-brand-overlay" />
        <div className="unified-login-brand-content">
          <img
            src="https://res.cloudinary.com/dd64mwkl2/image/upload/v1723636014/Centre_Diagnostic_logo_coucleur_ie6ywu.png"
            alt="Centre Diagnostic"
            className="unified-login-brand-logo"
          />
          <p className="unified-login-brand-name">Centre Diagnostic</p>
          <h1 className="unified-login-brand-headline">Portail des ressources humaines</h1>
          <p className="unified-login-brand-text">
            Accédez à votre espace sécurisé pour gérer les dossiers, congés, contrats et demandes.
          </p>
        </div>
      </aside>

      <div className="unified-login-panel">
        <div className="unified-login-panel-inner">
          <header className="unified-login-header">
            <img
              src="https://res.cloudinary.com/dd64mwkl2/image/upload/v1723636014/Centre_Diagnostic_logo_coucleur_ie6ywu.png"
              alt=""
              className="unified-login-logo-mobile"
            />
            <p className="unified-login-kicker">Connexion</p>
            <h2 className="unified-login-title">
              {userType === 'admin'
                ? 'Espace administrateur'
                : userType === 'rh'
                ? 'Espace RH'
                : userType === 'employee'
                ? 'Espace collaborateur'
                : 'Bienvenue'}
            </h2>
            <p className="unified-login-subtitle">
              Identifiez-vous avec votre email professionnel ou votre matricule.
            </p>
          </header>

          {error && (
            <div className="unified-alert unified-alert-danger" role="alert">
              <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="unified-login-form">
            <div className="unified-form-group">
              <label htmlFor="identifier" className="unified-form-label">
                {inputConfig.label}
              </label>
              <div className="unified-input-group">
                <i className={`fas ${inputConfig.icon} unified-input-icon`} aria-hidden="true"></i>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  className="unified-form-control"
                  placeholder={inputConfig.placeholder}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
                {userType && (
                  <span className="unified-user-type-badge">
                    {userType === 'admin' ? 'Admin' : userType === 'rh' ? 'RH' : 'Employé'}
                  </span>
                )}
              </div>
              {identifier && !userType && (
                <small className="unified-form-hint">
                  Email (ex. rh@centre-diagnostic.com) ou matricule (ex. CDL-2024-0001)
                </small>
              )}
            </div>

            <div className="unified-form-group">
              <label htmlFor="password" className="unified-form-label">Mot de passe</label>
              <div className="unified-input-group">
                <i className="fas fa-lock unified-input-icon" aria-hidden="true"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="unified-form-control"
                  placeholder="Votre mot de passe"
                  value={password || ''}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="unified-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Masquer' : 'Afficher'}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                </button>
              </div>
            </div>

            <div className="unified-form-options">
              <div className="unified-form-check">
                <input
                  className="unified-form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="unified-form-check-label" htmlFor="rememberMe">
                  Se souvenir de moi
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="unified-btn unified-btn-primary unified-btn-block"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="unified-spinner-border" role="status" aria-hidden="true"></span>
                  Connexion…
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <footer className="unified-login-footer">
            <p className="unified-help-text">
              <span><strong>RH</strong> — adresse email</span>
              <span><strong>Employé</strong> — matricule CDL-YYYY-XXXX</span>
            </p>
            <p className="unified-copyright">© {new Date().getFullYear()} Centre Diagnostic</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;

