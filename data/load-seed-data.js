const client = require('../lib/client');
// import our seed data:
const monitors = require('./monitors.js');
const usersData = require('./users.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
        [user.email, user.hash]);
      })
    );
      
    const user = users[0].rows[0];

    await Promise.all(
      monitors.map(monitor => {
        return client.query(`
                    INSERT INTO monitors (cool_factor, type, is_sick, brand, model, image, owner_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7);
                `,
        [monitor.cool_factor, monitor.type, monitor.is_sick, monitor.brand, monitor.model, monitor.image, user.id]);
      })
    );
    

    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    console.log(err);
  }
  finally {
    client.end();
  }
    
}
