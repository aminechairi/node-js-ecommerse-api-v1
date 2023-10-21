exports.userPropertysPrivate = (document) => {
  const propertys = [
    `emailVerifyCode`,
    `emailVerifyCodeExpires`,
    `password`,
    `passwordChangedAt`,
    `passwordResetCode`,
    `passwordResetExpires`,
    `passwordResetVerified`,
    'addressesList',
  ];
  for (let i = 0; i < propertys.length; i++) {
    document[propertys[i]] = undefined;
  }
  return document;
};