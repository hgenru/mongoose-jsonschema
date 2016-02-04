'use strict';
const chai = require('chai'); chai.should();
const expect = chai.expect;
chai.use(require('chai-shallow-deep-equal'));
chai.use(require('chai-as-promised'));

const co = require('co');
const mongoose = require('mongoose');
const ValidationError = mongoose.ValidationError;

const getSchema = require('../../lib/schema');
const USER_SCHEMA_PATH = './assets/user-schema.json';
const USER_SCHEMA = require(USER_SCHEMA_PATH);

describe(__filename, function() {
    it('schema() should resolve schema by path', co.wrap(function*() {
        var schema = getSchema(USER_SCHEMA_PATH);
        schema.jsonschemaPath.should.include('assets/user-schema.json');
    }));

    it('schema() should resolve schema by obj', co.wrap(function*() {
        var schema = getSchema(USER_SCHEMA);
        expect(schema.jsonschemaPath).to.be.an('undefined');
    }));

    it('schema() result should contains schema obj', co.wrap(function*() {
        var schema = getSchema(USER_SCHEMA);
        schema.jsonschema.should.include(USER_SCHEMA);
    }));

    it('user schema should convert to valid mongoose model', co.wrap(function*() {
        const EXPECTED_SCHEMA = {
            name: {
                first: {type: String, required: true},
                middle: {type: String},
                last: {type: String, required: true}
            },
            bday: {type: Date, required: false}
        };
        var modelSchema = getSchema(USER_SCHEMA);
        modelSchema.tree.should.shallowDeepEqual(EXPECTED_SCHEMA);
        modelSchema.tree.bday.type.should.be.equal(Date);  // хз почему shallowDeepEqual считает дату строкой
    }));

    it('user schema should be a valid', co.wrap(function*() {
        const VALID_ENTRY = {
            name: {
                first: 'Иван',
                last: 'Иванов'
            },
            bday: new Date()
        };
        var modelSchema = getSchema(USER_SCHEMA);
        var TestModel = mongoose.model('Test', modelSchema);
        var obj = new TestModel(VALID_ENTRY);
        yield obj.validate();
    }));

    it('user schema should check required fields', co.wrap(function*() {
        const VALID_ENTRY = {
            name: {
                first: 'Иван',
                middle: 'Иванович'
            },
            bday: new Date()
        };
        var modelSchema = getSchema(USER_SCHEMA);
        var TestModel = mongoose.model('Test2', modelSchema);
        var obj = new TestModel(VALID_ENTRY);
        obj.validate().should.be.rejectedWith(ValidationError);
    }));

    it('test enum field', co.wrap(function*() {
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

    it('test objectId field', co.wrap(function*() {
        var schema = getSchema({
            type: 'object',
            properties: {
                _id: {type: 'string', format: 'objectid'}
            }
        });
        var TestModel = mongoose.model('ObjIdField', schema);
        var t1 = new TestModel({_id: '4edd40c86762e0fb12000003'});
        yield t1.validate();
        var t2 = new TestModel({_id: 'invalid_id'});
        yield t2.validate().should.be.rejectedWith(ValidationError);
        var t3 = new TestModel({
            _id: mongoose.Types.ObjectId('4edd40c86762e0fb12000003')
        });
        yield t3.validate();
    }));

    it('test mongo prop', co.wrap(function*() {
        var schema = getSchema({
            type: 'object',
            properties: {
                testRef: {type: 'string', format: 'objectid', mongo: {ref: 'User'}}
            }
        });
        var TestModel = mongoose.model('ObjIdFieldRef', schema);
        var t1 = new TestModel({testRef: '4edd40c86762e0fb12000003'});
        yield t1.validate();
    }));
});
