import { Router } from 'express';
import { saveControllers } from './save.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../../constants';


const router = Router();

// Save a blog post for a user
router.post(
  '/:blogId/save',
  auth(USER_ROLE.USER),                 
  saveControllers.saveBlog
);


// Get all saved blogs for a user
router.get(
  '/',
  auth(USER_ROLE.USER),                 
  saveControllers.getUserSavedBlogs
);

// Check if a blog is saved by a user
router.get(
  '/:blogId/is-saved',
  auth(USER_ROLE.USER),
  saveControllers.isBlogSavedByUser
);


// Unsave a blog post for a user
router.delete(
  '/:blogId/unsave',
  auth(USER_ROLE.USER),               
  saveControllers.unsaveBlog
);

export const saveRoutes = router;
