import mongoose from "mongoose";
const addressSchema = new mongoose.Schema(
  {
    address_line: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    pincode: {
      type: String,
      default: "",
    },
    mobile: {
      type: String,
      default: "",
    },
    // address_type: {
    //     type: String,
    //   enum: ["home", "work", "other"],
    //   default: "home",
    // },
    // is_default: {
    //     type: Boolean,
    //   default: false,
    // },
  },
  { timestamps: true }
);

const AddressModel = mongoose.model("address", addressSchema);
export default AddressModel;
