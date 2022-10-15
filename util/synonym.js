const { readFile } = require('fs/promises');
const _ = require('lodash');
const { join } = require('path');

class Synonym {
  #synonymMap = new Map();

  async buildSynonymMap() {
    const synonyms = (
      await readFile(join(__dirname, '../', 'dict_synonym.txt'))
    )
      .toString()
      .split('\n');
    for (const sysnonym of synonyms) {
      const words = sysnonym.split(' ');
      for (let i = 1; i < words.length; i += 1) {
        this.#synonymMap.set(words[i], words[0]);
      }
    }
  }

  findSynonym(paragraphArray) {
    const newParagraphArray = _.cloneDeep(paragraphArray);
    for (const sentence of newParagraphArray) {
      for (let i = 0; i < sentence.length; i += 1) {
        if (this.#synonymMap.get(sentence[i])) {
          sentence[i] = this.#synonymMap.get(sentence[i]);
        }
      }
    }
    return newParagraphArray;
  }
}

const synonym = new Synonym();

synonym.buildSynonymMap();

module.exports = synonym;
