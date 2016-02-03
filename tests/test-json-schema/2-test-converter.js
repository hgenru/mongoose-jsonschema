'use strict';
const chai = require('chai'); chai.should();
chai.use(require('chai-as-promised'));

const co = require('co');
const mongoose = require('mongoose');
const ValidationError = mongoose.ValidationError;

const getSchema = require('../../lib/schema');

describe(__filename, function() {
    it('check enum', co.wrap(function*() {
        var schema = getSchema({
            type: 'object',
            properties: {
                gender: {type: 'string', enum: ['male', 'female']}
            }
        });
        var TestModel = mongoose.model('Test1', schema);
        var t1 = new TestModel({gender: 'male'});
        yield t1.validate();
        var t2 = new TestModel({gender: 'transgeder'});
        yield t2.validate().should.be.rejectedWith(ValidationError);
    }));
});
