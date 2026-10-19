const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User routes
router.post('/users', userController.createUser);
router.get('/users', userController.getAllUsers);

// Exercise routes
router.post('/users/:_id/exercises', userController.addExercise);

// Log routes
router.get('/users/:_id/logs', userController.getUserLogs);

module.exports = router;
