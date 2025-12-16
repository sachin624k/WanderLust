const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schema.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

//Post Route
router.post("/", validateReview, wrapAsync(async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        const { comment, rating } = req.body.review;
        if (!comment || comment.trim()==="") {
            throw new ExpressError(400, "Review comment cannot be empty");
        }
        const newReview = new Review({ comment: comment.trim(), rating });
        listing.reviews.push(newReview);

        await newReview.save();
        await listing.save();

        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        next(err);
    }
}));

//Delete Review Route
router.delete("/:reviewId", wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
}));

module.exports = router;