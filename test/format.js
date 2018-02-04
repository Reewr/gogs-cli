/* globals describe it */
'use strict';
const chai = require('chai');
const expect = chai.expect;
const format = require('../lib/format');

describe('format.date', function() {
  it('should exist as property', function() {
    expect(format).to.have.property('date');
    expect(format.date).to.be.a('function');
  });

  it('should throw on invalid dates', function() {
    expect(() => format.date()).to.throw(TypeError);
    expect(() => format.date(5)).to.throw(TypeError);
    expect(() => format.date(NaN)).to.throw(TypeError);
    expect(() => format.date({})).to.throw(TypeError);
    expect(() => format.date(new Date(NaN))).to.throw(TypeError);
    expect(() => format.date(new Date())).to.not.throw(TypeError);
  });

  it('should accept valid strings', function() {
    expect(() => format.date('not-a-valid-date')).to.throw(TypeError);

    expect(() => format.date(new Date())).to.not.throw(TypeError);
    expect(() => format.date('2018-01-01T03:24:00')).to.not.throw(TypeError);
    expect(() => format.date('2017')).to.not.throw(TypeError);
  });

  it('should format date in a YYYY-MM-DD HH:MM:SS format', function() {
    const d1 = new Date('2018-01-01T03:24:00');
    const d2 = new Date('2018-01-01T03:24:01');

    expect(format.date(d1)).to.equal('2018-01-01 02:24');
    expect(format.date(d2)).to.equal('2018-01-01 02:24:01');
  });
});

describe('format.since', function() {
  it('should exist as property', function() {
    expect(format).to.have.property('since');
    expect(format.since).to.be.a('function');
  });

  it('should throw on invalid dates', function() {
    expect(() => format.since()).to.throw(TypeError);
    expect(() => format.since(5)).to.throw(TypeError);
    expect(() => format.since(NaN)).to.throw(TypeError);
    expect(() => format.since({})).to.throw(TypeError);
    expect(() => format.since(new Date(NaN))).to.throw(TypeError);
    expect(() => format.since(new Date())).to.not.throw(TypeError);
  });

  it('should accept valid strings', function() {
    expect(() => format.since('not-a-valid-date')).to.throw(TypeError);

    expect(() => format.since(new Date())).to.not.throw(TypeError);
    expect(() => format.since('2018-01-01T03:24:00')).to.not.throw(TypeError);
    expect(() => format.since('2017')).to.not.throw(TypeError);
  });

  it('should return the duration since the date', function() {
    const aSecondInMs = 1000;
    const aMinuteInMs = aSecondInMs * 60;
    const anHourInMs  = aMinuteInMs * 60;
    const aDayInMs    = anHourInMs * 24;

    const fiveSecondsAgo = new Date(Date.now() - 5 * aSecondInMs);
    const fiveMinutesAgo = new Date(Date.now() - 5 * aMinuteInMs);
    const fiveHoursAgo = new Date(Date.now() - 5 * anHourInMs);
    const fiveDaysAgo = new Date(Date.now() - 5 * aDayInMs);

    const fourthyFiveSecondsAgo = new Date(Date.now() - 45 * aSecondInMs);
    const fourthyFiveMinutesAgo = new Date(Date.now() - 45 * aMinuteInMs);
    const fourthyFiveHoursAgo = new Date(Date.now() - 45 * anHourInMs);
    const fourthyFiveDaysAgo = new Date(Date.now() - 45 * aDayInMs);

    const oneSecondAgo = new Date(Date.now() - aSecondInMs);
    const oneMinuteAgo = new Date(Date.now() - aMinuteInMs);
    const oneHourAgo = new Date(Date.now() - anHourInMs);
    const oneDayAgo = new Date(Date.now() - aDayInMs);
    const oneWeekAgo = new Date(Date.now() - 7 * aDayInMs);
    const oneMonthAgo = new Date(Date.now() - 30.43 * aDayInMs);
    const oneYearAgo = new Date(Date.now() - 366 * aDayInMs);

    expect(format.since(fiveSecondsAgo)).to.equal('~5 seconds ago');
    expect(format.since(fiveMinutesAgo)).to.equal('~5 minutes ago');
    expect(format.since(fiveHoursAgo)).to.equal('~5 hours ago');
    expect(format.since(fiveDaysAgo)).to.equal('~5 days ago');

    expect(format.since(fourthyFiveSecondsAgo)).to.equal('~45 seconds ago');
    expect(format.since(fourthyFiveMinutesAgo)).to.equal('~45 minutes ago');
    expect(format.since(fourthyFiveHoursAgo)).to.equal('~2 days ago');
    expect(format.since(fourthyFiveDaysAgo)).to.equal('~45 days ago');

    expect(format.since(oneSecondAgo)).to.equal('~1 second ago');
    expect(format.since(oneMinuteAgo)).to.equal('~1 minute ago');
    expect(format.since(oneHourAgo)).to.equal('~1 hour ago');
    expect(format.since(oneDayAgo)).to.equal('~1 day ago');
    expect(format.since(oneWeekAgo)).to.equal('~1 week ago');
    expect(format.since(oneMonthAgo)).to.equal('~1 month ago');
    expect(format.since(oneYearAgo)).to.equal('~1 year ago');
  });
});
