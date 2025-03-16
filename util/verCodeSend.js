"use strict";
const nodemailer = require("nodemailer")


// 创建发送邮件的对象
let transporter = nodemailer.createTransport({
  host: "smtp.qq.com", // 发送方邮箱 qq 通过lib/wel-konw
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: '2417802903@qq.com', // 发送方邮箱地址
    pass: 'bnanuxanhqcceaif' // mtp 验证码 这个有了才可以发送邮件，可以qq邮箱去查看自己的码
  }
})

function verCodeSend(mail, code) {
  // 邮件信息
  let mailobj = {
    from: '"在线白板" <2417802903@qq.com>', // sender address
    to: mail, // list of receivers
    subject: "登陆验证", // Subject line
    text: `您的验证码是${code}，有效期1分钟`
  }

  return new Promise((reslove, reject) => {
  // 发送邮件
    transporter.sendMail(mailobj, (err, data) => {
      if (err) {
        reject()
      } else {
        reslove()
      }
    })
  })
  // // 发送邮件
  // transporter.sendMail(mailobj, (err, data) => {
  //   console.log(err)
  //   console.log(data)
  // })
}

module.exports = { verCodeSend }