const cors = require("cors");
const path = require("path");

const morgan = require("morgan");
const express = require("express");

const v1Router = require("./routes/v1");

const app = express();

app.use(
    cors({
        origin: "http://localhost:3000",
    })
);

app.use(morgan("common"));
app.use(express.json());
app.use("/v1", v1Router);
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

module.exports = app;
