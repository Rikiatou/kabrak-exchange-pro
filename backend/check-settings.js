// Script temporaire pour vérifier les settings des utilisateurs
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Modifier l'URL pour désactiver la vérification SSL
const dbUrl = process.env.DATABASE_URL.includes('?') 
  ? `${process.env.DATABASE_URL}&sslmode=no-verify`
  : `${process.env.DATABASE_URL}?sslmode=no-verify`;

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
});

async function checkSettings() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Récupérer tous les users
    const [users] = await sequelize.query(`
      SELECT id, email, "firstName", "lastName", "teamOwnerId", "teamRole"
      FROM users
      WHERE email IN ('inoua10@gmail.com', 'admin@exchange.com', 'rikiatouhassansale@gmail.com', 'bunnykitten2308@gmail.com')
      ORDER BY email
    `);

    console.log('\n📊 USERS:');
    users.forEach(u => {
      console.log(`  - ${u.email} (ID: ${u.id})`);
      console.log(`    Name: ${u.firstName} ${u.lastName}`);
      console.log(`    Role: ${u.teamRole || 'owner'}, TeamOwner: ${u.teamOwnerId || 'null'}`);
    });

    // Récupérer tous les settings
    const [settings] = await sequelize.query(`
      SELECT key, value, "userId"
      FROM settings
      WHERE key = 'businessName'
      ORDER BY "userId"
    `);

    console.log('\n📋 BUSINESS NAME SETTINGS:');
    if (settings.length === 0) {
      console.log('  ❌ Aucun businessName trouvé dans la base !');
    } else {
      settings.forEach(s => {
        const user = users.find(u => u.id === s.userId);
        console.log(`  - UserID: ${s.userId} → "${s.value}"`);
        if (user) {
          console.log(`    Email: ${user.email}`);
        }
      });
    }

    // Vérifier si inoua10@gmail.com a un businessName
    const inoua = users.find(u => u.email === 'inoua10@gmail.com');
    if (inoua) {
      const inouaSetting = settings.find(s => s.userId === inoua.id);
      console.log(`\n🔍 INOUA10@GMAIL.COM:`);
      console.log(`  UserID: ${inoua.id}`);
      console.log(`  BusinessName: ${inouaSetting ? `"${inouaSetting.value}"` : '❌ NON TROUVÉ'}`);
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSettings();
