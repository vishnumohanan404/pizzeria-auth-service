import { Request } from "express";

export interface UserData {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
}
export interface RegisterUserRequest extends Request {
  body: UserData;
}

export interface AuthRequest extends Request {
  auth: {
    sub: string;
    role: string;
  };
}
