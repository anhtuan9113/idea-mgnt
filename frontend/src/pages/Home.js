import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Idea Management System
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Share, collaborate, and innovate with your team
        </Typography>
        {!user ? (
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ mr: 2 }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/ideas')}
            sx={{ mt: 4 }}
          >
            View Ideas
          </Button>
        )}
      </Paper>
    </Container>
  );
};

export default Home; 