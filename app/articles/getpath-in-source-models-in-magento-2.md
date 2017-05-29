---
title: getPath() in Source Models in Magento 2
date: 2017-02-17
layout: article.html
published: true
lunr: true
tags:
  - Magento 2
  - Source Models
---

# getPath() in Source Models in Magento 2

Hi there! Got Magento 2 open in your IDE? Good!

Take a look at the `<section id="sales_email">`-node in the `etc/adminhtml/system.xml` of the Sales module.
Notice anything... weird? Look at all the source models responsible for rendering e-mail templates.
They **all** use the same source model: `Magento\Config\Model\Config\Source\Email\Template`.

This might look weird at first. After all: when you look at the configuration, you'll see that
each select-field is only populated with the proper e-mail templates. Like

- New Order (Default)
- New Order for Guest (Default)
- Order Update (Default)
- etc...

_"What kind of witchery is this?"_ you might ask. After all: it's one and the same source model and
it's not like there is any other parameters sent to the source model through `system.xml`. Or is there?

Here comes a small trick: look at the source model again. Notice the method `getPath()` that is called at some point.
This is where it gets interesting. The source model in question is extended from `Magento\Framework\DataObject`.
This means that it has the [magical getters and setters](https://gielberkers.com/magentos-magical-getters-setters-demystified/).

Now look at the method responsible for parsing the `<source_model>`-node from our `system.xml`. This
method is located at `\Magento\Config\Model\Config\Structure\Element\Field::_getOptionsFromSourceModel()`.
In this method you'll notice the following line:

```php
if ($sourceModel instanceof \Magento\Framework\DataObject) {
    $sourceModel->setPath($this->getPath());
}
```

Boom! There it is. What the above states means the following:

_"If you have a source model in your `system.xml`, and the source model is a child of `Magento\Framework\DataObject`,
you have knowledge to the path in the configuration from where the source model was invoked."_

In this example this means the following: Looking back at the `system.xml`-node of the Magento Sales
module we can summarize it like this:

```xml
<section id="sales_email">
    <group id="order">
        <field id="template">
            ...
        </field>
    </group>
</section>
```
    
This means that in this example the path is `sales_email/order/template`. In other words: this is the 
path that `getPath()` will return in this configuration-node. But in other locations in the XML, the
exact same method returns different results.

A small yet handy undocumented feature of Magento 2.