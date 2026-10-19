const userService = require('../services/userService');

function createUser(req, res) {
  const username = req.body && req.body.username;

  try {
    const user = userService.createUser(username);
    return res.status(200).json(user);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

function getAllUsers(req, res) {
  const users = userService.getAllUsers();
  return res.status(200).json(users);
}

function addExercise(req, res) {
  let userId = req.params._id;
  if (!userId || userId === ':_id') {
    userId = req.body && (req.body[':_id'] || req.body.userId || req.body._id);
  }
  const { description, duration, date } = req.body || {};

  try {
    const result = userService.addExercise(userId, { description, duration, date });
    return res.status(200).json(result);
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
}

function getUserLogs(req, res) {
  const userId = req.params._id;
  const { from, to, limit } = req.query || {};

  try {
    const logs = userService.getLogs(userId, { from, to, limit });
    return res.status(200).json(logs);
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createUser,
  getAllUsers,
  addExercise,
  getUserLogs
};
