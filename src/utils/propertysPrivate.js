exports.userPropertysPrivate = (document) => {
  const propertys = [
    `emailVerificationCode`,
    `emailVerificationCodeExpires`,
    `password`,
    `passwordChangedAt`,
    `passwordResetCode`,
    `passwordResetExpires`,
    'addressesList',
  ];
  for (let i = 0; i < propertys.length; i++) {
    document[propertys[i]] = undefined;
  }
  return document;
};