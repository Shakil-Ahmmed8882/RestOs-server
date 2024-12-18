/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import globalErrorHandler from './app/middlewares/globalErrorhandler';
import router from './route';
import notFound from './app/middlewares/notFound';


const app: Application = express();

//parsers
app.use(express.json());
app.use(cookieParser());

app.use(cors({ origin: ['http://localhost:5173','http://localhost:5174'], credentials: true }));

// application routes
app.use('/api/v1', router);


app.get('/', (req: Request, res: Response) => {
  res.send('Restaurant Operating System Server!');
});

app.use(globalErrorHandler);

//Not Found
app.use(notFound);

export default app;