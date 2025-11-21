import https from 'https';
import { calcTimeNowOffset } from './utils';

let isRunning = false;

function refresh(url: string, startHour: number, endHour: number, minuteInterval: number) {
  const time = calcTimeNowOffset('+2');
  const timeNow = time.getHours();
  if ((timeNow > startHour && timeNow < endHour) || startHour === endHour) {
    console.log('Calling KeepUp!', new Date().toLocaleString());
    https.get(url, (resp) => {
      console.log('KeepUp Response Status:', resp.statusCode);
      console.log('');
    });

    setTimeout(() => {
      refresh(url, startHour, endHour, minuteInterval);
    }, minuteInterval * 60 * 1000);
  } else {
    console.log('Done for the day!');
  }
}
export default function keepUp(url: string, startHour: number, endHour: number, minuteInterval: number) {
  if (!isRunning) {
    isRunning = true;
    refresh(url, startHour, endHour, minuteInterval);
  }
}
