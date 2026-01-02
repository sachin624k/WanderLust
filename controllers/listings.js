const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const geocodingClient = mbxGeocoding({
  accessToken: process.env.MAP_TOKEN,
});

/* =========================
   INDEX + SEARCH + CATEGORY
========================= */
module.exports.index = async (req, res) => {
  const { category, q } = req.query;
  let query = {};

  // Category filter
  if (category) {
    query.category = category;
  }

  // Search by title or location
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
    ];
  }

  const allListings = await Listing.find(query);
  res.render("listings/index", { allListings, category });
};

/* =========================
   SHOW LISTING
========================= */
module.exports.showListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  res.render("listings/show", { listing });
};

/* =========================
   NEW LISTING FORM
========================= */
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new");
};

/* =========================
   CREATE LISTING  ✅ FIXED
========================= */
module.exports.createListing = async (req, res) => {
  const { location, country } = req.body.listing;

  // 🚨 FORCE DETAILED LOCATION (CITY + STATE + COUNTRY)
  const searchText = `${location}, ${country || "India"}`;

  const geoResponse = await geocodingClient
    .forwardGeocode({
      query: searchText,
      limit: 1,
      countries: ["IN"],
      language: ["en"],
    })
    .send();

  // ❌ Safety check
  if (!geoResponse.body.features.length) {
    req.flash("error", "Please enter a specific city or place name");
    return res.redirect("/listings/new");
  }

  const listing = new Listing(req.body.listing);
  listing.owner = req.user._id;

  listing.image = {
    url: req.file.path,
    filename: req.file.filename,
  };

  listing.geometry = geoResponse.body.features[0].geometry;

  await listing.save();
  req.flash("success", "Listing created successfully!");
  res.redirect("/listings");
};


/* =========================
   EDIT FORM  ✅ FIXED
========================= */
module.exports.renderEditForm = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  const originalImageUrl = listing.image.url.replace(
    "/upload",
    "/upload/w_300"
  );

  res.render("listings/edit", { listing, originalImageUrl });
};

/* =========================
   UPDATE LISTING
========================= */
module.exports.updateListing = async (req, res) => {
  const listing = await Listing.findByIdAndUpdate(
    req.params.id,
    req.body.listing,
    { new: true }
  );

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await listing.save();
  }

  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${listing._id}`);
};

/* =========================
   DELETE LISTING
========================= */
module.exports.destroyListing = async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  req.flash("success", "Listing deleted");
  res.redirect("/listings");
};
