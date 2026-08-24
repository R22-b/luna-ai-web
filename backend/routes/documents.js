// MIT License — Luna AI Web | Built by Ravikiran (github.com/R22-b)
const express = require('express');
const router = express.Router();
const { generateWord, generatePDF, generatePPT, generateExcel } = require('../services/document-service');

const TYPES = {
  word:  { fn: generateWord,  ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  pdf:   { fn: generatePDF,   ext: 'pdf',  mime: 'application/pdf' },
  ppt:   { fn: generatePPT,   ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  excel: { fn: generateExcel, ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
};

router.post('/generate', async (req, res) => {
  try {
    const { type = 'word', topic, instructions = '', pages = 3 } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });
    const docType = TYPES[type];
    if (!docType) return res.status(400).json({ error: `Invalid type. Use: ${Object.keys(TYPES).join(', ')}` });

    const buffer = await docType.fn(topic, instructions, pages);
    const filename = `Luna_${topic.replace(/\s+/g, '_').substring(0, 30)}.${docType.ext}`;
    res.setHeader('Content-Type', docType.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Document error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
