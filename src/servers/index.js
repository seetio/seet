const express           = require('express');
const app               = express();
const i18n              = require('./../lib/translation');
const path              = require('path');
const bodyParser        = require('body-parser');
const cookieParser      = require('cookie-parser');
const session           = require('express-session');
const RedisStore        = require('connect-redis')(session);
const mongoose          = require('mongoose');
const Promise           = require('bluebird');
const atpl              = require('atpl');
const AppRoutes         = require('../routes/app');
const Logger            = require('./../lib/logger');
const PORT              = 7777;
mongoose.Promise= Promise;
mongoose.connect('mongodb://localhost/seetio');

atpl.registerFilters(require('./../lib/filters'));
atpl.registerFunctions(require('./../lib/functions'));
app.engine('html', atpl.__express);
app.use(i18n.init);
app.set('devel', false);
app.set('view engine', 'html');
app.set('view cache', false); // change to true after
app.set('views', path.join(__dirname, '../../templates'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

if ('production' === process.env.NODE_ENV) {
    app.set('trust proxy', 1);
}

app.use(session({
    store: new RedisStore({
      db: 5
    }),
    secret: 'CHANGE-THIS-SECRET',
    resave: false, // resave redis even no changes
    saveUninitialized: false, // create session even if didn't touched it
    rolling: true, // update user's cookie's expires every request
    cookie: {
        maxAge: 31 * 24 * 60 * 60 * 1000, // a month
        secure: ('production' === process.env.NODE_ENV) ? (true) : (false)
    }
}));

app.use('/public', express.static(path.join(__dirname, '../../dist/public')));

app.use(AppRoutes);

app.use(
    (err, req, res, next) => {
        res.status(500).end('something went wrong');
    }
);

if (!process.env.NODE_ENV) {
    console.log('cant start without knowing my environment NODE_ENV = production/dev ???');
    process.exit(0);
}
app.listen(PORT);

let logInfo = `Server started listening on port ${PORT} | ${new Date()}`;
Logger.info(logInfo);
