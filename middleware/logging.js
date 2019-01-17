require('express-async-errors');
const winston = require('winston');
require('winston-mongodb');
const config = require('config');

const myFormat = winston.format.printf(info => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
});

const db = config.get('db');

module.exports = winston.createLogger({
        format: winston.format.combine(
            winston.format.timestamp(),
            myFormat
        ),
        transports: [
            new winston.transports.Console({colorize: true, prettyPrint: true}),
            new winston.transports.File({filename: 'vidly.log'}),
            new winston.transports.MongoDB({
                db: db,
                level: 'info',
                options: {
                    useNewUrlParser: true
                }
            })
        ],
        exceptionHandlers: [
            new winston.transports.Console({colorize: true, prettyPrint: true}),
            new winston.transports.File({filename: 'vidly.log'}),
            new winston.transports.MongoDB({
                db: db,
                level: 'error',
                options: {
                    useNewUrlParser: true
                }
            })
        ]
    })