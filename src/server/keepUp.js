const https = require('https');

let isRunning = false;
function calcTime(offset) {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const nd = new Date(utc + (3600000 * offset));
  return nd.getHours();
}

function refresh(url, startHour, endHour, minuteInterval) {
  const timeNow = calcTime('+2');
  console.log('Time Now', timeNow, (timeNow > startHour), (timeNow < endHour));
  if (timeNow > startHour && timeNow < endHour) {
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
