const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    image: {
      filename: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },

    price: {
      type: Number,
      min: 0,
    },

    location: {
      type: String,
      required: true,
    },

    country: String,

    // 🔥 CATEGORY (THIS POWERS YOUR ICON FILTERS)
    category: {
      type: String,
      enum: [
        "Trending",
        "Rooms",
        "Iconic Cities",
        "Castles",
        "Amazing Pools",
        "Mountains",
        "Camping",
        "Farms",
        "Arctic",
        "Domes",
        "Boats"
      ],
      required: true
    },


    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true }
);

// 🔥 SEARCH INDEX (SEARCH BAR FIX)
listingSchema.index({
  title: "text",
  location: "text",
  country: "text",
});

// 🔥 CASCADE DELETE REVIEWS
listingSchema.post("findOneAndDelete", async function (listing) {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

module.exports = mongoose.model("Listing", listingSchema);
