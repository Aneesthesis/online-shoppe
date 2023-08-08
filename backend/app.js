const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const categoriesRoutes = require("./routes/categories");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/errror-handler");
const orderRoutes = require("./routes/order");

require("dotenv/config");

app.use(cors());
app.options("*", cors());

// MIDDLEWARES

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// Parse application/json
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(errorHandler);

const api = process.env.API_URL;

// ROUTER
app.use(authJwt());
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, orderRoutes);

mongoose
  .connect(process.env.DATABASE_URI, { dbName: "onlineshoppe-database" })
  .then(() => {
    console.log(`connected to.... ` + mongoose.connection.name);
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(5000, () => {
  console.log("server up on port http://127.0.0.1:5000");
});
