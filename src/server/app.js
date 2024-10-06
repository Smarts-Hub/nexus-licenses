import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import chalk from 'chalk';
import sessions from 'express-session';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import config from "../config.js";

import licensesRouter from './routes/licenses.routes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateRandomBytes(size) {
    return crypto.randomBytes(size).toString('hex');
}

const app = express();
app.use(express.static(path.join(__dirname, 'dashboard', 'public')));
app.set('view engine', 'ejs');
app.set('views', './dashboard/views');

app.use(sessions({
    secret: await generateRandomBytes(64),
    resave: true,
    saveUninitialized: true,
}))

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use('/licenses', licensesRouter);

const launchWebServer = async () => {
    console.log((`Launching web server on port ${config.webServerConfig.port}`));
    await app.listen(config.webServerConfig.port);
    console.log(chalk.green(`Successfully launched web server on port ${config.webServerConfig.port}`));
}

export default launchWebServer;
