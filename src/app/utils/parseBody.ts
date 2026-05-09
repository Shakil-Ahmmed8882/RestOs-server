import { NextFunction, Request, Response } from "express";

const parseBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.data) {
    try {
      req.body = JSON.parse(req.body.data);
    } catch (error) {
      return res.status(400).send({ error: "Invalid JSON data...." });
    }
  }
  next();
};

export default parseBody;
