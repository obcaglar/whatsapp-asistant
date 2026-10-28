// server.js - RESMİ META CLOUD API WEBHOOK SUNUCUSU
// Kurulum: npm install express body-parser dotenv googleapis axios

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { google } = require('googleapis');

const app = express();
app.use(bodyParser.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
const people = google.people({ version: 'v1', auth: oauth2Client });

app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg) return;

  const sender = msg.from;
  let text = '';
  let isVoice = false;

  if (msg.type === 'text') {
    text = msg.text.body;
  } else if (msg.type === 'audio') {
    isVoice = true;
    text = await fetchAndTranscribeMetaAudio(msg.audio.id);
  }

  if (text) {
    await syncWithGoogle(sender, text, isVoice);
  }
});

async function fetchAndTranscribeMetaAudio(mediaId) {
  const meta = await axios.get(`https://graph.facebook.com/v20.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
  });
  const audio = await axios.get(meta.data.url, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
    responseType: 'arraybuffer'
  });
  const b64 = Buffer.from(audio.data).toString('base64');
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: "Türkçe sesi metne çevir:" }, { inlineData: { mimeType: "audio/ogg", data: b64 } }] }] }
  );
  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function syncWithGoogle(to, text, isVoice) {
  const lower = text.toLowerCase();
  let reply = '';
  if (lower.includes('toplantı') || lower.includes('randevu')) {
    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: { summary: text, start: { dateTime: '2026-09-30T15:00:00+03:00' }, end: { dateTime: '2026-09-30T16:00:00+03:00' } }
    });
    reply = `📅 Google Takvim'e kaydedildi: ${text}`;
  } else if (lower.includes('rehber')) {
    await people.people.createContact({ requestBody: { names: [{ givenName: text }] } });
    reply = `👤 Google Kişiler'e eklendi: ${text}`;
  } else {
    reply = `📝 Notunuz alındı: "${text}"`;
  }

  await axios.post(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to: to,
    text: { body: reply }
  }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } });
}

app.listen(process.env.PORT || 3000, () => console.log('Sunucu 3000 portunda çalışıyor.'));