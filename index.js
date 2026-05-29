const express = require('express');
const app = express();
app.use(express.json());

// ------------------- 1. 读取环境变量 -------------------
const API_KEY = process.env.API_KEY;         // 12AI密钥
const API_SECRET = process.env.API_SECRET;   // 接口调用密钥
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS || ''; // 允许的前端域名

if (!API_KEY || !API_SECRET) {
  throw new Error('缺少必要的环境变量：API_KEY / API_SECRET');
}

// ------------------- 2. 白名单跨域（替换掉你原来的 *） -------------------
const allowedOrigins = ALLOWED_DOMAINS.split(',').map(d => d.trim());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // 只允许白名单里的域名
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ------------------- 3. 接口密钥校验（关键） -------------------
app.use('/api/generate', (req, res, next) => {
  const { secret } = req.body;
  if (secret !== API_SECRET) {
    return res.status(403).json({ error: '密钥错误，禁止访问' });
  }
  next();
});

// ------------------- 4. 原生成接口（不变） -------------------
app.post('/api/generate', async (req, res) => {
  const { prompt, size } = req.body;
  if (!prompt) return res.status(400).json({ error: "请输入生成指令" });

  const sizeMap = {
    "1:1": "1024x1024",
    "3:4": "1024x1792",
    "2:3": "1024x1536",
    "4:3": "1792x1024",
    "9:16": "1024x1792",
    "16:9": "1792x1024"
  };
  const targetSize = sizeMap[size] || "1024x1024";

  try {
    const response = await fetch("https://new12ai.org/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        size: targetSize,
        n: 1
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    res.json({
      imageUrl: data?.data?.[0]?.url || "",
      error: ""
    });
  } catch (err) {
    res.status(500).json({ error: "生成失败：" + err.message });
  }
});

module.exports = app;