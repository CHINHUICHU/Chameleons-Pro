const fs = require('fs');
const { promisify } = require('util');

const readAsync = promisify(fs.readFile);

async function buildStopWordMap() {
  // search stop words in file
  const stopword = new Map();
  const stopWords = (await readAsync('./stops.utf8')).toString().split('\n');
  for (const word of stopWords) {
    stopword.set(word, -1);
  }
  stopword.set(' ', -1);
  stopword.set('\n', -1);
  module.exports.stopWordMap = stopword;
}

async function buildSynonymMap() {
  // build synonym map
  const synonym = new Map();
  const synonyms = (await readAsync('./dict_synonym.txt'))
    .toString()
    .split('\n');
  for (const sysnonym of synonyms) {
    const words = sysnonym.split(' ');
    for (let i = 1; i < words.length; i += 1) {
      synonym.set(words[i], words[0]);
    }
  }
  module.exports.synonymMap = synonym;
}

buildStopWordMap().catch((err) => console.log(err));
buildSynonymMap().catch((err) => console.log(err));
