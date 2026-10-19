const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', 'data', 'database.json');

let users = [];

function initStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      users = JSON.parse(content);
      if (!Array.isArray(users)) {
        users = [];
      }
    }
  } catch {
    users = [];
  }
}

function persistStore() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch {
    // Graceful in-memory fallback if file system is read-only
  }
}

initStore();

function parseDate(input) {
  if (!input) return new Date();
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(input.replace(/-/g, '/'));
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}

function createUser(username) {
  if (!username || typeof username !== 'string' || !username.trim()) {
    throw new Error('Username is required');
  }

  const trimmedUsername = username.trim();
  const newUser = {
    _id: crypto.randomBytes(12).toString('hex'),
    username: trimmedUsername,
    exercises: []
  };

  users.push(newUser);
  persistStore();

  return {
    _id: newUser._id,
    username: newUser.username
  };
}

function getAllUsers() {
  return users.map(user => ({
    _id: user._id,
    username: user.username
  }));
}

function getUserById(userId) {
  return users.find(user => user._id === String(userId)) || null;
}

function addExercise(userId, { description, duration, date }) {
  const user = getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (!description || typeof description !== 'string') {
    throw new Error('Description is required');
  }

  const parsedDuration = parseInt(duration, 10);
  if (isNaN(parsedDuration)) {
    throw new Error('Duration must be a number');
  }

  const dateObj = parseDate(date);
  const formattedDate = dateObj.toDateString();

  const exercise = {
    description: description.trim(),
    duration: parsedDuration,
    date: formattedDate
  };

  user.exercises.push(exercise);
  persistStore();

  return {
    _id: user._id,
    username: user.username,
    date: exercise.date,
    duration: exercise.duration,
    description: exercise.description
  };
}

function getLogs(userId, { from, to, limit }) {
  const user = getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  let logs = [...user.exercises];

  if (from) {
    const fromTime = parseDate(from).getTime();
    logs = logs.filter(ex => parseDate(ex.date).getTime() >= fromTime);
  }

  if (to) {
    const toTime = parseDate(to).getTime();
    logs = logs.filter(ex => parseDate(ex.date).getTime() <= toTime);
  }

  if (limit !== undefined && limit !== null && limit !== '') {
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      logs = logs.slice(0, parsedLimit);
    }
  }

  return {
    _id: user._id,
    username: user.username,
    count: logs.length,
    log: logs.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date
    }))
  };
}

function resetStore() {
  users = [];
  persistStore();
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  addExercise,
  getLogs,
  resetStore
};
