const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb+srv://ragultr07_db_user:doFOvuNNzi4JSR2H@secdb.trr8jxk.mongodb.net/sec_slot_booking')
  .then(async () => {
    const User = mongoose.connection.db.collection('users');
    const users = await User.find({}).toArray();
    for (const u of users) {
      if (typeof u.passwordHash === 'string' && !u.passwordHash.startsWith('$')) {
        console.log('Hashing password for', u.refNumber, 'from plaintext', u.passwordHash);
        const hashed = await bcrypt.hash(u.passwordHash, 12);
        await User.updateOne({ _id: u._id }, { $set: { passwordHash: hashed } });
      } else {
        console.log('User', u.refNumber, 'already hashed or missing');
      }
    }
    console.log('Done!');
    process.exit(0);
  })
  .catch(console.error);
