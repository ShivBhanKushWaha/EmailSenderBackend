import express, { Request, Response } from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const app = express();
app.use(cors());

const PORT = 5000;

// Multer setup
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// POST /send-email
app.post(
  "/send-email",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const { from, to, subject, message, scheduleTime } = req.body;
    const file = req.file;

    if (!from || !to || !subject || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from,
      to,
      subject,
      text: message,
      attachments: file
        ? [{ filename: file.originalname, path: file.path }]
        : [],
    };

    // ⏳ Schedule logic
    const sendEmail = async () => {
      try {
        await transporter.sendMail(mailOptions);
        if (file) fs.unlink(file.path, () => {});
        console.log("Email sent!");
      } catch (error) {
        console.error("Error sending email:", error);
      }
    };

    // If scheduleTime is present, calculate delay and use setTimeout
    if (scheduleTime) {
      const scheduledDate = new Date(scheduleTime);
      const delay = scheduledDate.getTime() - Date.now();

      if (delay <= 0) {
        await sendEmail(); // If scheduleTime is in past, send immediately
      } else {
        setTimeout(sendEmail, delay);
      }

      res.status(200).json({ message: `Email scheduled for ${scheduledDate}` });
    } else {
      await sendEmail();
      res.status(200).json({ message: "Email sent successfully" });
    }
  }
);

app.get("/", (req: Request, res: Response) => {
  res.send("Server is getting notice");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
