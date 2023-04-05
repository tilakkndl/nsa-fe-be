const axios = require("axios");

const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");

let DEFAULT_FLIGHT_NUMBER = 100;

const launches = new Map();
let latestFlightNumber = 100;
// const launch = {
//     flightNumber: 100,
//     mission: "Kepler Exploration X",
//     rocket: "Explorer IS1",
//     launchDate: new Date("December 27, 2030"),
//     target: "Kepler-442 b",
//     customers: ["ZTM", "NASA"],
//     upcoming: true,
//     success: true,
// };

// saveLaunch(launch);

async function populateLanches() {
    const SPACEX_URL = "https://api.spacexdata.com/v5/launches/query";
    console.log("Downloading data from spaceX api......");
    const response = await axios.post(SPACEX_URL, {
        query: {},
        options: {
            populate: [
                {
                    path: "rocket",
                    select: {
                        name: 1,
                    },
                },
                {
                    path: "payloads",
                    select: {
                        customers: 1,
                    },
                },
            ],
        },
    });

    const launchDocs = response.data.docs;

    for (const launchDoc of launchDocs) {
        const payloads = launchDoc["payloads"];
        const customers = payloads.flatMap((payload) => {
            return payload["customers"];
        });

        const launch = {
            flightNumber: launchDoc["flight_number"],
            mission: launchDoc["rocket"]["name"],
            launchDate: launchDoc["date_local"],
            upcoming: launchDoc["upcoming"],
            success: launchDoc["success"],
            customers,
        };
        console.log(`${launch.flightNumber}  ${launch.mission}`);
        await saveLaunch(launch);
    }
}

async function loadLaunchData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        mission: "Falcon 1",
        // mission: "FalconSat",
    });
    console.log(firstLaunch);
    if (firstLaunch.length !== 0) {
        console.log("Launch data already loaded");
    } else {
        await populateLanches();
    }
}

// launches.set(launch.flightNumber, launch);

async function findLaunch(filter) {
    return await launchesDatabase.find(filter);
}

async function existsLauchWithLaunchID(launchID) {
    return await findLaunch({ flightNumber: launchID });
}

async function getLatestFlightNumber() {
    const lastestLaunch = await launchesDatabase
        .findOne()
        .sort("-flightNumber");

    if (!lastestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }
    return lastestLaunch.flightNumber;
}

async function getAllLaunches(limit, skip) {
    // return Array.from(launches.values());
    return await launchesDatabase
        .find({}, { __v: 0 })
        .sort({ flightNumber: 1 })
        .limit(limit)
        .skip(skip);
    // .page(2);
}

async function saveLaunch(launch) {
    await launchesDatabase.updateOne(
        { flightNumber: launch.flightNumber },
        launch,
        {
            upsert: true,
        }
    );
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.find({}, { keplerName: launch.target });
    if (!planet) {
        throw new Error("No match planet found");
    }
    const newFlightNumber = (await getLatestFlightNumber()) + 1;

    const newLaunch = Object.assign(launch, {
        success: true,
        upcoming: true,
        customers: ["Zero to Mastery", "NASA"],
        flightNumber: newFlightNumber,
    });
    await saveLaunch(newLaunch);
}

// function addNewLaunch(launch) {
//     latestFlightNumber++;
//     launches.set(
//         latestFlightNumber,
//         Object.assign(launch, {
//             success: true,
//             upcoming: true,
//             customers: ["ZTM", "NASA"],
//             flightNumber: latestFlightNumber,
//         })
//     );
// }

async function abortLaunchByID(launchID) {
    // const aborted = launches.get(launchID);
    // aborted.upcoming = false;
    // aborted.success = false;
    // return aborted;

    const aborted = await launchesDatabase.updateOne(
        { flightNumber: launchID },
        {
            upcoming: false,
            success: false,
        }
    );
    return aborted.acknowledged && aborted.modifiedCount;
}

module.exports = {
    getAllLaunches,
    abortLaunchByID,
    existsLauchWithLaunchID,
    scheduleNewLaunch,
    loadLaunchData,
};
