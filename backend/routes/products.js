const express = require("express");
const router = express.Router();
const { default: mongoose } = require("mongoose");
const { Product } = require("../models/product");
const { Category } = require("../models/category");
const multer = require("multer");

const FILE_TYPE_MAP = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/png": "png",
  // Add more MIME types and extensions as needed
};

const upload = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = isValid ? null : new Error("Invalid image type");

    cb(uploadError, "public/my-uploads"); // Removed the leading slash
  },
  filename: function (req, file, cb) {
    const extension = FILE_TYPE_MAP[file.mimetype];
    const fileName = file.originalname.split(" ").join("-");

    if (extension) {
      cb(null, fileName + "-" + Date.now() + "." + extension);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

const uploadOptions = multer({ storage: upload });

router.get("/", async (req, res) => {
  let filter = {};

  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }

  const prodList = await Product.find(filter).populate("category");

  if (!prodList) return res.status(500).json({ success: false });
  res.send(prodList);
});

router.get("/:id", async (req, res) => {
  const prod = await Product.findById(req.params.id).select("name image");

  if (!prod) return res.status(500).json({ success: false });
  res.send(prod);
});

router.post("/", uploadOptions.single("image"), async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  const file = req.file;
  if (!file) return res.status(400).send("no image in the request");

  const fileName = req.file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/my-uploads/`;

  const newProduct = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });

  const product = await newProduct.save();

  if (!product) return res.status(500).send("The product cannot be created");
});

router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Product Id");
  }

  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: req.body.image,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!product) return res.status(400).send("the product could not be updated");

  res.send(product);
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: "Product not found" });
    }
    if (deleted) {
      res.status(200).json({ success: true, message: "Product deleted" });
    }
  } catch (error) {
    return res.status(400).json({ success: false, error: error });
  }
});

router.get("/get/count", async (req, res) => {
  const productCount = await Product.countDocuments();

  if (!productCount) res.status(500).json({ success: false });

  res.json({
    productCount: productCount,
  });
});

router.get("/get/featured/:count", async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const products = await Product.find({ isFeatured: true }).limit(+count);

  if (!products) {
    res.status(500).json({ success: false });
  }
  res.send(products);
});

router.put(
  "/gallery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("invalid product ID");
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/my-uploads`;

    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.fileName}`);
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      { new: true }
    );

    if (!product) {
      return res.status(400).send("The images array could not be updated");
    }
    res.send(product);
  }
);

module.exports = router;
