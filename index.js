const express = require('express');
const app = express();
app.use(express.json());

// 允许跨域，让你的前端能正常调用
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 核心生成接口
app.post('/api/generate', async (req, res) => {
  const { prompt, size } = req.body;
  if (!prompt) return res.status(400).json({ error: "请输入生成指令" });

  // 尺寸映射，适配你的前端
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
    // 调用12AI的API，密钥存在Vercel的环境变量里
    const response = await fetch("https://new12ai.org/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_KEY}`
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

    // 返回生成的图片地址
    res.json({
      imageUrl: data?.data?.[0]?.url || "",
      error: ""
    });
  } catch (err) {
    res.status(500).json({ error: "生成失败：" + err.message });
  }
});

module.exports = app;