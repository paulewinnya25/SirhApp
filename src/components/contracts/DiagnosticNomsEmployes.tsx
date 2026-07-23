import React, { useState, useEffect } from 'react';
import { contratService, employeeService } from '../../services/api';

const DiagnosticNomsEmployes = () => {
  const [diagnostic, setDiagnostic] = useState<any>({
    contrats: null,
    employees: null,
    contratsAvecNoms: null,
    errors: [],
    warnings: [],
    success: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runDiagnostic = async () => {
    setIsLoading(true);
    const results = {
      contrats: null,
      employees: null,
      contratsAvecNoms: null,
      errors: [],
      warnings: [],
      success: []
    };

    try {
      // Test 1: Récupération des contrats
      console.log('🔍 Test 1: Récupération des contrats...');
      const contratsData = await contratService.getAll();
      results.contrats = contratsData;
      
      if (contratsData && contratsData.length > 0) {
        results.success.push('✅ Contrats récupérés avec succès');
        
        // Vérifier la structure des contrats
        const firstContrat = contratsData[0];
        if (firstContrat.employee_id) {
          results.success.push('✅ Les contrats ont bien un employee_id');
        } else {
          results.errors.push('❌ Les contrats n\'ont pas d\'employee_id');
        }
        
        if (firstContrat.nom_employe) {
          results.success.push('✅ Les contrats ont déjà un nom_employe');
        } else {
          results.warnings.push('⚠️ Les contrats n\'ont pas de nom_employe (normal, sera ajouté)');
        }
      } else {
        results.warnings.push('⚠️ Aucun contrat trouvé ou erreur de récupération');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des contrats:', error);
      results.errors.push(`❌ Erreur API contrats: ${error.message}`);
    }

    try {
      // Test 2: Récupération des employés
      console.log('🔍 Test 2: Récupération des employés...');
      const employeesData = await employeeService.getAll();
      results.employees = employeesData;
      
      if (employeesData && employeesData.length > 0) {
        results.success.push('✅ Employés récupérés avec succès');
        
        // Vérifier la structure des employés
        const firstEmployee = employeesData[0];
        if (firstEmployee.id) {
          results.success.push('✅ Les employés ont bien un id');
        } else {
          results.errors.push('❌ Les employés n\'ont pas d\'id');
        }
        
        if (firstEmployee.nom_prenom) {
          results.success.push('✅ Les employés ont bien un nom_prenom');
        } else {
          results.errors.push('❌ Les employés n\'ont pas de nom_prenom');
        }
      } else {
        results.warnings.push('⚠️ Aucun employé trouvé ou erreur de récupération');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des employés:', error);
      results.errors.push(`❌ Erreur API employés: ${error.message}`);
    }

    // Test 3: Test de la liaison
    if (results.contrats && results.employees) {
      console.log('🔍 Test 3: Test de la liaison contrats-employés...');
      try {
        const contratsAvecNoms = results.contrats.map(contrat => {
          const employee = results.employees.find(emp => emp.id === contrat.employee_id);
          return {
            ...contrat,
            nom_employe: employee ? employee.nom_prenom : 'Nom non défini'
          };
        });
        
        results.contratsAvecNoms = contratsAvecNoms;
        
        // Vérifier la qualité de la liaison
        const contratsAvecNomsReels = contratsAvecNoms.filter(c => c.nom_employe !== 'Nom non défini');
        const contratsSansNoms = contratsAvecNoms.filter(c => c.nom_employe === 'Nom non défini');
        
        if (contratsAvecNomsReels.length > 0) {
          results.success.push(`✅ ${contratsAvecNomsReels.length} contrats ont des noms d'employés valides`);
        }
        
        if (contratsSansNoms.length > 0) {
          results.warnings.push(`⚠️ ${contratsSansNoms.length} contrats n'ont pas de noms d'employés (employee_id manquant ou invalide)`);
          
          // Analyser pourquoi certains contrats n'ont pas de noms
          contratsSansNoms.forEach(contrat => {
            if (!contrat.employee_id) {
              results.errors.push(`❌ Contrat ${contrat.id}: Pas d'employee_id`);
            } else {
              const employeeExists = results.employees.find(emp => emp.id === contrat.employee_id);
              if (!employeeExists) {
                results.errors.push(`❌ Contrat ${contrat.id}: employee_id ${contrat.employee_id} ne correspond à aucun employé`);
              }
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de la liaison:', error);
        results.errors.push(`❌ Erreur lors de la liaison: ${error.message}`);
      }
    }

    // Test 4: Vérification de la base de données
    if (results.errors.length === 0 && results.warnings.length === 0) {
      results.success.push('🎉 Tous les tests sont passés avec succès !');
    }

    setDiagnostic(results);
    setIsLoading(false);
  };

  const clearDiagnostic = () => {
    setDiagnostic({
      contrats: null,
      employees: null,
      contratsAvecNoms: null,
      errors: [],
      warnings: [],
      success: []
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>🔍 Diagnostic : Affichage des Noms des Employés</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runDiagnostic}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isLoading ? 'Diagnostic en cours...' : 'Lancer le Diagnostic'}
        </button>
        
        <button 
          onClick={clearDiagnostic}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Effacer
        </button>
        
        <button 
          onClick={() => setShowDetails(!showDetails)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: showDetails ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          {showDetails ? 'Masquer Détails' : 'Afficher Détails'}
        </button>
      </div>

      {/* Résultats du diagnostic */}
      {diagnostic.success.length > 0 && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #c3e6cb',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#155724', marginTop: 0 }}>✅ Succès</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {diagnostic.success.map((msg, index) => (
              <li key={index} style={{ color: '#155724' }}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {diagnostic.warnings.length > 0 && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #ffeaa7',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#856404', marginTop: 0 }}>⚠️ Avertissements</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {diagnostic.warnings.map((msg, index) => (
              <li key={index} style={{ color: '#856404' }}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {diagnostic.errors.length > 0 && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #f5c6cb',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#721c24', marginTop: 0 }}>❌ Erreurs</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {diagnostic.errors.map((msg, index) => (
              <li key={index} style={{ color: '#721c24' }}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Détails des données */}
      {showDetails && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #dee2e6',
          marginBottom: '20px'
        }}>
          <h4>📊 Détails des Données</h4>
          
          {diagnostic.contrats && (
            <div style={{ marginBottom: '15px' }}>
              <h5>📋 Contrats ({diagnostic.contrats.length})</h5>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '10px', 
                borderRadius: '3px',
                border: '1px solid #e9ecef',
                fontSize: '12px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <pre>{JSON.stringify(diagnostic.contrats.slice(0, 3), null, 2)}</pre>
                {diagnostic.contrats.length > 3 && (
                  <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                    ... et {diagnostic.contrats.length - 3} autres contrats
                  </p>
                )}
              </div>
            </div>
          )}

          {diagnostic.employees && (
            <div style={{ marginBottom: '15px' }}>
              <h5>👥 Employés ({diagnostic.employees.length})</h5>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '10px', 
                borderRadius: '3px',
                border: '1px solid #e9ecef',
                fontSize: '12px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <pre>{JSON.stringify(diagnostic.employees.slice(0, 3), null, 2)}</pre>
                {diagnostic.employees.length > 3 && (
                  <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                    ... et {diagnostic.employees.length - 3} autres employés
                  </p>
                )}
              </div>
            </div>
          )}

          {diagnostic.contratsAvecNoms && (
            <div>
              <h5>🔗 Contrats avec Noms ({diagnostic.contratsAvecNoms.length})</h5>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '10px', 
                borderRadius: '3px',
                border: '1px solid #e9ecef',
                fontSize: '12px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <pre>{JSON.stringify(diagnostic.contratsAvecNoms.slice(0, 3), null, 2)}</pre>
                {diagnostic.contratsAvecNoms.length > 3 && (
                  <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                    ... et {diagnostic.contratsAvecNoms.length - 3} autres contrats
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions de résolution */}
      <div style={{ 
        backgroundColor: '#e9ecef', 
        padding: '15px', 
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h4>📋 Instructions de Résolution</h4>
        <ol>
          <li><strong>Lancer le diagnostic:</strong> Cliquez sur "Lancer le Diagnostic" pour identifier les problèmes</li>
          <li><strong>Analyser les erreurs:</strong> Regardez les erreurs et avertissements affichés</li>
          <li><strong>Vérifier les données:</strong> Utilisez "Afficher Détails" pour voir la structure des données</li>
          <li><strong>Résoudre les problèmes:</strong> Suivez les recommandations pour corriger les erreurs</li>
        </ol>
      </div>

      {/* Solutions recommandées */}
      <div style={{ 
        backgroundColor: '#d1ecf1', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #bee5eb',
        marginBottom: '20px'
      }}>
        <h4>💡 Solutions Recommandées</h4>
        <ul>
          <li><strong>Si l'API des contrats ne retourne pas employee_id:</strong> Vérifiez la route backend <code>/api/contrats</code></li>
          <li><strong>Si l'API des employés ne retourne pas nom_prenom:</strong> Vérifiez la route backend <code>/api/employees</code></li>
          <li><strong>Si les employee_id ne correspondent pas:</strong> Vérifiez la cohérence des données en base</li>
          <li><strong>Si les services frontend échouent:</strong> Vérifiez la configuration de l'API et l'authentification</li>
        </ul>
      </div>

      {/* Vérifications manuelles */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #ffeaa7'
      }}>
        <h4>🔍 Vérifications Manuelles</h4>
        <p>En plus du diagnostic automatique, vérifiez manuellement :</p>
        <ol>
          <li><strong>Console du navigateur:</strong> Regardez les erreurs et les requêtes réseau</li>
          <li><strong>Onglet Network:</strong> Vérifiez que les appels API retournent bien des données</li>
          <li><strong>Base de données:</strong> Vérifiez que les tables contrats et employees ont les bonnes données</li>
          <li><strong>Backend:</strong> Vérifiez que le serveur backend fonctionne et que les routes sont correctes</li>
        </ol>
      </div>
    </div>
  );
};

export default DiagnosticNomsEmployes;
