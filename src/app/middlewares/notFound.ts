import { Request, Response, NextFunction } from 'express';

const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    errorSources: [{ path: req.originalUrl, message: 'Route not found' }],
  });
};

export default notFound;
