const fetch = require('node-fetch');
const fs = require('fs');
const config = require('./config.js');

const lighthouse = require('lighthouse');
const log = require('lighthouse-logger');
const chromeLauncher = require('chrome-launcher');
const firstPaint = require('./first-paint');

function launchChromeAndRunLighthouse(url, opts, config = null) {
  return chromeLauncher.launch({chromeFlags: opts.chromeFlags}).then(chrome => {
    opts.port = chrome.port;
    return lighthouse(url, opts, config).then(results => {
      // The gathered artifacts are typically removed as they can be quite large (~50MB+)
      delete results.artifacts;
      return chrome.kill().then(() => results);
    }).catch(e => {
      chrome.kill().then(() => e);
    });
  });
}
const opts = {
  logLevel: 'info',
  // output: 'json',
  // disableDeviceEmulation: true,
  // disableCpuThrottling: true,
  // disableNetworkThrottling: true,
  chromeFlags: ['--disable-gpu', '--headless', '--no-sandbox']
};
log.setLevel(opts.logLevel);

module.exports = function audits (query, req) {
  return launchChromeAndRunLighthouse(query.url, opts, config).then(results => {
    return firstPaint(results).then(() => {
      let fp = results.audits['first-paint'];
      let fmp = results.audits['first-meaningful-paint'];
      let fi = results.audits['first-interactive'];
      let st = results.audits['screenshot-thumbnails'];
      let status = 1
      if (fmp.score === null || isNaN(fmp.score)) {
        if (st.details && st.details.items && st.details.items.length) {
          fmp.rawValue = fp.nextTiming || (st.details.scale - (st.details.scale - fp.rawValue) / 2);
        } else {
          status = 2
        }
      }
      if (fi.score === null || isNaN(fi.score)) {
        if (st.details && st.details.items && st.details.items.length) {
          fi.rawValue = st.details.scale;
        } else {
          status = 2
        }
      }
      return fetch(`http://10.210.228.89/s/audits/update?status=${status}&id=${query.id}`, {
        method: 'POST',
        headers: {
          cookie: req.headers.cookie,
        },
        // credentials: 'include'
        body: JSON.stringify({file: results})
      })
        .then(res => res.json())
        .then(res => {
          return res;
          // fs.writeFile(__dirname + `/response.json`, JSON.stringify(res, null, 2), 'utf8', err => {});
        })
      // fs.writeFile(__dirname + `/report.json`, JSON.stringify(results, null, 2), 'utf8', err => {});
    })
  });
}
