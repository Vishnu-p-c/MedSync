import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: String,
  password: String,  // later we hash this
  role: String,      // doctor or admin
  doctor_id: Number
});

export default mongoose.model("User", userSchema);
