# Helpers vs. Service Contracts

When to use Helpers en when to use Service Contracts

- Helpers when you're going to write functionality that's going to be needed solely **inside** your module.
- Service Contracts when you're going to write functionality that might also be needed **outside** your module.

## Helpers

When we're talking about _"functionality that's going to be needed solely **inside** your module"_, we're talking 
about functionality that's either:

- Not interesting for other modules to know about.
- Not required / the responsibility for other modules to use.
- Most likely going to change in the future and therefore not suited for 3rd party developers.

### Examples

Here are some examples of situations when you want to have a Helper over a Service Contract.

#### Configuration

## Service Contracts

When we're talking about _"functionality that might also be needed **outside** your module"_, we're talking about:

- Usage in other modules (duh).
- Usage in templates

### Examples

## How to make the decision?

In my opinion, you should always think _"Service Contract first, helper second"_. It's not without a reason that
a helper is mostly considered an anti-pattern (source).