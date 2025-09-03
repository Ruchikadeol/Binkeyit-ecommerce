import jwt from "jsonwebtoken";

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.SECRET_KEY_REFRESH_TOKEN, { expiresIn: "7d" });
};

export default generateRefreshToken;
