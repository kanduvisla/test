---
title: Embrace Data Models
date: 2017-05-22
layout: article.html
published: true
lunr: true
tags:
  - Magento 2
  - Data Models
---

# Say goodbye to Legacy Models in Magento 2 and embrace Data Models (with collections)

Most of you might already know this, but for those of you who have been living under a rock for the last year-and-a-half: Magento 2 has 2 properties that kind of collide with eachother:

1. Composition over Inheritance
2. Ported code of Magento 1 to Magento 2

## Composition over Inheritance

If you're not familiar with this, _'Composition over Inheritance'_ means that you should craft your models by including dependencies (composition) rather than extending one object after another (inheritance). It's one of the core principles of S.O.L.I.D. programming, where an object should only have one task and it's dependencies should be carefully picked for this task.

## Ported code

A lot of code has been ported from Magento 1 directly to Magento 2 and you can still see lot of Magento 1 design patterns and influences in todays' Magento 2 core. One of these concepts are the Magento 1 models and their collections. In Magento 1, the persistent operations where done directly on the model. For example:

```php
$productModel->load(42);
$productModel->setName('My Majestic Product');
$productModel->save();
```

In Magento 2 these actions are done by repositories:

```php
$productModel = $this->productRepository->getById(42);
$productModel->setName('My Majestic Product');
$this->productRepository->save($productModel);
```

The same goes for collections: those are almost entirely ported from Magento 1. Just take a look at their pseudo-constructors:

```php
protected function _construct()
{
    $this->_init('Vendor\Module\Model\Example', 'Vendor\Module\Model\ResourceModel\Example');
}
```

As you can see, collections depend on Magento 1-like (resource) models to operate. Which can be not exactly what you want, since Magentos' default model extends from `Magento\Framework\Model\AbstractModel` which has tons of boilerplate code that you don't really need. Remember that thing I said about composition over inheritance? This is a fine example of how inheritance is causing additional overhead.

This is especially the case when working with data models.

## Data models

Data models are a generally new concept in Magento, and they are nothing more than a representation of the data of an entity. They (usually) implement an interface from the `Api/Data`-folder and provide only the minimal functionality required to get and/or set data. A good example is the customer data model (`\Magento\Customer\Model\Data\Customer`). This model only implements the customer data interface (`\Magento\Customer\Api\Data\CustomerInterface`) and provides the minimum functionality required to operate.

In contrast with a legacy model (as I would like to call them from now on), data models have no methods that are tied to the persistency of data (like `save()`, `load()`, `beforeDelete()`, etc.). We use repositories for that (that's the reason why a repository requires a data interface as parameter for it's `save()`-method, not a legacy model). Nor do they handle events (like `model_load_after`, etc.). We can use plugins or decorators for that. And don't get me even started on magic methods...

All in all data models (in combination with repositories and managers) are a more S.O.L.I.D. way to work with your entities in Magento. You'll quickly find out that you will writer cleaner code when using this pure and separated approach.

There is however a problem that you need to overcome when working with data models: collections.

## Collections

Collections are still a fundamental part of Magento 2. They are used internally in repositories, in the admin grid, in forms, etc. They provide an abstract way to search through your entities and provide a set of results to work with. However, as I stated earlier: collections have a dependency on legacy models. Just take a look again at the pseudo constructor of a typical collection (extended from `Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection`):

```php
protected function _construct()
{
    $this->_init('Vendor\Module\Model\Example', 'Vendor\Module\Model\ResourceModel\Example');
}
```

As I've shown in the example above, there is no need for legacy models when you're embracing data models. So it would be a shame if we only need to create a legacy model to provide this basic functionality. Luckily for us, the flexible nature of Magento 2 makes it very easy to overcome this problem.

### In admin grids

First of, in admin grids it's easy to provide a collection. If you're already familiar with UI Components, you'll know that you can create a virtual type to provide a grid collection for this purpose:

