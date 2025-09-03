import jwt from "jsonwebtoken";

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.SECRET_KEY_ACCESS_TOKEN, { expiresIn: "24h" });
};

export default generateAccessToken;
