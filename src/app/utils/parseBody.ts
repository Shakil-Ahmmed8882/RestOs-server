import { NextFunction, Request, Response } from "express";

const parseBody = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = JSON.parse(req.body.data);
    next();
  } catch (error) {
    res.status(400).send({ error: "Invalid JSON data." });
  }

  return req.body;
};

export default parseBody;
