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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
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
import AlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import AlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import AlignRightIcon from '@mui/icons-material/FormatAlignRight';
import AlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import HelpIcon from '@mui/icons-material/Help';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  showToolbar?: boolean;
  readOnly?: boolean;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  height = 300,
  showToolbar = true,
  readOnly = false,
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [fontSizeMenuAnchor, setFontSizeMenuAnchor] = useState<null | HTMLElement>(null);
  const [textColorMenuAnchor, setTextColorMenuAnchor] = useState<null | HTMLElement>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Handle content changes
  const handleContentChange = useCallback(() => {
    if (editorRef.current && !readOnly) {
      const content = editorRef.current.innerHTML;
      if (content !== value) {
        onChange(content);
      }
    }
  }, [value, onChange, readOnly]);

  // Format commands
  const execCommand = (command: string, value?: string) => {
    if (readOnly) return;
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
  const handleAlignLeft = () => execCommand('justifyLeft');
  const handleAlignCenter = () => execCommand('justifyCenter');
  const handleAlignRight = () => execCommand('justifyRight');
  const handleAlignJustify = () => execCommand('justifyFull');

  const handleFontSize = (size: string) => {
    execCommand('fontSize', size);
    setFontSizeMenuAnchor(null);
  };

  const handleTextColor = (color: string) => {
    execCommand('foreColor', color);
    setTextColorMenuAnchor(null);
  };

  const handleLinkInsert = () => {
    if (!linkUrl) return;
    
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      execCommand('createLink', linkUrl);
    } else if (linkText) {
      execCommand('insertHTML', `<a href="${linkUrl}">${linkText}</a>`);
    }
    
    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleImageInsert = () => {
    if (!imageUrl) return;
    
    const imgHtml = `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%; height: auto;" />`;
    execCommand('insertHTML', imgHtml);
    
    setImageDialogOpen(false);
    setImageUrl('');
    setImageAlt('');
  };

  const handleCode = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      execCommand('insertHTML', `<code>${selection.toString()}</code>`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;
    
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
    if (!showToolbar || readOnly) return null;

    return (
      <Paper className="rich-text-editor-toolbar" elevation={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, flexWrap: 'wrap' }}>
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

          {/* Alignment */}
          <ButtonGroup size="small">
            <Tooltip title="Align Left">
              <IconButton onClick={handleAlignLeft}>
                <AlignLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Center">
              <IconButton onClick={handleAlignCenter}>
                <AlignCenterIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Right">
              <IconButton onClick={handleAlignRight}>
                <AlignRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Justify">
              <IconButton onClick={handleAlignJustify}>
                <AlignJustifyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

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
              <IconButton onClick={() => setLinkDialogOpen(true)}>
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Insert Image">
              <IconButton onClick={() => setImageDialogOpen(true)}>
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
          {[
            { size: '1', label: 'Very Small', px: '10px' },
            { size: '2', label: 'Small', px: '12px' },
            { size: '3', label: 'Normal', px: '14px' },
            { size: '4', label: 'Medium', px: '16px' },
            { size: '5', label: 'Large', px: '18px' },
            { size: '6', label: 'Very Large', px: '24px' },
            { size: '7', label: 'Huge', px: '32px' }
          ].map(({ size, label, px }) => (
            <MenuItem key={size} onClick={() => handleFontSize(size)}>
              <Typography variant="body2" fontSize={px}>
                {label}
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
            { color: '#000000', name: 'Black' },
            { color: '#333333', name: 'Dark Gray' },
            { color: '#666666', name: 'Gray' },
            { color: '#999999', name: 'Light Gray' },
            { color: '#FF0000', name: 'Red' },
            { color: '#00FF00', name: 'Green' },
            { color: '#0000FF', name: 'Blue' },
            { color: '#FFFF00', name: 'Yellow' },
            { color: '#FF00FF', name: 'Magenta' },
            { color: '#00FFFF', name: 'Cyan' },
            { color: '#FFA500', name: 'Orange' },
            { color: '#800080', name: 'Purple' }
          ].map(({ color, name }) => (
            <MenuItem key={color} onClick={() => handleTextColor(color)}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  backgroundColor: color, 
                  border: '1px solid #ccc',
                  mr: 1,
                  borderRadius: '2px'
                }} 
              />
              {name}
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    );
  };

  return (
    <Box className={`rich-text-editor ${className}`}>
      {renderToolbar()}
      
      <Paper 
        className={`rich-text-editor-content ${isEditorFocused ? 'focused' : ''} ${readOnly ? 'readonly' : ''}`}
        sx={{ 
          minHeight: height,
          border: '1px solid #e0e0e0',
          borderRadius: showToolbar ? '0 0 4px 4px' : '4px',
          overflow: 'hidden'
        }}
      >
        <div
          ref={editorRef}
          className="rich-text-editor-editable rich-text-editor-editable-content"
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleContentChange}
          onFocus={() => setIsEditorFocused(true)}
          onBlur={() => setIsEditorFocused(false)}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
        />
      </Paper>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Insert Link</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
            <TextField
              fullWidth
              label="Link Text (optional)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Enter text to display"
              helperText="Leave empty to use selected text"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLinkInsert} variant="contained" disabled={!linkUrl}>
            Insert Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Insert Image</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
            />
            <TextField
              fullWidth
              label="Alt Text"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Describe the image"
              helperText="Important for accessibility"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleImageInsert} variant="contained" disabled={!imageUrl}>
            Insert Image
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Rich Text Editor Help</DialogTitle>
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
            Formatting Features
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Text formatting (bold, italic, underline)</li>
            <li>Font size and color changes</li>
            <li>Text alignment (left, center, right, justify)</li>
            <li>Bulleted and numbered lists</li>
            <li>Links and images</li>
            <li>Inline code formatting</li>
          </Box>

          <Typography variant="h6" gutterBottom>
            Tips
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li>Select text before applying formatting</li>
            <li>Use the toolbar buttons or keyboard shortcuts</li>
            <li>Images are automatically resized to fit the editor</li>
            <li>Always provide alt text for images for accessibility</li>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};