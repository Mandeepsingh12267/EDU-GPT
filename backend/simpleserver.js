const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is working! 🚀',
        timestamp: new Date().toISOString()
    });
});

// Auth config
app.get('/auth/config', (req, res) => {
    res.json({
        success: true,
        message: 'Auth config endpoint',
        status: 'Ready for OAuth'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
});