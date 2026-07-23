class WebSocketService {
  socket: any;
  isConnected: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  listeners: any;

  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.listeners = new Map();
  }

  connect(userId, userType) {
    // Connexion WebSocket désactivée - la messagerie a été supprimée
    console.log('⚠️ Connexion WebSocket désactivée - la messagerie a été supprimée');
    return;
    
    // Code désactivé ci-dessous
    /*
    try {
      console.log(`🔌 Connexion WebSocket pour ${userType}:${userId}`);
      
      this.socket = new WebSocket(`ws://localhost:5002`);
      
      this.socket.onopen = () => {
        console.log('✅ WebSocket connecté');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Attendre un peu avant d'envoyer l'identification pour s'assurer que la connexion est stable
        setTimeout(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
              type: 'register',
              userType: userType,
              userId: userId
            }));
            console.log(`📝 Identification envoyée: ${userType}:${userId}`);
          }
        }, 100);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Message WebSocket reçu:', data);
          
          // Notifier tous les listeners
          this.listeners.forEach((callback, key) => {
            try {
              callback(data);
            } catch (err) {
              console.error(`❌ Erreur dans le listener ${key}:`, err);
            }
          });
        } catch (error) {
          console.error('❌ Erreur parsing message WebSocket:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('🔌 WebSocket fermé');
        this.isConnected = false;
        this.attemptReconnect(userType, userId);
      };

      this.socket.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
      };

    } catch (error) {
      console.error('❌ Erreur connexion WebSocket:', error);
    }
    */
  }

  attemptReconnect(userType, userId) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(userId, userType);
      }, this.reconnectInterval);
    } else {
      console.log('❌ Nombre maximum de tentatives de reconnexion atteint');
    }
  }

  addListener(key, callback) {
    this.listeners.set(key, callback);
  }

  removeListener(key) {
    this.listeners.delete(key);
  }

  // Méthodes compatibles avec le hook useWebSocket
  on(event, callback) {
    this.listeners.set(event, callback);
  }

  off(event, callback) {
    this.listeners.delete(event);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
    this.listeners.clear();
  }

  send(data) {
    // Vérifier que le socket existe et est dans l'état OPEN
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du message WebSocket:', error);
      }
    } else {
      const state = this.socket ? this.socket.readyState : 'null';
      console.warn('⚠️ WebSocket non prêt (état:', state, '), impossible d\'envoyer:', data);
    }
  }

  // Demander les notifications
  getNotifications() {
    // Attendre que la connexion soit établie avant d'envoyer
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        type: 'get_notifications'
      });
    } else if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      // Attendre que la connexion soit établie
      const onOpen = () => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.send({
            type: 'get_notifications'
          });
        }
      };
      this.socket.addEventListener('open', onOpen, { once: true });
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible de récupérer les notifications');
    }
  }

  // Demander les messages
  getMessages() {
    // Attendre que la connexion soit établie avant d'envoyer
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        type: 'get_messages'
      });
    } else if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      // Attendre que la connexion soit établie
      const onOpen = () => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.send({
            type: 'get_messages'
          });
        }
      };
      this.socket.addEventListener('open', onOpen, { once: true });
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible de récupérer les messages');
    }
  }

  // Marquer une notification comme lue
  markNotificationAsRead(notificationId) {
    // La méthode send() vérifie déjà l'état de la connexion
    this.send({
      type: 'mark_notification_read',
      notificationId: notificationId
    });
  }

  // Marquer un message comme lu
  markMessageAsRead(messageId) {
    // La méthode send() vérifie déjà l'état de la connexion
    this.send({
      type: 'mark_message_read',
      messageId: messageId
    });
  }
}

// Instance singleton
const webSocketService = new WebSocketService();

export default webSocketService;