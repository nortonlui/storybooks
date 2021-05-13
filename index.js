const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const connectDB = require('./config/db');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');

// Handlebars Helpers
const {
  formatDate,
  stripTags,
  truncate,
  editIcon,
  select,
} = require('./helpers/hbs');

// Load config
dotenv.config({ path: './config/config.env' });
const PORT =
  process.env.MODE === 'dev'
    ? (process.env.PORT = 5000)
    : (process.env.PORT = 3000);

//const PORT = process.env.PORT || 3000;

// Passport config
require('./config/passport')(passport);

// Connect mongoDB
connectDB();

// Initiate app
const app = express();

// Body parse
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Method override
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method;
      delete req.body._method;
      return method;
    }
  }),
);

// Enable logging on dev mode
if (process.env.MODE === 'dev') {
  app.use(morgan('dev'));
}

// Enable handlebars

app.engine(
  '.hbs',
  exphbs({
    helpers: {
      formatDate,
      stripTags,
      truncate,
      editIcon,
      select,
    },
    defaultLayout: 'main',
    extname: '.hbs',
  }),
);
app.set('view engine', '.hbs');

// Sessions
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
  }),
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Set global var
app.use(function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/stories', require('./routes/stories'));

app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
