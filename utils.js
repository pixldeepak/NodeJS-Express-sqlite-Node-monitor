const standardResponse = (success, data) => {
    let result = {};

    result.success = success;
    result.data = data;

    return JSON.stringify(result);
};

module.exports = { standardResponse };