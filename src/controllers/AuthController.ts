import { Request, Response } from "express";

export class AuthController {
  register(req: Request, res: Response) {
    // TODO: Implement the registration logic here
    res.status(201).json();
  }
}
