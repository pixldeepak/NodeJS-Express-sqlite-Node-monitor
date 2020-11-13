const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: `${__dirname}/database.sqlite`,
    logging: false,
});

const init = function () {
    return new Promise((resolve, reject) => {
        try {
            sequelize.authenticate();
            console.log("Connection has been established successfully.");

            sequelize.sync({ alter: true });
            console.log("All models were synchronized successfully.");

            resolve();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { sequelize, init };