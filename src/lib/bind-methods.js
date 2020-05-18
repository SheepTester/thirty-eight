export function bindMethods (instance, methodNames) {
  for (const methodName of methodNames) {
    instance[methodName] = instance[methodName].bind(instance)
  }
}
