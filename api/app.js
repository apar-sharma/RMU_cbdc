require("dotenv").config();
require("express-async-errors");
// express

const express = require("express");
const app = express();

const morgan = require("morgan");
// const cookieParser = require("cookie-parser");
// const fileUpload = require("express-fileupload");
const rateLimiter = require("express-rate-limit");
// const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");

// database
const connectDB = require("../db/connect");
const initializeAdmins = require("./createAdmins");

// Increase payload size limits - add this before other middleware configurations
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

//  routers
const userRouter = require("../routes/userRoutes");
const homePageRouter = require("../routes/homePageRoutes");
const transactionRouter = require("../routes/transactionRoutes");
const imageRouter = require("../routes/imageRoutes");
const kycRouter = require("../routes/kycRoutes");
const mintRouter = require("../routes/mintRoutes");

// middleware
const notFoundMiddleware = require("../middleware/not-found");
const errorHandlerMiddleware = require("../middleware/error-handler");

// app.set("trust proxy", 1);
// app.use(
//   rateLimiter({
//     windowMs: 15 * 60 * 1000,
//     max: 99999,
//   })
// );
// app.use(helmet());
app.use(xss());
app.use(mongoSanitize());

// app.use(cors({
//   origin: true,
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
// }));
app.use(cors());
// Remove these lines since they're now defined above with increased limits
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser(process.env.JWT_SECRET));
// app.use(fileUpload());
app.use("/api/v1/user", userRouter);
app.use("/api/v1/homepage", homePageRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/images", imageRouter);
app.use("/api/v1/kyc", kycRouter);
app.use("/api/v1/mint", mintRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.CONNECT_URL_DEVELOPMENT);
    await initializeAdmins();
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
module.exports = app;
