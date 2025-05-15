'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '/config/.env') });

const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');
const qs = require('qs'); // 重要：imgbb 需要用 x-www-form-urlencoded

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const chatgptKey = process.env.OPENAI_API_KEY;

const client = new line.Client(config);
const app = express();

// webhook endpoint
app.post('/callback', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('LINE Callback 錯誤：', err);
      res.status(500).end();
    });
});

// 簡單測試
app.get('/', (req, res) => {
  res.json('ok');
});

// 處理事件
async function handleEvent(event) {
  if (
    event.replyToken === '00000000000000000000000000000000' ||
    event.replyToken === 'ffffffffffffffffffffffffffffffff'
  ) {
    return Promise.resolve(null);
  }
  if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      // 呼叫 OpenAI API
      const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        temperature:0.5,
        messages: [
        {
          role:"system",
          content: "你是一個幽默、有好奇心的藝術家",
        },
        {
          role: "user", 
          content: userMessage  //上下文記憶功能（設定於content）。ex-"紀錄最近十次的對話"
        }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${chatgptKey}`,
          'Content-Type': 'application/json'
        }
      });

      const replyText = gptResponse.data.choices[0].message.content;

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyText
      });
      return true;
    }

  return Promise.resolve(null);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 listening on ${port}`);
});
