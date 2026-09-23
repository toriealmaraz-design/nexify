/**
 * Note Routes — /api/v1/notes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const noteController = require('../controllers/noteController');

// Create a note for a lesson
router.post('/', authenticate, noteController.createNote);

// Get all notes for a specific lesson (current user)
router.get('/lesson/:lessonId', authenticate, noteController.getNotesByLesson);

// Get all notes for current user (with lesson/course info)
router.get('/me', authenticate, noteController.getMyNotes);

// Update a note
router.put('/:id', authenticate, noteController.updateNote);

// Delete a note
router.delete('/:id', authenticate, noteController.deleteNote);

module.exports = router;
