const { readFile } = require('fs/promises');
const _ = require('lodash');
const { join } = require('path');

class StopWord {
  #stopWordMap = new Map();

  async buildStopWordsMap() {
    const stopWords = (await readFile(join(__dirname, '../', 'stops.utf8')))
      .toString()
      .split('\n');
    for (const word of stopWords) {
      this.#stopWordMap.set(word, -1);
    }
    this.#stopWordMap.set(' ', -1);
    this.#stopWordMap.set('\n', -1);
  }

  filterStopWords(splitedParagraphArray) {
    const result = [];
    const newArray = _.cloneDeep(splitedParagraphArray);
    for (const sentence of newArray) {
      for (let i = 0; i < sentence.length; i += 1) {
        if (this.#stopWordMap.get(sentence[i])) {
          sentence[i] = -1;
        }
      }
      const sentenceResult = sentence.filter((ele) => ele !== -1);
      result.push(sentenceResult);
    }
    return result;
  }
}

const stopWord = new StopWord();

stopWord.buildStopWordsMap();

module.exports = stopWord;
