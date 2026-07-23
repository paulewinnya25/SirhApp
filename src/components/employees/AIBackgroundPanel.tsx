import React, { useState, useEffect } from 'react';
import './AIBackgroundPanel.css';

const AIBackgroundPanel = ({ isVisible, onClose, conversationHistory, currentQuery }: any) => {
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (isVisible) {
      generateAIInsights();
    }
  }, [isVisible, conversationHistory, currentQuery]);

  const generateAIInsights = async () => {
    setProcessingStatus('analyzing');
    
    // Simulation d'analyse IA avancée
    setTimeout(() => {
      const insights = [
        {
          id: 1,
          type: 'pattern',
          title: 'Motif de conversation détecté',
          content: 'L\'utilisateur semble intéressé par les politiques RH',
          confidence: 0.87,
          icon: '🔍'
        },
        {
          id: 2,
          type: 'recommendation',
          title: 'Suggestion intelligente',
          content: 'Consultez la section "Notes de service" pour les dernières mises à jour',
          confidence: 0.92,
          icon: '💡'
        },
        {
          id: 3,
          type: 'prediction',
          title: 'Prédiction comportementale',
          content: 'Probabilité élevée de demande de congés dans les 7 prochains jours',
          confidence: 0.78,
          icon: '🔮'
        }
      ];

      const recommendations = [
        {
          id: 1,
          action: 'Consulter les événements à venir',
          reason: 'Basé sur votre historique de participation',
          priority: 'high',
          icon: '📅'
        },
        {
          id: 2,
          action: 'Vérifier vos documents RH',
          reason: 'Certains documents nécessitent une mise à jour',
          priority: 'medium',
          icon: '📄'
        },
        {
          id: 3,
          action: 'Planifier une formation',
          reason: 'Nouvelles formations disponibles dans votre domaine',
          priority: 'low',
          icon: '🎓'
        }
      ];

      setAiInsights(insights);
      setAiRecommendations(recommendations);
      setProcessingStatus('completed');
    }, 2000);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="ai-background-panel">
      <div className="ai-panel-overlay" onClick={onClose}></div>
      
      <div className="ai-panel-content">
        <div className="ai-panel-header">
          <div className="ai-panel-title">
            <span className="ai-icon">🧠</span>
            <h3>IA Wally - Analyse en Temps Réel</h3>
          </div>
          <button className="ai-close-btn" onClick={onClose}>
            <span>×</span>
          </button>
        </div>

        <div className="ai-panel-body">
          {/* Statut de traitement */}
          <div className="ai-status-section">
            <div className={`ai-status-indicator ${processingStatus}`}>
              <div className="status-spinner"></div>
              <span className="status-text">
                {processingStatus === 'analyzing' && 'Analyse en cours...'}
                {processingStatus === 'completed' && 'Analyse terminée'}
                {processingStatus === 'idle' && 'En attente'}
              </span>
            </div>
          </div>

          {/* Insights IA */}
          <div className="ai-insights-section">
            <h4 className="section-title">
              <span className="section-icon">🔍</span>
              Insights IA
            </h4>
            
            <div className="insights-grid">
              {aiInsights.map((insight) => (
                <div key={insight.id} className="insight-card">
                  <div className="insight-header">
                    <span className="insight-icon">{insight.icon}</span>
                    <div className="insight-meta">
                      <h5>{insight.title}</h5>
                      <div className={`confidence-badge ${getConfidenceColor(insight.confidence)}`}>
                        {Math.round(insight.confidence * 100)}% confiance
                      </div>
                    </div>
                  </div>
                  <p className="insight-content">{insight.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommandations IA */}
          <div className="ai-recommendations-section">
            <h4 className="section-title">
              <span className="section-icon">💡</span>
              Recommandations Personnalisées
            </h4>
            
            <div className="recommendations-list">
              {aiRecommendations.map((rec) => (
                <div key={rec.id} className={`recommendation-item ${getPriorityColor(rec.priority)}`}>
                  <div className="recommendation-icon">{rec.icon}</div>
                  <div className="recommendation-content">
                    <h5>{rec.action}</h5>
                    <p>{rec.reason}</p>
                  </div>
                  <div className="recommendation-priority">
                    <span className={`priority-badge ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métriques de conversation */}
          <div className="ai-metrics-section">
            <h4 className="section-title">
              <span className="section-icon">📊</span>
              Métriques de Conversation
            </h4>
            
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{conversationHistory.length}</div>
                <div className="metric-label">Messages échangés</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">87%</div>
                <div className="metric-label">Satisfaction IA</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">2.3s</div>
                <div className="metric-label">Temps de réponse moyen</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">15</div>
                <div className="metric-label">Sujets abordés</div>
              </div>
            </div>
          </div>

          {/* Analyse comportementale */}
          <div className="ai-behavior-section">
            <h4 className="section-title">
              <span className="section-icon">🎯</span>
              Analyse Comportementale
            </h4>
            
            <div className="behavior-analysis">
              <div className="behavior-item">
                <div className="behavior-label">Niveau d'engagement</div>
                <div className="behavior-bar">
                  <div className="behavior-fill" style={{ width: '85%' }}></div>
                </div>
                <span className="behavior-value">85%</span>
              </div>
              
              <div className="behavior-item">
                <div className="behavior-label">Complexité des questions</div>
                <div className="behavior-bar">
                  <div className="behavior-fill" style={{ width: '62%' }}></div>
                </div>
                <span className="behavior-value">62%</span>
              </div>
              
              <div className="behavior-item">
                <div className="behavior-label">Satisfaction utilisateur</div>
                <div className="behavior-bar">
                  <div className="behavior-fill" style={{ width: '92%' }}></div>
                </div>
                <span className="behavior-value">92%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ai-panel-footer">
          <div className="ai-footer-info">
            <span className="ai-version">IA Wally v2.0</span>
            <span className="ai-status">En ligne</span>
          </div>
          <div className="ai-footer-actions">
            <button className="ai-action-btn" onClick={generateAIInsights}>
              <span>🔄</span> Actualiser
            </button>
            <button className="ai-action-btn">
              <span>⚙️</span> Paramètres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIBackgroundPanel;