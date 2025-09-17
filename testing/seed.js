const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../adorastream-backend/models/user');
const Content = require('../adorastream-backend/models/content');
const WatchHistory = require('../adorastream-backend/models/watchHistory');
const Log = require('../adorastream-backend/models/auditLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/streaming_app';

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    const state = mongoose.connection.readyState;
    console.log('readyState:', state);


    // wipe old test data
    await Promise.all([
        User.deleteMany({}),
        Content.deleteMany({}),
        WatchHistory.deleteMany({}),
        Log.deleteMany({})

    ]);

    // create one user with two profiles
    const passwordHash = await bcrypt.hash('test123', 10);
    const user = await User.create({
        username: 'alice',
        passwordHash,
        roles: ['user', 'admin'],
        profiles: [
        { name: 'Alice', avatarUrl: '/img/alice.png' },
        { name: 'Bob', avatarUrl: '/img/bob.png' }
        ]
    });

    const passwordHash2 = await bcrypt.hash('test123', 10);
    const user2 = await User.create({
        username: 'matanel',
        passwordHash,
        roles: ['user', 'admin'],
        profiles: [
        { name: 'Alice', avatarUrl: '/img/alice.png' },
        { name: 'Bob', avatarUrl: '/img/bob.png' }
        ]
    });
    // create some content
    const inception = await Content.create({
        type: 'movie',
        title: 'Inception',
        year: 2010,
        genres: ['Sci-Fi', 'Thriller']
    });

    const dark = await Content.create({
        type: 'series',
        title: 'Dark',
        year: 2017,
        genres: ['Mystery', 'Sci-Fi']
    });

    // create watch history for Alice profile
    const profileAlice = user.profiles[0];
    await WatchHistory.create({
        userId: user.id,
        profileId: profileAlice.id,
        contentId: inception.id,
        lastPositionSec: 600,
        liked: true,
        completed: false,
        lastWatchedAt: new Date()
    });

    console.log('✅ Seed done. User login: alice@example.com / test123');
    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });