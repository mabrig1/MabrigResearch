const { v4: uuidv4 } = require('uuid');

// Format: 10.XXXXX/MR.YEAR.SUFFIX
// 10.62500 is a placeholder prefix — replace with your registered Crossref prefix
const DOI_PREFIX = process.env.DOI_PREFIX || '10.62500';

const generateDOI = () => {
  const year = new Date().getFullYear();
  const suffix = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `${DOI_PREFIX}/MR.${year}.${suffix}`;
};

module.exports = { generateDOI };
