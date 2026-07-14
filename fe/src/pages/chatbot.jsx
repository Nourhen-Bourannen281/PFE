// pages/Chatbot.jsx (Version corrigée)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getUser } from '../utils/auth';
import '../css/Chatbot.css';

const SUGGESTED_QUESTIONS = [
  'Comment créer une nouvelle commande ?',
  'Comment consulter mes factures en attente ?',
  'Quelles sont les étapes de validation d\'un contrat ?',
  'Comment calculer une pénalité de retard ?',
  'Comment suivre l\'état d\'une livraison ?',
  'Comment exporter les données en Excel ?',
];

const SYSTEM_PROMPT = `Tu es SMART-TRADE 360° Assistant, l'assistant virtuel intelligent de la plateforme SMART-TRADE 360° (Entreprise de Travaux et Applications Pétrolières).

Tu aides les utilisateurs à :
- Naviguer dans la plateforme (commandes, factures, contrats, livraisons, stock)
- Comprendre les processus métiers (validation, pénalités, conformité)
- Résoudre des problèmes techniques sur la plateforme
- Obtenir des informations sur les fonctionnalités disponibles

Réponds toujours en français, de manière concise et professionnelle.
Si une question ne concerne pas la plateforme SMART-TRADE 360° ou les métiers pétroliers, redirige poliment vers les sujets pertinents.
Utilise des listes et du formatage Markdown pour les réponses longues.`;

