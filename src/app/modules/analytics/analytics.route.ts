import { Router } from 'express';
import { analyticControllers } from './analytics.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.utils';

const router = Router();

router.get(
  '/matrix',
  // auth(USER_ROLE.admin),
  analyticControllers.getAnalyticsSummaryMatrix,
);

router.get(
  '/user/actions-counts',
  auth(USER_ROLE.user),
  analyticControllers.getUserActionCounts,
);

router.get(
  '/',
  // auth(USER_ROLE.admin),
  analyticControllers.getAllAnalytics,
);



export const AnalyticRoutes = router;
