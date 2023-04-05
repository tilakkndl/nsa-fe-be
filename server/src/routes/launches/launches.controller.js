const {
    getAllLaunches,
    scheduleNewLaunch,
    existsLauchWithLaunchID,
    abortLaunchByID,
} = require("../../models/launches.model");
const { getPagination } = require("../../services/query");

async function httpGetAllLaunches(req, res) {
    const { limit, skip } = getPagination(req.query);
    // console.log(req.query);
    const launches = await getAllLaunches(limit, skip);
    return res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {
    const launch = req.body;

    if (
        !launch.mission ||
        !launch.rocket ||
        !launch.launchDate ||
        !launch.target
    ) {
        return res.status(400).json({
            error: "Missing required launch property",
        });
    }

    launch.launchDate = new Date(launch.launchDate);
    if (launch.launchDate.toString() === "Invalid Date") {
        return res.status(400).json({
            error: "Date is not validate",
        });
    }
    await scheduleNewLaunch(launch);
    return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
    const launchID = Number(req.params.id);

    const existLaunch = await existsLauchWithLaunchID(launchID.toString());

    //if launch doesn't exist
    if (!existLaunch) {
        return res.status(404).json({
            error: "Launch not found",
        });
    }

    //if lauch exist
    const aborted = await abortLaunchByID(launchID);
    if (!aborted) {
        return res.status(400).json({
            error: "Launch not aborted",
        });
    }
    return res.status(200).json({
        ok: true,
    });
}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunch,
};
