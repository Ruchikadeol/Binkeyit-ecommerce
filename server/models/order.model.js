import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    orderId: {
      type: String,
      required: [true, "Order ID is required"],
      unique: true,
    },
    product_details: {
      _Id: String,
      type: Object,
      image: Array,
    },
  },
  { timestamps: true }
);

const ProductModel = mongoose.model("product", productSchema);
export default ProductModel;
