# How to write solid Magento 2 code

## Single Responsibility Responsibility

A class (or a method) should only have one responsibility. A great example of how this is implemented
in Magento 2 is how controllers and observers work compared to Magento 1.

### Controllers

In Magento 1, You would have a controller that would handle all kind of actions. The path in the URL
would determine what action of the controller would be called. For example, You could have a controller
with the following actions:

    class Foo_Bar_Controller_Action extends Mage_Core_Controller_Front_Action
    {
        public function editAction()
        {
            // ...
        }
        
        public function saveAction()
        {
            // ...
        }
        
        public function deleteAction()
        {
            // ...
        }
    }

The URL could be `foo/bar/edit`, and it would invoke the `editAction()`. At the same time, calling
`foo/bar/delete` would call the `deleteAction()` of the same class. In this example, this single class
had multiple responsibilities. Not very solid...

Magento 2 takes a different approach. Instead of having one class that handles all actions, each action
is handled within it's own class. So in the above example, you would have not have one class, but 3 classes:

`foo/bar/edit` would call `Controller/Bar/Edit.php`:

    class Edit extends \Magento\Framework\App\Action\Action
    {
        public function execute()
        {
            // ...
        }
    }

`foo/bar/save` would call `Controller/Bar/Save.php`:

    class Save extends \Magento\Framework\App\Action\Action
    {
        public function execute()
        {
            // ...
        }
    }
    
etc...

This way of organizing your code makes it much easier to maintain, test and extend. Each class has only
one responsibility to worry about.

### Observers

Likewise, observers are also much better handled in Magento 2. In Magento 1, it's considerd the best practice
to have one observer and just put every event that could every be dispatched inside that controller:

    class Foo_Bar_Model_Observer
    {
        public function productLoadAfterEvent($observer)
        {
            // ...
        }
        
        public function customerLoginAfterEvent($observer)
        {
            // ...
        }
        
        public function someOtherEvent($observer)
        {
            // ...
        }
    }
    
Most of the time you would end up with one massive controller that had just too much responsibility.
Just as with controllers, Magento decided to chop things up in Magento 2, so that each event uses it's
own observer:

    <event name="cms_page_render">
        <observer name="cms_page_render" instance="Vendor\Module\Observer\Cms\PageRender" />
    </event>
    <event name="cms_block_load_after">
        <observer name="cms_block_load_after" instance="Vendor\Module\Observer\Cms\BlockLoadAfter" />
    </event>
    <event name="controller_action_predispatch_contact_index_post">
        <observer name="controller_action_predispatch_contact_index_post"
            instance="Vendor\Module\Observer\Contact"/>
    </event>

In this example, 3 classes are needed and as with the observer, each class has one `execute()`-method
that is called. One class, one single responsibility.

### Methods

The same principle can be applied further on the way how you write and organize your code. When you
write your methods, make sure that your methods also just have one responsibility.

(todo: add example)

## Open / Closed Principle

## Liskov Substituion Principle

## Interface Segregation Principle

## Dependency Inversion Principle