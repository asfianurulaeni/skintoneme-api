const mysql = require('promise-mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = 'secret_key';


const createUnixSocketPool = async config => {
    return mysql.createPool({
      user: process.env.DB_USER, // e.g. 'my-db-user'
      password: process.env.DB_PASS, // e.g. 'my-db-password'
      database: process.env.DB_NAME, // e.g. 'my-database'
      socketPath: process.env.INSTANCE_UNIX_SOCKET, // e.g. '/cloudsql/project:region:instance'
    });
  };
  
  let pool;
  (async () => {
      pool = await createUnixSocketPool();
  })();

const register = async (request, h) => {
    try {
        const {
            username,
            gender,
            email,
            password
        } = request.payload;
    
        if (!email || !password) {
            const response = h.response({
                status: 'fail',
                message: 'Please fill email and password',
              });
              response.code(400);
              return response;
        }

        // cek email di db
        const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
        const existingUser = await new Promise((resolve, reject) => {
            pool.query(checkEmailQuery, [email], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
        });

        if (existingUser) {
            const response = h.response({
                status: 'fail',
                message: 'Email already exists',
            });
            response.code(400);
            return response;
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
    
        const query = "INSERT INTO users(username, gender, email, password) VALUES(?, ?, ?, ?)";
    
        await new Promise((resolve, reject) => {
            pool.query(query, [username, gender, email, hashedPassword], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    
        const response = h.response({
            status: 'success',
            message: 'User created successfully',
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
          status: 'fail',
          message: err.message,
        });
        response.code(500);
        return response;
    }
}

const login = async (request, h) => {
    const { email, password } = request.payload;

    try {
        const query = "SELECT * FROM users WHERE email = ?";

        const user = await new Promise((resolve, reject) => {
            pool.query(query, [email], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
        });
        
        if (!user){
            const response = h.response({
                status: 'fail',
                message: 'Account invalid',
            });
            response.code(400);
            return response;
        }
        
        const isPassValid = await bcrypt.compare(password, user.password);
        
        if (!isPassValid){
            const response = h.response({
                status: 'fail',
                message: 'Account invalid',
            });
            response.code(400);
            return response;
        }
        
        const token = jwt.sign({ userId : user.id }, 'secret_key');
    
        const response = h.response({
            status: 'success',
            message: 'login successful',
            username: user.username,
            data: { 
                token
            },
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
}

const readUser = async (request, h) => {
    try {
        const token = request.headers.authorization.replace('Bearer ', '');
        let decodedToken;

        try{
            decodedToken = jwt.verify(token, 'secret_key');
        } catch (err) {
            const response = h.response({
                status: 'missed',
                message: 'User is not authorized!',
            });
            response.code(401);
            return response;
        }

        const userId = decodedToken.userId;

        const query = 'SELECT * FROM users WHERE id = ?';
        
        const user = await new Promise((resolve, reject) => {
            pool.query(query, [userId], (err, rows, field) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
        });

        if (!user){
            const response = h.response({
                status: 'fail',
                message: 'User is not found!',
            });
            response.code(400);
            return response;
        }

        const { password, ...userData } = user;

        const response = h.response({
            status: 'success',
            message: 'read successful',
            data: userData,
        });
        response.code(200);
        return response;
    } catch (err) {
        const response = h.response({
            status: 'fail',
            message: err.message,
        });
        response.code(500);
        return response;
    }
}

module.exports = {register, login, readUser};