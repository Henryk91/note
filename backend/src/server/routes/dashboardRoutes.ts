import { Router } from 'express';
import { dashboardController } from '../controllers/DashboardController';

const router = Router();

router.get('/dash-data/weather', dashboardController.getWeather);
router.get('/dash-data/countries', dashboardController.getCovidCountries);
router.get('/dash-data/historical', dashboardController.getCovidHistorical);
router.get('/dash-data/map-data', dashboardController.getCovidMapData);

export default router;
