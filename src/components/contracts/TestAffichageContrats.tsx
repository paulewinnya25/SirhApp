import React, { useState, useEffect } from 'react';
import { contratService, employeeService } from '../../services/api';

const TestAffichageContrats = () => {
  const [contrats, setContrats] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [contratsAvecNoms, setContratsAvecNoms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Début de la récupération des données...');

        // 1. Récupérer les contrats
        console.log('📋 Récupération des contrats...');
        const contratsData = await contratService.getAll();
        console.log('✅ Contrats récupérés:', contratsData);
        setContrats(contratsData);

        // 2. Récupérer les employés
        console.log('👥 Récupération des employés...');
        const employeesData = await employeeService.getAll();
        console.log('✅ Employés récupérés:', employeesData);
        setEmployees(employeesData);

        // 3. Lier les contrats avec les noms des employés
        console.log('🔗 Liaison contrats-employés...');
        const contratsLies = contratsData.map(contrat => {
          const employee = employeesData.find(emp => emp.id === contrat.employee_id);
          return {
            ...contrat,
            nom_employe: employee ? employee.nom_prenom : 'Employé non trouvé',
            poste: contrat.poste || 'Poste non défini',
            date_fin: contrat.date_fin || 'Date fin non définie',
            service: contrat.service || 'Service non défini'
          };
        });
        console.log('✅ Contrats liés:', contratsLies);
        setContratsAvecNoms(contratsLies);

      } catch (err) {
        console.error('❌ Erreur lors de la récupération:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>🔄 Chargement en cours...</h3>
        <p>Récupération des contrats et employés...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h3>❌ Erreur</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>🔍 Test d'Affichage des Contrats</h2>
      
      {/* Résumé des données */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #90caf9',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: '#1565c0', marginTop: 0 }}>📊 Résumé des Données</h4>
        <p style={{ color: '#1565c0', margin: 0 }}>
          <strong>Contrats récupérés:</strong> {contrats.length} <br />
          <strong>Employés récupérés:</strong> {employees.length} <br />
          <strong>Contrats avec noms:</strong> {contratsAvecNoms.length}
        </p>
      </div>

      {/* Aperçu des premiers contrats */}
      <div style={{ marginBottom: '20px' }}>
        <h3>📋 Aperçu des 5 Premiers Contrats</h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <pre style={{ 
            backgroundColor: 'white', 
            padding: '10px', 
            borderRadius: '3px',
            border: '1px solid #dee2e6',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(contratsAvecNoms.slice(0, 5), null, 2)}
          </pre>
        </div>
      </div>

      {/* Tableau des contrats */}
      <div style={{ marginBottom: '20px' }}>
        <h3>📊 Tableau des Contrats (Premiers 10)</h3>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '5px',
          border: '1px solid #dee2e6',
          overflow: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Nom Employé</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Type Contrat</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Poste</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Service</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Date Début</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Date Fin</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {contratsAvecNoms.slice(0, 10).map((contrat) => (
                <tr key={contrat.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{contrat.id}</td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                    <strong>{contrat.nom_employe}</strong>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{contrat.type_contrat}</td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{contrat.poste}</td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{contrat.service}</td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                    {contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                    {contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                    <span style={{ 
                      backgroundColor: contrat.statut === 'Actif' ? '#d4edda' : '#f8d7da',
                      color: contrat.statut === 'Actif' ? '#155724' : '#721c24',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {contrat.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnostic des problèmes potentiels */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #ffeaa7',
        marginTop: '20px'
      }}>
        <h4 style={{ color: '#856404', marginTop: 0 }}>🔍 Diagnostic des Problèmes</h4>
        <ul style={{ color: '#856404', margin: 0, paddingLeft: '20px' }}>
          <li><strong>Si le tableau est vide :</strong> Problème de liaison contrats-employés</li>
          <li><strong>Si les noms sont "Employé non trouvé" :</strong> Problème de correspondance des IDs</li>
          <li><strong>Si les contrats s'affichent ici mais pas dans ContractManagement :</strong> Problème dans le composant principal</li>
          <li><strong>Si les dates sont "N/A" :</strong> Problème de format des dates</li>
        </ul>
      </div>

      {/* Instructions de test */}
      <div style={{ 
        backgroundColor: '#d1ecf1', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #bee5eb',
        marginTop: '20px'
      }}>
        <h4 style={{ color: '#0c5460', marginTop: 0 }}>📋 Instructions de Test</h4>
        <ol style={{ color: '#0c5460', margin: 0, paddingLeft: '20px' }}>
          <li><strong>Vérifiez la console :</strong> Regardez les logs de récupération des données</li>
          <li><strong>Vérifiez le tableau :</strong> Les contrats doivent s'afficher avec les noms des employés</li>
          <li><strong>Comparez avec ContractManagement :</strong> Si ça marche ici mais pas là-bas, le problème est dans le composant principal</li>
          <li><strong>Vérifiez les erreurs :</strong> Regardez s'il y a des erreurs JavaScript</li>
        </ol>
      </div>

      {/* Bouton de rafraîchissement */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Rafraîchir les Données
        </button>
      </div>
    </div>
  );
};

export default TestAffichageContrats;
