const https = require('https');
const calcTimeNowOffset = require('./utils.js');

let isRunning = false;

function refresh(url, startHour, endHour, minuteInterval) {
  const time = calcTimeNowOffset('+2');
  const timeNow = time.getHours();
  if ((timeNow > startHour && timeNow < endHour) || (startHour === endHour)) {
    console.log('Calling KeepUp!', new Date().toLocaleString());
    https.get(url, (resp) => {
      console.log('KeepUp Responce Status:', resp.statusCode);
      console.log('');
    });

    setTimeout(() => {
      refresh(url, startHour, endHour, minuteInterval);
    }, (minuteInterval * 60 * 1000));
  } else {
    console.log('Done for the day!');
  }
}
function KeepUp(url, startHour, endHour, minuteInterval) {
  if (!isRunning) {
    isRunning = true;
    refresh(url, startHour, endHour, minuteInterval);
  } else {
    // console.log('Already Running');
  }
}

module.exports = KeepUp;
