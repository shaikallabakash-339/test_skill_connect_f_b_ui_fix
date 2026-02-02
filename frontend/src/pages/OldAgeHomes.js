import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload, X, AlertCircle } from 'lucide-react';
import '../styles/donations.css';

const OldAgeHomes = () => {
  const navigate = useNavigate();
  const [homes, setHomes] = useState([]);
  const [selectedHome, setSelectedHome] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [homeCount, setHomeCount] = useState(0);
  const [transactionData, setTransactionData] = useState({
    amount: '',
    name: '',
    email: '',
    phone: '',
    screenshot: null
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchHomes();
  }, []);

  const fetchHomes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/api/old-age-homes`);
      if (response.data && response.data.data) {
        setHomes(response.data.data);
        setHomeCount(response.data.data.length);
      } else {
        setHomes([]);
        setError('No homes available at the moment.');
      }
    } catch (err) {
      console.error('Error fetching homes:', err);
      setError('Failed to load homes. Please try again later.');
      setHomes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHome = (home) => {
    setSelectedHome(home);
    setShowPayment(true);
    setTransactionData({
      amount: '',
      name: '',
      email: '',
      phone: '',
      screenshot: null
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    setTransactionData({ ...transactionData, screenshot: file });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransactionData({ ...transactionData, [name]: value });
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    
    if (!transactionData.screenshot) {
      alert('Please upload a transaction screenshot.');
      return;
    }

    if (!transactionData.amount || !transactionData.name || !transactionData.email || !transactionData.phone) {
      alert('Please fill all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('screenshot', transactionData.screenshot);
    formData.append('type', 'old-age');
    formData.append('item_id', selectedHome.id);
    formData.append('item_name', selectedHome.name);
    formData.append('amount', transactionData.amount);
    formData.append('name', transactionData.name);
    formData.append('email', transactionData.email);
    formData.append('phone', transactionData.phone);

    try {
      const response = await axios.post(`${apiUrl}/api/upload-transaction`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        alert('Transaction submitted successfully! Thank you for your donation.');
        setShowPayment(false);
        setSelectedHome(null);
        setTransactionData({
          amount: '',
          name: '',
          email: '',
          phone: '',
          screenshot: null
        });
        navigate('/user-dashboard');
      }
    } catch (err) {
      console.error('Error submitting transaction:', err.response?.data || err);
      alert(`Failed to submit transaction: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="donation-container">
      <div className="donation-header">
        <h1 className="title">Support Old Age Homes</h1>
        <p className="subtitle">Help provide care and comfort to elderly in need</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading homes...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={24} />
          <p>{error}</p>
          <button onClick={fetchHomes} className="retry-btn">Retry</button>
        </div>
      ) : !showPayment ? (
        <div className="homes-grid">
          {homes.length > 0 ? (
            homes.map((home) => (
              <motion.div
                key={home.id}
                className="home-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
              >
                {home.home_url && (
                  <div className="home-image-container">
                    <img src={home.home_url} alt={home.name} className="home-image" />
                  </div>
                )}
                <div className="home-content">
                  <h3 className="home-name">{home.name}</h3>
                  <div className="qr-code-container">
                    {home.qr_url && <img src={home.qr_url} alt="UPI QR Code" className="qr-code" />}
                  </div>
                  <p className="qr-label">Scan to Donate via UPI</p>
                  <button
                    onClick={() => handleSelectHome(home)}
                    className="donate-button"
                  >
                    Donate Now
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="no-homes">
              <p>No homes available at the moment.</p>
            </div>
          )}
        </div>
      ) : (
        <motion.div className="payment-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="payment-header-close">
            <h2 className="payment-title">Donate to {selectedHome?.name}</h2>
            <button className="close-btn" onClick={() => setShowPayment(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="qr-display">
            {selectedHome?.qr_url && (
              <img src={selectedHome.qr_url} alt="UPI QR Code" className="qr-large" />
            )}
            <p className="qr-instruction">Scan the QR code above using any UPI app to make payment</p>
          </div>

          <form onSubmit={handleSubmitTransaction} className="transaction-form">
            <div className="form-group">
              <label htmlFor="amount">Donation Amount (₹)</label>
              <input
                id="amount"
                type="number"
                name="amount"
                placeholder="e.g., 500"
                value={transactionData.amount}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={transactionData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={transactionData.email}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="+91 99999 99999"
                value={transactionData.phone}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label htmlFor="screenshot">Payment Proof Screenshot</label>
              <label htmlFor="screenshot-input" className="file-upload-label">
                <Upload size={20} />
                <p>Click to upload or drag & drop</p>
                <small>PNG, JPG, PDF (Max 5MB)</small>
              </label>
              <input
                id="screenshot-input"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                required
                className="file-input-hidden"
              />
              {transactionData.screenshot && (
                <p className="file-selected">{transactionData.screenshot.name}</p>
              )}
            </div>

            <div className="form-buttons">
              <button type="submit" className="submit-button">Submit Donation Proof</button>
              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="back-button"
              >
                Back to List
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default OldAgeHomes;
