// MIT License — Luna AI Web | Built by Ravikiran (github.com/R22-b)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cache = require('./services/cache-manager');
const limits = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/chat',      limits.chat,      require('./routes/chat'));
app.use('/api/image',     limits.image,     require('./routes/image'));
app.use('/api/documents', limits.documents, require('./routes/documents'));
app.use('/api/research',  limits.research,  require('./routes/research'));
app.use('/api/student',   limits.student,  require('./routes/student'));
app.use('/api/settings',  require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Luna AI Web is running 🌙',
    version: '1.0.0',
    builtBy: 'Ravikiran | github.com/R22-b',
    cache: cache.getStats(),
    uptime: process.uptime(),
  });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🌙 Luna AI Web Backend running on port ${PORT}`);
  console.log(`   Built by Ravikiran | github.com/R22-b`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
