const axios = require('axios');
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
const people = google.people({ version: 'v1', auth: oauth2Client });

module.exports = async function handler(req, res) {
  // 1. Meta Webhook Doğrulaması (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Doğrulama başarısız' });
  }

  // 2. WhatsApp Gelen Mesaj / Sesli Komut İşleme (POST)
  if (req.method === 'POST') {
    try {
      const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!msg) return res.status(200).send('EVENT_RECEIVED');

      const sender = msg.from;
      let text = '';

      if (msg.type === 'text') {
        text = msg.text.body;
      } else if (msg.type === 'audio') {
        // Sesli mesajı Gemini ile metne çevir
        const meta = await axios.get(`https://graph.facebook.com/v20.0/${msg.audio.id}`, {
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
        });
        const audio = await axios.get(meta.data.url, {
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
          responseType: 'arraybuffer'
        });
        const b64 = Buffer.from(audio.data).toString('base64');
        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
          { contents: [{ parts: [{ text: "Türkçe sesi metne dök:" }, { inlineData: { mimeType: "audio/ogg", data: b64 } }] }] }
        );
        text = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      }

      if (text) {
        const lower = text.toLowerCase();
        let reply = '';

        if (lower.includes('toplantı') || lower.includes('randevu') || lower.startsWith('!toplanti')) {
          await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
              summary: text,
              start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
              end: { dateTime: new Date(Date.now() + 90000000).toISOString() }
            }
          });
          reply = `📅 Google Takvim'e kaydedildi: ${text}`;
        } else if (lower.includes('rehber') || lower.startsWith('!rehber')) {
          await people.people.createContact({
            requestBody: { names: [{ givenName: text }] }
          });
          reply = `👤 Google Kişiler'e eklendi: ${text}`;
        } else {
          reply = `📝 Not alındı: "${text}"`;
        }

        await axios.post(
          `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          { messaging_product: 'whatsapp', to: sender, text: { body: reply } },
          { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } }
        );
      }

      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error(err);
      return res.status(200).send('EVENT_HANDLED');
    }
  }

  return res.status(405).send('Method Not Allowed');
};