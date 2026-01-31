import config from '../config';

export class DashboardService {
  async getWeather(coordinates: string) {
    const darkSkyApiKey = config.weatherApiKey;
    const fetchRes = await fetch(
      `https://api.darksky.net/forecast/${darkSkyApiKey}/${coordinates}?units=auto&exclude=alerts`,
    );
    return fetchRes.json();
  }

  async getCovidCountries() {
    const fRes = await fetch('https://disease.sh/v3/covid-19/countries');
    return fRes.json();
  }

  async getCovidHistorical() {
    const fRes = await fetch('https://disease.sh/v3/covid-19/historical/all?lastdays=80');
    return fRes.json();
  }

  async getCovidMapData() {
    const fRes = await fetch('https://thevirustracker.com/timeline/map-data.json');
    return fRes.json();
  }
}

export const dashboardService = new DashboardService();
