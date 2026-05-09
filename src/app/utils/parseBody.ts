import { NextFunction, Request, Response } from "express";

const parseBody = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body.data) {
    try {
      req.body = JSON.parse(req.body.data);
    } catch (error) {
      res.status(400).send({ error: "Invalid JSON data...." });
      return;
    }
  }
  next();
};

export default parseBody;
