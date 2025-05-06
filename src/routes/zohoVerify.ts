import path from 'path';
import express from 'express';

const router = express.Router();

// Endpoint para servir o arquivo de verificação do Zoho
router.get('/zohoverify/verifyforzoho.html', (req, res) => {
  const filePath = path.join(__dirname, '../zohoverify/verifyforzoho.html'); // Caminho ajustado
  res.sendFile(filePath);
});

export default router;
