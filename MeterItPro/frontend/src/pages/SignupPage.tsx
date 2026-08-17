import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  TextField, Button, Typography, Box, Paper, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
  Stepper, Step, StepLabel,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import logo from '../assets/meteritpro-logo.svg';
import { Turnstile } from '../components/auth/Turnstile';
import './SignupPage.css';

interface SignupFormData {
  // User Info
  userName: string;
  userEmail: string;
  userPhone: string;
  password: string;
  confirmPassword: string;

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

  // Payment
  paymentMethod: 'paypal' | 'venmo' | 'credit_card';
  planType: 'starter' | 'growth' | 'enterprise';
}

const steps = ['Your Info', 'Company', 'Payment'];

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { plan } = useParams<{ plan?: string }>();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    userName: '',
    userEmail: '',
    userPhone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyPhone: '',
    companyUrl: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
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

  const validateStep = (step: number): boolean => {
    setError('');
    switch (step) {
      case 0:
        if (!formData.userName.trim()) {
          setError('Your name is required');
          return false;
        }
        if (!formData.userEmail.trim()) {
          setError('Email is required');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
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
      case 1:
        if (!formData.companyName.trim()) {
          setError('Company name is required');
          return false;
        }
        return true;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setActiveStep(prev => prev - 1);
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

    if (!validateStep(activeStep)) {
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
          turnstileToken,
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
          user: {
            name: formData.userName,
            email: formData.userEmail,
            phone: formData.userPhone,
            password: formData.password,
          },
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

      if (data.data?.apiKey) {
        setApiKey(data.data.apiKey);
        setShowApiKeyDialog(true);
      } else {
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

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box className="signup-step-content">
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
        );

      case 1:
        return (
          <Box className="signup-step-content">
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
        );

      case 2:
        return (
          <Box className="signup-step-content">
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {formData.planType === 'starter' && 'Starter Plan - Perfect for small portfolios'}
              {formData.planType === 'growth' && 'Growth Plan - Scale across multiple locations'}
              {formData.planType === 'enterprise' && 'Enterprise Plan - Custom integrations'}
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
            <Turnstile
              onVerify={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken('')}
            />
          </Box>
        );

      default:
        return null;
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

          <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            <Box className="signup-actions">
              {activeStep > 0 && (
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              <Box sx={{ flex: 1 }} />
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !turnstileToken}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Account'}
                </Button>
              )}
            </Box>

            <Typography variant="body2" align="center" color="textSecondary" sx={{ mt: 2 }}>
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
