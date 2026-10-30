import mongoose, { Schema } from "mongoose";

const preferences = new Schema(
  {
    city: { type: String, default: "Abidjan" },
    district: { type: String, default: "" },
    transaction: { type: String, enum: ["rent", "sale"], default: "rent" },
    type: { type: String, default: "" },
    budget: { type: Number, default: 500000 },
    bedrooms: { type: Number, default: 2 },
  },
  { _id: false },
);
export const User = mongoose.model(
  "User",
  new Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      password: { type: String, required: true, select: false },
      phone: { type: String, default: "" },
      role: {
        type: String,
        enum: ["seeker", "owner", "agency"],
        required: true,
      },
      preferences: { type: preferences, default: () => ({}) },
      favorites: [{ type: Schema.Types.ObjectId, ref: "Property" }],
    },
    { timestamps: true },
  ),
);

const propertySchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    transaction: { type: String, enum: ["rent", "sale"], required: true },
    type: {
      type: String,
      enum: ["apartment", "villa", "house", "land", "office"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    area: { type: Number, required: true, min: 1 },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    city: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    images: { type: [String], required: true },
    panorama: { type: String, default: "" },
    amenities: [String],
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
    },
  },
  { timestamps: true },
);
propertySchema.index({ status: 1, transaction: 1, city: 1, price: 1 });
export const Property = mongoose.model("Property", propertySchema);

const leadSchema = new Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seeker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stage: {
      type: String,
      enum: ["new", "contacted", "qualified", "won", "lost"],
      default: "new",
    },
    notes: { type: String, default: "" },
    messages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        body: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);
leadSchema.index({ property: 1, seeker: 1 }, { unique: true });
export const Lead = mongoose.model("Lead", leadSchema);

const appointmentSchema = new Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seeker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    message: { type: String, default: "" },
  },
  { timestamps: true },
);
appointmentSchema.index(
  { owner: 1, startsAt: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  },
);
appointmentSchema.index(
  { seeker: 1, startsAt: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  },
);
export const Appointment = mongoose.model("Appointment", appointmentSchema);
