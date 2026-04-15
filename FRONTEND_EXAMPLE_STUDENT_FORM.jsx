// Example React Component for Student Form
// Save this as: frontend/pages/SubmitForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SubmitForm = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    city: '',
    state: '',
    interested: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const franchiseID = queryParams.get('franchise');
  const phoneNumber = queryParams.get('phone');

  useEffect(() => {
    // Check if phone already submitted
    const checkPhone = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/franchise/student/check-phone?phoneNumber=${phoneNumber}&franchiseID=${franchiseID}`
        );
        
        if (response.data.alreadySubmitted) {
          setAlreadySubmitted(true);
          setError('You have already submitted a response. Thank you!');
        }
      } catch (err) {
        console.error('Error checking phone:', err);
      }
    };

    if (phoneNumber && franchiseID) {
      checkPhone();
    }
  }, [phoneNumber, franchiseID]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterest = (value) => {
    setFormData(prev => ({
      ...prev,
      interested: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.studentName || !formData.city || !formData.state || formData.interested === null) {
        setError('All fields are required');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'http://localhost:3000/api/franchise/student/submit-form',
        {
          phoneNumber,
          franchiseID,
          studentName: formData.studentName,
          city: formData.city,
          state: formData.state,
          interested: formData.interested
        }
      );

      if (response.data.status) {
        setSuccess('Form submitted successfully! Thank you for your interest.');
        setFormData({
          studentName: '',
          city: '',
          state: '',
          interested: null,
        });
        // Optionally redirect or show success message
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  if (alreadySubmitted) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '50px auto', 
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px'
      }}>
        <h2>Already Submitted</h2>
        <p>Thank you! We have already received your response.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '50px auto', 
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h1>Student Interest Form</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Please help us understand your interest in our programs
      </p>

      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px',
          borderLeft: '4px solid #c00'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: '#efe',
          color: '#060',
          borderRadius: '4px',
          borderLeft: '4px solid #060'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Full Name *
          </label>
          <input
            type="text"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            placeholder="Enter your full name"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            disabled={loading}
          />
        </div>

        {/* City */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter your city"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            disabled={loading}
          />
        </div>

        {/* State */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            State *
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="Enter your state"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            disabled={loading}
          />
        </div>

        {/* Interest */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Are you interested? *
          </label>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              type="button"
              onClick={() => handleInterest(true)}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: formData.interested === true ? '#4CAF50' : '#f0f0f0',
                color: formData.interested === true ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.3s'
              }}
              disabled={loading}
            >
              ✓ Yes, Interested
            </button>
            <button
              type="button"
              onClick={() => handleInterest(false)}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: formData.interested === false ? '#f44336' : '#f0f0f0',
                color: formData.interested === false ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.3s'
              }}
              disabled={loading}
            >
              ✗ Not Interested
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.3s'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Form'}
        </button>
      </form>

      <p style={{ 
        marginTop: '20px', 
        fontSize: '12px', 
        color: '#999',
        textAlign: 'center'
      }}>
        Your phone number: {phoneNumber}
      </p>
    </div>
  );
};

export default SubmitForm;
