const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// IMPORTANT: extract default safely
const plm = require("passport-local-mongoose");
const passportLocalMongoose = plm.default || plm;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
