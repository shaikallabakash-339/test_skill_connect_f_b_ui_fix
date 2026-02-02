import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Menu, X, LogOut, BarChart3, Users, MessageSquare, Settings, Search, Upload,
  Trash2, Eye, Download, Plus, Zap, TrendingUp, Target, Package, Send
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/admin-dashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentNavTab, setCurrentNavTab] = useState('dashboard');

  // Admin data
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });

  // Users management
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');

  // Messaging system
  const [messagesByStatus, setMessagesByStatus] = useState({});
  const [messageForm, setMessageForm] = useState({ status: 'employed', message: '' });

  // Donation stats
  const [donationStats, setDonationStats] = useState([]);
  const [oldAgeStats, setOldAgeStats] = useState([]);
  const [orphanStats, setOrphanStats] = useState([]);
  const [oldAgeHomes, setOldAgeHomes] = useState([]);
  const [orphans, setOrphans] = useState([]);

  // Upload section
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'old-age',
    qrImage: null,
    homeImage: null,
  });
  const [uploadLoading, setUploadLoading] = useState(false);

  const fileRef = useRef(null);
  const homeFileRef = useRef(null);

  // Initialize
  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (!adminData) {
      navigate('/admin/login');
      return;
    }

    setAdmin(JSON.parse(adminData));
    setLoading(false);
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchUserStats(),
        fetchMessageStats(),
        fetchDonationStats(),
        fetchOldAgeStats(),
        fetchOrphanStats(),
        fetchOldAgeHomes(),
        fetchOrphans(),
      ]);
    } catch (err) {
      console.error('[v0] Error fetching dashboard data:', err);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/all-users`);
      if (res.data && res.data.users && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
        setDashboardStats(prev => ({ ...prev, totalUsers: res.data.users.length }));
      }
    } catch (err) {
      console.error('[v0] Error fetching users:', err);
    }
  };

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/user-stats`);
      if (res.data.success) {
        setUserStats(res.data);
      }
    } catch (err) {
      console.error('[v0] Error fetching user stats:', err);
    }
  };

  // Fetch message stats
  const fetchMessageStats = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/message-stats`);
      if (res.data.success) {
        setMessagesByStatus(res.data.categoryCount || {});
        setDashboardStats(prev => ({ ...prev, totalMessages: res.data.totalMessages || 0 }));
      }
    } catch (err) {
      console.error('[v0] Error fetching message stats:', err);
    }
  };

  // Fetch donation stats
  const fetchDonationStats = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/donations-stats`);
      if (res.data.success) {
        setDonationStats(res.data.stats || []);
        setDashboardStats(prev => ({ ...prev, totalRevenue: res.data.totalRevenue || 0 }));
      }
    } catch (err) {
      console.error('[v0] Error fetching donation stats:', err);
    }
  };

  // Fetch old age homes stats
  const fetchOldAgeStats = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/old-age-homes-stats`);
      if (res.data.success) {
        setOldAgeStats(res.data.data || []);
      }
    } catch (err) {
      console.error('[v0] Error fetching old age stats:', err);
    }
  };

  // Fetch orphan stats
  const fetchOrphanStats = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/orphans-stats`);
      if (res.data.success) {
        setOrphanStats(res.data.data || []);
      }
    } catch (err) {
      console.error('[v0] Error fetching orphan stats:', err);
    }
  };

  // Fetch old age homes
  const fetchOldAgeHomes = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/old-age-homes`);
      if (res.data.success) {
        setOldAgeHomes(res.data.data || []);
      }
    } catch (err) {
      console.error('[v0] Error fetching old age homes:', err);
    }
  };

  // Fetch orphans
  const fetchOrphans = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/orphans`);
      if (res.data.success) {
        setOrphans(res.data.data || []);
      }
    } catch (err) {
      console.error('[v0] Error fetching orphans:', err);
    }
  };

  // Send message to users
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageForm.message.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/send-message`, {
        category: messageForm.status,
        message: messageForm.message,
      });

      if (res.data.success) {
        alert('Message sent successfully!');
        setMessageForm({ status: 'employed', message: '' });
        fetchMessageStats();
      }
    } catch (err) {
      console.error('[v0] Error sending message:', err);
      alert('Failed to send message');
    }
  };

  // Handle file upload
  const handleQRUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.qrImage || !uploadForm.name) {
      alert('Please fill in all required fields');
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('name', uploadForm.name);
    formData.append('type', uploadForm.type);
    formData.append('qrImage', uploadForm.qrImage);
    if (uploadForm.homeImage) {
      formData.append('homeImage', uploadForm.homeImage);
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/upload-qr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        alert('QR code uploaded successfully!');
        setUploadForm({ name: '', type: 'old-age', qrImage: null, homeImage: null });
        if (uploadForm.type === 'old-age') {
          fetchOldAgeHomes();
        } else {
          fetchOrphans();
        }
      }
    } catch (err) {
      console.error('[v0] Error uploading QR:', err);
      alert('Failed to upload QR code');
    } finally {
      setUploadLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  // Get filtered users
  const getFilteredUsers = () => {
    return users.filter(u => {
      const matchesSearch = u.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = userFilter === 'all' || u.status === userFilter;
      return matchesSearch && matchesFilter;
    });
  };

  if (loading) {
    return <div className="loading-container"><p>Loading...</p></div>;
  }

  return (
    <motion.div
      className="admin-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Sidebar */}
      <motion.aside
        className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
      >
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
          <button className="close-admin-sidebar" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        {/* Admin Profile */}
        <div className="admin-profile">
          <div className="admin-avatar">
            <span>{admin?.email?.[0]?.toUpperCase() || 'A'}</span>
          </div>
          <h3>{admin?.email || 'Administrator'}</h3>
          <p>System Administrator</p>

          <div className="admin-dropdown">
            <button
              className="admin-dropdown-toggle"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <Settings size={20} />
            </button>
            {profileMenuOpen && (
              <motion.div
                className="admin-dropdown-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button className="admin-dropdown-item logout-item" onClick={handleLogout}>
                  <LogOut size={18} /> Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Admin Navigation */}
        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${currentNavTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentNavTab('dashboard')}
          >
            <BarChart3 size={20} /> Dashboard
          </button>
          <button
            className={`admin-nav-item ${currentNavTab === 'users' ? 'active' : ''}`}
            onClick={() => setCurrentNavTab('users')}
          >
            <Users size={20} /> Users
          </button>
          <button
            className={`admin-nav-item ${currentNavTab === 'messaging' ? 'active' : ''}`}
            onClick={() => setCurrentNavTab('messaging')}
          >
            <MessageSquare size={20} /> Messaging
          </button>
          <button
            className={`admin-nav-item ${currentNavTab === 'donations' ? 'active' : ''}`}
            onClick={() => setCurrentNavTab('donations')}
          >
            <Target size={20} /> Donations
          </button>
          <button
            className={`admin-nav-item ${currentNavTab === 'upload' ? 'active' : ''}`}
            onClick={() => setCurrentNavTab('upload')}
          >
            <Upload size={20} /> Upload QR
          </button>
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="admin-main-content">
        {/* Top Navbar */}
        <header className="admin-top-navbar">
          <button className="admin-toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          <h1>Admin Dashboard</h1>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </header>

        {/* Content Area */}
        <div className="admin-content-area">
          {/* DASHBOARD TAB */}
          {currentNavTab === 'dashboard' && (
            <motion.div
              className="admin-tab-content dashboard-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Stats Cards */}
              <div className="admin-stats-grid">
                <motion.div className="admin-stat-card" whileHover={{ y: -5 }}>
                  <div className="stat-icon users-icon">
                    <Users size={28} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Total Users</p>
                    <h3 className="stat-value">{dashboardStats.totalUsers}</h3>
                  </div>
                </motion.div>

                <motion.div className="admin-stat-card" whileHover={{ y: -5 }}>
                  <div className="stat-icon messages-icon">
                    <MessageSquare size={28} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Total Messages</p>
                    <h3 className="stat-value">{dashboardStats.totalMessages}</h3>
                  </div>
                </motion.div>

                <motion.div className="admin-stat-card" whileHover={{ y: -5 }}>
                  <div className="stat-icon revenue-icon">
                    <TrendingUp size={28} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Total Revenue</p>
                    <h3 className="stat-value">₹{(dashboardStats.totalRevenue || 0).toLocaleString()}</h3>
                  </div>
                </motion.div>

                <motion.div className="admin-stat-card" whileHover={{ y: -5 }}>
                  <div className="stat-icon active-icon">
                    <Zap size={28} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Active Users</p>
                    <h3 className="stat-value">{dashboardStats.activeUsers}</h3>
                  </div>
                </motion.div>
              </div>

              {/* Charts Section */}
              <div className="admin-charts-grid">
                {/* User Status Distribution */}
                {userStats.statusCount && Object.keys(userStats.statusCount).length > 0 && (
                  <motion.div className="admin-chart-card" whileHover={{ y: -5 }}>
                    <h3>User Distribution by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(userStats.statusCount).map(([name, value]) => ({
                            name: name.charAt(0).toUpperCase() + name.slice(1),
                            value
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.keys(userStats.statusCount).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#4f46e5', '#ec4899', '#10b981', '#f59e0b'][index % 4]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {/* Messages by Status */}
                {Object.keys(messagesByStatus).length > 0 && (
                  <motion.div className="admin-chart-card" whileHover={{ y: -5 }}>
                    <h3>Messages by User Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(messagesByStatus).map(([name, value]) => ({ name, value }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#4f46e5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* USERS TAB */}
          {currentNavTab === 'users' && (
            <motion.div
              className="admin-tab-content users-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="admin-users-header">
                <h2>User Management</h2>
                <div className="admin-users-controls">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="admin-search-input"
                  />
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="admin-filter-select"
                  >
                    <option value="all">All Users</option>
                    <option value="employed">Employed</option>
                    <option value="graduated">Graduated</option>
                    <option value="pursuing">Pursuing</option>
                  </select>
                </div>
              </div>

              <div className="admin-users-table-container">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredUsers().map((user) => (
                      <motion.tr key={user.id} whileHover={{ backgroundColor: '#f8fafc' }}>
                        <td>{user.fullname}</td>
                        <td>{user.email}</td>
                        <td>{user.company || '-'}</td>
                        <td>
                          <span className={`admin-status-badge status-${user.status}`}>
                            {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                          </span>
                        </td>
                        <td>{user.city || '-'}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-action-btn view-btn" title="View">
                              <Eye size={16} />
                            </button>
                            <button className="admin-action-btn delete-btn" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {getFilteredUsers().length === 0 && (
                  <p className="admin-empty-message">No users found</p>
                )}
              </div>
            </motion.div>
          )}

          {/* MESSAGING TAB */}
          {currentNavTab === 'messaging' && (
            <motion.div
              className="admin-tab-content messaging-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="admin-messaging-container">
                <h2>Send Message to Users</h2>
                <form onSubmit={handleSendMessage} className="admin-message-form">
                  <div className="admin-form-group">
                    <label>Target User Category</label>
                    <select
                      value={messageForm.status}
                      onChange={(e) => setMessageForm({ ...messageForm, status: e.target.value })}
                      className="admin-form-select"
                    >
                      <option value="employed">Employed</option>
                      <option value="graduated">Graduated</option>
                      <option value="pursuing">Pursuing</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Message</label>
                    <textarea
                      value={messageForm.message}
                      onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                      placeholder="Enter your message here..."
                      className="admin-form-textarea"
                      rows="6"
                    />
                  </div>

                  <button type="submit" className="admin-submit-btn">
                    <Send size={18} /> Send Message
                  </button>
                </form>

                {/* Message Stats */}
                {Object.keys(messagesByStatus).length > 0 && (
                  <div className="admin-message-stats">
                    <h3>Message Statistics</h3>
                    <div className="admin-stats-list">
                      {Object.entries(messagesByStatus).map(([status, count]) => (
                        <div key={status} className="admin-stat-row">
                          <span className="admin-stat-label">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                          <span className="admin-stat-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* DONATIONS TAB */}
          {currentNavTab === 'donations' && (
            <motion.div
              className="admin-tab-content donations-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Donation Analytics</h2>

              {/* Old Age Homes Section */}
              <div className="admin-donation-section">
                <h3>Old Age Homes</h3>
                <div className="admin-donation-items">
                  {oldAgeHomes.map((home) => (
                    <motion.div key={home.id} className="admin-donation-card" whileHover={{ y: -5 }}>
                      <h4>{home.name}</h4>
                      {home.qr_url && (
                        <img src={home.qr_url} alt={home.name} className="admin-qr-image" />
                      )}
                      <a href={home.qr_url} download className="admin-download-link">
                        <Download size={16} /> Download QR
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Orphans Section */}
              <div className="admin-donation-section">
                <h3>Orphanages</h3>
                <div className="admin-donation-items">
                  {orphans.map((orphan) => (
                    <motion.div key={orphan.id} className="admin-donation-card" whileHover={{ y: -5 }}>
                      <h4>{orphan.name}</h4>
                      {orphan.qr_url && (
                        <img src={orphan.qr_url} alt={orphan.name} className="admin-qr-image" />
                      )}
                      <a href={orphan.qr_url} download className="admin-download-link">
                        <Download size={16} /> Download QR
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* UPLOAD TAB */}
          {currentNavTab === 'upload' && (
            <motion.div
              className="admin-tab-content upload-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Upload QR Codes</h2>
              <form onSubmit={handleQRUpload} className="admin-upload-form">
                <div className="admin-form-group">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder="Enter organization name"
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Organization Type</label>
                  <select
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                    className="admin-form-select"
                  >
                    <option value="old-age">Old Age Home</option>
                    <option value="orphan">Orphanage</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>QR Code Image (Required)</label>
                  <input
                    type="file"
                    ref={fileRef}
                    accept="image/*"
                    onChange={(e) => setUploadForm({ ...uploadForm, qrImage: e.target.files[0] })}
                    className="admin-form-file"
                  />
                  {uploadForm.qrImage && <p className="admin-file-name">{uploadForm.qrImage.name}</p>}
                </div>

                <div className="admin-form-group">
                  <label>Organization Image (Optional)</label>
                  <input
                    type="file"
                    ref={homeFileRef}
                    accept="image/*"
                    onChange={(e) => setUploadForm({ ...uploadForm, homeImage: e.target.files[0] })}
                    className="admin-form-file"
                  />
                  {uploadForm.homeImage && <p className="admin-file-name">{uploadForm.homeImage.name}</p>}
                </div>

                <button type="submit" disabled={uploadLoading} className="admin-submit-btn">
                  {uploadLoading ? 'Uploading...' : 'Upload QR Code'}
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </main>
    </motion.div>
  );
}

export default AdminDashboard;
