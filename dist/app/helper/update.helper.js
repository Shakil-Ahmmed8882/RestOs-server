"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArrayField = exports.updateNestedFields = void 0;
// Helper function to handle nested object updates with dynamic paths
function updateNestedFields(basePath, nestedObject, targetObject) {
    if (nestedObject && Object.keys(nestedObject).length > 0) {
        for (const [key, value] of Object.entries(nestedObject)) {
            targetObject[`${basePath}.${key}`] = value;
        }
    }
}
exports.updateNestedFields = updateNestedFields;
// Helper function to handle array replacement and de-duplication
function updateArrayField(fieldName, newValues, modifiedArrayData) {
    if (newValues) {
        modifiedArrayData[fieldName] = [...new Set(newValues)];
    }
}
exports.updateArrayField = updateArrayField;
