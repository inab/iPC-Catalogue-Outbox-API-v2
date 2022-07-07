import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import initDb from './outbox_db';
import metadataRoutes from './routes/metadata';
import { keycloak, sessionData, serverConf } from './config';
import 'express-async-errors';
import errors from './middleware/errors';
require('dotenv').config();
require('./logs')();

initDb();

let app = express();

app.server = http.createServer(app);

app.use(morgan('dev'));

app.use(cors({
	exposedHeaders: serverConf.corsHeaders
}));

app.use(bodyParser.json({
	limit: serverConf.bodyLimit
}));

app.use(sessionData);

app.use(keycloak.middleware());

app.set('trust proxy', true);

app.use('/v1/metadata', metadataRoutes({ keycloak }));

app.use(errors)

app.server.listen(process.env.PORT || serverConf.port, () => {
	console.log(`Started on port ${app.server.address().port}`);
});

export default app;


