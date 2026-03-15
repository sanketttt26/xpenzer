import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import users from "../../services/users.js";
import response from "../../helpers/response.js";
import generateToken from "../../helpers/generateToken.js";
import notifications from "../../services/notifications.js";

export const signupUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    const errorMessages = errors.array().map((err) => err.msg);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: errorMessages,
      });
    }

    // EXTRACT REQ BODY
    const { username, phone, password } = req.body;

    // HASH THE PASSWORD
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (error) {
      console.log("Error while hashing the password " + error.message);
    }

    const newUser = await users.createUser(username, phone, hashedPassword);

    return response.ok(res, newUser, "Signup success");
  } catch (error) {
    console.log(error);
    let message =
      error.code === "23505"
        ? "User already exists"
        : "Error while signing up user";
    return response.serverError(res, message);
  }
};

export const loginUser = async (req, res) => {
  const { phone, password } = req.body;
  try {
    const errors = validationResult(req.body);
    const errorMessages = errors.array().map((err) => err.msg);

    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: errorMessages,
      });
    }

    const isUser = await users.findUser(phone);

    if (!isUser || !(await bcrypt.compare(password, isUser.password)))
      return response.unAuthorized(res, "Invalid username of password");

    isUser.password = null;
    const token = generateToken(isUser);

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return response.ok(res, isUser, "Login successful");
  } catch (error) {
    console.log("Something went wrong while logging in " + error);
    return response.serverError(res, "Something went wrong while logging in");
  }
};

export const autoLogin = async (req, res) => {
  if (req.user) {
    return res.status(StatusCodes.OK).json({
      message: "Login successful",
      user: req.user,
    });
  }
  return res.status(StatusCodes.UNAUTHORIZED).json({
    message: "Access denied",
  });
};

export const getAllNotifications = async (req, res) => {
  try {
    const result = await notifications.getAllNotifications(req.user.userId);
    return response.ok(res, result);
  } catch (error) {
    console.log(error);
    response.serverError(res);
  }
};

export const readNotifications = async (req, res) => {
  const { id } = req.query;

  try {
    const result = await notifications.markRead(id);
    response.ok(res);
  } catch (error) {
    console.log(error);
    response.serverError(res);
  }
};
