import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Briefcase, Target, Star, TrendingUp } from 'lucide-react';
import Footer from '../components/Footer';
import '../styles/home.css';

function Home() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  const features = [
    {
      icon: Users,
      title: 'Connect with Professionals',
      description: 'Build meaningful relationships with experienced professionals in your field and expand your network globally.',
    },
    {
      icon: Briefcase,
      title: 'Career Growth',
      description: 'Access exclusive opportunities, mentorship, and resources to accelerate your career development.',
    },
    {
      icon: Target,
      title: 'Skill Development',
      description: 'Learn from industry experts and upskill yourself with curated resources and guidance.',
    },
    {
      icon: TrendingUp,
      title: 'Real-time Updates',
      description: 'Stay informed with the latest industry trends, job opportunities, and professional insights.',
    },
  ];

  const stats = [
    { number: '50K+', label: 'Active Members' },
    { number: '1000+', label: 'Companies' },
    { number: '100K+', label: 'Connections' },
    { number: '95%', label: 'Success Rate' },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer at TechCorp',
      text: 'Skill Connect helped me find my dream job. The professional community here is amazing!',
    },
    {
      name: 'Raj Patel',
      role: 'Product Manager',
      text: 'I connected with industry mentors who guided me through a career transition. Highly recommended!',
    },
    {
      name: 'Emma Williams',
      role: 'UX Designer',
      text: 'The opportunities here are endless. Made valuable connections that led to amazing projects.',
    },
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
            {/* Left Content */}
            <div className="hero-text">
              <div className="hero-badge">
                <span>Welcome to the Future of Networking</span>
              </div>
              <h1 className="hero-title">
                Connect. Grow. Succeed Together
              </h1>
              <p className="hero-description">
                Join thousands of professionals building meaningful connections and accelerating their careers through our innovative platform.
              </p>

              {/* CTA Buttons */}
              <div className="hero-buttons">
                <button onClick={handleGetStarted} className="btn-primary">
                  Get Started <ArrowRight size={20} />
                </button>
                <button className="btn-secondary">
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="hero-image">
              <div className="hero-image-box">
                <div className="hero-image-content">
                  <Users size={80} />
                  <p>Professional Network</p>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <p className="stat-number">{stat.number}</p>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-header">
          <h2>Why Join Skill Connect?</h2>
          <p>Experience a platform designed to empower professionals like you to achieve your goals.</p>
        </div>

        <div className="features-container">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <IconComponent size={32} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-header">
          <h2>Success Stories</h2>
          <p>Hear from our community members about their transformative experiences.</p>
        </div>

        <div className="testimonials-container">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="star" />
                ))}
              </div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-divider"></div>
              <p className="testimonial-name">{testimonial.name}</p>
              <p className="testimonial-role">{testimonial.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Transform Your Career?</h2>
          <p>Join thousands of professionals building connections and advancing their careers on Skill Connect.</p>
          <button onClick={handleGetStarted} className="cta-button">
            Get Started Free <ArrowRight size={24} />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
