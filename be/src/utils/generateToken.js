const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secretkey", {
    expiresIn: "1d",
  });
};

module.exports = generateToken;