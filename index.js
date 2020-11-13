const express = require("express");
const app = express();
const md5 = require("md5");
const redis = require("redis");
const md5lib = require("md5");
const { init, sequelize } = require("./database/db");
const RedisInfo = require("./database/model");
const utils = require("./utils");


app.use(express.urlencoded({urlencoded:true}));
app.use(express.json());


app.use(express.static(__dirname + "/public"));
app.set("views", __dirname + "/public/views");
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.get("/", (req, res) => {
    res.render("index_page.html");
});

//Route for redis list api-This Api is used to fetch list of redis server our monitor is tracking
app.get("/api/redis_list", async (req, res) => {
    let result = {};
    result["success"] = 1;
    try {
        const data = await RedisInfo.findAll();
        let temp = [];
        for (let i = 0; i < data.length; i++) {
            console.log(data[i].dataValues);
            temp.push(data[i].dataValues);
        }
        result.data = temp;
        console.log("Printing temp", JSON.stringify(result));

        res.send(utils.standardResponse(1, temp));
    } catch (error) {
        console.log("Error in the data base");
    }
});

//redis_info API is used to for getting information about the server like server name,version etc.
app.get("/api/redis_info", async (req, res) => {
    let id = req.query.md5;
    try {
        const ele = await RedisInfo.findAll({ where: { md5: id } });
        if (ele) {
            res.send(utils.standardResponse(1, ele[0].dataValues));
        } else {
            res.send(utils.standardResponse(0, []));
        }
    } catch (error) {
        res.send(utils.standardResponse(0, error));
    }
});

//API for monitoring this is the main API responsible for taking data which is used to show graphs
app.get("/api/redis_monitor", async (req, res) => {
    let md5 = req.query.md5;
    try {
        const ele = await RedisInfo.findAll({ where: { md5: md5 } });

        const startTime = Date.now();
        const client = redis.createClient({
            host: ele[0].host,
            port: ele[0].port,
            password: ele[0].password,
        });
        client.on("ready", function () {
            delete client.server_info.versions;
            client.server_info.get_time = Date.now() - startTime;
            res.send(utils.standardResponse(1, client.server_info));
            client.quit();
        });
        client.on("error", function (error) {
            console.error(error);
            client.quit();
        });
    } catch (error) {
        res.send(utils.standardResponse(0, []));
    }
});

//Route for Ping. This API is used to checking connection with the server .
app.get("/api/ping", async (req, res) => {
    let host = req.query.host;
    let port = req.query.port;
    let password = req.query.password;

    const client = redis.createClient({
        host: host,
        port: port,
        password: password,
    });

    client.on("ready", () => {
        res.send(utils.standardResponse(1, "Ping Success!"));
        client.quit();
    });

    client.once("error", () => {
        res.send(utils.standardResponse(0, "Ping Error!"));
        client.quit();
    });

    client.on("error", () => {
        console.log("Second event has benn handled");
        client.quit();
    });
});

//API to add a server in the monitor.
app.post("/api/add", (req, res) => {
    let host = req.body.host;
    let port = req.body.port;
    let password = req.body.password;

    const client = redis.createClient({
        host: host,
        port: port,
        password: password,
    });

    client.on("ready", async () => {
        try {
            const redis_client = await RedisInfo.create({
                md5: md5lib(host + port),
                host: host,
                port: port,
                password: password,
            });
            res.send(utils.standardResponse(1, redis_client));
        } catch (error) {
            res.send(error);
        }
        client.quit();
    });

    client.once("error", () => {
        res.send(utils.standardResponse(0, "Ping error!"));
        client.quit();
    });

    client.on("error", () => {
        console.log("Other events are listened");
        client.quit();
    });
});

//Route for deleting a redis server.
app.post("/api/del", async (req, res) => {
    let md5 = req.body.md5;
    try {
        await RedisInfo.destroy({ where: { md5: md5 } });
        res.send(utils.standardResponse(1, "Success!"));
    } catch (error) {
        res.send(utils.standardResponse(0, "Not Found!"));
    }
});

//Api for flush db thsi is used to flush data from a db.
app.get("/api/redis/flushall", async (req, res) => {
    let md = req.query.md5;
    let db = req.query.db;
    let redis_client;
    try {
        redis_client = await RedisInfo.findOne({ where: { md5: md } });

        const client = redis.createClient({
            host: redis_client.host,
            port: redis_client.port,
            password: redis_client.password,
            db: db,
        });
        client.on("ready", () => {
            console.log("server is ready to get flushed");
            client.send_command("FLUSHDB", console.log);
            res.send(utils.standardResponse(1, "Success!"));
            client.quit();
        });
    } catch (error) {
        console.log("error in flush command", error);
        res.send(utils.standardResponse(0, "Not Found!"));
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("App is listening");
    init();
});