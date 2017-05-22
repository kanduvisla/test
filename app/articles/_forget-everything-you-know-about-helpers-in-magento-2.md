(artikel over waarom je geen helpers moet gebruiken maar managers, interfaces en dependency injection)

## Service Interfaces

If you look at the [official documentation](http://devdocs.magento.com/guides/v2.1//extension-dev-guide/service-contracts/design-patterns.html#service-interfaces), you'll notice that Magento 2 makes a distinct difference in 3 type of interfaces:

1. **Repository interfaces** - These are used to handle persistent data entities. These interfaces have methods that provide saving and loading of entities.
2. **Management interfaces** - These are used to provide functionality that are not related to repositories.
3. **Metadata interfaces** - These are not quite documented (yet), but I'm guessing they're talking about interfaces that don't provide direct functionality related to the model.

## Helpers vs Management interfaces

To understand why we shouldn't use helpers, we must first understand why helpers are there in the first place:

## Example

