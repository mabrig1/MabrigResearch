const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['author', 'editor', 'admin'], default: 'author' },
    institution: { type: String, trim: true },
    country: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    orcid: { type: String, trim: true },
    papersPublished: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Paper' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
