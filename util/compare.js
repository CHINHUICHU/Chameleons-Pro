require('dotenv').config();
const MATCH_THREASHOLD = +process.env.MATCH_THREASHOLD;

function findMatchedKeyword(longSentence, shortSentence) {
  const compareSet = [];
  let matched = 0;
  longSentence.forEach((element) => compareSet.push(element));
  shortSentence.forEach((element) => {
    if (compareSet.includes(element)) {
      matched++;
    }
  });
  return matched;
}

function findMatchedSentence(synonymTaggedSource, synonymTaggedTarget) {
  const result = {};
  result.source = new Set();
  result.target = new Set();

  for (const source of synonymTaggedSource) {
    for (const target of synonymTaggedTarget) {
      // choose longer sentence to add to the set first
      const matchedKeywordCount =
        source.length > target.length
          ? findMatchedKeyword(source, target)
          : findMatchedKeyword(target, source);

      if (
        matchedKeywordCount / Math.max(source.length, target.length) >=
        MATCH_THREASHOLD
      ) {
        result.source.add(synonymTaggedSource.indexOf(source));
        result.target.add(synonymTaggedTarget.indexOf(target));
      }
    }
  }

  result.source = Array.from([...result.source]);
  result.target = Array.from([...result.target]);

  return result;
}

function calculateSimilarity(source, target) {
  const sourceSet = new Set();
  source.forEach((element) => {
    sourceSet.add(element);
  });

  const targetSet = new Set();
  target.forEach((element) => {
    targetSet.add(element);
  });

  const intersection = new Set(
    [...sourceSet].filter((element) => targetSet.has(element))
  );

  const union = new Set([...sourceSet, ...targetSet]);
  const similarity = intersection.size / union.size;

  return similarity;
}

module.exports = {
  findMatchedKeyword,
  findMatchedSentence,
  calculateSimilarity,
};
