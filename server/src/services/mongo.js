const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL
    ;

mongoose.connection.once("open", () => {
    console.log("MongoDB connection ready");
});

mongoose.connection.on("error", (err) => {
    console.log(err);
});

async function mongoConnect() {
    await mongoose.set("strictQuery", true);
    mongoose.connect(MONGO_URL, {}).then((con) => {
        console.log("DB connected successfully.");
    });
}

async function mongoDisConnect() {
    await mongoose.disconnect();
}

module.exports = { mongoConnect, mongoDisConnect };
