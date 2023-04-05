const { parse } = require("csv-parse");
const fs = require("fs");
const path = require("path");

const planets = require("./planets.mongo");

const results = [];

function isHabitablePlanet(planet) {
    return (
        planet["koi_disposition"] === "CONFIRMED" &&
        planet["koi_insol"] > 0.36 &&
        planet["koi_insol"] < 1.11 &&
        planet["koi_prad"] < 1.6
    );
}

function loadPlanetsData() {
    return new Promise((resolve, reject) => {
        fs.createReadStream(
            path.join(__dirname, "..", "..", "data", "kepler_data.csv")
        )
            .pipe(
                parse({
                    comment: "#",
                    columns: true,
                })
            )
            .on("data", async (data) => {
                if (isHabitablePlanet(data)) {
                    // results.push(data);
                    //upsert = update+insert
                    savePlanet(data);
                }
            })
            .on("error", (err) => {
                console.log(err);
                reject(err);
            })
            .on("end", async () => {
                console.log(
                    results.map((planet) => {
                        return planet["kepler_name"];
                    })
                );
                const countPlanetsFound = await getAllPlanets();
                console.log(countPlanetsFound);
                console.log(`${countPlanetsFound.length} habitat planet found`);
                resolve();
            });
    });
}

async function getAllPlanets() {
    return await planets.find({}, { __v: 0 });
}

async function savePlanet(planet) {
    try {
        await planets.updateOne(
            {
                keplerName: planet.kepler_name,
            },
            {
                keplerName: planet.kepler_name,
            },
            {
                upsert: true,
            }
        );
    } catch (err) {
        console.error(`Couldn't save the planet ${err}`);
    }
}

module.exports = {
    getAllPlanets,
    loadPlanetsData,
};