const Chatbot = () => {
  const user = getUser();
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Bonjour ${user?.nom || user?.pseudo || 'utilisateur'} 👋\n\nJe suis **SMART-TRADE 360° Assistant**, votre assistant virtuel. Je peux vous aider à naviguer dans la plateforme, comprendre les processus métiers et répondre à vos questions.\n\nComment puis-je vous aider aujourd'hui ?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState(null); // Ajout de l'état
  const [conversations, setConversations] = useState([]); // Pour l'historique des conversations
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Token d'authentification (à adapter selon votre système)
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Charger les conversations existantes au montage
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/chatbot/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:3001/api/chatbot/conversation/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.conversation.messages.map((msg, index) => ({
          id: index,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(formattedMessages);
        setCurrentConversationId(conversationId);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      const token = getAuthToken();
      
      const response = await fetch('http://localhost:3001/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: content,
          conversationId: currentConversationId, // Maintenant défini
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(data.message.timestamp),
      }]);

      // Sauvegarder l'ID de conversation si nouvelle conversation
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId);
        loadConversations(); // Recharger la liste des conversations
      }

    } catch (err) {
      console.error('Chatbot error:', err);
      setError('Impossible de joindre l\'assistant. Vérifiez votre connexion.');
      
      // Message de fallback local
      const fallbackResponse = getLocalFallbackResponse(content);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, currentConversationId]);

  // Fonction de fallback locale
  const getLocalFallbackResponse = (message) => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('commande')) {
      return "📦 **Création de commande**\n\nPour créer une nouvelle commande :\n1. Accédez au menu **Commandes**\n2. Cliquez sur **Nouvelle commande**\n3. Sélectionnez le produit et la quantité\n4. Choisissez la date de livraison\n5. Validez les informations\n\nPuis-je vous aider avec autre chose ?";
    }
    
    if (lowerMsg.includes('facture')) {
      return "💰 **Factures en attente**\n\nPour consulter vos factures :\n1. Allez dans **Facturation** > **Factures en attente**\n2. Vous verrez la liste des factures impayées\n3. Cliquez sur une facture pour voir les détails\n4. Utilisez le bouton **Payer** pour régler\n\nBesoin d'aide pour le paiement ?";
    }
    
    if (lowerMsg.includes('contrat')) {
      return "📄 **Validation de contrat**\n\nLes étapes de validation :\n• Étape 1 : Création du contrat\n• Étape 2 : Vérification juridique\n• Étape 3 : Validation commerciale\n• Étape 4 : Signature électronique\n• Étape 5 : Archivage\n\nLe processus prend généralement 2-3 jours ouvrés.";
    }
    
    if (lowerMsg.includes('livraison')) {
      return "🚚 **Suivi de livraison**\n\nPour suivre votre livraison :\n1. Accédez à **Logistique** > **Suivi livraisons**\n2. Entrez votre numéro de commande\n3. Consultez le statut en temps réel\n\nLes statuts possibles : En préparation, Expédiée, En transit, Livrée.";
    }
    
    return "🤖 Je suis votre Assistant SMART-TRADE 360°. Je peux vous aider avec :\n\n• 📦 Commandes et devis\n• 💰 Factures et paiements\n• 📄 Contrats et signatures\n• 🚚 Livraisons et logistique\n• 📊 Exports et rapports\n\nPosez-moi votre question sur l'un de ces sujets !";
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: `Bonjour ${user?.nom || user?.pseudo || 'utilisateur'} 👋\n\nConversation réinitialisée. Comment puis-je vous aider aujourd'hui ?`,
      timestamp: new Date(),
    }]);
    setCurrentConversationId(null);
    setShowSuggestions(true);
    setError('');
  };

  const startNewConversation = () => {
    clearChat();
  };

  // Rendu Markdown simplifié
  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold
      const parts = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
      
      // List item
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <li key={i}>{parts}</li>;
      }
      
      // Heading
      if (line.startsWith('### ')) {
        return <h4 key={i} className="chat-h4">{parts.slice(2)}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} className="chat-h3">{parts.slice(1)}</h3>;
      }
      
      // Empty line
      if (!line.trim()) return <br key={i} />;
      
      return <p key={i} className="chat-p">{parts}</p>;
    });
  };

  const formatTime = (d) => {
    if (!d) return '';
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(d));
  };

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar-header">
            <span>🤖</span>
            <span className="chat-online-dot" />
          </div>
          <div>
            <h1>SMART-TRADE 360° Assistant</h1>
            <p className={loading ? 'chat-typing-text' : ''}>
              {loading ? 'En train de répondre...' : 'Assistant virtuel · En ligne'}
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="btn-clear-chat" onClick={startNewConversation} title="Nouvelle conversation">
            🗑 Nouvelle conversation
          </button>
        </div>
      </div>

      {/* Sidebar des conversations (optionnel) */}
      {conversations.length > 0 && (
        <div className="chat-sidebar">
          <h4>Conversations récentes</h4>
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              className={`chat-history-item ${currentConversationId === conv.id ? 'active' : ''}`}
              onClick={() => loadConversation(conv.id)}
            >
              <div className="chat-history-title">{conv.title}</div>
              <div className="chat-history-date">{new Date(conv.updatedAt).toLocaleDateString('fr-FR')}</div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble-wrap ${msg.role === 'user' ? 'user-wrap' : 'bot-wrap'}`}>
            {msg.role === 'assistant' && (
              <div className="chat-avatar-sm">🤖</div>
            )}
            <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'} ${msg.isError ? 'chat-bubble-error' : ''}`}>
              <div className="chat-bubble-content">
                {msg.role === 'assistant'
                  ? <>{renderMarkdown(msg.content)}</>
                  : <p className="chat-p">{msg.content}</p>
                }
              </div>
              <div className="chat-bubble-time">{formatTime(msg.timestamp)}</div>
            </div>
            {msg.role === 'user' && (
              <div className="chat-avatar-sm chat-avatar-user">
                {(user?.nom || user?.pseudo || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble-wrap bot-wrap">
            <div className="chat-avatar-sm">🤖</div>
            <div className="chat-bubble chat-bubble-bot">
              <div className="chat-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && !loading && messages.length <= 1 && (
        <div className="chat-suggestions">
          <p className="chat-suggest-label">Questions fréquentes</p>
          <div className="chat-suggest-grid">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button key={i} className="chat-suggest-btn" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="chat-error">
          ⚠️ {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-wrap">
        <div className="chat-input-box">
          <textarea
            ref={inputRef}
            className="chat-textarea"
            placeholder="Posez votre question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="btn-send"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            title="Envoyer (Entrée)"
          >
            {loading ? <span className="btn-send-spinner" /> : '↑'}
          </button>
        </div>
        <p className="chat-hint">Appuyez sur <kbd>Entrée</kbd> pour envoyer · <kbd>Shift+Entrée</kbd> pour une nouvelle ligne</p>
      </div>
    </div>
  );
};

export default Chatbot;