const generateSlug = (text) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const generateUniqueSlug = async (text, checkExists, excludeId = null) => {
  let slug = generateSlug(text);
  let exists = await checkExists(slug, excludeId);
  let counter = 1;

  while (exists) {
    slug = `${generateSlug(text)}-${counter}`;
    exists = await checkExists(slug, excludeId);
    counter++;
  }

  return slug;
};

module.exports = { generateSlug, generateUniqueSlug };
