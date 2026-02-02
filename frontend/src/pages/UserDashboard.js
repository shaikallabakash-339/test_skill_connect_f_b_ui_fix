import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, MessageSquare, Bell, LogOut, Search, Send, Upload, FileText, Trash2,
  ChevronDown, Settings, User, Users, Zap, Lock, CreditCard
} from 'lucide-react';
import { showToast } from '../utils/toast';
import '../styles/user-dashboard.css';

function UserDashboard() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auth & User State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

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
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumWarning, setShowPremiumWarning] = useState(false);

  // Notifications Tab State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Resume State
  const [resumes, setResumes] = useState([]);
  const [resumeUploading, setResumeUploading] = useState(false);

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

  // Fetch user profile details
  const fetchUserProfile = async (userData) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/user/${userData.email}`);
      if (res.data.success) {
        setUser(res.data.user);
        setUpdatedProfile(res.data.user);
        setIsPremium(res.data.user.is_premium || false);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Fetch all users for browsing
  const fetchAllUsers = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/all-users`);
      if (res.data && Array.isArray(res.data.users)) {
        const filtered = res.data.users.filter(u => u.email !== user?.email);
        setAllUsers(filtered);
        setFilteredUsers(filtered);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

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
      }
      return false;
    });
    setFilteredUsers(filtered);
  }, [searchQuery, userSearchType, allUsers]);

  // Fetch conversations
  const fetchConversations = async (userId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/conversations/${userId}`);
      if (res.data.success && res.data.conversations) {
        setConversations(res.data.conversations);
        setConversationCount(res.data.conversations.length);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  // Fetch messages
  const fetchMessages = async (senderId, receiverId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/user-message/${senderId}/${receiverId}`);
      if (res.data.success) {
        setMessages(res.data.messages || []);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async (userId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/notifications/${userId}`);
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        const unread = res.data.notifications?.filter(n => !n.is_read).length || 0;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Fetch resumes
  const fetchResumes = async (email) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/resumes/${email}`);
      if (res.data.success) {
        setResumes(res.data.resumes || []);
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser) return;

    // Check conversation limit for free users
    if (!isPremium && conversationCount >= 5) {
      setShowPremiumWarning(true);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/user-message/send`, {
        senderId: user.id,
        receiverId: selectedUser.id,
        message: messageInput,
      });

      if (res.data.success) {
        setMessageInput('');
        await fetchMessages(user.id, selectedUser.id);
        await fetchConversations(user.id);
        showToast('Message sent!', 'success');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      showToast('Failed to send message', 'error');
    }
  };

  // Handle user selection
  const handleSelectUser = (selectedUserData) => {
    setSelectedUser(selectedUserData);
    setMessageLoading(true);
    fetchMessages(user.id, selectedUserData.id);
    setMessageLoading(false);
  };

  // Handle resume upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload PDF or Word document', 'error');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('email', user.email);
    formData.append('name', user.fullname);

    setResumeUploading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/upload-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        fetchResumes(user.email);
        showToast('Resume uploaded successfully!', 'success');
      } else {
        showToast('Failed to upload resume', 'error');
      }
    } catch (err) {
      console.error('Error uploading resume:', err);
      showToast('Error uploading resume', 'error');
    } finally {
      setResumeUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete resume
  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Delete this resume?')) return;

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.delete(`${apiUrl}/api/resume/${resumeId}`);
      if (res.data.success) {
        fetchResumes(user.email);
        showToast('Resume deleted', 'success');
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
      showToast('Failed to delete resume', 'error');
    }
  };

  // Update user profile
  const handleUpdateProfile = async () => {
    if (!updatedProfile.fullname || !updatedProfile.email) {
      showToast('Name and email are required', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.put(`${apiUrl}/api/user/${user.id}/update`, updatedProfile);

      if (res.data.success) {
        setUser(updatedProfile);
        localStorage.setItem('user', JSON.stringify(updatedProfile));
        setProfileUpdateMode(false);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Zap size={40} />
        </motion.div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="user-dashboard-new"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Left Sidebar - User Profile Menu */}
      <aside className="dashboard-sidebar">
        <motion.div
          className="profile-card"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="profile-image-wrapper">
            <img
              src={user?.profile_image_url || 'https://via.placeholder.com/100?text=Profile'}
              alt={user?.fullname}
              className="profile-image-large"
            />
            {user?.is_premium && (
              <motion.div
                className="premium-badge"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <CreditCard size={12} />
              </motion.div>
            )}
          </div>

          <h2 className="profile-name">{user?.fullname}</h2>
          <p className="profile-company">{user?.company_name || 'Company not set'}</p>
          <p className="profile-status">
            <span className={`status-badge ${user?.status}`}>{user?.status}</span>
          </p>

          <motion.button
            className="update-profile-btn"
            onClick={() => setProfileUpdateMode(!profileUpdateMode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <User size={16} />
            Update Profile
          </motion.button>

          <div className="sidebar-stats">
            <div className="stat-item">
              <p className="stat-label">Conversations</p>
              <p className="stat-value">{conversationCount}</p>
            </div>
            <div className="stat-item">
              <p className="stat-label">Notifications</p>
              <p className="stat-value">{unreadCount}</p>
            </div>
          </div>

          {!user?.is_premium && conversationCount >= 5 && (
            <motion.button
              className="upgrade-btn"
              onClick={() => navigate('/premium')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap size={16} />
              Upgrade to Premium
            </motion.button>
          )}

          <nav className="sidebar-menu">
            <p className="menu-title">Quick Links</p>
            <a href="#" className="menu-link">
              <Settings size={16} />
              Settings
            </a>
            <a href="#" className="menu-link">
              <CreditCard size={16} />
              Billing
            </a>
          </nav>
        </motion.div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Navigation */}
        <nav className="dashboard-navbar">
          <motion.div
            className="navbar-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <button
              className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <Home size={20} />
              <span>Home</span>
            </button>
            <button
              className={`nav-btn ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              <MessageSquare size={20} />
              <span>Messages</span>
              {conversationCount > 0 && <span className="badge">{conversationCount}</span>}
            </button>
            <button
              className={`nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={20} />
              <span>Notifications</span>
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
          </motion.div>

          {/* Top Right - Profile & Logout */}
          <motion.div
            className="navbar-right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.button
              className="profile-menu-btn"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={user?.profile_image_url || 'https://via.placeholder.com/32?text=P'}
                alt="Profile"
                className="navbar-profile-img"
              />
              <ChevronDown size={16} />
            </motion.button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  className="profile-dropdown-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="dropdown-header">
                    <h4>{user?.fullname}</h4>
                    <p>{user?.email}</p>
                  </div>
                  <hr />
                  <button className="dropdown-item">
                    <User size={16} />
                    View Profile
                  </button>
                  <button className="dropdown-item">
                    <Settings size={16} />
                    Settings
                  </button>
                  <button className="dropdown-item premium">
                    <Zap size={16} />
                    {user?.is_premium ? 'Premium Active' : 'Upgrade'}
                  </button>
                  <hr />
                  <motion.button
                    className="dropdown-item logout"
                    onClick={handleLogout}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut size={16} />
                    Logout
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </nav>

        {/* Welcome Banner */}
        <motion.div
          className="welcome-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1>👋 Welcome to Skill Connect</h1>
          <p>Connect with professionals, grow your network, and discover opportunities</p>
        </motion.div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <motion.div
              className="home-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Profile Update Mode */}
              {profileUpdateMode && (
                <motion.div
                  className="profile-update-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3>Update Your Profile</h3>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={updatedProfile.fullname || ''}
                      onChange={(e) =>
                        setUpdatedProfile({ ...updatedProfile, fullname: e.target.value })
                      }
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={updatedProfile.company_name || ''}
                      onChange={(e) =>
                        setUpdatedProfile({ ...updatedProfile, company_name: e.target.value })
                      }
                      placeholder="Your company"
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={updatedProfile.city || ''}
                      onChange={(e) =>
                        setUpdatedProfile({ ...updatedProfile, city: e.target.value })
                      }
                      placeholder="Your city"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={updatedProfile.status || 'pursuing'}
                      onChange={(e) =>
                        setUpdatedProfile({ ...updatedProfile, status: e.target.value })
                      }
                    >
                      <option value="pursuing">Pursuing</option>
                      <option value="graduated">Graduated</option>
                      <option value="employed">Employed</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <motion.button
                      className="btn-primary"
                      onClick={handleUpdateProfile}
                      disabled={isUpdatingProfile}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                    <motion.button
                      className="btn-secondary"
                      onClick={() => setProfileUpdateMode(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Resume Section */}
              <motion.div
                className="resume-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3>
                  <FileText size={20} />
                  Your Resumes
                </h3>

                <motion.button
                  className="upload-resume-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={resumeUploading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Upload size={16} />
                  {resumeUploading ? 'Uploading...' : 'Upload Resume'}
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  style={{ display: 'none' }}
                />

                <div className="resumes-list">
                  {resumes && resumes.length > 0 ? (
                    resumes.map((resume, idx) => (
                      <motion.div
                        key={idx}
                        className="resume-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="resume-info">
                          <FileText size={24} />
                          <div>
                            <p className="resume-name">{resume.file_name}</p>
                            <p className="resume-date">
                              Uploaded: {new Date(resume.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="resume-actions">
                          <motion.a
                            href={resume.minio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-view"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View
                          </motion.a>
                          <motion.button
                            className="btn-delete"
                            onClick={() => handleDeleteResume(resume.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="empty-message">No resumes uploaded yet</p>
                  )}
                </div>
              </motion.div>

              {/* Browse Users Section */}
              <motion.div
                className="browse-users-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3>
                  <Users size={20} />
                  Browse People
                </h3>

                <div className="search-filters">
                  <div className="search-container">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Search people..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <div className="filter-buttons">
                    <motion.button
                      className={`filter-btn ${userSearchType === 'name' ? 'active' : ''}`}
                      onClick={() => setUserSearchType('name')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      By Name
                    </motion.button>
                    <motion.button
                      className={`filter-btn ${userSearchType === 'company' ? 'active' : ''}`}
                      onClick={() => setUserSearchType('company')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      By Company
                    </motion.button>
                  </div>
                </div>

                <div className="users-grid">
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((person, idx) => (
                      <motion.div
                        key={person.id}
                        className="user-card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
                      >
                        <div className="user-card-header">
                          <div className="user-avatar">
                            {person.profile_image_url ? (
                              <img src={person.profile_image_url} alt={person.fullname} />
                            ) : (
                              <User size={32} />
                            )}
                          </div>
                          <span className={`status-badge ${person.status}`}>
                            {person.status}
                          </span>
                        </div>

                        <h4>{person.fullname}</h4>
                        <p className="user-company">{person.company_name || 'No company'}</p>

                        <motion.button
                          className="message-btn"
                          onClick={() => handleSelectUser(person)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <MessageSquare size={16} />
                          Message
                        </motion.button>
                      </motion.div>
                    ))
                  ) : (
                    <p className="empty-message">No people found</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <motion.div
              className="messages-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="messages-container">
                {/* Conversations List */}
                <motion.div
                  className="conversations-list"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                >
                  <h3>Conversations</h3>

                  <div className="search-container">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                    />
                  </div>

                  <p className="conversation-limit">
                    {isPremium ? (
                      <span className="premium-text">
                        <Zap size={14} /> Unlimited conversations
                      </span>
                    ) : (
                      <span>
                        <Lock size={14} /> {conversationCount}/5 conversations
                      </span>
                    )}
                  </p>

                  <div className="conversations-items">
                    {conversations && conversations.length > 0 ? (
                      conversations.map((conv, idx) => (
                        <motion.div
                          key={idx}
                          className={`conversation-item ${
                            selectedUser?.id === conv.conversation_partner_id ? 'active' : ''
                          }`}
                          onClick={() => handleSelectUser(conv)}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <img
                            src={
                              conv.partner_profile_image_url ||
                              'https://via.placeholder.com/40?text=P'
                            }
                            alt={conv.conversation_partner_name}
                          />
                          <div className="conv-info">
                            <p>{conv.conversation_partner_name}</p>
                            <span className="last-message">
                              {conv.last_message?.substring(0, 30)}...
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="empty-message">No conversations yet</p>
                    )}
                  </div>
                </motion.div>

                {/* Chat Area */}
                {selectedUser ? (
                  <motion.div
                    className="chat-area"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                  >
                    <div className="chat-header">
                      <div className="chat-user-info">
                        <img
                          src={selectedUser.profile_image_url || 'https://via.placeholder.com/40'}
                          alt={selectedUser.fullname}
                        />
                        <div>
                          <h4>{selectedUser.fullname}</h4>
                          <p>{selectedUser.company_name || 'No company'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="messages-display">
                      {messageLoading ? (
                        <p className="loading">Loading messages...</p>
                      ) : messages && messages.length > 0 ? (
                        messages.map((msg, idx) => (
                          <motion.div
                            key={idx}
                            className={`message ${
                              msg.sender_id === user.id ? 'sent' : 'received'
                            }`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                          >
                            <p>{msg.message}</p>
                            <span className="message-time">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </motion.div>
                        ))
                      ) : (
                        <p className="empty-message">No messages yet. Start the conversation!</p>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {showPremiumWarning && (
                      <motion.div
                        className="premium-warning"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Zap size={16} />
                        <span>Reached 5 conversation limit. Upgrade to premium!</span>
                        <motion.button
                          onClick={() => navigate('/premium')}
                          whileHover={{ scale: 1.05 }}
                        >
                          Upgrade
                        </motion.button>
                      </motion.div>
                    )}

                    <form className="message-input-form" onSubmit={handleSendMessage}>
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={showPremiumWarning}
                      />
                      <motion.button
                        type="submit"
                        disabled={!messageInput.trim() || showPremiumWarning}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Send size={18} />
                      </motion.button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    className="empty-chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <MessageSquare size={48} />
                    <p>Select a conversation to start chatting</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <motion.div
              className="notifications-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2>Notifications</h2>

              <div className="notifications-container">
                {notifications && notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <motion.div
                      key={idx}
                      className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="notif-icon">
                        {notif.type === 'admin' ? (
                          <Bell size={24} />
                        ) : (
                          <MessageSquare size={24} />
                        )}
                      </div>
                      <div className="notif-content">
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                        <span className="notif-type">
                          {notif.type === 'admin' ? '📢 Admin' : '💬 Message'}
                        </span>
                      </div>
                      <span className="notif-time">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="empty-notification"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Bell size={48} />
                    <p>No notifications yet</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </motion.div>
  );
}

export default UserDashboard;
