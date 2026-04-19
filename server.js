const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 }
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.array('files[]'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ success: false, error: 'No files uploaded' });

    const results = [];
    for (const file of req.files) {
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('fileToUpload', file.buffer, { filename: file.originalname, contentType: file.mimetype });

      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST', body: fd, headers: fd.getHeaders()
      });
      const text = await response.text();
      if (text.trim().startsWith('http')) {
        results.push({ name: file.originalname, url: text.trim(), success: true });
      } else {
        results.push({ name: file.originalname, success: false, error: text });
      }
    }
    res.json({ success: true, files: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/upload-perm', upload.single('fileToUpload'), async (req, res) => {
  try {
    if (!req.file) return res.status(500).send('No file received');

    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('fileToUpload', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST', body: fd, headers: fd.getHeaders()
    });

    const text = await response.text();

    if (text.trim().startsWith('http')) {
      res.send(text.trim());
    } else {
      res.status(500).send('Catbox error: ' + text);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
