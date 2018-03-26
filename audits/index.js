// var shell = require('shelljs');
// const configs = [
//   '--config-path=config.js',
//   '--output json',
//   '--output-path ./report.json',
//   '--chrome-flags="--headless"'
// ]
// shell.exec('lighthouse --config-path=config.js --chrome-flags="--headless" http://sinaluming.com/z/1754/ --output json  --output-path ./report.json', function(code, stdout, stderr) {
//   console.log(stdout)
// });
// if (!shell.which('git')) {
//   shell.echo('Sorry, this script requires git');
//   shell.exit(1);
// }
const fetch = require('node-fetch');
const fs = require('fs');
const config = require('./config.js');
// const lighthouse = require('lighthouse');
// const {Launcher} = require('lighthouse/chrome-launcher');
// const launcher = new Launcher({port: 9222});
// launcher.launch()
//   .then(() => lighthouse('http://sinaluming.com/z/1754/', {port: 9222}, config))
//   .then(result => {
//     console.log(result);
//     fs.writeFile(__dirname + `/report2.json`, JSON.stringify(result, null, 2), 'utf8', err => {});
//     launcher.kill();
//   });

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

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
  chromeFlags: ['--headless']
};

module.exports = function audits (url, req) {
  launchChromeAndRunLighthouse(url, opts, config).then(results => {
    // console.log(results)
    fetch('http://local.sina.com.cn:8090/s/tag/list?parentId=1', {
      headers:{
        cookie: req.headers.cookie,
      },
      // credentials: 'include'
    })
      .then(res => res.json())
      .then(res => {
        console.log(res)
        fs.writeFile(__dirname + `/response.json`, JSON.stringify(res, null, 2), 'utf8', err => {});
      })
    fs.writeFile(__dirname + `/report.json`, JSON.stringify(results, null, 2), 'utf8', err => {});
  });
}
