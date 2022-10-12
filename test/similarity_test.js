const chai = require('chai');
const should = require('should');
const { calculateSimilarity, findMatchedKeyword } = require('../util/compare');

describe('calculate similarity', () => {
  it('should return the intersection size divided by the union size', (done) => {
    let result = calculateSimilarity(['A', 'B', 'C'], ['B', 'C', 'D']);
    result.should.equal(0.5);
    done();
  });

  it('should return 0', (done) => {
    let result = calculateSimilarity(['X', 'Y', 'Z'], ['B', 'C', 'D']);
    result.should.equal(0);
    done();
  });

  it('should return 100', (done) => {
    let result = calculateSimilarity(['A', 'B', 'C'], ['A', 'C', 'B']);
    result.should.equal(1);
    done();
  });
});

describe('find matched keyword', () => {
  it('should return 2', (done) => {
    let result = findMatchedKeyword(['A', 'B', 'C'], ['B', 'C', 'D']);
    result.should.equal(2);
    done();
  });

  it('should return 0', (done) => {
    let result = findMatchedKeyword(['X', 'Y', 'Z'], ['B', 'C', 'D']);
    result.should.equal(0);
    done();
  });

  it('should return 3', (done) => {
    let result = findMatchedKeyword(['X', 'Y', 'Z'], ['X', 'Y', 'Z']);
    result.should.equal(3);
    done();
  });
});
