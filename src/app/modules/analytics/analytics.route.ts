import { Router } from 'express';
import { analyticControllers } from './analytics.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../../constants';


const router = Router();

router.get(
  '/matrix',
  // auth(USER_ROLE.ADMIN),
  analyticControllers.getAnalyticsSummaryMatrix,
);

router.get(
  '/user/actions-counts',
  auth(USER_ROLE.USER),
  analyticControllers.getUserActionCounts,
);

router.get(
  '/',
  // auth(USER_ROLE.ADMIN),
  analyticControllers.getAllAnalytics,
);



export const analyticRoutes = router;