```xml
<virtualType name="Vendor\Module\Model\ResourceModel\Example\Grid\Collection"
             type="Magento\Framework\View\Element\UiComponent\DataProvider\SearchResult">
    <arguments>
        <argument name="mainTable" xsi:type="string">my_table</argument>
        <argument name="resourceModel" xsi:type="string">Vendor\Module\Model\ResourceModel\Example</argument>
    </arguments>
</virtualType>
```

Since we're working with persistent data, we need a resource model. Since a resource model only needs to know information about the database (like what table to map to and what field is used for the primary key, we can simply create a resource model by extending `\Magento\Framework\Model\ResourceModel\Db\AbstractDb`:

```php
class Example extends \Magento\Framework\Model\ResourceModel\Db\AbstractDb
{
    /**
     * Pseudo Constructor
     */
    protected function _construct()
    {
        $this->_init('my_table', 'id');
    }
}
```

So now we have a resource model and a collection that can work with our grid. But what about plain ol' regular collections? They require a legacy model to work with!

Right?

Well, actually... they don't.

If you take a look at `Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection`, the class that's regulary used to create a collection, then yes: due to it's nature it requires to know what legacy model to use. However, this class extends from `\Magento\Framework\Data\Collection\AbstractDb`, a simple database wrapper for the default data collection, and it implements `\Magento\Framework\App\ResourceConnection\SourceProviderInterface`. Now in these little facts lies the key to our problem. Because there is nothing that stops us from creating our own collection that extends the same class and implements the same interface. And if you look at the requirements for such a task, it's fairly simple:

- `\Magento\Framework\Data\Collection\AbstractDb` only requires us to implement `getResource()` which returns the resource model. We can easily add our resource model using dependency injection and return that. So that's something we've got covered!
- `\Magento\Framework\App\ResourceConnection\SourceProviderInterface` only requires us to implement `getMainTable()` and `addFieldToSelect()`. Now, `getMainTable()` can return the same table as the resource model and as long as we don't do any joins with other tables, our `addFieldToSelect()` can just return... itself!

So basically, we can now create a simple collection without the need of a legacy model like this:

```php
use Vendor\Module\Model\ResourceModel\Example;
use Magento\Framework\App\ResourceConnection\SourceProviderInterface;
use Magento\Framework\Data\Collection\AbstractDb;
use Magento\Framework\Data\Collection\Db\FetchStrategyInterface;
use Magento\Framework\Data\Collection\EntityFactoryInterface;
use Psr\Log\LoggerInterface as Logger;

/**
 * Class Collection
 */
class Collection extends AbstractDb implements SourceProviderInterface
{
    /**
     * @var string
     */
    protected $_idFieldName = 'id';

    /**
     * @var Example
     */
    protected $resource;

    /**
     * Collection constructor.
     * @param Example $resource
     * @param EntityFactoryInterface $entityFactory
     * @param Logger $logger
     * @param FetchStrategyInterface $fetchStrategy
     * @param \Magento\Framework\DB\Adapter\AdapterInterface|null $connection
     */
    public function __construct(
        Example $resource,
        EntityFactoryInterface $entityFactory,
        Logger $logger,
        FetchStrategyInterface $fetchStrategy,
        \Magento\Framework\DB\Adapter\AdapterInterface $connection = null
    ) {
        $this->resource = $resource;

        if (!$connection) {
            $connection = $resource->getConnection();
        }
        
        parent::__construct($entityFactory, $logger, $fetchStrategy, $connection);

        // Set main table:
        $this->getSelect()->from(['main_table' => $this->getMainTable()]);
    }

    /**
     * @return Example
     */
    public function getResource()
    {
        return $this->resource;
    }

    /**
     * @return string
     */
    public function getMainTable()
    {
        return $this->resource->getMainTable();
    }

    /**
     * @param string $fieldName
     * @param null $alias
     * @return $this
     */
    public function addFieldToSelect($fieldName, $alias = null)
    {
        return $this;
    }
}
```

So there you have it! A minimal example of a collection that's driven by composition, not inheritance. So let's just take this example by heart and start saying goodbye to legacy models.