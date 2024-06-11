const {register, login, readUser} = require('./handler');

const routes = [
    {
        method: 'POST',
        path: '/register',
        handler: register,
    },

    {
        method: 'POST',
        path: '/login',
        handler: login,
    },

    {
        method: 'GET',
        path: '/readUser',
        handler: readUser,
    },
];

module.exports = routes;