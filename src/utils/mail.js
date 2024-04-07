import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

const sendEmail = async (email, subject, content) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_NAME,
        pass: process.env.MAIL_PASSWORD
      }
    })
    const templatePath = path.join(__dirname, '../templates/new-email.html')
    let htmlContent = fs.readFileSync(templatePath, 'utf8')

    htmlContent = htmlContent.replace('{{subject}}', subject).replace('{{content}}', content)

    await transporter.sendMail({
      from: 'Shop online <no-relply>',
      to: email,
      subject: subject,
      text: content,
      html: htmlContent,
      attachments: [
        {
          filename: 'BEE_Jan23_FashionGuide_v01.gif',
          path: path.join(__dirname, '../templates/images/BEE_Jan23_FashionGuide_v01.gif'),
          cid: 'logoimagecid'
        },
        {
          filename: 'images/SevenWonders_Logo_WhitewithBlackStroke_1.png',
          path: path.join(__dirname, '../templates/images/SevenWonders_Logo_WhitewithBlackStroke_1.png'),
          cid: 'logocid'
        }
      ]
    })
  } catch (error) {
    console.error('Error sending email:', error)
  }
}

export default sendEmail
