const { Order } = require("../models/order");
const express = require("express");
const { OrderItem } = require("../models/orderItem");
const router = express.Router();

router.get("/", async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 });

  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(orderList);
});

router.get("/:id", async (req, res) => {
  let order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });

  if (!order) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(order);
});

router.post("/", async (req, res) => {
  try {
    const orderItemsIdsArray = await Promise.all(
      req.body.orderItems.map(async (orderItem) => {
        console.log(orderItem);
        let newOrderItem = new OrderItem({
          quantity: orderItem.quantity,
          product: orderItem.product,
        });
        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
      })
    );

    let order = new Order({
      orderItems: orderItemsIdsArray,
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2,
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
      phone: req.body.phone,
      status: req.body.status,
      totalPrice: req.body.totalPrice,
      user: req.body.user,
    });

    order = await order.save();

    if (!order) {
      return res.status(404).send("The order cannot be created");
    }

    res.send(order);
  } catch (error) {
    // Handle error
    res.status(500).send("Internal Server Error" + error);
  }
});

router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );

  if (!order) return res.status(400).send("the order cannot be updated");

  res.send(order);
});

router.delete("/:id", async (req, res) => {
  try {
    const orderDeleted = await Order.findByIdAndDelete(req.params.id);
    if (!orderDeleted) {
      res.status(404).json({ success: false, message: "Order not found" });
    }
    if (orderDeleted) {
      await orderDeleted.orderItems.map(async (orderItem) => {
        await OrderItem.findByIdAndDelete(orderItem);
      });
      res.status(200).json({ success: true, message: " orderDeleted" });
    }
  } catch (error) {
    return res.status(400).json({ success: false, error: error });
  }
});

module.exports = router;
