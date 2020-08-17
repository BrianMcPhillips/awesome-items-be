const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

const user = {
  id: 1,
  email: 'jon@arbuckle.net',
  hash: '42r8c24'
};

app.get('/monitors', async(req, res) => {
  const data = await client.query(`
  SELECT m.id, cool_factor, type, is_sick, model, image, b.name AS brands_id
    FROM monitors AS m
    JOIN brands AS b ON m.brands_id = b.id`);

  res.json(data.rows);
});


app.get('/brands', async(req, res) => {
  const data = await client.query(`
      SELECT * FROM brands`);
  
  res.json(data.rows);
});

app.get('/monitors/:id', async(req, res) => {
  const monitorId = req.params.id;
  const data = await client.query(`
  SELECT m.id, cool_factor, b.name as brands_id 
  FROM monitors AS m 
  JOIN brands AS b
  ON m.id=$1`, [monitorId]);
  res.json(data.rows[0]);
});

app.delete('/montors/:id', async(req, res) => {
  const monitorId = req.params.id;
  const data = await client.query('DELETE FROM monitors WHERE monitors.id=$1;', [monitorId]);
  res.json(data.rows[0]);
});

app.put('/monitors/:id', async(req, res) => {
  const monitorId = req.params.id;

  try {
    const updatedMonitor = {
      cool_factor: req.body.cool_factor,
      type: req.body.type,
      is_sick: req.body.is_sick,
      model: req.body.model,
      image: req.body.image,
      brands_id: req.body.brands_id

    };
    const data = await client.query(`
    UPDATE monitors
    SET cool_factor=$1, type=$2, is_sick=$3, model=$4, image=$5, brands_id=$6 WHERE monitors.id =$7 RETURNING *`, [updatedMonitor.cool_factor, updatedMonitor.type, updatedMonitor.is_sick, updatedMonitor.model, updatedMonitor.image, updatedMonitor.brands_id, monitorId]);
    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }});

app.post('/monitors', async(req, res) => {
  try {
    const newMonitor = {
      cool_factor: req.body.cool_factor,
      type: req.body.type,
      is_sick: req.body.is_sick,
      model: req.body.model,
      image: req.body.image,
      brands_id: req.body.brands_id
    };

    const data = await client.query(`
    INSERT INTO monitors(cool_factor, type, is_sick, model, image, owner_id, brands_id)
    VALUES($1, $2, $3, $4, $5, $6, $7)
    RETURNING * 
  `, [newMonitor.cool_factor, newMonitor.type, newMonitor.is_sick, newMonitor.model, newMonitor.image, user.id, newMonitor.brands_id]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
