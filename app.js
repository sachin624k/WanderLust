require("dotenv").config();
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing or empty");
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingsRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbURL = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbURL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbURL,
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.error("MONGO SESSION STORE ERROR", err);
});

const sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,// Date.now() = Today's data + 7days * 24hrs * 60mins * 60sec * 1000ms matalb 7days baad expire ho jayega
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,//saves from cross scripting attack 
  },
};

// app.get("/", (req, res) => {
//     res.send("Hi,I'm root");
// });

app.use(session(sessionOptions));
app.use(flash());// flash ke baad routes aate hain

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// app.get("/demouser", async (req, res) => {
//   let fakeUser = new User({ 
//     email: "sachin624k@gmail.com",
//     username: "sachin624k",
//     });

//     let registeredUser = await User.register(fakeUser, "mypassword");
//     res.send(registeredUser);
// });

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  console.log("REAL ERROR");
  console.log(err);
  console.log("REAL ERROR");

  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
  console.log("Listening on port 8080");
});