const removeHttpHeader = (req, res, next) => {
  // Во всех ответах удалить HTTP заголовок 'x-powered-by'
  res.removeHeader('x-powered-by');
  next();
};

module.exports = removeHttpHeader;
