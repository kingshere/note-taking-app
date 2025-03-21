const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const path = require('path');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all notes with categories
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        category: true,
      },
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single note with category
app.get('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const note = await prisma.note.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        category: true,
      },
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a note with optional category
app.post('/api/notes', async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const note = await prisma.note.create({
      data: {
        title,
        content,
        ...(categoryId && { categoryId: parseInt(categoryId) }),
      },
      include: {
        category: true,
      },
    });
    
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a note with optional category
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, categoryId } = req.body;
    
    if (!title && !content && categoryId === undefined) {
      return res.status(400).json({ error: 'At least one field must be provided' });
    }
    
    const note = await prisma.note.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(categoryId !== undefined && { categoryId: categoryId ? parseInt(categoryId) : null }),
      },
      include: {
        category: true,
      },
    });
    
    res.json(note);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete a note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.note.delete({
      where: {
        id: parseInt(id),
      },
    });
    
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a category
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const category = await prisma.category.create({
      data: { name },
    });
    
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});