import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Chip,
  FormHelperText,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { validateEmail } from '@meterit/framework-frontend/utils/validationHelpers';

interface RecipientManagerProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
  error?: string;
  disabled?: boolean;
}

const RecipientManager: React.FC<RecipientManagerProps> = ({
  recipients,
  onChange,
  error,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAddRecipient = () => {
    const email = inputValue.trim();

    if (!email) {
      setInputError('Email address is required');
      return;
    }

    if (!validateEmail(email)) {
      setInputError('Invalid email format');
      return;
    }

    if (recipients.includes(email)) {
      setInputError('This email is already added');
      return;
    }

    onChange([...recipients, email]);
    setInputValue('');
    setInputError(null);
  };

  const handleRemoveRecipient = (email: string) => {
    onChange(recipients.filter((r) => r !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRecipient();
    }
  };

  return (
    <Box>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Email Address"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (inputError) setInputError(null);
            }}
            onKeyPress={handleKeyPress}
            error={!!inputError}
            helperText={inputError}
            disabled={disabled}
            placeholder="user@example.com"
            size="small"
            sx={{ flex: 1 }}
          />
          <Button
            onClick={handleAddRecipient}
            variant="outlined"
            disabled={disabled}
            startIcon={<AddIcon />}
            sx={{ mt: 1 }}
          >
            Add
          </Button>
        </Box>

        {recipients.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {recipients.map((email) => (
              <Chip
                key={email}
                label={email}
                onDelete={() => handleRemoveRecipient(email)}
                disabled={disabled}
              />
            ))}
          </Box>
        )}

        {error && (
          <FormHelperText error>
            {error}
          </FormHelperText>
        )}

        {/* {recipients.length === 0 && !error && (
          <FormHelperText>
            Add at least one recipient email address
          </FormHelperText>
        )} */}
      </Stack>
    </Box>
  );
};

export default RecipientManager;
