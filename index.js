const express = require('express')
const audits = require('./audits')
const mysql = require('mysql')
const pool = mysql.createPool({
  connectionLimit: 10,
  host: '10.210.228.89',
  port: 3307,
  user: 'root',
  password: '123456',
  database: 'smart'
});
pool.getConnection((err, connection) => {
  connection.query('SELECT * FROM tag LIMIT 100;', (error, results, fields) => {
    console.log(results)
    connection.release();
    if (error) throw error;
  });
});

const app = express()
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With')
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')
  next()
})

app.get('/node-server/audits', (req, res) => {
  try {
    audits(req.query.url, req)
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
