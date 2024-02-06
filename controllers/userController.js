/* /controllers/userController.js */
require('dotenv').config();
const path = require("path");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sequelize = require("../util/database");

const generateAccessToken = (userId, userEmail, isPremiumUser) => {
  const token = jwt.sign({ userId, userEmail, isPremiumUser }, "1937683932020310230484786355", { expiresIn: '1h' });
  return token;
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing token' });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Forbidden: Invalid token' });
    }

    req.user = decoded;
    next();
  });
};

const isPremiumUser = async (req, res, next) => {
  try {
    if (req.user && req.user.isPremiumUser) {
      return res.json({ isPremiumUser: true });
    } else {
      return res.json({ isPremiumUser: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getLoginPage = async (req, res, next) => {
  try {
    res.sendFile(path.join(__dirname, "../", "public", "views", "login.html"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const postUserSignUp = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email: email } });

    if (existingUser) {
      return res.status(409).send(
        `<script>alert('This email is already taken. Please choose another one.'); window.location.href='/'</script>`
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: name,
      email: email,
      password: hashedPassword,
    });

    res.status(200).send(
      `<script>alert('User Created Successfully!'); window.location.href='/'</script>`
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const postUserLogin = async (req, res, next) => {
  try {
    const { loginEmail, loginPassword } = req.body;

    const user = await User.findOne({ where: { email: loginEmail } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User doesn't Exist!",
      });
    }

    bcrypt.compare(loginPassword, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Something went Wrong!" });
      }
      if (result) {
        // Modify this line to include the isPremiumUser parameter if applicable
        const token = generateAccessToken(user.id, user.email, user.isPremiumUser);
        
        return res.status(200).json({
          success: true,
          message: "Login Successful!",
          token: token,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Password Incorrect!",
        });
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: [
        [sequelize.col("name"), "name"],
        [sequelize.col("totalExpenses"), "totalExpenses"],
      ],
      order: [[sequelize.col("totalExpenses"), "DESC"]],
    });

    const result = users.map((user) => ({
      name: user.getDataValue("name"),
      totalExpenses: user.getDataValue("totalExpenses"),
    }));

    res.send(JSON.stringify(result));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  generateAccessToken,
  getLoginPage,
  postUserLogin,
  postUserSignUp,
  isPremiumUser,
  getAllUsers,
};

