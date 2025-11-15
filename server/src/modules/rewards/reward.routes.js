import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Get all rewards');
});

router.post('/', (req, res) => {
  res.send('Create a new reward');
});

export default router;