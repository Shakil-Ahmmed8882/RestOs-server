// Helper function to handle nested object updates with dynamic paths
export function updateNestedFields(
    basePath: string,
    nestedObject: Record<string, any> | undefined,
    targetObject: Record<string, string | undefined>
  ) {
    if (nestedObject && Object.keys(nestedObject).length > 0) {
      for (const [key, value] of Object.entries(nestedObject)) {
        targetObject[`${basePath}.${key}`] = value;
      }
    }
  }
  

  // Helper function to handle array replacement and de-duplication
export function updateArrayField(
  fieldName: string,
  newValues: string[] | undefined,
  modifiedArrayData: Record<string, any[]>
) {
  if (newValues) {
    modifiedArrayData[fieldName] = [...new Set(newValues)];
  }
}