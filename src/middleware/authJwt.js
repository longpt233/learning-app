import {verify, TokenExpiredError} from 'jsonwebtoken';
import {User, Role} from '../models';
import {httpStatus, apiStatus} from '../constants'

const CatchExpiredTokenError = (err, res) => {
    if(err instanceof TokenExpiredError){
        return res.status(httpStatus.UNAUTHORIZED).send({
            status: apiStatus.AUTH_ERROR,
            message: "Unauthorized! Access token was expired"
        });
    }
    return res.status(httpStatus.UNAUTHORIZED).send({
        status: apiStatus.AUTH_ERROR,
        message: "Unauthorized!"
    });
}

export const verifyToken = (req, res, next) => {
    let token = req.headers.authorization.split(' ')[1];

    if(!token){
        return res.status(httpStatus.FORBIDDEN).send({
            status: apiStatus.AUTH_ERROR,
            message: "No token provided!"
        });
    }

    verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if(err){
            return CatchExpiredTokenError(err, res);
        }
        req.userId = decoded.id;
        next();
    });
}

export const isAdmin = async (req, res, next) => {
    await User.findById(req.userId).exec((err, user) => {
        if(err){
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
                status: apiStatus.INVALID_PARAM,
                message: err
            });
        }
        Role.findById(user.role).exec((err, role) => {
            if(err){
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
                    status: apiStatus.OTHER_ERROR,
                    message: err
                });
            }

            if(role.name === "ADMIN"){
                next();
                return;
            }
            return res.status(httpStatus.FORBIDDEN).send({
                status: apiStatus.AUTH_ERROR,
                message: "Require ADMIN role!"
            });
        })
    })
}


