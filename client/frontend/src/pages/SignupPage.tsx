import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Typography, Box, Paper, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
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
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
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

  const formatPhone = (input: string): string => {
    const digits = input.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleInputChange = (field: keyof SignupFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = (field === 'companyPhone' || field === 'userPhone')
      ? formatPhone(event.target.value)
      : event.target.value;
    setFormData({ ...formData, [field]: value });
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

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy API key:', err);
    }
  };

  const handleCloseApiKeyDialog = () => {
    setShowApiKeyDialog(false);
    navigate('/login', {
      state: {
        email: formData.userEmail,
        password: formData.password,
        message: 'Account created successfully! Please log in.'
      }
    });
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

      // Show the API key dialog
      if (data.data?.apiKey) {
        setApiKey(data.data.apiKey);
        setShowApiKeyDialog(true);
      } else {
        // Fallback: redirect to login if no API key returned
        navigate('/login', {
          state: {
            email: formData.userEmail,
            password: formData.password,
            message: 'Account created successfully! Please log in.'
          }
        });
      }
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
                type="tel"
                value={formData.companyPhone}
                onChange={handleInputChange('companyPhone')}
                margin="normal"
                placeholder="(___) ___-____"
                inputProps={{ maxLength: 14 }}
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
                type="tel"
                value={formData.userPhone}
                onChange={handleInputChange('userPhone')}
                margin="normal"
                placeholder="(___) ___-____"
                inputProps={{ maxLength: 14 }}
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

      {/* API Key Dialog */}
      <Dialog
        open={showApiKeyDialog}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>Account Created Successfully!</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Important: Save your API Key now!
            </Typography>
            <Typography variant="body2">
              You will need this API key to connect your sync server. This key will not be shown again.
            </Typography>
          </Alert>

          <Typography variant="body2" color="textSecondary" gutterBottom>
            Your Sync Server API Key:
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              fontFamily: 'monospace'
            }}
          >
            <Typography
              variant="body1"
              sx={{
                flex: 1,
                wordBreak: 'break-all',
                fontFamily: 'monospace'
              }}
            >
              {apiKey}
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
              <IconButton onClick={handleCopyApiKey} size="small">
                {copied ? <CheckIcon color="success" /> : <ContentCopyIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Use this API key when setting up your sync server to connect it to your account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleCloseApiKeyDialog}
            disabled={!copied}
          >
            I've Saved My API Key - Continue to Login
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SignupPage;
