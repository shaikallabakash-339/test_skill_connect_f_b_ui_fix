/*
 * Copyright (c) 2025-2026 Your Company Name
 * All rights reserved.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import '../styles/admin-dashboard.css';

function AdminDashboard() {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // User-related states
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({ totalUsers: 0, statusCount: {}, cityCount: {}, stateCount: {}, countryCount: {}, qualificationByYearStatus: {}, branchByQualYearStatus: {} });
  const [messageStats, setMessageStats] = useState({ totalMessages: 0, categoryCount: {}, messages: [] });
  const [messages, setMessages] = useState({ employed: '', graduated: '', pursuing: '' });
  const [filter, setFilter] = useState({ city: '', state: '', country: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Premium Subscription Management
  const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  // Donation-related states
  const [qrUpload, setQrUpload] = useState({ name: '', type: 'old-age', qrImage: null, homeImage: null });
  const [oldAgeHomes, setOldAgeHomes] = useState([]);
  const [orphans, setOrphans] = useState([]);
  const [oldAgeStats, setOldAgeStats] = useState([]);
  const [orphanStats, setOrphanStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchUserStats(),
        fetchMessageStats(),
        fetchData(),
        fetchPendingSubscriptions(),
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const admin = localStorage.getItem('admin');
    if (!admin) {
      navigate('/admin-login');
      return;
    }
    fetchAllData();
  }, [navigate, fetchAllData]);

  // User-related functions
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/all-users`);
      if (res.data && res.data.users) {
        setUsers(res.data.users);
      } else {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/user-stats`);
      if (res.data.success) {
        setUserStats(res.data);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const fetchMessageStats = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/message-stats`);
      if (res.data.success) {
        setMessageStats(res.data);
      }
    } catch (err) {
      console.error('Error fetching message stats:', err);
    }
  };

  const fetchPendingSubscriptions = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/subscriptions/admin/pending`);
      if (res.data && res.data.success) {
        setPendingSubscriptions(res.data.subscriptions || []);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    }
  };

  const handleMessageSend = async (category) => {
    try {
      if (!messages[category].trim()) {
        alert('Please enter a message');
        return;
      }
      const res = await axios.post(`${apiUrl}/api/send-message`, {
        category,
        message: messages[category]
      });
      if (res.data.success) {
        alert(`Message sent to ${category} users`);
        setMessages({ ...messages, [category]: '' });
        fetchMessageStats();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    }
  };

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter an email to search');
      setSearchedUser(null);
      return;
    }

    setIsSearching(true);
    setSearchError('');
    try {
      const email = searchQuery.trim().toLowerCase();
      const res = await axios.get(`${apiUrl}/api/resumes/${email}`);
      if (res.data && res.data.success) {
        setSearchedUser({ email, resumes: res.data.resumes || [] });
      } else {
        setSearchedUser(null);
        setSearchError('No resumes found for this user');
      }
    } catch (err) {
      console.error('Error fetching resume:', err);
      setSearchedUser(null);
      setSearchError('Error searching for user or no data found');
    } finally {
      setIsSearching(false);
    }
  };

  // Premium Subscription Management
  const handleSubscriptionApprove = async (subscriptionId) => {
    try {
      const res = await axios.post(`${apiUrl}/api/subscriptions/admin/approve/${subscriptionId}`);
      if (res.data.success) {
        alert('Premium subscription approved!');
        fetchPendingSubscriptions();
        setShowSubscriptionModal(false);
        setSelectedSubscription(null);
      }
    } catch (err) {
      console.error('Error approving subscription:', err);
      alert('Failed to approve subscription');
    }
  };

  const handleSubscriptionReject = async (subscriptionId) => {
    try {
      const res = await axios.post(`${apiUrl}/api/subscriptions/admin/reject/${subscriptionId}`);
      if (res.data.success) {
        alert('Premium subscription rejected!');
        fetchPendingSubscriptions();
        setShowSubscriptionModal(false);
        setSelectedSubscription(null);
      }
    } catch (err) {
      console.error('Error rejecting subscription:', err);
      alert('Failed to reject subscription');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    navigate('/admin-login');
  };

  // Donation-related functions
  const fetchData = async () => {
    try {
      const [oldAgeRes, orphansRes, oldAgeStatsRes, orphanStatsRes] = await Promise.all([
        axios.get(`${apiUrl}/api/old-age-homes`),
        axios.get(`${apiUrl}/api/orphans`),
        axios.get(`${apiUrl}/api/old-age-homes-stats`),
        axios.get(`${apiUrl}/api/orphans-stats`),
      ]);
      setOldAgeHomes(oldAgeRes.data.data || []);
      setOrphans(orphansRes.data.data || []);
      setOldAgeStats(oldAgeStatsRes.data.data || []);
      setOrphanStats(orphanStatsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load donation data');
    }
  };

  const handleQrUploadChange = (e) => {
    setQrUpload({ ...qrUpload, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }
    if (file && !['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Please upload a JPEG or PNG file');
      return;
    }
    setQrUpload({ ...qrUpload, [e.target.name]: file });
  };

  const handleQrUpload = async (e) => {
    e.preventDefault();
    if (!qrUpload.name || !qrUpload.qrImage || !qrUpload.type) {
      alert('Please provide name, type, and QR image');
      return;
    }

    const formData = new FormData();
    formData.append('qrImage', qrUpload.qrImage);
    if (qrUpload.homeImage) formData.append('homeImage', qrUpload.homeImage);
    formData.append('name', qrUpload.name);
    formData.append('type', qrUpload.type);

    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/api/upload-qr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        alert('QR code uploaded successfully!');
        fetchData();
        setQrUpload({ name: '', type: 'old-age', qrImage: null, homeImage: null });
        document.querySelectorAll('input[type="file"]').forEach(input => (input.value = ''));
      }
    } catch (err) {
      console.error('Upload error:', err.response?.data || err);
      alert(`Failed to upload QR: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDailyAmount = (stats, name, date) => {
    const stat = stats.find(s => s.item_name === name && s.date === date);
    return stat ? parseFloat(stat.total_amount).toFixed(2) : '0.00';
  };

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Prepare chart data
  const statusData = [
    { name: 'Employed', value: userStats.statusCount?.employed || 0 },
    { name: 'Graduated', value: userStats.statusCount?.graduated || 0 },
    { name: 'Pursuing', value: userStats.statusCount?.pursuing || 0 },
  ];

  const messageData = [
    { name: 'Employed', value: messageStats.categoryCount?.employed || 0 },
    { name: 'Graduated', value: messageStats.categoryCount?.graduated || 0 },
    { name: 'Pursuing', value: messageStats.categoryCount?.pursuing || 0 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const filteredUsers = users.filter(user =>
    (!filter.city || user.city === filter.city) &&
    (!filter.state || user.state === filter.state) &&
    (!filter.country || user.country === filter.country)
  );

  const sortMessagesByRecent = (msgs) => {
    return msgs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'messaging' ? 'active' : ''}`}
          onClick={() => setActiveTab('messaging')}
        >
          Messages
        </button>
        <button
          className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          Premium ({pendingSubscriptions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'donations' ? 'active' : ''}`}
          onClick={() => setActiveTab('donations')}
        >
          Donations
        </button>
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Search Users
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-content">
              <div className="charts-section">
                <h3>User Statistics (Total: {userStats.totalUsers})</h3>
                <div className="filter-section">
                  <select name="city" value={filter.city} onChange={handleFilterChange}>
                    <option value="">Filter by City</option>
                    {Object.keys(userStats.cityCount || {}).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <select name="state" value={filter.state} onChange={handleFilterChange}>
                    <option value="">Filter by State</option>
                    {Object.keys(userStats.stateCount || {}).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <select name="country" value={filter.country} onChange={handleFilterChange}>
                    <option value="">Filter by Country</option>
                    {Object.keys(userStats.countryCount || {}).map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div className="chart-row">
                  <div className="chart-container">
                    <h4>Status Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-container">
                    <h4>Messages Sent: {messageStats.totalMessages}</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={messageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messaging Tab */}
          {activeTab === 'messaging' && (
            <div className="message-section">
              <h3>Send Messages to Users</h3>
              <div className="message-boxes">
                <motion.div className="message-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h4>Employed Users</h4>
                  <textarea
                    value={messages.employed}
                    onChange={(e) => setMessages({ ...messages, employed: e.target.value })}
                    placeholder="Message for employed users"
                    rows={6}
                  />
                  <button onClick={() => handleMessageSend('employed')}>Send</button>
                </motion.div>
                <motion.div className="message-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h4>Graduated Users</h4>
                  <textarea
                    value={messages.graduated}
                    onChange={(e) => setMessages({ ...messages, graduated: e.target.value })}
                    placeholder="Message for graduated users"
                    rows={6}
                  />
                  <button onClick={() => handleMessageSend('graduated')}>Send</button>
                </motion.div>
                <motion.div className="message-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h4>Pursuing Users</h4>
                  <textarea
                    value={messages.pursuing}
                    onChange={(e) => setMessages({ ...messages, pursuing: e.target.value })}
                    placeholder="Message for pursuing users"
                    rows={6}
                  />
                  <button onClick={() => handleMessageSend('pursuing')}>Send</button>
                </motion.div>
              </div>

              <div className="message-history-section">
                <h3>Message History</h3>
                <div className="message-history-container">
                  <div className="message-history">
                    <h4>Employed</h4>
                    {messageStats.messages?.filter(m => m.category === 'employed').length > 0 ? (
                      sortMessagesByRecent(messageStats.messages.filter(m => m.category === 'employed')).map((msg, idx) => (
                        <div key={idx} className="message-history-item">
                          <p>{msg.message}</p>
                          <small>{new Date(msg.timestamp).toLocaleString()}</small>
                        </div>
                      ))
                    ) : (
                      <p>No messages sent</p>
                    )}
                  </div>
                  <div className="message-history">
                    <h4>Graduated</h4>
                    {messageStats.messages?.filter(m => m.category === 'graduated').length > 0 ? (
                      sortMessagesByRecent(messageStats.messages.filter(m => m.category === 'graduated')).map((msg, idx) => (
                        <div key={idx} className="message-history-item">
                          <p>{msg.message}</p>
                          <small>{new Date(msg.timestamp).toLocaleString()}</small>
                        </div>
                      ))
                    ) : (
                      <p>No messages sent</p>
                    )}
                  </div>
                  <div className="message-history">
                    <h4>Pursuing</h4>
                    {messageStats.messages?.filter(m => m.category === 'pursuing').length > 0 ? (
                      sortMessagesByRecent(messageStats.messages.filter(m => m.category === 'pursuing')).map((msg, idx) => (
                        <div key={idx} className="message-history-item">
                          <p>{msg.message}</p>
                          <small>{new Date(msg.timestamp).toLocaleString()}</small>
                        </div>
                      ))
                    ) : (
                      <p>No messages sent</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Premium Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="subscriptions-section">
              <h3>Premium Subscription Requests ({pendingSubscriptions.length})</h3>
              {pendingSubscriptions.length > 0 ? (
                <div className="subscriptions-grid">
                  {pendingSubscriptions.map((sub) => (
                    <motion.div key={sub.id} className="subscription-card" whileHover={{ y: -5 }}>
                      <h4>{sub.user_email}</h4>
                      <p><strong>Plan:</strong> {sub.plan}</p>
                      <p><strong>Amount:</strong> ₹{sub.amount}</p>
                      <p><strong>Status:</strong> {sub.status}</p>
                      {sub.screenshot_url && (
                        <div className="screenshot-preview">
                          <img src={sub.screenshot_url} alt="Payment" style={{ maxWidth: '100%', height: '200px' }} />
                        </div>
                      )}
                      <div className="subscription-actions">
                        <button className="approve-btn" onClick={() => {
                          setSelectedSubscription(sub);
                          setShowSubscriptionModal(true);
                        }}>Review</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p>No pending requests</p>
              )}

              {showSubscriptionModal && selectedSubscription && (
                <div className="modal-overlay" onClick={() => setShowSubscriptionModal(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3>Review Subscription</h3>
                    <p><strong>Email:</strong> {selectedSubscription.user_email}</p>
                    <p><strong>Plan:</strong> {selectedSubscription.plan}</p>
                    <p><strong>Amount:</strong> ₹{selectedSubscription.amount}</p>
                    {selectedSubscription.screenshot_url && (
                      <img src={selectedSubscription.screenshot_url} alt="Payment" style={{ maxWidth: '100%', marginTop: '15px' }} />
                    )}
                    <div className="modal-actions">
                      <button className="approve-btn" onClick={() => handleSubscriptionApprove(selectedSubscription.id)}>Approve</button>
                      <button className="reject-btn" onClick={() => handleSubscriptionReject(selectedSubscription.id)}>Reject</button>
                      <button className="close-btn" onClick={() => setShowSubscriptionModal(false)}>Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Donations Tab */}
          {activeTab === 'donations' && (
            <div className="donations-section">
              <div className="qr-upload-section">
                <h3>Upload QR Codes</h3>
                <form onSubmit={handleQrUpload} className="qr-upload-form">
                  <input
                    type="text"
                    name="name"
                    value={qrUpload.name}
                    onChange={handleQrUploadChange}
                    placeholder="Organization Name"
                    required
                    className="input-field"
                  />
                  <select name="type" value={qrUpload.type} onChange={handleQrUploadChange} required className="input-field">
                    <option value="old-age">Old Age Home</option>
                    <option value="orphan">Orphanage</option>
                  </select>
                  <input type="file" accept="image/jpeg,image/png" name="qrImage" onChange={handleFileChange} required className="input-field" />
                  <input type="file" accept="image/jpeg,image/png" name="homeImage" onChange={handleFileChange} className="input-field" />
                  <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
                </form>
              </div>

              <div className="stats-section">
                <h3>Old Age Homes ({oldAgeHomes.length})</h3>
                <table className="stats-table">
                  <thead>
                    <tr><th>Name</th><th>QR Code</th><th>Image</th><th>Today</th><th>Yesterday</th></tr>
                  </thead>
                  <tbody>
                    {oldAgeHomes.map(home => (
                      <tr key={home.id}>
                        <td>{home.name}</td>
                        <td><img src={home.qr_url} alt="QR" style={{ maxWidth: '80px' }} /></td>
                        <td>{home.home_url ? <img src={home.home_url} alt="Home" style={{ maxWidth: '80px' }} /> : 'N/A'}</td>
                        <td>₹{getDailyAmount(oldAgeStats, home.name, today)}</td>
                        <td>₹{getDailyAmount(oldAgeStats, home.name, yesterday)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ marginTop: '30px' }}>Orphanages ({orphans.length})</h3>
                <table className="stats-table">
                  <thead>
                    <tr><th>Name</th><th>QR Code</th><th>Image</th><th>Today</th><th>Yesterday</th></tr>
                  </thead>
                  <tbody>
                    {orphans.map(orphan => (
                      <tr key={orphan.id}>
                        <td>{orphan.name}</td>
                        <td><img src={orphan.qr_url} alt="QR" style={{ maxWidth: '80px' }} /></td>
                        <td>{orphan.home_url ? <img src={orphan.home_url} alt="Home" style={{ maxWidth: '80px' }} /> : 'N/A'}</td>
                        <td>₹{getDailyAmount(orphanStats, orphan.name, today)}</td>
                        <td>₹{getDailyAmount(orphanStats, orphan.name, yesterday)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="search-section">
              <h3>Search User Resumes</h3>
              <div className="search-container-wrapper">
                <div className="user-table-container">
                  <h4>Users</h4>
                  {filteredUsers.length > 0 ? (
                    <div className="user-table-wrapper">
                      <table className="user-table">
                        <thead><tr><th>Email</th></tr></thead>
                        <tbody>
                          {filteredUsers.map((user, idx) => (
                            <tr key={idx} onClick={() => {
                              setSearchQuery(user.email);
                              handleSearch();
                            }} style={{ cursor: 'pointer' }}>
                              <td>{user.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p>No users found</p>
                  )}
                </div>
                <div className="search-container">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter email"
                    className="search-input"
                  />
                  <button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
              {searchError && <p style={{ color: 'red' }}>{searchError}</p>}
              {searchedUser && (
                <div className="document-display">
                  <h4>Resumes for {searchedUser.email}:</h4>
                  {searchedUser.resumes?.length > 0 ? (
                    <ul>
                      {searchedUser.resumes.map((res, idx) => (
                        <li key={idx}><a href={res.minio_url} target="_blank" rel="noopener noreferrer">{res.filename}</a></li>
                      ))}
                    </ul>
                  ) : (
                    <p>No resumes</p>
                  )}
                </div>
              )}
            </div>
          )}

          <Footer />
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
