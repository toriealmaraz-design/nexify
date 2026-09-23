require('dotenv').config({ path: '/home/toriealmaraz/nexify/backend/.env' );
const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 'ac6f1c12-faee-46f4-8960-a0c52fcd09d1', role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '24h' });
process.stdout.write(token);
