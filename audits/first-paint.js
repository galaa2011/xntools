const {Buffer} = require('buffer');
let thmclrx = require("thmclrx");
module.exports = function (data) {
  let _all = []
  data.audits['screenshot-thumbnails'].details.items.forEach(item => {
    if (item.timing < data.audits['first-meaningful-paint'].rawValue) {
      _all.push(new Promise((resolve, reject) => {
        let buffer = new Buffer(item.data, 'base64')
        thmclrx.octree(buffer, (err, colors) => {
          if (colors) {
            resolve(colors)
          } else {
            reject(err)
          }
        });
      }))
    }
  })
  return Promise.all(_all).then(allColors => {
    if (allColors.length === 1) {
      data.audits['first-paint'] = {rawValue: data.audits['screenshot-thumbnails'].details.items[0].timing}
      return
    }
    allColors.forEach((colors, i) => {
      if (colors.length >= 1 && colors[0].color.toLowerCase() !== 'ffffff' && !data.audits['first-paint']) {
        data.audits['first-paint'] = {rawValue: data.audits['screenshot-thumbnails'].details.items[i - 1].timing}
      }
    })
  })
}
