const DataTypes = require("sequelize");
const { sequelize } = require("./db");

const RedisInfo = sequelize.define(
    "RedisInfo",
    {
        md5: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        host: {
            type: DataTypes.STRING,
        },
        port: {
            type: DataTypes.INTEGER,
        },
        password: {
            type: DataTypes.STRING,
        },
    },
    {
        timestamps: true,
        createdAt: "add_time",
        updatedAt: false,
    }
);

module.exports = RedisInfo;