import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, MessageSquare, Bell, LogOut, Search, Send, Upload, FileText, Trash2,
  ChevronDown, Settings, User, Users, Zap, Lock, CreditCard, X, Camera
} from 'lucide-react';
import { showToast } from '../utils/toast';
import '../styles/user-dashboard.css';

function UserDashboard() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profilePhotoInputRef = useRef(null);

  // Auth & User State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState('home');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Home Tab State
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchType, setUserSearchType] = useState('name');
  const [profileUpdateMode, setProfileUpdateMode] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({});

  // Messages Tab State
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumWarning, setShowPremiumWarning] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);

  // Notifications Tab State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Resume State
  const [resumes, setResumes] = useState([]);
  const [resumeUploading, setResumeUploading] = useState(false);

  // Profile Photo State
  const [photoUploading, setPhotoUploading] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Initialize user and fetch data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setUpdatedProfile(parsedUser);
    setIsPremium(parsedUser.is_premium || false);

    // Fetch all data
    fetchUserProfile(parsedUser);
    fetchAllUsers();
    fetchConversations(parsedUser.id);
    fetchNotifications(parsedUser.id);
    fetchResumes(parsedUser.email);

    setLoading(false);

    // Set up polling for real-time messages and notifications
    const messageInterval = setInterval(() => {
      if (selectedUser && parsedUser.id) {
        fetchMessages(parsedUser.id, selectedUser.id);
      }
      if (parsedUser.id) {
        fetchNotifications(parsedUser.id);
      }
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [navigate]);

  const fetchUserProfile = useCallback(async (userData) => {
    try {
      const res = await axios.get(`${apiUrl}/api/user/${userData.email}`);
      if (res.data.success) {
        setUser(res.data.user);
        setUpdatedProfile(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }, [apiUrl]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/all-users`);
      if (res.data && res.data.users && Array.isArray(res.data.users)) {
        const filtered = res.data.users.filter(u => u.email !== user?.email);
        setAllUsers(filtered);
        setFilteredUsers(filtered);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      showToast('Failed to load users', 'error');
    }
  }, [apiUrl, user]);

  useEffect(() => {
    if (user && allUsers.length === 0) {
      fetchAllUsers();
    }
  }, [user]);

  // Search and filter users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(allUsers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allUsers.filter(u => {
      if (userSearchType === 'name') {
        return u.fullname?.toLowerCase().includes(query);
      } else if (userSearchType === 'company') {
        return u.company_name?.toLowerCase().includes(query);
      } else if (userSearchType === 'status') {
        return u.status?.toLowerCase().includes(query);
      }
      return false;
    });
    setFilteredUsers(filtered);
  }, [searchQuery, userSearchType, allUsers]);

  const fetchConversations = useCallback(async (userId) => {
    try {
      const res = await axios.get(`${apiUrl}/api/conversations/${userId}`);
      if (res.data.success && res.data.conversations) {
        setConversations(res.data.conversations);
        setConversationCount(res.data.conversations.length);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [apiUrl]);

  const fetchMessages = useCallback(async (senderId, receiverId) => {
    try {
      const res = await axios.get(`${apiUrl}/api/user-message/${senderId}/${receiverId}`);
      if (res.data.success) {
        setMessages(res.data.messages || []);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [apiUrl]);

  const fetchNotifications = useCallback(async (userId) => {
    try {
      const res = await axios.get(`${apiUrl}/api/notifications/${userId}`);
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        const unread = res.data.notifications?.filter(n => !n.is_read).length || 0;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [apiUrl]);

  const fetchResumes = useCallback(async (email) => {
    try {
      const res = await axios.get(`${apiUrl}/api/resumes/${email}`);
      if (res.data.success) {
        setResumes(res.data.resumes || []);
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
    }
  }, [apiUrl]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser || !user) return;

    // Check conversation limit for free users
    if (!isPremium && conversationCount >= 5) {
      setShowPremiumWarning(true);
      return;
    }

    try {
      const res = await axios.post(`${apiUrl}/api/user-message/send`, {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        message: messageInput
      });

      if (res.data.success) {
        setMessageInput('');
        fetchMessages(user.id, selectedUser.id);
        showToast('Message sent!', 'success');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      showToast('Failed to send message', 'error');
    }
  };

  const handleSelectUser = async (selectedU) => {
    setSelectedUser(selectedU);
    if (user) {
      fetchMessages(user.id, selectedU.id);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    setResumeUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', user.email);

    try {
      const res = await axios.post(`${apiUrl}/api/upload-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        showToast('Resume uploaded successfully!', 'success');
        fetchResumes(user.email);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        showToast(res.data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setResumeUploading(false);
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (2MB max for photo)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Photo size must be less than 2MB', 'error');
      return;
    }

    setPhotoUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', user.email);

    try {
      const res = await axios.post(`${apiUrl}/api/upload-profile-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        showToast('Profile photo updated!', 'success');
        const updatedUser = { ...user, profile_image_url: res.data.photoUrl };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';
      } else {
        showToast(res.data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const res = await axios.put(`${apiUrl}/api/user/${user.id}/update`, updatedProfile);
      if (res.data.success) {
        setUser(res.data.user);
        setUpdatedProfile(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setProfileUpdateMode(false);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Failed to update profile', 'error');
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    try {
      const res = await axios.delete(`${apiUrl}/api/resume/${resumeId}`);
      if (res.data.success) {
        showToast('Resume deleted successfully!', 'success');
        if (user) fetchResumes(user.email);
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
      showToast('Failed to delete resume', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="user-dashboard-container">
      {/* NAVBAR - Separated from main content */}
      <nav className="dashboard-navbar">
        <div className="navbar-content">
          <h1 className="navbar-logo">Skill Connect</h1>
          <div className="navbar-tabs">
            <button
              className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <Home size={20} /> Home
            </button>
            <button
              className={`nav-tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              <MessageSquare size={20} /> Messages
            </button>
            <button
              className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={20} /> Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
            <button
              className={`nav-tab ${activeTab === 'resumes' ? 'active' : ''}`}
              onClick={() => setActiveTab('resumes')}
            >
              <FileText size={20} /> Resumes
            </button>
            <button
              className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <Settings size={20} /> Profile
            </button>
          </div>
          <div className="navbar-profile">
            <button className="profile-menu-btn" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
              {user?.profile_image_url ? (
                <img src={user.profile_image_url} alt="Profile" className="profile-pic-nav" />
              ) : (
                <User size={24} />
              )}
              <ChevronDown size={16} />
            </button>
            {profileMenuOpen && (
              <motion.div className="profile-dropdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="dropdown-email">{user?.email}</p>
                <button onClick={() => setActiveTab('profile')} className="dropdown-item">
                  Edit Profile
                </button>
                <button onClick={handleLogout} className="dropdown-item logout-btn">
                  <LogOut size={16} /> Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA - Separated from navbar */}
      <div className="dashboard-main">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <motion.div className="tab-content home-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>Browse Users & Connect</h2>
            <div className="search-section">
              <div className="search-inputs">
                <select value={userSearchType} onChange={(e) => setUserSearchType(e.target.value)} className="filter-select">
                  <option value="name">Search by Name</option>
                  <option value="company">Search by Company</option>
                  <option value="status">Search by Status</option>
                </select>
                <input
                  type="text"
                  placeholder={`Search by ${userSearchType}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <p className="results-count">Found {filteredUsers.length} users</p>
            </div>

            <div className="users-grid">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <motion.div key={u.id} className="user-card" whileHover={{ y: -5 }}>
                    {u.profile_image_url ? (
                      <img src={u.profile_image_url} alt={u.fullname} className="user-avatar" />
                    ) : (
                      <div className="user-avatar-placeholder">
                        <User size={40} />
                      </div>
                    )}
                    <h3 className="user-name">{u.fullname}</h3>
                    <p className="user-company">{u.company_name || 'N/A'}</p>
                    <p className="user-status">
                      <span className={`status-badge ${u.status}`}>{u.status}</span>
                    </p>
                    <button
                      onClick={() => handleSelectUser(u)}
                      className="message-btn"
                    >
                      <MessageSquare size={16} /> Message
                    </button>
                  </motion.div>
                ))
              ) : (
                <p className="no-users">No users found</p>
              )}
            </div>
          </motion.div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <motion.div className="tab-content messages-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="messages-container">
              {/* Conversations List */}
              <div className="conversations-sidebar">
                <h3>Conversations {conversationCount > 0 && <span className="count">{conversationCount}</span>}</h3>
                <div className="conversations-list">
                  {conversations.length > 0 ? (
                    conversations.map((conv) => (
                      <motion.div
                        key={conv.other_user_id}
                        className={`conversation-item ${selectedUser?.id === conv.other_user_id ? 'active' : ''}`}
                        onClick={() => handleSelectUser(conv.other_user)}
                        whileHover={{ x: 5 }}
                      >
                        {conv.other_user?.profile_image_url ? (
                          <img src={conv.other_user.profile_image_url} alt={conv.other_user.fullname} />
                        ) : (
                          <div className="avatar-placeholder">
                            <User size={24} />
                          </div>
                        )}
                        <div className="conversation-info">
                          <h4>{conv.other_user?.fullname}</h4>
                          <p className="last-message">{conv.last_message || 'No messages yet'}</p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="no-conversations">No conversations yet. Start messaging users from Home tab!</p>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="chat-area">
                {selectedUser ? (
                  <>
                    <div className="chat-header">
                      <div className="chat-header-info">
                        {selectedUser.profile_image_url ? (
                          <img src={selectedUser.profile_image_url} alt={selectedUser.fullname} />
                        ) : (
                          <div className="avatar-placeholder">
                            <User size={32} />
                          </div>
                        )}
                        <div>
                          <h3>{selectedUser.fullname}</h3>
                          <p className="user-status-mini">{selectedUser.company_name || selectedUser.status}</p>
                        </div>
                      </div>
                      {!isPremium && conversationCount >= 5 && (
                        <div className="premium-notice">
                          <Zap size={16} /> Premium Required
                        </div>
                      )}
                    </div>

                    <div className="messages-box">
                      <AnimatePresence>
                        {messages.map((msg, idx) => (
                          <motion.div
                            key={idx}
                            className={`message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <p>{msg.message}</p>
                            <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>

                    {showPremiumWarning && (
                      <div className="premium-warning">
                        <p>⭐ You've reached the 5-message limit. Upgrade to Premium for unlimited messaging!</p>
                        <button onClick={() => navigate('/premium')} className="upgrade-btn">
                          Upgrade Now
                        </button>
                        <button onClick={() => setShowPremiumWarning(false)} className="close-warning">
                          <X size={18} />
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSendMessage} className="message-form">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={!isPremium && conversationCount >= 5}
                        className="message-input"
                      />
                      <button type="submit" disabled={!isPremium && conversationCount >= 5} className="send-btn">
                        <Send size={18} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="no-chat-selected">
                    <MessageSquare size={48} />
                    <p>Select a conversation to start chatting</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <motion.div className="tab-content notifications-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>Notifications</h2>
            <div className="notifications-list">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <motion.div key={notif.id} className="notification-item" whileHover={{ x: 5 }}>
                    <Bell size={20} />
                    <div className="notification-content">
                      <h4>{notif.title}</h4>
                      <p>{notif.message}</p>
                      <small>{new Date(notif.timestamp).toLocaleString()}</small>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="no-notifications">No notifications yet</p>
              )}
            </div>
          </motion.div>
        )}

        {/* RESUMES TAB */}
        {activeTab === 'resumes' && (
          <motion.div className="tab-content resumes-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>My Resumes</h2>
            <div className="resume-upload-section">
              <label htmlFor="resume-input" className="upload-label">
                <Upload size={24} />
                <p>Click to Upload Resume</p>
                <small>PDF, DOC, DOCX (Max 5MB)</small>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="resume-input"
                onChange={handleResumeUpload}
                disabled={resumeUploading}
                accept=".pdf,.doc,.docx"
                className="file-input"
              />
              {resumeUploading && <p className="uploading-text">Uploading...</p>}
            </div>

            <div className="resumes-list">
              {resumes.length > 0 ? (
                resumes.map((resume) => (
                  <motion.div key={resume.id} className="resume-item" whileHover={{ y: -3 }}>
                    <FileText size={32} />
                    <div className="resume-info">
                      <h4>{resume.name}</h4>
                      <p className="file-size">{(resume.file_size / 1024).toFixed(2)} KB</p>
                      <p className="upload-date">{new Date(resume.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="resume-actions">
                      <a href={resume.minio_url} target="_blank" rel="noopener noreferrer" className="download-btn">
                        View
                      </a>
                      <button onClick={() => handleDeleteResume(resume.id)} className="delete-btn">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="no-resumes">No resumes uploaded yet. Upload one to get started!</p>
              )}
            </div>
          </motion.div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <motion.div className="tab-content profile-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>My Profile</h2>
            {!profileUpdateMode ? (
              <div className="profile-view">
                <div className="profile-header">
                  <div className="profile-photo-section">
                    {user?.profile_image_url ? (
                      <img src={user.profile_image_url} alt="Profile" className="large-profile-pic" />
                    ) : (
                      <div className="profile-pic-placeholder">
                        <User size={80} />
                      </div>
                    )}
                    <button
                      onClick={() => profilePhotoInputRef.current?.click()}
                      disabled={photoUploading}
                      className="upload-photo-btn"
                    >
                      <Camera size={18} /> {photoUploading ? 'Uploading...' : 'Change Photo'}
                    </button>
                    <input
                      ref={profilePhotoInputRef}
                      type="file"
                      onChange={handleProfilePhotoUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>

                  <div className="profile-details">
                    <div className="detail-row">
                      <label>Full Name</label>
                      <p>{user?.fullname}</p>
                    </div>
                    <div className="detail-row">
                      <label>Email</label>
                      <p>{user?.email}</p>
                    </div>
                    <div className="detail-row">
                      <label>Status</label>
                      <p className={`status-badge ${user?.status}`}>{user?.status}</p>
                    </div>
                    <div className="detail-row">
                      <label>Company</label>
                      <p>{user?.company_name || 'Not specified'}</p>
                    </div>
                    <div className="detail-row">
                      <label>Phone</label>
                      <p>{user?.phone || 'Not specified'}</p>
                    </div>
                    <div className="detail-row">
                      <label>Location</label>
                      <p>{user?.city}, {user?.state}, {user?.country}</p>
                    </div>
                    <div className="detail-row">
                      <label>Premium Status</label>
                      <p>{user?.is_premium ? <span className="premium-badge">✓ Premium</span> : <span>Free</span>}</p>
                    </div>
                  </div>
                </div>

                <button onClick={() => setProfileUpdateMode(true)} className="edit-profile-btn">
                  <Settings size={18} /> Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={updatedProfile.fullname || ''}
                    onChange={(e) => setUpdatedProfile({ ...updatedProfile, fullname: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={updatedProfile.company_name || ''}
                    onChange={(e) => setUpdatedProfile({ ...updatedProfile, company_name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={updatedProfile.phone || ''}
                    onChange={(e) => setUpdatedProfile({ ...updatedProfile, phone: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={updatedProfile.city || ''}
                    onChange={(e) => setUpdatedProfile({ ...updatedProfile, city: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={updatedProfile.state || ''}
                    onChange={(e) => setUpdatedProfile({ ...updatedProfile, state: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={updatedProfile.country || ''}
                    onChange={(e) => setUpdatedProfile({ ...updatedProfile, country: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={updatedProfile.bio || ''}
                    onChange={(e) => setUpdatedProfile({ ...updatedProfile, bio: e.target.value })}
                    rows={4}
                    className="form-input"
                  />
                </div>

                <div className="form-buttons">
                  <button type="submit" className="save-btn">Save Changes</button>
                  <button type="button" onClick={() => setProfileUpdateMode(false)} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
