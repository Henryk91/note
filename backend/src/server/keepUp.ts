import https from 'https';
import { calcTimeNowOffset } from './utils';
import logger from './utils/logger';

let isRunning = false;

function refresh(url: string, startHour: number, endHour: number, minuteInterval: number) {
  const time = calcTimeNowOffset('+2');
  const timeNow = time.getHours();
  if ((timeNow > startHour && timeNow < endHour) || startHour === endHour) {
    logger.info({ time: new Date().toLocaleString() }, 'Calling KeepUp!');
    https.get(url, (resp) => {
      logger.info({ statusCode: resp.statusCode }, 'KeepUp Response Status');
    });

    setTimeout(
      () => {
        refresh(url, startHour, endHour, minuteInterval);
      },
      minuteInterval * 60 * 1000,
    );
  } else {
    logger.info('Done for the day!');
  }
}
export default function keepUp(url: string, startHour: number, endHour: number, minuteInterval: number) {
  if (!isRunning) {
    isRunning = true;
    refresh(url, startHour, endHour, minuteInterval);
  }
}
