const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Constants for roles and statuses
const ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  HR: 'HR',
  APPROVER: 'APPROVER'
};

const STATUSES = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  REVIEWING: 'REVIEWING',
  ACCEPTED: 'ACCEPTED',
  IMPLEMENTED: 'IMPLEMENTED'
};

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Get all ideas (with role-based filtering)
router.get('/', auth, async (req, res) => {
  try {
    let ideas;
    if (req.user.role === ROLES.ADMIN) {
      // Admin can see all ideas
      ideas = await prisma.idea.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Other users can only see their own ideas
      ideas = await prisma.idea.findMany({
        where: {
          authorId: req.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Parse tags for each idea
    ideas = ideas.map(idea => ({
      ...idea,
      tags: JSON.parse(idea.tags || '[]')
    }));

    res.json(ideas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single idea
router.get('/:id', auth, async (req, res) => {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: true,
      },
    });
    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    // Check if user has permission to view the idea
    if (req.user.role !== ROLES.ADMIN && idea.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this idea' });
    }

    // Parse tags
    const ideaWithParsedTags = {
      ...idea,
      tags: JSON.parse(idea.tags || '[]')
    };

    res.json(ideaWithParsedTags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new idea with file uploads
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, category, status } = req.body;

    // Create idea with attachments
    const idea = await prisma.idea.create({
      data: {
        title,
        description,
        category,
        status: status || STATUSES.DRAFT,
        authorId: req.user.id,
        attachments: {
          create: req.files.map(file => ({
            name: file.originalname,
            url: `/uploads/${file.filename}`,
            type: file.mimetype,
            size: file.size,
          })),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: true,
      },
    });

    res.status(201).json(idea);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update idea with file uploads
router.put('/:id', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, category, status, tags } = req.body;
    const ideaId = parseInt(req.params.id);

    // Check if user owns the idea or is admin
    const existingIdea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { author: true },
    });

    if (!existingIdea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    // Only admin or idea owner can update
    if (req.user.role !== ROLES.ADMIN && existingIdea.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this idea' });
    }

    // Parse tags if they are provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        parsedTags = [];
        //return res.status(400).json({ message: 'Invalid tags format' });
      }
    }

    // Status change permissions
    let finalStatus = existingIdea.status;
    let assignedTo = null;

    if (status) {
      if (req.user.role === ROLES.ADMIN) {
        // Admin can change to any status
        finalStatus = status;
      } else if (existingIdea.authorId === req.user.id) {
        // Author can only change from DRAFT to SUBMITTED
        if (existingIdea.status === STATUSES.DRAFT && status === STATUSES.SUBMITTED) {
          finalStatus = status;
          
          // Find an admin or HR user to assign the idea to
          const assignee = await prisma.user.findFirst({
            where: {
              OR: [
                { role: ROLES.ADMIN },
                { role: ROLES.HR }
              ]
            }
          });

          if (assignee) {
            assignedTo = assignee.id;
          }
        } else {
          return res.status(403).json({ message: 'You can only submit draft ideas' });
        }
      } else {
        return res.status(403).json({ message: 'Not authorized to change idea status' });
      }
    }

    // Update idea with new attachments
    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        title,
        description,
        category,
        status: finalStatus,
        tags: parsedTags && parsedTags.length > 0 ? JSON.stringify(parsedTags)  : undefined,
        assignedTo: assignedTo ? {
          connect: { id: assignedTo }
        } : undefined,
        attachments: req.files && req.files.length > 0 ? {
          create: req.files.map(file => ({
            name: file.originalname,
            url: `/uploads/${file.filename}`,
            type: file.mimetype,
            size: file.size,
          })),
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    // Create notification if status has changed
    if (existingIdea.status !== finalStatus) {
      await prisma.notification.create({
        data: {
          title: 'Idea Status Updated',
          message: `Your idea "${idea.title}" status has been changed to ${finalStatus}`,
          type: 'STATUS_CHANGE',
          link: `/ideas/${idea.id}`,
          user: {
            connect: { id: idea.author.id }
          },
          idea: {
            connect: { id: idea.id }
          }
        }
      });
    }
    // Convert tags to array if it's a string
    if (typeof idea.tags === 'string') {
      idea.tags = JSON.parse(idea.tags);
    }
    res.json(idea);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete idea
router.delete('/:id', auth, async (req, res) => {
  try {
    const ideaId = parseInt(req.params.id);

    // Check if user owns the idea or is admin
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { author: true },
    });

    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    // Only admin or idea owner can delete
    if (req.user.role !== ROLES.ADMIN && idea.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this idea' });
    }

    // Delete idea and its attachments
    await prisma.idea.delete({
      where: { id: ideaId },
    });

    res.json({ message: 'Idea deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 