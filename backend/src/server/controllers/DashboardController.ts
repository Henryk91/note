import { Request, Response } from 'express';
import { dashboardService } from '../services/DashboardService';
import logger from '../utils/logger';

export class DashboardController {
  async getWeather(req: Request, res: Response) {
    try {
      const coordinates = (req.query.coordinates as string) ?? '';
      const data = await dashboardService.getWeather(coordinates);
      res.json(data);
    } catch (error) {
      logger.error({ err: error }, 'Weather error');
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
      logger.error({ err: error }, 'Covid countries error');
      res.status(500).json({ error: 'Failed to fetch covid countries' });
    }
  }

  async getCovidHistorical(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getCovidHistorical();
      res.json(data);
    } catch (error) {
      logger.error({ err: error }, 'Covid historical error');
      res.status(500).json({ error: 'Failed to fetch covid historical data' });
    }
  }

  async getCovidMapData(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getCovidMapData();
      res.json(data);
    } catch (error) {
      logger.error({ err: error }, 'Covid map data error');
      res.status(500).json({ error: 'Failed to fetch covid map data' });
    }
  }
}

export const dashboardController = new DashboardController();
