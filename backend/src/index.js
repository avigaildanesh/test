const express = require('express');
const log4js = require('log4js');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

const logger = log4js.getLogger();
logger.level = 'info';

const dbConfig = {
  host: process.env.DB_HOST || 'tidb',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  port: process.env.DB_PORT || 4000,
  database: process.env.DB_NAME || 'testdb',
};


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length > 0) {
      const token = uuidv4();
      await conn.execute('UPDATE users SET token = ? WHERE id = ?', [token, rows[0].id]);

      logger.info(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: rows[0].id,
        action: 'login',
        ip: req.ip,
      }));

      res.json({ token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }

    await conn.end();
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(5000, () => {
  logger.info('Backend running on port 5000');
});
