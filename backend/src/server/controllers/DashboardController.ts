import { Request, Response } from 'express';
import { dashboardService } from '../services/DashboardService';

export class DashboardController {
  async getWeather(req: Request, res: Response) {
    try {
      const coordinates = (req.query.coordinates as string) ?? '';
      const data = await dashboardService.getWeather(coordinates);
      res.json(data);
    } catch (error) {
      console.error('Weather error:', error);
      res.status(500).json({
        error: 'Unable to fetch weather',
        detail: (error as Error).message,
      });
    }
  }

  async getCovidCountries(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getCovidCountries();
      res.json(data);
    } catch (error) {
      console.error('Covid countries error:', error);
      res.status(500).json({ error: 'Failed to fetch covid countries' });
    }
  }

  async getCovidHistorical(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getCovidHistorical();
      res.json(data);
    } catch (error) {
      console.error('Covid historical error:', error);
      res.status(500).json({ error: 'Failed to fetch covid historical data' });
    }
  }

  async getCovidMapData(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getCovidMapData();
      res.json(data);
    } catch (error) {
      console.error('Covid map data error:', error);
      res.status(500).json({ error: 'Failed to fetch covid map data' });
    }
  }
}

export const dashboardController = new DashboardController();
