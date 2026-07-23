import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RH_KNOWLEDGE_BASE, AGENT_UTILS } from '../../data/rhKnowledgeBase';
import elevenLabsService from '../../services/elevenLabsService';
import aiService from '../../services/aiService';
import './ModernVoiceAssistant.css';

const ModernVoiceAssistantFixed = ({ user, onClose }: any) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentStatus, setAgentStatus] = useState('ready');
  const [elevenLabsStatus, setElevenLabsStatus] = useState('checking');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentQuery, setCurrentQuery] = useState('');
  const [responseText, setResponseText] = useState('');
  const [showWaveform, setShowWaveform] = useState(false);
  const [waveformData, setWaveformData] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState('voice');
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialiser l'assistant moderne
  const initializeAssistant = useCallback(async () => {
    try {
      console.log('🚀 Initialisation de l\'assistant vocal...');
      
      // Vérifier ElevenLabs
      const configResult = await elevenLabsService.checkConfiguration();
      if (configResult.success) {
        setElevenLabsStatus('connected');
        console.log('🚀 Assistant moderne connecté à ElevenLabs');
      } else {
        setElevenLabsStatus('error');
        console.warn('⚠️ ElevenLabs non disponible, mode local activé');
      }

      // Configuration de la reconnaissance vocale CORRIGÉE
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        // Configuration SIMPLIFIÉE pour éviter les conflits
        recognitionRef.current.continuous = false;  // ❌ CHANGÉ : false au lieu de true
        recognitionRef.current.interimResults = false;  // ❌ CHANGÉ : false au lieu de true
        recognitionRef.current.lang = 'fr-FR';
        recognitionRef.current.maxAlternatives = 1;  // ❌ CHANGÉ : 1 au lieu de 3

        recognitionRef.current.onstart = () => {
          console.log('✅ Écoute démarrée');
          setIsListening(true);
          setAgentStatus('listening');
          setShowWaveform(true);
          startWaveformAnimation();
        };

        recognitionRef.current.onresult = (event) => {
          console.log('📝 Résultat reçu:', event);
          
          // Traitement SIMPLIFIÉ des résultats
          const transcript = event.results[0][0].transcript;
          console.log('🗣️ Transcription:', transcript);
          
          setCurrentQuery(transcript);
          
          // Traiter immédiatement la commande vocale
          handleVoiceCommand(transcript);
          
          // IMPORTANT : Ne pas arrêter l'écoute ici
          // L'assistant continuera d'écouter après avoir traité la commande
        };

        recognitionRef.current.onerror = (event) => {
          console.error('❌ Erreur de reconnaissance vocale:', event.error);
          
          // Gestion d'erreur AMÉLIORÉE
          if (event.error === 'no-speech') {
            console.log('🔄 Aucune parole détectée, redémarrage de l\'écoute...');
            // Redémarrer l'écoute après un délai PLUS LONG et seulement si pas déjà en cours
            setTimeout(() => {
              if (agentStatus !== 'error' && !isSpeaking && !isListening) {
                startListening();
              }
            }, 3000); // ✅ CHANGÉ : 3 secondes au lieu de 1
          } else if (event.error === 'audio-capture') {
            console.error('❌ Problème de capture audio');
            setAgentStatus('error');
          } else if (event.error === 'network') {
            console.error('❌ Erreur réseau');
            setAgentStatus('error');
          } else {
            console.error('❌ Erreur inconnue:', event.error);
            setAgentStatus('error');
          }
        };

        recognitionRef.current.onend = () => {
          console.log('🛑 Écoute terminée');
          setIsListening(false);
          setShowWaveform(false);
          stopWaveformAnimation();
          
          // Redémarrer automatiquement l'écoute APRÈS un délai PLUS LONG et seulement si pas déjà en cours
          if (agentStatus !== 'error' && !isSpeaking && !isListening) {
            setTimeout(() => {
              console.log('🔄 Redémarrage automatique de l\'écoute...');
              startListening();
            }, 5000); // ✅ CHANGÉ : 5 secondes au lieu de 2
          }
        };
      } else {
        console.warn('⚠️ Reconnaissance vocale non supportée dans ce navigateur');
        setAgentStatus('error');
      }

      // Initialiser l'audio context pour la visualisation
      initializeAudioContext();

      // Message de bienvenue SIMPLIFIÉ avec délai PLUS LONG
      setTimeout(() => {
        const welcomeMessage = "Bonjour, je suis Wally votre assistant RH. Que puis-je faire pour vous aujourd'hui ?";
        setResponseText(welcomeMessage);
        
        const welcomeChatMessage = {
          id: Date.now(),
          type: 'assistant',
          text: welcomeMessage,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages([welcomeChatMessage]);
        
        // Dire le message de bienvenue puis démarrer l'écoute APRÈS un délai PLUS LONG
        speakWithElevenLabs(welcomeMessage).then(() => {
          console.log('🎤 Démarrage de l\'écoute après message de bienvenue...');
          setTimeout(() => {
            startListening();
          }, 3000); // ✅ CHANGÉ : 3 secondes au lieu de 1
        });
      }, 2000); // ✅ CHANGÉ : 2 secondes au lieu de 1

    } catch (error) {
      console.error('💥 Erreur lors de l\'initialisation:', error);
      setElevenLabsStatus('error');
      setAgentStatus('error');
    }
  }, []);

  // Initialisation de l'assistant
  useEffect(() => {
    initializeAssistant();
    aiService.initialize(RH_KNOWLEDGE_BASE);
    return () => {
      cleanup();
    };
  }, [initializeAssistant]);

  // Initialiser le contexte audio pour la visualisation
  const initializeAudioContext = () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      setWaveformData(new Array(analyserRef.current.frequencyBinCount).fill(0));
    } catch (error) {
      console.warn('Contexte audio non disponible:', error);
    }
  };

  // Démarrer l'animation de la forme d'onde
  const startWaveformAnimation = () => {
    if (!analyserRef.current) return;

    const updateWaveform = () => {
      if (!isListening) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      setWaveformData(Array.from(dataArray));
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  };

  // Arrêter l'animation de la forme d'onde
  const stopWaveformAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Démarrer l'écoute CORRIGÉE
  const startListening = () => {
    // VÉRIFICATIONS ROBUSTES pour éviter l'erreur InvalidStateError
    if (!recognitionRef.current) {
      console.log('⚠️ Reconnaissance vocale non initialisée');
      return;
    }
    
    if (isListening) {
      console.log('⚠️ Écoute déjà en cours, impossible de redémarrer');
      return;
    }
    
    if (agentStatus === 'listening') {
      console.log('⚠️ Agent déjà en mode écoute, impossible de redémarrer');
      return;
    }
    
    if (isSpeaking) {
      console.log('⚠️ Assistant en train de parler, impossible de démarrer l\'écoute');
      return;
    }
    
    try {
      console.log('🎤 Démarrage de l\'écoute...');
      recognitionRef.current.start();
      setAgentStatus('listening');
    } catch (error) {
      console.error('Erreur lors du démarrage:', error);
      setAgentStatus('error');
    }
  };

  // Arrêter l'écoute CORRIGÉE
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        console.log('🛑 Arrêt manuel de l\'écoute...');
        recognitionRef.current.stop();
        setIsListening(false);
        setAgentStatus('ready');
        setShowWaveform(false);
        stopWaveformAnimation();
        setCurrentQuery('');
      } catch (error) {
        console.error('Erreur lors de l\'arrêt:', error);
      }
    }
  };

  // Basculer la reconnaissance vocale
  const toggleVoiceRecognition = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Traiter les commandes vocales CORRIGÉ
  const handleVoiceCommand = async (command) => {
    try {
      console.log('🧠 Traitement de la commande vocale:', command);
      setAgentStatus('processing');
      setIsProcessing(true);
      
      // Ajouter la commande au chat
      const userMessage = {
        id: Date.now(),
        type: 'user',
        text: command,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, userMessage]);
      
      // Traiter avec le service AI
      const aiResponse: any = await aiService.generateResponse(command, chatMessages);
      
      // Ajouter la réponse au chat
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: typeof aiResponse === 'string' ? aiResponse : aiResponse?.text,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Dire la réponse
      setResponseText(typeof aiResponse === 'string' ? aiResponse : aiResponse?.text);
      await speakWithElevenLabs(typeof aiResponse === 'string' ? aiResponse : aiResponse?.text);
      
      // IMPORTANT : Redémarrer l'écoute APRÈS un délai PLUS LONG et seulement si pas déjà en cours
      console.log('🔄 Redémarrage de l\'écoute après réponse...');
      setTimeout(() => {
        if (!isListening && !isSpeaking && agentStatus !== 'error') {
          startListening();
        }
      }, 4000); // ✅ CHANGÉ : 4 secondes au lieu de 1
      
    } catch (error) {
      console.error('❌ Erreur lors du traitement de la commande:', error);
      const errorMessage = "Désolé, j'ai rencontré une erreur. Pouvez-vous reformuler ?";
      setResponseText(errorMessage);
      
      // Redémarrer l'écoute même en cas d'erreur avec délai PLUS LONG et vérifications
      setTimeout(() => {
        if (!isListening && !isSpeaking && agentStatus !== 'error') {
          startListening();
        }
      }, 4000); // ✅ CHANGÉ : 4 secondes au lieu de 1
    } finally {
      setIsProcessing(false);
      setAgentStatus('ready');
    }
  };

  // Parler avec ElevenLabs ou fallback local
  const speakWithElevenLabs = async (text) => {
    return new Promise<void>((resolve) => {
      if (elevenLabsStatus === 'connected' && voiceEnabled) {
        try {
          setIsSpeaking(true);
          setAgentStatus('speaking');
          setResponseText(text);
          
          elevenLabsService.synthesizeText(text).then(audioResult => {
            if (audioResult.success) {
              const audioURL = elevenLabsService.createAudioURL(audioResult.audioBlob);
              const audio = new Audio(audioURL);
              
              audio.onended = () => {
                setIsSpeaking(false);
                setAgentStatus('ready');
                setResponseText('');
                elevenLabsService.cleanupAudioURL(audioURL);
                resolve();
              };
              
              audio.play();
            } else {
              speakLocally(text).then(() => {
                resolve();
              });
            }
          }).catch(error => {
            console.warn('Synthèse ElevenLabs échouée, fallback local');
            speakLocally(text).then(() => {
              resolve();
            });
          });
        } catch (error) {
          console.warn('Synthèse ElevenLabs échouée, fallback local');
          speakLocally(text).then(() => {
            resolve();
          });
        }
      } else {
        speakLocally(text).then(() => {
          resolve();
        });
      }
    });
  };

  // Synthèse vocale locale (fallback)
  const speakLocally = (text) => {
    return new Promise<void>((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        utterance.onstart = () => {
          setIsSpeaking(true);
          setAgentStatus('speaking');
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setAgentStatus('ready');
          resolve();
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          setAgentStatus('ready');
          resolve();
        };
        
        speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  // Nettoyer les ressources
  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Gérer le changement de mode de chat
  const handleChatModeChange = (mode) => {
    setChatMode(mode);
    if (mode === 'voice' && !isListening && agentStatus === 'ready') {
      startListening();
    } else if (mode === 'text' && isListening) {
      stopListening();
    }
  };

  // Gérer la soumission du chat textuel
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      setIsTyping(true);
      const aiResponse = await aiService.generateResponse(inputText, chatMessages);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur lors de la génération de la réponse:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="modern-voice-assistant">
      {/* Header moderne avec effet glassmorphism */}
      <div className="assistant-header">
        <div className="header-content">
          <div className="assistant-avatar">
            <div className="avatar-container">
              <div className="avatar-ring"></div>
              <div className="avatar-core">
                <span className="avatar-icon">🤖</span>
              </div>
            </div>
          </div>
          
          <div className="assistant-info">
            <h2 className="assistant-title">Assistant RH Moderne</h2>
            <p className="assistant-subtitle">Centre Diagnostic de Libreville</p>
            <div className="status-container">
              <div className={`status-pill ${agentStatus}`}>
                <span className="status-dot"></span>
                {agentStatus === 'ready' && 'Prêt'}
                {agentStatus === 'listening' && 'Écoute...'}
                {agentStatus === 'processing' && 'Traitement...'}
                {agentStatus === 'speaking' && 'Parle...'}
                {agentStatus === 'error' && 'Erreur'}
              </div>
            </div>
          </div>
        </div>
        
        <button className="close-button" onClick={onClose}>
          <span className="close-icon">×</span>
        </button>
      </div>

      {/* Contenu principal */}
      <div className="assistant-content">
        {/* Section de contrôle ultra-moderne */}
        <div className="control-section">
          <h2 className="control-title">🎤 Contrôle Vocal</h2>
          
          <div className="voice-controls">
            {/* Bouton vocal principal ultra-moderne */}
            <button
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={toggleVoiceRecognition}
              disabled={isProcessing || isSpeaking}
            >
              <span className="voice-icon">
                {isListening ? '🎤' : '🎤'}
              </span>
              <span className="voice-text">
                {isListening ? 'Arrêter l\'écoute' : 'Démarrer l\'écoute'}
              </span>
            </button>

            {/* Bouton de basculement du mode */}
            <button
              className={`mode-button ${chatMode === 'voice' ? 'active' : ''}`}
              onClick={() => handleChatModeChange(chatMode === 'voice' ? 'text' : 'voice')}
            >
              {chatMode === 'voice' ? '📝 Mode Texte' : '🎤 Mode Vocal'}
            </button>
          </div>
        </div>

        {/* Section de visualisation de la forme d'onde */}
        {showWaveform && (
          <div className="waveform-section">
            <h3 className="waveform-title">🎵 Activité Vocale</h3>
            <div className="waveform-container">
              {waveformData.map((value, index) => (
                <div
                  key={index}
                  className="waveform-bar"
                  style={{
                    height: `${(value / 255) * 100}%`,
                    backgroundColor: `hsl(${200 + (value / 255) * 60}, 70%, 60%)`
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Section d'affichage de la requête */}
        {currentQuery && (
          <div className="query-display">
            <h3 className="query-label">🎯 Requête Détectée</h3>
            <div className="query-text">{currentQuery}</div>
          </div>
        )}

        {/* Section d'affichage de la réponse */}
        {responseText && (
          <div className="response-display">
            <h3 className="response-label">💬 Réponse de Wally</h3>
            <div className="response-text">{responseText}</div>
          </div>
        )}

        {/* Section de chat */}
        <div className="chat-section">
          <div className="chat-header">
            <h3>💬 Conversation</h3>
            <div className="chat-mode-indicator">
              Mode: {chatMode === 'voice' ? '🎤 Vocal' : '📝 Texte'}
            </div>
          </div>

          {/* Messages du chat */}
          <div className="chat-messages">
            {chatMessages.map((message) => (
              <div key={message.id} className={`chat-message ${message.type}`}>
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  <div className="message-timestamp">{message.timestamp}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message assistant typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input textuel pour le mode texte */}
          {chatMode === 'text' && (
            <form onSubmit={handleChatSubmit} className="chat-input-form">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tapez votre message..."
                className="chat-input"
                disabled={isTyping}
              />
              <button type="submit" className="chat-submit" disabled={isTyping}>
                Envoyer
              </button>
            </form>
          )}
        </div>

        {/* Section d'aide */}
        <div className="help-section">
          <h3 className="help-title">💡 Comment utiliser Wally</h3>
          <div className="help-content">
            <div className="usage-tip">
              <h4>🎤 Mode Vocal</h4>
              <p>Cliquez sur le bouton microphone et parlez clairement. Wally vous écoutera et répondra vocalement.</p>
            </div>
            <div className="usage-tip">
              <h4>📝 Mode Texte</h4>
              <p>Utilisez le champ de texte pour taper vos questions et obtenir des réponses écrites.</p>
            </div>
            <div className="usage-tip">
              <h4>🔄 Conversation Continue</h4>
              <p>Wally reste en mode écoute et peut traiter plusieurs commandes consécutives.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernVoiceAssistantFixed;
