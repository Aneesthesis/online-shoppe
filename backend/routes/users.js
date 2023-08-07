const { User } = require("../models/user");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userList = await User.find().select("-passwordHash");

    if (!userList) {
      res.status(500).json({ sucess: false });
    }
    res.send(userList);
  } catch (error) {
    res.send(error);
  }
});

router.post("/register", async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    color: req.body.color,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();
  if (!user) return res.status(400).send("the user cannot be created");

  res.send(user);
});

router.get("/:id", async (req, res) => {
  let user = await User.findById(req.params.id).select("name email phone");

  if (!user) return res.status(500).json({ success: false });
  res.send(user);
});

router.post("/login", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(500).send("The user not found");
  }

  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    return res.status(200).send({ message: "User Authenticated", token });
  } else {
    res.status(400).send("Wrong Password");
  }
});

router.get("/get/count", async (req, res) => {
  const usersCount = await User.countDocuments();
  console.log("Anees");

  if (!usersCount) res.status(500).json({ success: false });

  res.json({
    usersCount,
  });
});

module.exports = router;
