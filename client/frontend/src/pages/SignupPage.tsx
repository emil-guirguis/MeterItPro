import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Typography, Box, Paper, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Alert, CircularProgress } from '@mui/material';
import logo from '../assets/meteritpro-logo.svg';
import './SignupPage.css';

interface SignupFormData {
  // Company Info
  companyName: string;
  companyPhone: string;
  companyUrl: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  
  // User Info
  userName: string;
  userEmail: string;
  userPhone: string;
  password: string;
  confirmPassword: string;
  
  // Payment
  paymentMethod: 'paypal' | 'venmo' | 'credit_card';
  planType: 'starter' | 'growth' | 'enterprise';
}

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { plan } = useParams<{ plan?: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<SignupFormData>({
    companyName: '',
    companyPhone: '',
    companyUrl: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    userName: '',
    userEmail: '',
    userPhone: '',
    password: '',
    confirmPassword: '',
    paymentMethod: 'credit_card',
    planType: 'starter'
  });

  useEffect(() => {
    if (plan && ['starter', 'growth', 'enterprise'].includes(plan.toLowerCase())) {
      setFormData(prev => ({ ...prev, planType: plan.toLowerCase() as 'starter' | 'growth' | 'enterprise' }));
    }
  }, [plan]);

  const handleInputChange = (field: keyof SignupFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const validateForm = (): boolean => {
    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.userName.trim()) {
      setError('Your name is required');
      return false;
    }
    if (!formData.userEmail.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.userEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Company data
          company: {
            name: formData.companyName,
            phone: formData.companyPhone,
            url: formData.companyUrl,
            street: formData.street,
            street2: formData.street2,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            country: formData.country,
          },
          // User data
          user: {
            name: formData.userName,
            email: formData.userEmail,
            phone: formData.userPhone,
            password: formData.password,
          },
          // Payment & plan data
          payment: {
            method: formData.paymentMethod,
            planType: formData.planType,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      // Redirect to login with pre-filled credentials
      navigate('/login', { 
        state: { 
          email: formData.userEmail, 
          password: formData.password,
          message: 'Account created successfully! Please log in.' 
        } 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <header className="signup-header">
        <div className="signup-logo" onClick={() => navigate('/')}>
          <img src={logo} alt="MeterIt Pro logo" />
          <span>MeterIt Pro</span>
        </div>
      </header>

      <div className="signup-container">
        <Paper elevation={3} className="signup-paper">
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Create Your Account
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" gutterBottom>
            {formData.planType === 'starter' && 'Starter Plan - Perfect for small portfolios'}
            {formData.planType === 'growth' && 'Growth Plan - Scale across multiple locations'}
            {formData.planType === 'enterprise' && 'Enterprise Plan - Custom integrations'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Company Information Section */}
            <Box className="signup-section">
              <Typography variant="h6" gutterBottom>
                Company Information
              </Typography>
              <TextField
                fullWidth
                label="Company Name"
                required
                value={formData.companyName}
                onChange={handleInputChange('companyName')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Company Phone"
                value={formData.companyPhone}
                onChange={handleInputChange('companyPhone')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Company Website"
                placeholder="https://example.com"
                value={formData.companyUrl}
                onChange={handleInputChange('companyUrl')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Street Address"
                value={formData.street}
                onChange={handleInputChange('street')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Street Address 2"
                placeholder="Suite, Unit, etc."
                value={formData.street2}
                onChange={handleInputChange('street2')}
                margin="normal"
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="City"
                  value={formData.city}
                  onChange={handleInputChange('city')}
                  margin="normal"
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="State"
                  value={formData.state}
                  onChange={handleInputChange('state')}
                  margin="normal"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="ZIP"
                  value={formData.zip}
                  onChange={handleInputChange('zip')}
                  margin="normal"
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>

            {/* User Information Section */}
            <Box className="signup-section">
              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              <TextField
                fullWidth
                label="Your Name"
                required
                value={formData.userName}
                onChange={handleInputChange('userName')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={formData.userEmail}
                onChange={handleInputChange('userEmail')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Phone"
                value={formData.userPhone}
                onChange={handleInputChange('userPhone')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange('password')}
                margin="normal"
                helperText="Minimum 8 characters"
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                margin="normal"
              />
            </Box>

            {/* Payment Section */}
            <Box className="signup-section">
              <Typography variant="h6" gutterBottom>
                Payment Method
              </Typography>
              <FormControl component="fieldset" margin="normal">
                <FormLabel component="legend">Select Payment Method</FormLabel>
                <RadioGroup
                  value={formData.paymentMethod}
                  onChange={handleInputChange('paymentMethod')}
                >
                  <FormControlLabel 
                    value="credit_card" 
                    control={<Radio />} 
                    label="Credit Card" 
                  />
                  <FormControlLabel 
                    value="paypal" 
                    control={<Radio />} 
                    label="PayPal" 
                  />
                  <FormControlLabel 
                    value="venmo" 
                    control={<Radio />} 
                    label="Venmo" 
                  />
                </RadioGroup>
              </FormControl>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Payment processing will be set up after account creation
              </Typography>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>

            <Typography variant="body2" align="center" color="textSecondary">
              Already have an account?{' '}
              <Button 
                color="primary" 
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none' }}
              >
                Log in
              </Button>
            </Typography>
          </form>
        </Paper>
      </div>
    </div>
  );
};

export default SignupPage;
