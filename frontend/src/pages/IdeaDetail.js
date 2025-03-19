import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const STATUSES = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Reviewing', value: 'REVIEWING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Implemented', value: 'IMPLEMENTED' },
];

const IdeaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchIdea();
  }, [id]);

  const fetchIdea = async () => {
    try {
      const response = await api.get(`/ideas/${id}`);
      setIdea(response.data);
      setNewStatus(response.data.status);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch idea');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/ideas/${id}`);
      navigate('/ideas');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete idea');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const response = await api.put(`/ideas/${id}`, {
      //  ...idea,
        status: status
      });
      setIdea(response.data);
      setNewStatus(status);
      setToast({
        open: true,
        message: `Idea status updated to ${status}`,
        severity: 'success'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
      setToast({
        open: true,
        message: 'Failed to update status',
        severity: 'error'
      });
    }
  };

  const handleImageClick = (attachment) => {
    setSelectedImage(attachment);
  };

  const handleCloseImageDialog = () => {
    setSelectedImage(null);
  };

  const getAttachmentUrl = (url) => {
    // Remove the /api prefix from the URL if it exists
    const cleanUrl = url.replace('/api', '');
    return `${API_URL}${cleanUrl}`;
  };

  const getCurrentStepIndex = () => {
    return STATUSES.findIndex(status => status.value === idea?.status);
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!idea) return <Typography>Idea not found</Typography>;

  const isOwner = user.id === idea.author.id;
  const isAdmin = user.role === 'ADMIN';
  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 'success';
      case 'REVIEWING':
        return 'warning';
      case 'IMPLEMENTED':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/ideas')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {idea.title}
        </Typography>
        {canEdit && (
          <IconButton onClick={() => navigate(`/ideas/${id}/edit`)}>
            <EditIcon />
          </IconButton>
        )}
        {canDelete && (
          <IconButton onClick={() => setDeleteDialogOpen(true)}>
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Status Progress Bar */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Status Progress
            </Typography>
            <Stepper activeStep={getCurrentStepIndex()} alternativeLabel>
              {STATUSES.map((status) => (
                <Step 
                  key={status.value}
                  active={getCurrentStepIndex() >= STATUSES.indexOf(status)}
                  completed={getCurrentStepIndex() > STATUSES.indexOf(status)}
                  sx={{
                    cursor: isAdmin ? 'pointer' : 'default',
                    '&:hover': {
                      '& .MuiStepIcon-root': {
                        color: 'primary.main',
                      },
                      '& .MuiStepLabel-label': {
                        color: 'primary.main',
                      },
                    },
                  }}
                  onClick={() => isAdmin && handleStatusChange(status.value)}
                >
                  <StepLabel>
                    <Typography
                      variant="body2"
                      color={idea.status === status.value ? 'primary' : 'text.secondary'}
                    >
                      {status.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="body1" paragraph>
              {idea.description}
            </Typography>
            {idea.solution && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Solution
                </Typography>
                <Typography variant="body1">{idea.solution}</Typography>
              </Box>
            )}
          </Paper>

          {/* Attachments Section */}
          {idea.attachments && idea.attachments.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFileIcon /> Attachments
              </Typography>
              <ImageList cols={3} rowHeight={164} gap={8}>
                {idea.attachments.map((attachment) => (
                  <ImageListItem 
                    key={attachment.id}
                    onClick={() => handleImageClick(attachment)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <img
                      src={getAttachmentUrl(attachment.url)}
                      alt={attachment.name}
                      loading="lazy"
                      style={{ height: '164px', objectFit: 'cover' }}
                    />
                    <ImageListItemBar
                      title={attachment.name}
                      subtitle={`${(attachment.size / 1024 / 1024).toFixed(2)} MB`}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Details
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Author
              </Typography>
              <Typography>{idea.author.name}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Status:
              </Typography>
              <Chip
                label={idea.status}
                color={getStatusColor(idea.status)}
                size="small"
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {idea.tags?.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Created
              </Typography>
              <Typography>
                {new Date(idea.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Idea</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this idea? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={handleCloseImageDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {selectedImage && (
            <img
              src={getAttachmentUrl(selectedImage.url)}
              alt={selectedImage.name}
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Toast Message */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IdeaDetail; 