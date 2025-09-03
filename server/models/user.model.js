import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    mobile: { type: Number, default: null },
    refreshToken: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    lastLoginDate: { type: Date, default: null },
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
    addressDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: "address" }],
    shoppingCart: [{ type: mongoose.Schema.Types.ObjectId, ref: "cartProduct" }],
    orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "order" }],
    forgotPasswordOTP: { type: String, default: null },
    forgotPasswordOTPExpiry: { type: Date, default: null },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
