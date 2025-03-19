import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
  Fade,
  Autocomplete,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const IdeaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [],
    attachments: [],
  });
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [existingIdea, setExistingIdea] = useState(null);

  useEffect(() => {
    if (id) {
      fetchIdea();
    }
  }, [id]);

  const fetchIdea = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ideas/${id}`);
      const idea = response.data;
      setFormData({
        title: idea.title,
        description: idea.description,
        tags: idea.tags || [],
        attachments: [],
      });
      setExistingAttachments(idea.attachments || []);
      setExistingIdea(idea);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch idea');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleAddTag = (event) => {
    if (event.key === 'Enter' && newTag.trim()) {
      event.preventDefault();
      const tag = newTag.trim();
      if (!formData.tags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
        setNewTag('');
      }
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToDelete)
    }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
    setError('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
    setError('');
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = async (attachmentId) => {
    try {
      await api.delete(`/ideas/${id}/attachments/${attachmentId}`);
      setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
      setSuccess('Attachment removed successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove attachment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      files.forEach((file) => {
        formDataToSend.append('attachments', file);
      });

      if (id) {
        await api.put(`/ideas/${id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setSuccess('Idea updated successfully');
      } else {
        await api.post('/ideas', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setSuccess('Idea created successfully');
      }
      setTimeout(() => navigate('/ideas'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save idea');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitIdea = async () => {
    try {
      setLoading(true);
      setError('');
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      formDataToSend.append('status', 'SUBMITTED');
      files.forEach((file) => {
        formDataToSend.append('attachments', file);
      });

      await api.put(`/ideas/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Idea submitted successfully');
      setTimeout(() => navigate('/ideas'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit idea');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="md">
      <Fade in timeout={500}>
        <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            {id ? 'Edit Idea' : 'Create New Idea'}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  required
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleDeleteTag(tag)}
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    />
                  ))}
                </Box>
                <TextField
                  fullWidth
                  label="Add Tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleAddTag}
                  variant="outlined"
                  helperText="Press Enter to add a tag"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
                  Attachments
                </Typography>
                
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: isDragging ? 'action.hover' : 'background.paper',
                    border: '2px dashed',
                    borderColor: isDragging ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer',
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    accept="*/*"
                    style={{ display: 'none' }}
                    id="file-upload"
                    multiple
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload">
                    <Box sx={{ cursor: 'pointer' }}>
                      <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                      <Typography variant="body1" gutterBottom>
                        Drag and drop files here or click to browse
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supported file types: All
                      </Typography>
                    </Box>
                  </label>
                </Paper>
              </Grid>

              {(files.length > 0 || existingAttachments.length > 0) && (
                <Grid item xs={12}>
                  <List>
                    {existingAttachments.map((attachment) => (
                      <ListItem
                        key={attachment.id}
                        sx={{
                          backgroundColor: 'background.default',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemText
                          primary={attachment.name}
                          secondary={formatFileSize(attachment.size)}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Remove attachment">
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveExistingFile(attachment.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {files.map((file, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          backgroundColor: 'background.default',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemText
                          primary={file.name}
                          secondary={formatFileSize(file.size)}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Remove file">
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveFile(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="large"
                    startIcon={<CancelIcon />}
                    onClick={() => navigate('/ideas')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  {id && existingIdea?.status === 'DRAFT' && existingIdea?.authorId === user.id && (
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                      onClick={handleSubmitIdea}
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Idea'}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Fade>
    </Container>
  );
};

export default IdeaForm; 