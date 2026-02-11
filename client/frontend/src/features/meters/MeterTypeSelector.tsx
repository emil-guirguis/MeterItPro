import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import PhysicalIcon from '@mui/icons-material/Devices';
import VirtualIcon from '@mui/icons-material/Cloud';
import './MeterTypeSelector.css';

interface MeterTypeSelectorProps {
  isOpen: boolean;
  onSelect: (type: 'physical' | 'virtual') => void;
  onCancel: () => void;
}

export const MeterTypeSelector: React.FC<MeterTypeSelectorProps> = ({
  isOpen,
  onSelect,
  onCancel,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      className="meter-type-selector"
    >
      <DialogTitle className="meter-type-selector__title">
        Select Meter Type
      </DialogTitle>
      <DialogContent className="meter-type-selector__content">
        <p className="meter-type-selector__description">
          Choose whether you want to add a physical meter or a virtual meter.
        </p>
        <div className="meter-type-selector__buttons">
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<PhysicalIcon />}
            onClick={() => onSelect('physical')}
            className="meter-type-selector__button meter-type-selector__button--physical"
          >
            Physical Meter
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            startIcon={<VirtualIcon />}
            onClick={() => onSelect('virtual')}
            className="meter-type-selector__button meter-type-selector__button--virtual"
          >
            Virtual Meter
          </Button>
        </div>
      </DialogContent>
      <DialogActions className="meter-type-selector__actions">
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MeterTypeSelector;
