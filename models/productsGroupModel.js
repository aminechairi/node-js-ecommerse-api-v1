const mongoose = require('mongoose');

const productsGroupSchema = mongoose.Schema(
  {
    groupName:  {
      type: String,
      required: [true, "Group name is required."],
      trim: true,
      lowercase: true,
      minlength: [2, "Too short group name."],
      maxlength: [32, "Too long group name."],
    },
    productsIDs: [
      {
        type: mongoose.Schema.ObjectId,
        ref: `Product`,
      },
    ],
  },
  {
    timestamps: true,
  }
);

productsGroupSchema.pre('find', function () {
  this.populate({
    path: "productsIDs",
    select: "imageCover"
  })
});

module.exports = mongoose.model('productsGroup', productsGroupSchema);