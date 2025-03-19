import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Grid,
  CircularProgress,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Visibility as ViewIcon 
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const statusColors = {
  DRAFT: 'default',
  SUBMITTED: 'primary',
  REVIEWING: 'warning',
  ACCEPTED: 'success',
  IMPLEMENTED: 'info'
};

function Ideas() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const response = await api.get('/ideas');
      // Filter out draft ideas for admin users
      const filteredIdeas = user?.role === 'ADMIN' 
        ? response.data.filter(idea => idea.status !== 'DRAFT')
        : response.data;
      setIdeas(filteredIdeas);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIdea = () => {
    navigate('/ideas/new');
  };

  const handleViewIdea = (id) => {
    navigate(`/ideas/${id}`);
  };

  const handleEditIdea = (id) => {
    navigate(`/ideas/${id}/edit`);
  };

  const handleDeleteClick = (idea) => {
    setIdeaToDelete(idea);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/ideas/${ideaToDelete.id}`);
      setIdeas(ideas.filter(idea => idea.id !== ideaToDelete.id));
      setDeleteDialogOpen(false);
      setIdeaToDelete(null);
    } catch (error) {
      console.error('Error deleting idea:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setIdeaToDelete(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Ideas
          </Typography>
          {user?.role === 'EMPLOYEE' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateIdea}
            >
              Submit New Idea
            </Button>
          )}
        </Box>

        <List>
          {ideas.map((idea, index) => {
            const isOwner = idea.authorId === user.id;
            const isAdmin = user.role === 'ADMIN';
            const canEdit = isOwner || isAdmin;
            const canDelete = isOwner || isAdmin;

            return (
              <React.Fragment key={idea.id}>
                <ListItem
                  sx={{
                    py: 2,
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 'medium',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {idea.title}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {idea.description}
                          </Typography>
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Chip
                        label={idea.status}
                        color={statusColors[idea.status] || 'default'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {idea.tags.slice(0, 2).map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                        {idea.tags.length > 2 && (
                          <Chip
                            label={`+${idea.tags.length - 2}`} 
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" color="text.secondary">
                        {idea.author.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(idea.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      gap: 0.5,
                      opacity: 0,
                      transition: 'all 0.2s',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '.MuiListItem-root:hover &': {
                        opacity: 1,
                      },
                    }}
                  >
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={() => handleViewIdea(idea.id)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {canEdit && (
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditIdea(idea.id)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(idea)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
                {index < ideas.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Idea</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this idea? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Ideas; 