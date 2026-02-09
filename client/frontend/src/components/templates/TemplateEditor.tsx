import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import BoldIcon from '@mui/icons-material/FormatBold';
import ItalicIcon from '@mui/icons-material/FormatItalic';
import UnderlineIcon from '@mui/icons-material/FormatUnderlined';
import BulletListIcon from '@mui/icons-material/FormatListBulleted';
import NumberListIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FontSizeIcon from '@mui/icons-material/FormatSize';
import TextColorIcon from '@mui/icons-material/FormatColorText';
import AddVariableIcon from '@mui/icons-material/Add';
import PreviewIcon from '@mui/icons-material/Visibility';
import HelpIcon from '@mui/icons-material/Help';
import './TemplateEditor.css';

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  availableVariables?: Record<string, any>;
  placeholder?: string;
  height?: number;
  showToolbar?: boolean;
  showVariableHelper?: boolean;
  onPreview?: (content: string) => void;
}

interface VariableInsertDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (variable: string, format?: string) => void;
  availableVariables: Record<string, any>;
}

const VariableInsertDialog: React.FC<VariableInsertDialogProps> = ({
  open,
  onClose,
  onInsert,
  availableVariables
}) => {
  const [selectedVariable, setSelectedVariable] = useState('');
  const [format, setFormat] = useState('');
  const [customFormat, setCustomFormat] = useState('');

  const formatOptions = [
    { value: '', label: 'Default' },
    { value: 'uppercase', label: 'UPPERCASE' },
    { value: 'lowercase', label: 'lowercase' },
    { value: 'capitalize', label: 'Capitalize' },
    { value: 'date', label: 'Date Format' },
    { value: 'currency', label: 'Currency' },
    { value: 'number', label: 'Number' },
    { value: 'custom', label: 'Custom Format' }
  ];

  const handleInsert = () => {
    if (!selectedVariable) return;
    
    let variableString = `{{${selectedVariable}`;
    
    if (format === 'custom' && customFormat) {
      variableString += ` | ${customFormat}`;
    } else if (format) {
      variableString += ` | ${format}`;
    }
    
    variableString += '}}';
    
    onInsert(variableString);
    onClose();
    setSelectedVariable('');
    setFormat('');
    setCustomFormat('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Insert Variable</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Variable</InputLabel>
            <Select
              value={selectedVariable}
              onChange={(e) => setSelectedVariable(e.target.value)}
              label="Variable"
            >
              {Object.entries(availableVariables).map(([key, info]: [string, any]) => (
                <MenuItem key={key} value={key}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {info.description || `${info.type} variable`}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Format</InputLabel>
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              label="Format"
            >
              {formatOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {format === 'custom' && (
            <TextField
              fullWidth
              label="Custom Format"
              value={customFormat}
              onChange={(e) => setCustomFormat(e.target.value)}
              placeholder="e.g., date:'YYYY-MM-DD' or number:'0,0.00'"
              helperText="Enter custom format string"
            />
          )}

          {selectedVariable && (
            <Alert severity="info">
              <Typography variant="body2">
                Preview: <code>{`{{${selectedVariable}${format && format !== 'custom' ? ` | ${format}` : ''}${format === 'custom' && customFormat ? ` | ${customFormat}` : ''}}}`}</code>
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleInsert} 
          variant="contained"
          disabled={!selectedVariable}
        >
          Insert Variable
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  value,
  onChange,
  availableVariables = {},
  placeholder = 'Enter your template content...',
  height = 400,
  showToolbar = true,
  showVariableHelper = true,
  onPreview
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [variableDialogOpen, setVariableDialogOpen] = useState(false);
  const [fontSizeMenuAnchor, setFontSizeMenuAnchor] = useState<null | HTMLElement>(null);
  const [textColorMenuAnchor, setTextColorMenuAnchor] = useState<null | HTMLElement>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Handle content changes
  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  }, [onChange]);

  // Format commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentChange();
    editorRef.current?.focus();
  };

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleBulletList = () => execCommand('insertUnorderedList');
  const handleNumberList = () => execCommand('insertOrderedList');
  const handleUndo = () => execCommand('undo');
  const handleRedo = () => execCommand('redo');

  const handleFontSize = (size: string) => {
    execCommand('fontSize', size);
    setFontSizeMenuAnchor(null);
  };

  const handleTextColor = (color: string) => {
    execCommand('foreColor', color);
    setTextColorMenuAnchor(null);
  };

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const handleImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const handleCode = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      execCommand('insertHTML', `<code>${selection.toString()}</code>`);
    }
  };

  const handleVariableInsert = (variableString: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const variableSpan = document.createElement('span');
      variableSpan.className = 'template-variable';
      variableSpan.contentEditable = 'false';
      variableSpan.textContent = variableString;
      
      range.insertNode(variableSpan);
      range.setStartAfter(variableSpan);
      range.setEndAfter(variableSpan);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // If no selection, insert at the end
      const variableSpan = document.createElement('span');
      variableSpan.className = 'template-variable';
      variableSpan.contentEditable = 'false';
      variableSpan.textContent = variableString;
      
      editorRef.current?.appendChild(variableSpan);
    }
    
    handleContentChange();
    editorRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleBold();
          break;
        case 'i':
          e.preventDefault();
          handleItalic();
          break;
        case 'u':
          e.preventDefault();
          handleUnderline();
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          break;
      }
    }
  };

  const renderToolbar = () => {
    if (!showToolbar) return null;

    return (
      <Paper className="template-editor-toolbar" elevation={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
          {/* Undo/Redo */}
          <ButtonGroup size="small">
            <Tooltip title="Undo (Ctrl+Z)">
              <IconButton onClick={handleUndo}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Shift+Z)">
              <IconButton onClick={handleRedo}>
                <RedoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Text Formatting */}
          <ButtonGroup size="small">
            <Tooltip title="Bold (Ctrl+B)">
              <IconButton onClick={handleBold}>
                <BoldIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic (Ctrl+I)">
              <IconButton onClick={handleItalic}>
                <ItalicIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Underline (Ctrl+U)">
              <IconButton onClick={handleUnderline}>
                <UnderlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Font Size */}
          <Tooltip title="Font Size">
            <IconButton 
              onClick={(e) => setFontSizeMenuAnchor(e.currentTarget)}
              size="small"
            >
              <FontSizeIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Text Color */}
          <Tooltip title="Text Color">
            <IconButton 
              onClick={(e) => setTextColorMenuAnchor(e.currentTarget)}
              size="small"
            >
              <TextColorIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem />

          {/* Lists */}
          <ButtonGroup size="small">
            <Tooltip title="Bullet List">
              <IconButton onClick={handleBulletList}>
                <BulletListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Numbered List">
              <IconButton onClick={handleNumberList}>
                <NumberListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Insert Elements */}
          <ButtonGroup size="small">
            <Tooltip title="Insert Link">
              <IconButton onClick={handleLink}>
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Insert Image">
              <IconButton onClick={handleImage}>
                <ImageIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Code">
              <IconButton onClick={handleCode}>
                <CodeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Template Features */}
          {showVariableHelper && Object.keys(availableVariables).length > 0 && (
            <Tooltip title="Insert Variable">
              <IconButton 
                onClick={() => setVariableDialogOpen(true)}
                color="primary"
              >
                <AddVariableIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {onPreview && (
            <Tooltip title="Preview">
              <IconButton onClick={() => onPreview(value)}>
                <PreviewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Help">
            <IconButton onClick={() => setHelpDialogOpen(true)}>
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Font Size Menu */}
        <Menu
          anchorEl={fontSizeMenuAnchor}
          open={Boolean(fontSizeMenuAnchor)}
          onClose={() => setFontSizeMenuAnchor(null)}
        >
          {['1', '2', '3', '4', '5', '6', '7'].map(size => (
            <MenuItem key={size} onClick={() => handleFontSize(size)}>
              <Typography variant="body2" fontSize={`${8 + parseInt(size) * 2}px`}>
                Size {size}
              </Typography>
            </MenuItem>
          ))}
        </Menu>

        {/* Text Color Menu */}
        <Menu
          anchorEl={textColorMenuAnchor}
          open={Boolean(textColorMenuAnchor)}
          onClose={() => setTextColorMenuAnchor(null)}
        >
          {[
            '#000000', '#333333', '#666666', '#999999',
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
            '#FF00FF', '#00FFFF', '#FFA500', '#800080'
          ].map(color => (
            <MenuItem key={color} onClick={() => handleTextColor(color)}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  backgroundColor: color, 
                  border: '1px solid #ccc',
                  mr: 1
                }} 
              />
              {color}
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    );
  };

  const renderVariableHelper = () => {
    if (!showVariableHelper || Object.keys(availableVariables).length === 0) {
      return null;
    }

    return (
      <Paper className="template-editor-variables" sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Available Variables
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click to insert into template
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(availableVariables).map(([key, _info]: [string, any]) => (
            <Chip
              key={key}
              label={`{{${key}}}`}
              size="small"
              variant="outlined"
              clickable
              onClick={() => handleVariableInsert(`{{${key}}}`)}
              sx={{ fontFamily: 'monospace' }}
            />
          ))}
        </Box>
      </Paper>
    );
  };

  return (
    <Box className="template-editor">
      {renderToolbar()}
      
      <Paper 
        className={`template-editor-content ${isEditorFocused ? 'focused' : ''}`}
        sx={{ 
          minHeight: height,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        <div
          ref={editorRef}
          className="template-editor-editable template-editor-editable-content"
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          onFocus={() => setIsEditorFocused(true)}
          onBlur={() => setIsEditorFocused(false)}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
        />
      </Paper>

      {renderVariableHelper()}

      {/* Variable Insert Dialog */}
      <VariableInsertDialog
        open={variableDialogOpen}
        onClose={() => setVariableDialogOpen(false)}
        onInsert={handleVariableInsert}
        availableVariables={availableVariables}
      />

      {/* Help Dialog */}
      <Dialog 
        open={helpDialogOpen} 
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Template Editor Help</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Keyboard Shortcuts
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <li><strong>Ctrl+B</strong> - Bold</li>
            <li><strong>Ctrl+I</strong> - Italic</li>
            <li><strong>Ctrl+U</strong> - Underline</li>
            <li><strong>Ctrl+Z</strong> - Undo</li>
            <li><strong>Ctrl+Shift+Z</strong> - Redo</li>
          </Box>

          <Typography variant="h6" gutterBottom>
            Template Variables
          </Typography>
          <Typography variant="body2" paragraph>
            Use variables to insert dynamic content into your templates. Variables are enclosed in double curly braces.
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <li><code>{'{{variable_name}}'}</code> - Basic variable</li>
            <li><code>{'{{variable_name | format}}'}</code> - Formatted variable</li>
            <li><code>{'{{#if condition}}...{{/if}}'}</code> - Conditional content</li>
            <li><code>{'{{#each items}}...{{/each}}'}</code> - Loop through items</li>
          </Box>

          <Typography variant="h6" gutterBottom>
            Formatting Options
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li><strong>uppercase</strong> - Convert to UPPERCASE</li>
            <li><strong>lowercase</strong> - Convert to lowercase</li>
            <li><strong>capitalize</strong> - Capitalize First Letter</li>
            <li><strong>date</strong> - Format as date</li>
            <li><strong>currency</strong> - Format as currency</li>
            <li><strong>number</strong> - Format as number</li>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};