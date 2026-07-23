import React, { useState, useEffect, useRef } from 'react';
import './ModernVoiceAssistant.css';

const ControlledVoiceAssistant = ({ onClose }: any) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('ready');
  const [message, setMessage] = useState('Assistant vocal contrôlé - Cliquez pour commencer');
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any[]>([]);
  
  const recognitionRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = { timestamp, message, type };
    setLogs(prev => [...prev, newLog]);
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    addLog('🔍 Composant ControlledVoiceAssistant monté');
    
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
      addLog('🔍 Composant ControlledVoiceAssistant démonté');
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
      
      // Configuration SIMPLIFIÉE et contrôlée
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
        
        // Ajouter à la conversation
        const userMessage = {
          id: Date.now(),
          type: 'user',
          text: transcript,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setConversation(prev => [...prev, userMessage]);
        
        setMessage(`🎯 Reçu: "${transcript}"`);
        setStatus('result');
        
        // Traiter la commande et générer une réponse
        processCommand(transcript);
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
        
        // IMPORTANT : NE PAS redémarrer automatiquement
        // L'utilisateur doit cliquer manuellement pour recommencer
        setStatus('ready');
        setMessage('Assistant vocal contrôlé - Cliquez pour recommencer');
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
        addLog('🛑 Arrêt manuel de l\'écoute...');
      }
    } catch (error) {
      addLog(`💥 Erreur lors de l'arrêt: ${error.message}`, 'error');
    }
  };

  const processCommand = (command) => {
    addLog(`🧠 Traitement de la commande: "${command}"`);
    
    // Simuler une réponse intelligente
    let response = '';
    
    if (command.toLowerCase().includes('bonjour') || command.toLowerCase().includes('salut')) {
      response = "Bonjour ! Comment puis-je vous aider aujourd'hui ?";
    } else if (command.toLowerCase().includes('congé') || command.toLowerCase().includes('vacance')) {
      response = "Pour vos congés, je peux vous expliquer la procédure. Avez-vous une date spécifique en tête ?";
    } else if (command.toLowerCase().includes('salaire') || command.toLowerCase().includes('paie')) {
      response = "Concernant votre salaire, je peux vous donner des informations sur la structure de rémunération. Que souhaitez-vous savoir exactement ?";
    } else if (command.toLowerCase().includes('formation') || command.toLowerCase().includes('apprentissage')) {
      response = "Pour la formation, nous avons plusieurs programmes disponibles. Quel domaine vous intéresse ?";
    } else if (command.toLowerCase().includes('merci')) {
      response = "Je vous en prie ! C'est un plaisir de vous aider. Y a-t-il autre chose ?";
    } else if (command.toLowerCase().includes('au revoir') || command.toLowerCase().includes('bye')) {
      response = "Au revoir ! N'hésitez pas à revenir si vous avez d'autres questions. Bonne journée !";
    } else {
      response = `J'ai bien compris votre demande : "${command}". Laissez-moi vous aider avec cela. Pouvez-vous me donner plus de détails ?`;
    }
    
    // Ajouter la réponse à la conversation
    const assistantMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      text: response,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    setConversation(prev => [...prev, assistantMessage]);
    
    setMessage(response);
    setStatus('ready');
    
    addLog(`💬 Réponse générée: "${response}"`);
  };

  const resetAssistant = () => {
    addLog('🔄 Réinitialisation de l\'assistant...');
    setStatus('ready');
    setMessage('Assistant vocal contrôlé - Cliquez pour commencer');
    setError(null);
    setIsListening(false);
    setLogs([]);
    setConversation([]);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 Logs effacés');
  };

  const clearConversation = () => {
    setConversation([]);
    addLog('🧹 Conversation effacée');
  };

  return (
    <div className="controlled-voice-assistant">
      <div className="test-header">
        <h2>🎤 Assistant Vocal Contrôlé</h2>
        <p>Version avec contrôle manuel complet - Pas de redémarrage automatique</p>
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
          onClick={clearConversation}
          className="test-button reset"
        >
          💬 Effacer Conversation
        </button>

        <button 
          onClick={onClose}
          className="test-button close"
        >
          ❌ Fermer
        </button>
      </div>

      {/* Section de conversation */}
      {conversation.length > 0 && (
        <div className="conversation-section">
          <h3>💬 Conversation ({conversation.length} messages)</h3>
          <div className="conversation-content" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {conversation.map((msg) => (
              <div key={msg.id} className={`conversation-message ${msg.type}`} style={{
                marginBottom: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: msg.type === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                borderLeft: `3px solid ${msg.type === 'user' ? '#3b82f6' : '#22c55e'}`
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {msg.type === 'user' ? '👤 Vous' : '🤖 Wally'}
                </div>
                <div>{msg.text}</div>
                <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                  {msg.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="test-info">
        <h3>📋 Informations de test</h3>
        <ul>
          <li><strong>Navigateur:</strong> {navigator.userAgent}</li>
          <li><strong>Reconnaissance vocale:</strong> {'webkitSpeechRecognition' in window || 'SpeechRecognition' in window ? '✅ Disponible' : '❌ Non disponible'}</li>
          <li><strong>HTTPS:</strong> {window.location.protocol === 'https:' ? '✅ Sécurisé' : '⚠️ Non sécurisé'}</li>
          <li><strong>État actuel:</strong> {status}</li>
          <li><strong>Écoute active:</strong> {isListening ? '✅ Oui' : '❌ Non'}</li>
          <li><strong>Messages dans la conversation:</strong> {conversation.length}</li>
        </ul>
      </div>

      <div className="test-logs">
        <h3>📝 Logs détaillés ({logs.length} entrées)</h3>
        <div className="log-content" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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

export default ControlledVoiceAssistant;










