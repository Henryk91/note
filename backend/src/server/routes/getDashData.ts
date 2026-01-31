import { Application, Request, Response } from 'express';

export default function getDashData(app: Application) {
  app.get('/api/dash-data/weather', async (req: Request, res: Response) => {
    try {
      const darkSkyApiKey = process.env.WEATHER_DATA_API_KEY;
      const coordinates = (req.query.coordinates as string) ?? '';
      const fetchRes = await fetch(`https://api.darksky.net/forecast/${darkSkyApiKey}/${coordinates}?units=auto&exclude=alerts`);
      const json = await fetchRes.json();
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(json));
    } catch (error) {
      res.status(500).json({ error: 'Unable to fetch weather', detail: (error as Error).message });
    }
  });

  app.get('/api/dash-data/countries', async (_req: Request, res: Response) => {
    const fRes = await fetch('https://disease.sh/v3/covid-19/countries');
    const data = await fRes.json();
    res.json(data);
  });

  app.get('/api/dash-data/historical', async (_req: Request, res: Response) => {
    const fRes = await fetch('https://disease.sh/v3/covid-19/historical/all?lastdays=80');
    const data = await fRes.json();
    res.json(data);
  });

  app.get('/api/dash-data/map-data', async (_req: Request, res: Response) => {
    const fRes = await fetch('https://thevirustracker.com/timeline/map-data.json');
    const data = await fRes.json();
    res.json(data);
  });
}
