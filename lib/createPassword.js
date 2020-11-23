const createPassword = (password) => {
  bcrypt.genSalt(10).then((salt, err) => {
    if (err) {
      this.logger.logError(err, "registerUser");

      reject(err);
    }

    return bcrypt.hash(password, salt).then((hash, err) => {
      if (err) {
        this.logger.logError(err, "registerUser");

        reject(err);
      }

      return hash;
    });
  });
};
