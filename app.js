const mongoose = require("mongoose");
require("dotenv").config();
const express = require("express");
const app = express();
const contactRoutes = require("./routes/contacts.routes");
const usersRoutes = require("./routes/auth.routes");
const PORT = process.env.PORT || 4000;
const connection = mongoose.connect(process.env.DATABASE_URL, {
  dbName: "db-contacts",
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.json());
require("./config/passport");
const cors = require("cors");
app.use(cors());

app.use("/api", contactRoutes);
app.use("/api/users", usersRoutes);
app.use("/avatars", express.static("./public/avatars"));

app.get("/favicon.ico", (req, res) => res.status(204));
connection
  .then(() => {
    console.log("Database connection successful");
    app.listen(PORT, () => {
      console.log(`App listens on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Error while establishing connection: [${err}]`);
    process.exit(1);
  });
