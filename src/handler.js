const mysql = require('promise-mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


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
            name,
            gender,
            email,
            pass
        } = request.payload;
    
        if (!email || !pass) {
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
            connection.query(checkEmailQuery, [email], (err, rows, field) => {
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
    
        const hashedPass = await bcrypt.hash(pass, 10);
    
        const query = "INSERT INTO users(username, gender, email, password) VALUES(?, ?, ?, ?)";
    
        await new Promise((resolve, reject) => {
            pool.query(query, [name, gender, email, hashedPass], (err, rows, field) => {
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
    const { email, pass } = request.payload;

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
        
        const isPassValid = await bcrypt.compare(pass, user.password);
        
        if (!isPassValid){
            const response = h.response({
                status: 'fail',
                message: 'Account invalid',
            });
            response.code(400);
            return response;
        }
        
        const token = jwt.sign({ userId : user.user_id }, 'secret_key');
    
        const response = h.response({
            status: 'success',
            message: 'login successful',
            data: { token },
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

module.exports = {register, login};