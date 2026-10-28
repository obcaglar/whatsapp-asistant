# WhatsApp ⇄ Google Workspace Asistanı (Sesli & Yazılı)

## ▲ Vercel ile 1 Dakikada Yayına Alma:
1. Bu klasördeki tüm dosyaları yeni bir **GitHub** reposuna yükleyin.
2. [vercel.com/new](https://vercel.com/new) adresinden reponuzu **Import** edin.
3. **Environment Variables** kısmına `.env.example` içindeki değişkenleri ekleyin ve **Deploy**'a basın!
4. Meta Webhook URL'niz: `https://PROJE-ADINIZ.vercel.app/api/webhook` olarak hazır olacaktır.

## 📱 Hızlı Başlangıç (QR Kodlu Bireysel Kurulum - Kendi Bilgisayarınız veya Railway/VPS):
1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
2. `.env.example` dosyasını `.env` olarak kopyalayın ve Google OAuth + Gemini API anahtarlarınızı girin.
3. Botu başlatın:
   ```bash
   npm run start:qr
   ```
4. Terminalde beliren **QR kodu telefonunuzdaki WhatsApp ile taratın**.
