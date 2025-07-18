import express, { Request, Response } from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const app = express();
app.use(cors());

const PORT = 5000;

// Multer setup
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// POST /send-email
app.post('/send-email', upload.single('file'), async (req: Request, res: Response) => {
  const { from, to, subject, message } = req.body;
  const file = req.file;

  if (!from || !to || !subject || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // must be same as `from` in real SMTP
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from, // use user's input as "from" name
    to,
    subject,
    text: message,
    attachments: file
      ? [{ filename: file.originalname, path: file.path }]
      : [],
  };

  try {
    await transporter.sendMail(mailOptions);

    // optional: delete file after sending
    if (file) fs.unlink(file.path, () => {});

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Server is getting');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
 