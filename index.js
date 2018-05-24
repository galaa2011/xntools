const express = require('express')
const audits = require('./audits')

const app = express()
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With')
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')
  next()
})

app.get('/audits/run', (req, res) => {
  try {
    audits(req.query, req).catch(e => {console.error(e)})
    res.send({status: 200, time: +new Date})
  } catch (error) {
    res.send({
      status: 500,
      error: error.message,
      message: '检测失败',
      time: +new Date
    })
  }
})

app.listen(9223)
