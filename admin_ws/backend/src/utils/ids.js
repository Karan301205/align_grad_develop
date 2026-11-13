// Row ids are TEXT holding 24-char lowercase hex strings (the original document
// ids carried over from the pre-PostgreSQL data, and the database default for new
// rows produces the same format).
const ID_REGEX = /^[0-9a-fA-F]{24}$/;

function isValidId(value) {
  return typeof value === 'string' && ID_REGEX.test(value);
}

// Well-formed hex ids are lowercased (stored ids are lowercase); any other
// value is passed through unchanged so it simply matches no row.
function normalizeId(value) {
  return isValidId(value) ? value.toLowerCase() : value;
}

module.exports = { ID_REGEX, isValidId, normalizeId };
