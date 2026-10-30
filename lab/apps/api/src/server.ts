import mongoose from "mongoose";
import { config } from "./config.js";
import { createApp } from "./app.js";
import { User, Property, Lead, Appointment } from "./models.js";
await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
await Promise.all([
  User.init(),
  Property.init(),
  Lead.init(),
  Appointment.init(),
]);
const server = createApp().listen(config.PORT, () =>
  console.log(`Artparts API : http://localhost:${config.PORT}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(() => {
      void mongoose.disconnect().then(() => process.exit(0));
    });
  });
