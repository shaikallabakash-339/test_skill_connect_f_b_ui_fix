import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload, X, AlertCircle, Heart, Share2, Clock, MapPin, Users, Book, ArrowRight, Check } from 'lucide-react';
import '../styles/donations.css';

const Orphans = () => {
  const navigate = useNavigate();
  const [orphans, setOrphans] = useState([]);
  const [selectedOrphan, setSelectedOrphan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactionData, setTransactionData] = useState({
    amount: '',
    name: '',
    email: '',
    phone: '',
    screenshot: null
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchOrphans = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/api/orphans`);
      if (response.data && response.data.data) {
        setOrphans(response.data.data);
      } else {
        setOrphans([]);
        setError('No orphanages available at the moment.');
      }
    } catch (err) {
      console.error('Error fetching orphans:', err);
      setError('Failed to load orphanages. Please try again later.');
      setOrphans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrphans();
  }, []);

  const handleSelectOrphan = (orphan) => {
    setSelectedOrphan(orphan);
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
    formData.append('type', 'orphan');
    formData.append('item_id', selectedOrphan.id);
    formData.append('item_name', selectedOrphan.name);
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
        setSelectedOrphan(null);
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div style={{ color: 'white', padding: '60px 40px', textAlign: 'center' }}>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '48px', fontWeight: 'bold', margin: '0 0 20px 0' }}
        >
          🏡 Support Orphanages
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ fontSize: '20px', margin: 0, opacity: 0.9 }}
        >
          Help provide education, care, and hope to children in need
        </motion.p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 40px 40px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #667eea',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <p style={{ fontSize: '18px', color: '#666' }}>Loading orphanages...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '40px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}
          >
            <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '20px' }} />
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>{error}</p>
            <button
              onClick={fetchOrphans}
              style={{
                padding: '12px 32px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </motion.div>
        ) : !showPayment ? (
          <>
            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
              }}
            >
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', marginBottom: '10px' }}>
                  {orphans.length}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Orphanages Supported</div>
              </div>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📚</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Education Programs</div>
              </div>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>❤️</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Care & Support</div>
              </div>
            </motion.div>

            {/* Orphanages Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '30px'
            }}>
              {orphans.length > 0 ? (
                orphans.map((orphan, idx) => (
                  <motion.div
                    key={orphan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -8 }}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Image */}
                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                      {orphan.home_url ? (
                        <img
                          src={orphan.home_url}
                          alt={orphan.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ fontSize: '64px' }}>🏡</span>
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#ef4444',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Heart size={16} /> Help Needed
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#1f2937' }}>
                        {orphan.name}
                      </h3>

                      {/* QR Code */}
                      {orphan.qr_url && (
                        <div style={{
                          background: '#f3f4f6',
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '16px',
                          textAlign: 'center'
                        }}>
                          <img
                            src={orphan.qr_url}
                            alt="UPI QR Code"
                            style={{
                              width: '120px',
                              height: '120px',
                              margin: '0 auto'
                            }}
                          />
                          <p style={{
                            margin: '8px 0 0 0',
                            fontSize: '12px',
                            color: '#666',
                            fontWeight: '600'
                          }}>
                            Quick Donate via UPI
                          </p>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        color: '#666'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Users size={14} /> Children Helped
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Book size={14} /> Education
                        </span>
                      </div>

                      {/* Donate Button */}
                      <motion.button
                        onClick={() => handleSelectOrphan(orphan)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        Donate Now
                        <ArrowRight size={18} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'white',
                  borderRadius: '16px'
                }}>
                  <p style={{ fontSize: '18px', color: '#666', margin: 0 }}>
                    No orphanages available at the moment.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Payment Modal */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '500px',
              margin: '0 auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                Donate to {selectedOrphan?.name}
              </h2>
              <button
                onClick={() => setShowPayment(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* QR Code */}
            {selectedOrphan?.qr_url && (
              <div style={{
                background: '#f3f4f6',
                padding: '30px',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '30px'
              }}>
                <img
                  src={selectedOrphan.qr_url}
                  alt="UPI QR Code"
                  style={{
                    width: '200px',
                    height: '200px',
                    marginBottom: '15px'
                  }}
                />
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  📱 Scan with any UPI app to make payment
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitTransaction}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Donation Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  placeholder="e.g., 500"
                  value={transactionData.amount}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    value={transactionData.name}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={transactionData.email}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 99999 99999"
                  value={transactionData.phone}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Payment Proof
                </label>
                <label style={{
                  display: 'block',
                  border: '2px dashed #667eea',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}>
                  <Upload size={24} color="#667eea" style={{ margin: '0 auto 10px' }} />
                  <p style={{ margin: '0 0 5px 0', fontWeight: '600', color: '#667eea' }}>
                    Click to upload
                  </p>
                  <small style={{ color: '#999' }}>PNG, JPG (Max 5MB)</small>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    style={{ display: 'none' }}
                  />
                </label>
                {transactionData.screenshot && (
                  <p style={{
                    marginTop: '10px',
                    fontSize: '13px',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <Check size={16} /> {transactionData.screenshot.name}
                  </p>
                )}
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '10px'
                }}
              >
                Submit Donation
              </button>
              <button
                type="button"
                onClick={() => setShowPayment(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};
};

export default Orphans;
