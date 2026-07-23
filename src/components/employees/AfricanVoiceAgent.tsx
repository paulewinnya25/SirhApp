import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RH_KNOWLEDGE_BASE, AGENT_UTILS } from '../../data/rhKnowledgeBase';
import elevenLabsService from '../../services/elevenLabsService';
import './AfricanVoiceAgent.css';

const AfricanVoiceAgent = ({ user, onClose }: any) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentStatus, setAgentStatus] = useState('ready'); // ready, listening, processing, speaking
  const [elevenLabsStatus, setElevenLabsStatus] = useState('checking'); // checking, connected, error
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const recognitionRef = useRef(null);

  // Initialisation de l'agent
  useEffect(() => {
    initializeAgent();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Initialiser l'agent vocal
  const initializeAgent = async () => {
    try {
      // Vérifier la connexion ElevenLabs
      const configResult = await elevenLabsService.checkConfiguration();
      if (configResult.success) {
        setElevenLabsStatus('connected');
        console.log('🎤 Agent Wally connecté à ElevenLabs');
      } else {
        setElevenLabsStatus('error');
        console.warn('⚠️ ElevenLabs non disponible, utilisation du mode local');
      }

      // Configuration de la reconnaissance vocale
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
                 recognitionRef.current.continuous = false;
         recognitionRef.current.interimResults = false;
         recognitionRef.current.lang = 'fr-FR';
         recognitionRef.current.maxAlternatives = 1;

                 recognitionRef.current.onstart = () => {
           setIsListening(true);
           setAgentStatus('listening');
         };

        recognitionRef.current.onresult = (event) => {
          const command = event.results[0][0].transcript;
          handleVoiceCommand(command);
        };

                 recognitionRef.current.onerror = (event) => {
           console.error('Erreur de reconnaissance vocale:', event.error);
           // Ne pas arrêter automatiquement en cas d'erreur
           if (event.error !== 'no-speech') {
             setIsListening(false);
             setAgentStatus('ready');
           }
         };

         recognitionRef.current.onend = () => {
           // Ne pas arrêter automatiquement, laisser l'utilisateur contrôler
           if (!isListening) {
             setIsListening(false);
             setAgentStatus('ready');
           }
         };
      }



    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'agent:', error);
      setElevenLabsStatus('error');
    }
  };

  // Parler avec ElevenLabs ou fallback local
  const speakWithElevenLabs = async (text) => {
    if (elevenLabsStatus === 'connected' && voiceEnabled) {
      try {
        setIsSpeaking(true);
        setAgentStatus('speaking');
        
        const audioResult = await elevenLabsService.synthesizeText(text);
        if (audioResult.success) {
          const audioURL = elevenLabsService.createAudioURL(audioResult.audioBlob);
          const audio = new Audio(audioURL);
          
          audio.onended = () => {
            setIsSpeaking(false);
            setAgentStatus('ready');
            elevenLabsService.cleanupAudioURL(audioURL);
          };
          
          audio.play();
        } else {
          // Fallback local
          speakLocally(text);
        }
      } catch (error) {
        console.warn('Synthèse ElevenLabs échouée, fallback local');
        speakLocally(text);
      }
    } else {
      speakLocally(text);
    }
  };

  // Synthèse vocale locale (fallback)
  const speakLocally = (text) => {
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
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  // Gérer les commandes vocales
  const handleVoiceCommand = async (command) => {
    setIsProcessing(true);
    setAgentStatus('processing');
    
    try {
             // Traiter la commande avec l'intelligence locale
       const response = await processCommandIntelligently(command);
      
      // Parler la réponse
      await speakWithElevenLabs(response.text);
      
      // Exécuter les actions si nécessaire
      if ((response as any).actions && (response as any).actions.length > 0) {
        executeActions((response as any).actions);
      }
      
         } catch (error) {
       console.error('Erreur lors du traitement de la commande:', error);
       const errorResponse = "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ?";
       speakWithElevenLabs(errorResponse);
     } finally {
      setIsProcessing(false);
      setAgentStatus('ready');
    }
  };

  // Traitement intelligent des commandes
  const processCommandIntelligently = async (command) => {
    const lowerCommand = command.toLowerCase();
    
    // Recherche dans la base de connaissances
    const knowledgeResult = AGENT_UTILS.searchKnowledge(command);
    if (knowledgeResult) {
      return formatKnowledgeResponse(knowledgeResult);
    }

    // Commandes de navigation
    if (lowerCommand.includes('tableau de bord') || lowerCommand.includes('accueil')) {
      return {
        text: "Je vous amène au tableau de bord. C'est votre espace de travail principal !",
        actions: [{ type: 'navigate', target: '/employee-portal' }]
      };
    }
    
    if (lowerCommand.includes('documents') || lowerCommand.includes('mes documents')) {
      return {
        text: "Je vous amène à vos documents. Vous y trouverez tous vos fichiers importants !",
        actions: [{ type: 'navigate', target: '/employee-portal/documents' }]
      };
    }
    
    if (lowerCommand.includes('demandes') || lowerCommand.includes('mes demandes')) {
      return {
        text: "Je vous amène à vos demandes. Suivez l'état de vos requêtes en temps réel !",
        actions: [{ type: 'navigate', target: '/employee-portal/requests' }]
      };
    }
    
    if (lowerCommand.includes('notes') || lowerCommand.includes('notes de service')) {
      return {
        text: "Je vous amène aux notes de service. Restez informé des dernières actualités !",
        actions: [{ type: 'navigate', target: '/employee-portal/notes' }]
      };
    }
    
    if (lowerCommand.includes('événements') || lowerCommand.includes('calendrier')) {
      return {
        text: "Je vous amène aux événements. Consultez le calendrier des activités !",
        actions: [{ type: 'navigate', target: '/employee-portal/events' }]
      };
    }
    
    if (lowerCommand.includes('sanctions') || lowerCommand.includes('mes sanctions')) {
      return {
        text: "Je vous amène à vos sanctions. Consultez votre dossier disciplinaire !",
        actions: [{ type: 'navigate', target: '/employee-portal/sanctions' }]
      };
    }
    
    if (lowerCommand.includes('profil') || lowerCommand.includes('mon profil')) {
      return {
        text: "Je vous amène à votre profil. Gérez vos informations personnelles !",
        actions: [{ type: 'navigate', target: '/employee-portal/profile' }]
      };
    }

    // Commandes d'information RH
    if (lowerCommand.includes('congé') || lowerCommand.includes('vacance')) {
      const conges = RH_KNOWLEDGE_BASE.politiques.conges;
      return {
        text: `Voici nos politiques de congés : ${conges.annuels}, ${conges.maladie}, ${conges.maternite}, ${conges.paternite}, et ${conges.formation}.`
      };
    }
    
    if (lowerCommand.includes('salaire') || lowerCommand.includes('rémunération')) {
      const remuneration = RH_KNOWLEDGE_BASE.politiques.remuneration;
      return {
        text: `Notre politique de rémunération inclut : ${remuneration.salaire}, ${remuneration.primes}, et ${remuneration.avantages}.`
      };
    }
    
    if (lowerCommand.includes('horaire') || lowerCommand.includes('travail')) {
      const horaires = RH_KNOWLEDGE_BASE.politiques.horaires;
      return {
        text: `Nos horaires de travail : ${horaires.standard}, ${horaires.pause}, et ${horaires.flexibilite}.`
      };
    }

    // Commandes sur les procédures RH
    if (lowerCommand.includes('pointage') || lowerCommand.includes('pointeuse')) {
      const pointage = RH_KNOWLEDGE_BASE.procedures.pointage;
      return {
        text: `Voici les informations sur le pointage : ${pointage.obligation}, ${pointage.utilisation}, ${pointage.cartes}, ${pointage.avantages}.`
      };
    }
    
    if (lowerCommand.includes('recrutement') || lowerCommand.includes('embauche')) {
      const recrutement = RH_KNOWLEDGE_BASE.procedures.recrutement;
      return {
        text: `Voici les informations sur le recrutement : ${recrutement.etapes}, ${recrutement.integration}, ${recrutement.documents}, ${recrutement.delai}.`
      };
    }
    
    if (lowerCommand.includes('paie') || lowerCommand.includes('paiement')) {
      const paie = RH_KNOWLEDGE_BASE.procedures.paie;
      return {
        text: `Voici les informations sur la paie : ${paie.periode}, ${paie.transmission}, ${paie.traitement}, ${paie.validation}, ${paie.paiement}.`
      };
    }
    
    if (lowerCommand.includes('discipline') || lowerCommand.includes('sanction')) {
      const discipline = RH_KNOWLEDGE_BASE.procedures.discipline;
      return {
        text: `Voici les informations sur la discipline : ${discipline.procedure}, ${discipline.sanctions}, ${discipline.transmission}.`
      };
    }
    
    if (lowerCommand.includes('formation') || lowerCommand.includes('santymed')) {
      const formation = RH_KNOWLEDGE_BASE.procedures.formation;
      return {
        text: `Voici les informations sur la formation : ${formation.reglementaire}, ${formation.santymed}, ${formation.continue}.`
      };
    }

    // Commandes de culture d'entreprise
    if (lowerCommand.includes('bonjour') || lowerCommand.includes('salut')) {
      const greeting = AGENT_UTILS.getRandomGreeting();
      const humor = AGENT_UTILS.getRandomHumor();
      return {
        text: `${greeting} ${humor}`
      };
    }
    
    if (lowerCommand.includes('aide') || lowerCommand.includes('que peux-tu faire')) {
      return {
        text: "Je suis Wally, votre assistant RH ! Je peux vous aider avec les politiques RH, la navigation dans le portail, les informations sur le Centre Diagnostic de Libreville, et bien plus encore. Dites-moi ce que vous souhaitez savoir !"
      };
    }
    
    if (lowerCommand.includes('merci') || lowerCommand.includes('au revoir')) {
      const encouragement = AGENT_UTILS.getRandomEncouragement();
      return {
        text: `De rien ! ${encouragement} N'hésitez pas si vous avez d'autres questions.`
      };
    }

    // Commande non reconnue
    return {
      text: "Je n'ai pas compris cette commande. Pouvez-vous reformuler ou dire 'aide' pour connaître mes fonctionnalités ? Je suis là pour vous aider avec tout ce qui concerne les ressources humaines du Centre Diagnostic de Libreville."
    };
  };

  // Formater les réponses de la base de connaissances
  const formatKnowledgeResponse = (knowledgeResult) => {
    switch (knowledgeResult.type) {
      case 'faq':
        return {
          text: `${knowledgeResult.question} : ${knowledgeResult.reponse}`
        };
      
      case 'politique':
        const policyData = knowledgeResult.data;
        let response = "Voici les informations sur cette politique : ";
        for (const [key, value] of Object.entries(policyData)) {
          response += `${key} : ${value}. `;
        }
        return { text: response };
      
      case 'service':
        return {
          text: `Le service ${knowledgeResult.service} : ${knowledgeResult.description}`
        };
      
      case 'formation':
        const formationData = knowledgeResult.data;
        let formationResponse = "Voici nos programmes de formation : ";
        for (const [key, value] of Object.entries(formationData)) {
          formationResponse += `${key} : ${value}. `;
        }
        return { text: formationResponse };
      
      case 'procedure':
        const procedureData = knowledgeResult.data;
        let procedureResponse = `Voici les informations sur la procédure ${knowledgeResult.categorie} : `;
        for (const [key, value] of Object.entries(procedureData)) {
          procedureResponse += `${key} : ${value}. `;
        }
        return { text: procedureResponse };
      
      default:
        return {
          text: "J'ai trouvé des informations pertinentes dans ma base de connaissances. Pouvez-vous préciser votre question ?"
        };
    }
  };

  // Exécuter les actions
  const executeActions = (actions) => {
    actions.forEach(action => {
      if (action.type === 'navigate') {
        setTimeout(() => {
          navigate(action.target);
        }, 2000); // Délai pour laisser le temps d'entendre la réponse
      } else if (action.type === 'logout') {
        setTimeout(() => {
          sessionStorage.removeItem('employeeUser');
          sessionStorage.removeItem('token');
          navigate('/EmployeeLogin');
        }, 2000);
      }
    });
  };



     // Démarrer l'écoute
   const startListening = () => {
     if (recognitionRef.current && agentStatus === 'ready') {
       try {
         recognitionRef.current.start();
         console.log('🎤 Démarrage de l\'écoute...');
       } catch (error) {
         console.error('Erreur lors du démarrage de l\'écoute:', error);
         setIsListening(false);
         setAgentStatus('ready');
       }
     }
   };

     // Arrêter l'écoute
   const stopListening = () => {
     if (recognitionRef.current && isListening) {
       try {
         recognitionRef.current.stop();
         setIsListening(false);
         setAgentStatus('ready');
         console.log('🛑 Arrêt de l\'écoute...');
       } catch (error) {
         console.error('Erreur lors de l\'arrêt de l\'écoute:', error);
       }
     }
   };

     // Basculer la reconnaissance vocale
   const toggleVoiceRecognition = () => {
     if (isListening) {
       console.log('🛑 Arrêt de la reconnaissance vocale...');
       stopListening();
     } else {
       console.log('🎤 Démarrage de la reconnaissance vocale...');
       startListening();
     }
   };

  return (
    <div className="african-voice-agent">
      <div className="agent-header">
        <div className="agent-avatar">
          <div className="avatar-circle">
            <span className="avatar-text">W</span>
          </div>
        </div>
        <div className="agent-info">
          <h3>Wally - Assistant RH Africain</h3>
          <p>Centre Diagnostic de Libreville</p>
          <div className="agent-status">
            <span className={`status-indicator ${agentStatus}`}>
              {agentStatus === 'ready' && '🟢 Prêt'}
              {agentStatus === 'listening' && '🔴 Écoute...'}
              {agentStatus === 'processing' && '🟡 Traitement...'}
              {agentStatus === 'speaking' && '🔵 Parle...'}
            </span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

             <div className="agent-content">

        <div className="controls-section">
          <div className="voice-controls">
                         <button
               className={`voice-btn ${isListening ? 'listening' : ''}`}
               onClick={toggleVoiceRecognition}
               disabled={agentStatus === 'speaking' || agentStatus === 'processing'}
             >
               {isListening ? '🛑' : '🎤'}
               {isListening ? ' Arrêter l\'écoute' : ' Commencer à parler'}
             </button>
            
            <button
              className="voice-btn secondary"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
            >
              {voiceEnabled ? '🔊' : '🔇'} {voiceEnabled ? 'Voix ON' : 'Voix OFF'}
            </button>
            

          </div>

          <div className="elevenlabs-status">
            <span className={`status-badge ${elevenLabsStatus}`}>
              {elevenLabsStatus === 'checking' && '🔄 Vérification...'}
              {elevenLabsStatus === 'connected' && '✅ ElevenLabs connecté'}
              {elevenLabsStatus === 'error' && '⚠️ Mode local'}
            </span>
          </div>
        </div>

                                   <div className="help-section">
            <h4>Guide d'utilisation de Wally</h4>
           <div className="commands-list">

             <div className="command-group">
               <h5>🧭 Navigation</h5>
               <p>"Tableau de bord", "Mes documents", "Mes demandes", "Notes de service"</p>
             </div>
             <div className="command-group">
               <h5>📋 Informations RH</h5>
               <p>"Congés", "Salaire", "Horaires", "Formation"</p>
             </div>
             <div className="command-group">
               <h5>⚙️ Procédures RH</h5>
               <p>"Pointage", "Recrutement", "Paie", "Discipline", "Formation Santymed"</p>
             </div>
             <div className="command-group">
               <h5>💬 Culture d'entreprise</h5>
               <p>"Bonjour", "Aide", "Que peux-tu faire ?"</p>
             </div>
           </div>
           
                       <div className="conseil-utilisation">
              <h5>
                💡 <span>Comment utiliser Wally</span>
              </h5>
              <p>
                1. Cliquez sur "🎤 Commencer à parler" pour activer le microphone<br/>
                2. Posez votre question RH (ex: "Quels sont mes congés ?")<br/>
                3. Attendez la réponse de Wally<br/>
                4. Cliquez sur "🛑 Arrêter l'écoute" quand vous avez fini
              </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AfricanVoiceAgent;
