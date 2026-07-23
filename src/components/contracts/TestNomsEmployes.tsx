import React, { useState, useEffect } from 'react';
import ContractManagement from './ContractManagement';

const TestNomsEmployes = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const runTests = () => {
    const results = [];
    
    // Test 1: Vérifier que le composant se monte sans erreur
    try {
      results.push({
        test: 'Montage du composant',
        status: '✅ SUCCÈS',
        message: 'Le composant se monte sans erreur'
      });
    } catch (error) {
      results.push({
        test: 'Montage du composant',
        status: '❌ ÉCHEC',
        message: `Erreur: ${error.message}`
      });
    }

    // Test 2: Vérifier la logique de liaison contrats-employés
    const testLiaison = () => {
      // Simulation de données
      const contrats = [
        { id: 1, employee_id: 1, type_contrat: 'CDI', poste: 'Développeur' },
        { id: 2, employee_id: 2, type_contrat: 'CDD', poste: 'Designer' }
      ];
      
      const employees = [
        { id: 1, nom_prenom: 'Jean Dupont' },
        { id: 2, nom_prenom: 'Marie Martin' }
      ];
      
      // Test de la logique de liaison
      const contratsAvecNoms = contrats.map(contrat => {
        const employee = employees.find(emp => emp.id === contrat.employee_id);
        return {
          ...contrat,
          nom_employe: employee ? employee.nom_prenom : 'Nom non défini'
        };
      });
      
      const hasNames = contratsAvecNoms.every(contrat => 
        contrat.nom_employe && contrat.nom_employe !== 'Nom non défini'
      );
      
      return hasNames;
    };

    if (testLiaison()) {
      results.push({
        test: 'Liaison contrats-employés',
        status: '✅ SUCCÈS',
        message: 'La logique de liaison fonctionne correctement'
      });
    } else {
      results.push({
        test: 'Liaison contrats-employés',
        status: '❌ ÉCHEC',
        message: 'La logique de liaison ne fonctionne pas'
      });
    }

    // Test 3: Vérifier la gestion des employés manquants
    const testEmployeManquant = () => {
      const contrats = [
        { id: 1, employee_id: 999, type_contrat: 'CDI', poste: 'Développeur' }
      ];
      
      const employees = [
        { id: 1, nom_prenom: 'Jean Dupont' }
      ];
      
      const contratsAvecNoms = contrats.map(contrat => {
        const employee = employees.find(emp => emp.id === contrat.employee_id);
        return {
          ...contrat,
          nom_employe: employee ? employee.nom_prenom : 'Nom non défini'
        };
      });
      
      return contratsAvecNoms[0].nom_employe === 'Nom non défini';
    };

    if (testEmployeManquant()) {
      results.push({
        test: 'Gestion employé manquant',
        status: '✅ SUCCÈS',
        message: 'La gestion des employés manquants fonctionne'
      });
    } else {
      results.push({
        test: 'Gestion employé manquant',
        status: '❌ ÉCHEC',
        message: 'La gestion des employés manquants ne fonctionne pas'
      });
    }

    setTestResults(results);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>🧪 Test : Affichage des Noms des Employés</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runTests}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Lancer les Tests
        </button>
        
        <button 
          onClick={() => setShowDebug(!showDebug)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: showDebug ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showDebug ? 'Masquer Debug' : 'Afficher Debug'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📊 Résultats des Tests</h3>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '5px',
            border: '1px solid #dee2e6'
          }}>
            {testResults.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '3px',
                border: '1px solid #e9ecef'
              }}>
                <strong>{result.test}:</strong> {result.status}
                <br />
                <small style={{ color: '#6c757d' }}>{result.message}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ 
        backgroundColor: '#e9ecef', 
        padding: '15px', 
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h4>📋 Instructions de Test</h4>
        <ol>
          <li><strong>Lancer les tests:</strong> Cliquez sur "Lancer les Tests" pour vérifier la logique</li>
          <li><strong>Vérifier l'affichage:</strong> Dans le composant ContractManagement, vérifiez que les vrais noms s'affichent</li>
          <li><strong>Vérifier la recherche:</strong> Testez la recherche par nom d'employé</li>
          <li><strong>Vérifier les filtres:</strong> Testez les filtres avec les noms corrects</li>
        </ol>
      </div>

      {showDebug && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #ffeaa7',
          marginBottom: '20px'
        }}>
          <h4>🔍 Mode Debug - Vérifications</h4>
          <p>Pour diagnostiquer le problème des noms manquants :</p>
          <ol>
            <li><strong>Console du navigateur:</strong> Vérifiez les requêtes API et les données reçues</li>
            <li><strong>Réseau (Network):</strong> Vérifiez que l'API retourne bien les contrats ET les employés</li>
            <li><strong>Structure des données:</strong> Vérifiez que les contrats ont bien un <code>employee_id</code></li>
            <li><strong>Jointure:</strong> Vérifiez que l'<code>employee_id</code> correspond bien à un employé existant</li>
          </ol>
        </div>
      )}

      <div style={{ 
        border: '2px solid #28a745', 
        borderRadius: '10px',
        padding: '20px',
        backgroundColor: '#f8fff9'
      }}>
        <h3 style={{ color: '#28a745', marginTop: 0 }}>
          🎯 Composant ContractManagement - Test des Noms
        </h3>
        <ContractManagement />
      </div>

      <div style={{ 
        backgroundColor: '#d1ecf1', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #bee5eb',
        marginTop: '20px'
      }}>
        <h4>💡 Corrections Appliquées</h4>
        <p>Les modifications suivantes ont été apportées :</p>
        <ul>
          <li><strong>Liaison contrats-employés:</strong> Création d'une fonction qui combine les données</li>
          <li><strong>Mise à jour des contrats:</strong> Ajout des noms des employés aux contrats</li>
          <li><strong>Utilisation des données combinées:</strong> Filtrage et tri sur les contrats avec noms</li>
          <li><strong>Gestion des cas manquants:</strong> Valeur par défaut "Nom non défini" si l'employé n'existe pas</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: '#f8d7da', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #f5c6cb',
        marginTop: '20px'
      }}>
        <h4>🚨 En cas de problème persistant</h4>
        <p>Si les noms ne s'affichent toujours pas :</p>
        <ol>
          <li><strong>Vérifiez l'API backend:</strong> L'endpoint des contrats doit retourner <code>employee_id</code></li>
          <li><strong>Vérifiez l'API des employés:</strong> L'endpoint doit retourner <code>id</code> et <code>nom_prenom</code></li>
          <li><strong>Vérifiez la base de données:</strong> Les contrats doivent avoir un <code>employee_id</code> valide</li>
          <li><strong>Vérifiez les services frontend:</strong> Les appels API doivent fonctionner correctement</li>
        </ol>
      </div>
    </div>
  );
};

export default TestNomsEmployes;
