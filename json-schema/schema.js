'use strict';
const path = require('path');
const co = require('co');
const tv4 = require('tv4');
const tv4formats = require('tv4-formats');

const mongoose = require('mongoose');

const validator = tv4.freshApi();
validator.addFormat(tv4formats);

const TYPES = {
    'string': String,
    'number': Number,
    'integer': Number,
    'boolean': Boolean,
    'array': Array,
    'object': Object,
    'null': null,
};

const FORMATTERS = {
    'date-time': {
        type: Date,
        disableValidate: true,
        from: (v) => new Date(v),
        to: (d) => d.toISOString()
    }
};

const convertType = (field) => {
    var convType = TYPES[field.type];
    if (!convType) {throw Error('unkown type');}
    var formatter = FORMATTERS[field.format];
    if (formatter && formatter.type) {
        return formatter.type;
    }
    return convType;
};

const getValidator = (field) => {
    var formatter = FORMATTERS[field.format];
    if (!formatter || (formatter && !formatter.disableValidate)) {
        return (value, next) => {
            var result = validator.validateResult(value, field);
            next(result.valid, result.valid ? undefined : result.error.message);
        }
    }
};

function convertSchema(jsonSchema) {
    const props = jsonSchema.properties;
    const required = jsonSchema.required || [];
    const schemaTemplate = {};
    for (let key of Object.keys(props)) {
        var field = props[key];
        var entry;
        if (field.type === 'object') {
            entry = convertSchema(field);
        } else {
            let validate = true;
            let validator = getValidator(field);
            entry = {
                type: convertType(field),
                required: required.indexOf(key) !== -1
            };
            if (validator) { entry.validate = validator; }
        }
        schemaTemplate[key] = entry;
    }
    return schemaTemplate;
}

function getSchema(jsonSchema) {
    var jsonschemaPath;
    if (typeof jsonSchema === 'string') {
        let dirname = path.dirname(module.parent.filename);
        jsonschemaPath = path.join(dirname, jsonSchema);
        jsonSchema = require(jsonschemaPath);
    }
    var schemaTemplate = convertSchema(jsonSchema);
    var schema = new mongoose.Schema(schemaTemplate);
    schema.jsonschema = jsonSchema;
    schema.jsonschemaPath = jsonschemaPath;
    return schema;
};

module.exports = getSchema;