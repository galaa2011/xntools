const fetch = require('node-fetch');
const fs = require('fs');
const config = require('./config.js');

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const firstPaint = require('./first-paint');

function launchChromeAndRunLighthouse(url, opts, config = null) {
  return chromeLauncher.launch({chromeFlags: opts.chromeFlags}).then(chrome => {
    opts.port = chrome.port;
    return lighthouse(url, opts, config).then(results => {
      // The gathered artifacts are typically removed as they can be quite large (~50MB+)
      delete results.artifacts;
      return chrome.kill().then(() => results);
    });
  });
}
const opts = {
  chromeFlags: ['--disable-gpu', '--headless', '--no-sandbox']
};

module.exports = function audits (query, req) {
  launchChromeAndRunLighthouse(query.url, opts, config).then(results => {
    firstPaint(results).then(() => {
      fetch('http://10.210.228.89/s/audits/update?status=1&id=' + query.id, {
        method: 'POST',
        headers: {
          cookie: req.headers.cookie,
        },
        // credentials: 'include'
        body: JSON.stringify({file: results})
      })
        .then(res => res.json())
        .then(res => {
          // console.log(res)
          // fs.writeFile(__dirname + `/response.json`, JSON.stringify(res, null, 2), 'utf8', err => {});
        })
      // fs.writeFile(__dirname + `/report.json`, JSON.stringify(results, null, 2), 'utf8', err => {});
    })
  });
}
