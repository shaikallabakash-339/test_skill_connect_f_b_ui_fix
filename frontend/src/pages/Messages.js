import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, Send, MessageSquare, User, Bell, Clock, ArrowLeft } from 'lucide-react';
import { showToast } from '../utils/toast';
import '../styles/user-dashboard-new.css';

function Messages() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // User State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Messages State
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  // Search State
  const [peopleSearch, setPeopleSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [suggestedConnections, setSuggestedConnections] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Premium State
  const [isPremium, setIsPremium] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const [showPremiumWarning, setShowPremiumWarning] = useState(false);

  // Message Filter State
  const [messageFilter, setMessageFilter] = useState('all');
  const [adminMessages, setAdminMessages] = useState([]);
  const [userMessages, setUserMessages] = useState([]);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setIsPremium(parsedUser.is_premium || false);

    fetchConversations(parsedUser.email);
    fetchAllUsers(parsedUser.email);
    fetchNotifications(parsedUser.id);

    setLoading(false);

    const messageInterval = setInterval(() => {
      if (selectedUser && parsedUser.id) {
        fetchMessages(parsedUser.email, selectedUser.email);
      }
      if (parsedUser.id) {
        fetchNotifications(parsedUser.id);
      }
    }, 2000);

    return () => clearInterval(messageInterval);
  }, [navigate, selectedUser]);

  const fetchConversations = useCallback(async (userEmail) => {
    try {
      const res = await axios.get(`${apiUrl}/api/conversations/${userEmail}`);
      if (res.data && res.data.conversations) {
        setConversations(res.data.conversations);
        setConversationCount(res.data.conversations.length);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [apiUrl]);

  const fetchAllUsers = useCallback(async (currentUserEmail) => {
    try {
      const res = await axios.get(`${apiUrl}/api/all-users`);
      if (res.data && Array.isArray(res.data)) {
        const filtered = res.data.filter(u => u.email !== currentUserEmail);
        setAllUsers(filtered);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, [apiUrl]);

  const fetchMessages = useCallback(async (sender, receiver) => {
    try {
      const res = await axios.get(`${apiUrl}/api/messages/${sender}/${receiver}`);
      if (res.data && res.data.messages) {
        setUserMessages(res.data.messages);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [apiUrl]);

  const fetchNotifications = useCallback(async (userId) => {
    try {
      const res = await axios.get(`${apiUrl}/api/notifications/${userId}`);
      if (res.data && res.data.notifications) {
        const adminMsgs = res.data.notifications.filter(n => n.type === 'admin_message');
        setAdminMessages(adminMsgs);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [apiUrl]);

  // Search for people and companies
  useEffect(() => {
    if (peopleSearch.trim()) {
      const query = peopleSearch.toLowerCase();
      const filtered = allUsers.filter(u => u.fullname?.toLowerCase().includes(query));
      setSuggestedConnections(filtered);
    } else if (companySearch.trim()) {
      const query = companySearch.toLowerCase();
      const companies = [...new Set(allUsers.map(u => u.company_name).filter(Boolean))].filter(c => c.toLowerCase().includes(query));
      const filtered = allUsers.filter(u => companies.includes(u.company_name));
      setSuggestedConnections(filtered);
    } else {
      setSuggestedConnections([]);
    }
  }, [peopleSearch, companySearch, allUsers]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser || !user) return;

    if (!isPremium && conversationCount >= 5) {
      setShowPremiumWarning(true);
      return;
    }

    try {
      const res = await axios.post(`${apiUrl}/api/send-message`, {
        sender_email: user.email,
        receiver_email: selectedUser.email,
        message: messageInput,
        timestamp: new Date().toISOString()
      });

      if (res.data.success) {
        setMessageInput('');
        fetchMessages(user.email, selectedUser.email);
        fetchConversations(user.email);
        showToast('Message sent!', 'success');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      showToast('Failed to send message', 'error');
    }
  };

  const handleSelectUser = (selectedU) => {
    setSelectedUser(selectedU);
    setMessageFilter('all');
    if (user) {
      fetchMessages(user.email, selectedU.email);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const displayMessages = messageFilter === 'admin' ? adminMessages : messageFilter === 'user' ? userMessages : [...userMessages, ...adminMessages].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* LEFT PANEL - CONVERSATIONS */}
        <div className="conversations-panel">
          <div className="conversations-header">
            <button onClick={() => navigate('/dashboard')} className="back-btn">
              <ArrowLeft size={20} />
            </button>
            <h2>Messages</h2>
          </div>

          {/* Search Bars */}
          <div className="search-section">
            <div className="search-container">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search people by name..."
                value={peopleSearch}
                onChange={(e) => { setPeopleSearch(e.target.value); setCompanySearch(''); }}
              />
            </div>

            <div className="search-container">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by company..."
                value={companySearch}
                onChange={(e) => { setCompanySearch(e.target.value); setPeopleSearch(''); }}
              />
            </div>
          </div>

          {/* Suggested Connections */}
          {suggestedConnections.length > 0 && (
            <motion.div className="suggested-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h4>Suggested</h4>
              {suggestedConnections.slice(0, 5).map((u) => (
                <motion.div
                  key={u.id}
                  className={`conversation-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                  onClick={() => handleSelectUser(u)}
                  whileHover={{ x: 5 }}
                >
                  {u.profile_image_url ? (
                    <img src={u.profile_image_url} alt={u.fullname} />
                  ) : (
                    <div className="avatar"><User size={20} /></div>
                  )}
                  <div className="conv-info">
                    <h4>{u.fullname}</h4>
                    <p>{u.company_name}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Conversations List */}
          <motion.div className="conversations-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h4>Your Conversations ({conversations.length})</h4>
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  className={`conversation-item ${selectedUser?.id === conv.other_user_id ? 'active' : ''}`}
                  onClick={() => handleSelectUser(conv.other_user)}
                  whileHover={{ x: 5 }}
                >
                  {conv.other_user?.profile_image_url ? (
                    <img src={conv.other_user.profile_image_url} alt={conv.other_user?.fullname} />
                  ) : (
                    <div className="avatar"><User size={20} /></div>
                  )}
                  <div className="conv-info">
                    <h4>{conv.other_user?.fullname}</h4>
                    <p>{conv.last_message?.substring(0, 30) || 'No messages'}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="empty">No conversations yet</p>
            )}
          </motion.div>

          {!isPremium && conversationCount >= 5 && (
            <div className="premium-limit-banner">
              <Zap size={16} />
              <p>Upgrade Premium for unlimited conversations</p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL - CHAT */}
        <div className="chat-panel">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                {selectedUser.profile_image_url ? (
                  <img src={selectedUser.profile_image_url} alt={selectedUser.fullname} />
                ) : (
                  <div className="avatar"><User size={24} /></div>
                )}
                <div className="header-info">
                  <h3>{selectedUser.fullname}</h3>
                  <p>{selectedUser.company_name} • Online</p>
                </div>
              </div>

              {/* Message Type Filter */}
              <div className="message-type-filter">
                <button
                  className={messageFilter === 'all' ? 'active' : ''}
                  onClick={() => setMessageFilter('all')}
                >
                  All Messages
                </button>
                <button
                  className={messageFilter === 'user' ? 'active' : ''}
                  onClick={() => setMessageFilter('user')}
                >
                  User Messages
                </button>
                <button
                  className={messageFilter === 'admin' ? 'active' : ''}
                  onClick={() => setMessageFilter('admin')}
                >
                  Admin Messages ({adminMessages.length})
                </button>
              </div>

              {/* Messages */}
              <div className="messages-area">
                {displayMessages.length > 0 ? (
                  displayMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      className={`message ${msg.sender_email === user?.email ? 'sent' : 'received'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="message-text">{msg.message}</p>
                      <p className="message-time">
                        <Clock size={12} /> {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-chat">
                    <MessageSquare size={48} color="#ccc" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Premium Warning */}
              {showPremiumWarning && (
                <div className="premium-warning">
                  <Bell size={16} />
                  <p>Free users limited to 5 conversations. Upgrade for unlimited messaging!</p>
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={!isPremium && conversationCount >= 5}
                />
                <button type="submit" disabled={!messageInput.trim() || (!isPremium && conversationCount >= 5)}>
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="empty-chat-panel">
              <MessageSquare size={64} color="#ccc" />
              <p>Select a conversation to start messaging</p>
              <p className="hint">Search for people or browse your existing conversations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
