const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Memory storage — file buffer me rakhega, disk pe nahi
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB max
});

// CORS — browser se request allow karne ke liye
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve frontend HTML
app.use(express.static(path.join(__dirname, 'public')));

// Upload proxy endpoint
app.post('/upload', upload.array('files[]'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const results = [];

    for (const file of req.files) {
      const formData = new FormData();
      formData.append('files[]', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const response = await fetch('https://pone.rs/upload?output=json', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });

      const data = await response.json();

      if (data.success && data.files && data.files.length > 0) {
        results.push({
          name: file.originalname,
          url: data.files[0].url,
          success: true,
        });
      } else {
        results.push({
          name: file.originalname,
          success: false,
          error: 'pone.rs rejected the file',
        });
      }
    }

    res.json({ success: true, files: results });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
