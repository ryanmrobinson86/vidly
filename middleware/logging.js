require('express-async-errors');
const winston = require('winston');
require('winston-mongodb');

const myFormat = winston.format.printf(info => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  });

module.exports = winston.createLogger({
        format: winston.format.combine(
            winston.format.timestamp(),
            myFormat
        ),
        transports: [
            new winston.transports.Console({colorize: true, prettyPrint: true}),
            //new winston.transports.File({filename: 'vidly.log'}),
            new winston.transports.MongoDB({
                db: 'mongodb://localhost/vidly',
                level: 'info',
                options: {
                    useNewUrlParser: true
                }
            })
        ],
        exceptionHandlers: [
            new winston.transports.Console({colorize: true, prettyPrint: true}),
            //new winston.transports.File({filename: 'vidly.log'}),
            new winston.transports.MongoDB({
                db: 'mongodb://localhost/vidly',
                level: 'error',
                options: {
                    useNewUrlParser: true
                }
            })
        ]
    })