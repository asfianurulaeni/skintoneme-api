const {register, login, readUser, updateUser, deleteUser} = require('./handler');

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

    {
        method: 'PUT',
        path: '/updateUser',
        handler: updateUser
    },

    {
        method: 'DELETE',
        path: '/deleteUser',
        handler: deleteUser
    },
];

module.exports = routes;