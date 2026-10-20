const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asset_db';
const BACKUP_FILE = path.join(__dirname, 'data_backup.json');

async function syncData() {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`Backup file not found at ${BACKUP_FILE}`);
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  const assetsCollection = db.collection('assets');
  const categoriesCollection = db.collection('categories');

  const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
  const { assets, categories } = JSON.parse(raw);

  console.log(`Read ${assets.length} assets and ${categories.length} categories from file.`);

  // 1. Sync Categories
  if (categories && categories.length > 0) {
    const existingCats = await categoriesCollection.find().toArray();
    const existingNames = new Set(existingCats.map((c) => c.name));
    const toInsertCats = [];
    for (const c of categories) {
      if (!existingNames.has(c.name)) {
        toInsertCats.push({
          name: c.name,
          description: c.description || `หมวดหมู่${c.name}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        existingNames.add(c.name);
      }
    }
    if (toInsertCats.length > 0) {
      await categoriesCollection.insertMany(toInsertCats);
      console.log(`Inserted ${toInsertCats.length} new categories.`);
    } else {
      console.log('All categories already exist.');
    }
  }

  // 2. Sync Assets
  console.log('Clearing existing assets in DB to ensure fresh and clean sync...');
  await assetsCollection.deleteMany({});

  const CHUNK_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < assets.length; i += CHUNK_SIZE) {
    const chunk = assets.slice(i, i + CHUNK_SIZE).map((doc) => {
      // Re-hydrate dates
      return {
        ...doc,
        _id: doc._id ? new mongoose.Types.ObjectId(doc._id) : new mongoose.Types.ObjectId(),
        purchaseDate: doc.purchaseDate ? new Date(doc.purchaseDate) : null,
        createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
      };
    });
    const res = await assetsCollection.insertMany(chunk, { ordered: false });
    inserted += res.insertedCount;
    console.log(`Imported ${inserted}/${assets.length} assets...`);
  }

  const count = await assetsCollection.countDocuments({ deleteFlag: 0 });
  console.log(`Sync completed! Total active assets in DB: ${count}`);

  await mongoose.disconnect();
}

syncData().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
