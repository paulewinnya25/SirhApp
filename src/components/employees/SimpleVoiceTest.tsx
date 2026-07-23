import React, { useState, useEffect, useRef } from 'react';
import './ModernVoiceAssistant.css';

const SimpleVoiceTest = ({ onClose }: any) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('ready');
  const [message, setMessage] = useState('Assistant vocal de test - Cliquez pour commencer');
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  const recognitionRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = { timestamp, message, type };
    setLogs(prev => [...prev, newLog]);
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    addLog('🔍 Composant SimpleVoiceTest monté');
    
    // Vérifier la disponibilité de la reconnaissance vocale
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      addLog('✅ Reconnaissance vocale disponible');
      setMessage('Reconnaissance vocale disponible - Cliquez pour tester');
    } else {
      addLog('❌ Reconnaissance vocale non disponible');
      setMessage('Reconnaissance vocale non disponible dans ce navigateur');
      setError('Navigateur non compatible');
    }

    return () => {
      addLog('🔍 Composant SimpleVoiceTest démonté');
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    try {
      addLog('🎤 Démarrage de l\'écoute...');
      setStatus('starting');
      setMessage('Démarrage de l\'écoute...');
      setError(null);

      // Créer une nouvelle instance de reconnaissance vocale
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configuration SIMPLIFIÉE
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.maxAlternatives = 1;

      // Gestionnaires d'événements
      recognitionRef.current.onstart = () => {
        addLog('✅ Écoute démarrée - onstart déclenché');
        setIsListening(true);
        setStatus('listening');
        setMessage('🎤 Écoute en cours... Parlez maintenant');
      };

      recognitionRef.current.onresult = (event) => {
        addLog('📝 Résultat reçu - onresult déclenché');
        
        const transcript = event.results[0][0].transcript;
        addLog(`🗣️ Transcription: "${transcript}"`);
        
        setMessage(`🎯 Reçu: "${transcript}"`);
        setStatus('result');
        
        // Simuler une réponse
        setTimeout(() => {
          const response = `J'ai bien reçu: "${transcript}". Test réussi !`;
          setMessage(response);
          setStatus('ready');
          
          // Redémarrer l'écoute après 2 secondes
          setTimeout(() => {
            if (status !== 'error') {
              startListening();
            }
          }, 2000);
        }, 1000);
      };

      recognitionRef.current.onerror = (event) => {
        addLog(`❌ Erreur: ${event.error}`, 'error');
        setError(`Erreur: ${event.error}`);
        setStatus('error');
        setMessage(`❌ Erreur: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        addLog('🛑 Écoute terminée - onend déclenché');
        setIsListening(false);
        
        if (status !== 'error') {
          setStatus('ready');
          setMessage('Assistant vocal de test - Cliquez pour recommencer');
        }
      };

      // Démarrer l'écoute
      recognitionRef.current.start();
      addLog('🚀 Méthode start() appelée');
      
    } catch (error) {
      addLog(`💥 Erreur lors du démarrage: ${error.message}`, 'error');
      setError(error.message);
      setStatus('error');
      setMessage(`💥 Erreur: ${error.message}`);
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        addLog('🛑 Arrêt de l\'écoute - stop() appelé');
      }
    } catch (error) {
      addLog(`💥 Erreur lors de l'arrêt: ${error.message}`, 'error');
    }
  };

  const resetAssistant = () => {
    addLog('🔄 Réinitialisation de l\'assistant...');
    setStatus('ready');
    setMessage('Assistant vocal de test - Cliquez pour commencer');
    setError(null);
    setIsListening(false);
    setLogs([]);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 Logs effacés');
  };

  return (
    <div className="simple-voice-test">
      <div className="test-header">
        <h2>🧪 Test Simple Assistant Vocal</h2>
        <p>Version simplifiée sans fonctionnalités complexes</p>
      </div>

      <div className="test-status">
        <div className={`status-indicator ${status}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {status === 'ready' && '🟢 Prêt'}
            {status === 'starting' && '🟡 Démarrage...'}
            {status === 'listening' && '🔴 Écoute...'}
            {status === 'result' && '🟢 Résultat reçu'}
            {status === 'error' && '🔴 Erreur'}
          </span>
        </div>
      </div>

      <div className="test-message">
        <p>{message}</p>
        {error && (
          <div className="error-message">
            <strong>Erreur:</strong> {error}
          </div>
        )}
      </div>

      <div className="test-controls">
        <button 
          onClick={startListening}
          disabled={isListening || status === 'starting'}
          className="test-button start"
        >
          {isListening ? '🎤 Écoute...' : '🎤 Démarrer l\'écoute'}
        </button>

        <button 
          onClick={stopListening}
          disabled={!isListening}
          className="test-button stop"
        >
          🛑 Arrêter
        </button>

        <button 
          onClick={resetAssistant}
          className="test-button reset"
        >
          🔄 Réinitialiser
        </button>

        <button 
          onClick={clearLogs}
          className="test-button reset"
        >
          🧹 Effacer Logs
        </button>

        <button 
          onClick={onClose}
          className="test-button close"
        >
          ❌ Fermer
        </button>
      </div>

      <div className="test-info">
        <h3>📋 Informations de test</h3>
        <ul>
          <li><strong>Navigateur:</strong> {navigator.userAgent}</li>
          <li><strong>Reconnaissance vocale:</strong> {'webkitSpeechRecognition' in window || 'SpeechRecognition' in window ? '✅ Disponible' : '❌ Non disponible'}</li>
          <li><strong>HTTPS:</strong> {window.location.protocol === 'https:' ? '✅ Sécurisé' : '⚠️ Non sécurisé'}</li>
          <li><strong>État actuel:</strong> {status}</li>
          <li><strong>Écoute active:</strong> {isListening ? '✅ Oui' : '❌ Non'}</li>
        </ul>
      </div>

      <div className="test-logs">
        <h3>📝 Logs détaillés ({logs.length} entrées)</h3>
        <div className="log-content" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <p>Aucun log pour le moment. Commencez par tester l'assistant.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '8px', 
                padding: '4px 8px', 
                backgroundColor: log.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                borderRadius: '4px',
                borderLeft: `3px solid ${log.type === 'error' ? '#ef4444' : '#3b82f6'}`
              }}>
                <strong>[{log.timestamp}]</strong> {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleVoiceTest;










