# Dumbing down templates in Magento 2

> Just because you can do anything in a template doesn't mean you should.

Some of you might already know the S.O.L.I.D way of programming. If you haven't, it's really interesting stuff if you want to be a better programmer. And besides that, the S.O.L.I.D principles can be found throughout Magento 2.

The **S** in S.O.L.I.D stands for _Single Responsibility_: an object should only have one responsibility, therefore you must keep it as simple as possible. So let's just look at how this applies to templates in Magento 2.

If we look at the _responsibility_ of a template, we can simply say:

_A template should **only** be responsible for converting variables to HTML._

Now take a step back and let that sink in. What does this actually mean? In my opinion, _"Converting variables to HTML"_ means:

- Putting the value of a variable inside a HTML tag / attribute.
- Rendering (or leaving out) parts of the template according to a boolean condition.
- Iterating through an itterable variable.

What is **doesn't mean** is:

- Performing complex PHP logic.
- Performing complex Magento tasks, like filtering a product collection for example.
- Querying database tables (believe me, I've seen templates performing 100+ lines of SQL queries without outputting a single character of HTML).

What I like to do is keep my templates as dumb as possible. That means we need to minimize the responsibility of logic in the template, and only use templates for what they are intended to do: convert variables to HTML. All logic needs to come from their corresponding block class.

## How to make your templates dumb

When you take a critical look at how templates are handled within Magento 2, you'll quickly notice that templates are _'too smart'_. So what does that mean? When is a template too smart? Well, look at it this way:

Imagine you're working in a team with 2 developers:

1. A Magento backend developer that knows how to get things done in Magento. He knows the basic principles of dependency injection, plugins, events, the layout model, etc.
2. A frontend developer (not limited to Magento) who knows his way into templating, but is not that familiar with all the backend coding stuff. 

They're a perfect match.

Now, the Magento backend developer knows how to work with models, collections, repositories, factories, registries, etc. But the frontend developer doesn't have all that knowledge. On the other hand, he's a wizard when it comes to CSS, JavaScript, SVG, animations, etc.

In this setup, it would make no sense for the frontend developer to know all the inner workings and gizmo's of Magento. Simply put, you cannot expect from every Magento frontend developer to write something like this:

```html
<?php
$imageUrl = $this->helper('Magento\Catalog\Helper\Image')
->init($block->getProduct(), 'product_page_image_large')
->setImageFile($block->getImageFile())
->getUrl();
?>
<img src="<?php echo $imageUrl; ?>" />
```

I don't even think the average frontend developer would be happy with having to write something like this.

But even more important: this causes a lot of clutter in the template that makes it harder to read and harder to maintain. It would make much more sense for a template to have something like this:

```html
<img src="<?php echo $block->getLargeImageUrl(); ?>" />
```

By moving the logic on how to generate the URL out of the template, we're dumbing down the template.

## So what's a frontend developer allowed to do?

In my opinion, templates should only be allowed to have the following PHP functionality:

- `echo`
- `for`
- `foreach`
- `if / else`

And the following Magento functionality:

- `__()`
- `$block->getChildHtml()`

The main idea is that the backend developer who writes the block class provides
all information that is required by the template. The template itself should
never contain business logic like filtering and such.

### Conditional statements

Assertions in conditional statements should not be done in templates but in the
corresponding block class. Having to do a condition inside a template brings business logic into a template, and that's not the place for it. So instead of this:

```html
<div>
<?php if ($block->getStatus === \Vendor\Module\Model\Config\Source\Status::DONE) : ?>
<p>It's done...</p>
<?php endif; ?>
</div>
```

You should write this in your template:

```html
<div>
<?php if ($block->isDone()) : ?>
<p>It's done...</p>
<?php endif; ?>
</div>
```

or to be more semantic:

```html
<div>
<?php if ($block->isStatusDone()) : ?>
<p>It's done...</p>
<?php endif; ?>
</div>
```

This makes the template more readable, but even more so: functionality tends to change over the course of time. So if we look at the above `$block->isDone()`. While the current implementation of `isDone()` might initialy look like this:

```php
public function isDone(): bool
{
    return $this->getStatus() === \Vendor\Module\Model\Config\Source\Status::DONE;
}
```

A couple of iterations later the method could possibly end up like this:

```php
public function isDone(): bool
{
    if ($this->customerSession->isLoggedIn() && $this->someExoticMethod() !== -1) {
        switch ($this->getStatusToLookAt()) {
            case self::STATUS_ONE:
                return $this->getStatus() === \Vendor\Module\Model\Config\Source\Status::DONE;
                break;
            case self::STATUS_TWO:
                return $this->getAlternativeStatus() === \Vendor\Module\Model\Config\Source\Status::DONE;
                break;                
        }
    }
    
    return false;
}
```

Trust me, I've seen templates that started small and ended up like spaghetti nightmares that even the most experienced PHP developers couldn't make much sense of. Just let your template only worry about `true` or `false`. It doesn't need to know how it's determined. It's not the templates' _responsibility_.

Also, this approach makes it great to write unit tests for your block classes, reducing the chances of errors and future bugs in your templates.

### Filtering and stuff

The same goes for collections and all other kinds of filtering:

You should never have to work directly on collections inside your template:

```html
<ul class="products">
<?php $collection = $block->getProductCollection()->addFieldToFilter('foo','bar') ?>
<?php foreach($collection as $product): ?>
<li>yay!</li>
<?php endforeach; ?>
</ul>
```

or even worse:

```html
<ul class="products">
<?php $helper = $this->helper('\Who\Needs\Helper\Anyway') ?>
<?php $collection = $block->getProductCollection()->addFieldToFilter('foo','bar') ?>
<?php if ($helper->isCustomerLoggedIn()) {
    // Yeah, let's just join a table in our template, who cares?
    $collection->join(
        // ...A lot of PHP code to make this bizar contraption work...
    )->addFieldToFilter('customer_id', $helper->getCustomerId());
} ?>
<?php foreach($collection as $product): ?>
<li>yay!</li>
<?php endforeach; ?>
</ul>
```

Once again, I'm not being melo-dramatic here. This shit happens! There are actually developers who think:

> Yeah let me just put this business logic that joins a couple of tables together in this phtml file. What's the worst that could happen?

Keep in mind that when you're developing, you're not just developing for yourself. Especially not when you work in a company and have co-workers. However, freelancers should also play nice too. Why? Because **at some point a developer with less knowledge then you will take over your code and have to work with it!** This can be somebody new at work. Or perhaps the client is leaving. Or you are leaving. However, as a developer you too have a _responsibility_ to always aim at the hights quality of code you can offer.

Let's get back to the whole subject of _responsibility_: It's the _responsibility_ of the block to give you the proper collection:

```html
<ul class="products">
    <?php foreach($block->getFilteredCollection() as $product): ?>
    <li>yay!</li>
    <?php endforeach; ?>
</ul>
```

Once again, it's the _responsibility_ of the block to give you the proper collection. The block is responsible for filtering, paginating, checking if the customer is logged in, joining tables, etc. The template should only worry about rendering the result. Don't make that template too smart!

#### Mind the catch!

There's also an extra catch here: if you look at the above example, you might already have spotted it. Yes? No? Let me tell you:

If the product collection is empty you end up with the following output:

```html
<ul class="products">
</ul>
```

This, of course, is undesirable. Now, a quick fix might look like this:

```html
<?php if ($collection = $block->getFilteredCollection()) : ?>
<ul class="products">
    <?php foreach($collection as $product): ?>
    <li>yay!</li>
    <?php endforeach; ?>
</ul>
<?php endif; ?>
```

Right? **WRONG!**

Ask yourself the following question:

_"Is it the responsibility of the **block** or of the **template** to determine whether or not the list should be rendered?"_

Look at the question. It's a decision. Decisions should be made by the block. The template should only handle according to these decisions. So the proper way to solve this would be:

```html
<?php if ($block->isVisible()) : ?>
<ul class="products">
    <?php foreach($block->getFilteredCollection() as $product): ?>
    <li>yay!</li>
    <?php endforeach; ?>
</ul>
<?php endif; ?>
```

The `isVisible()`-method in it's turn could look something like this:

```php
public function isVisible(): bool
{
    return $this->getCollection()->count() > 0;
}
```

Once again, it's the same as with the previous example. This method might look simple and like overhead at the moment, but in the future chances are that the visibility of the block is determined by more parameters than just the count of the collection. For example, this is what the method might look like after a couple of iterations:

```php
public function isVisible(): bool
{
    if ($this->configHelper->isListVisibleOnCategoryPage() && 
        $this->getCurrentPageType() == self::TYPE_CATEGORY) {
        return $this->getCollection()->count() > 0;
    }
    
    return false;
}
```

Once again: business logic might change, but since you've kept your templates as dumb as possible there are no surprises there.

### Everything should come from the block

By now, it should be clear to you why it's important to keep your templates dumb: everything should come from the block. So let's dive deeper into this: What is _'everything'_? What are the common gotchas? We've already seen above that even the simplest assumption can break the responsibility principle. So what more is there to be aware of?

Let's just start with the most basic example. A lot of templates out there have a structure similar to this:

#### product.phtml
```php
<?php /** @var \Vendor\Module\Block\Example $block */ ?>
<?php $product = $block->getProduct(); ?>
...
<h1><?php echo $product->getName(); ?></h1>
...
```
Believe it or not, this is wrong. Why? Because of responsibility. Ask yourself the question: _"Who's responsibility is it to **get** the name of the product, and who's responsibility is it to **render** the name of the product?"_

Just let that sink in for a moment...

Done? Right! Then you've probably came to the conclusion that it's not the template responsibility to get the name, but solely to render it. Look at this modified example:

#### product.phtml
```php
<?php /** @var \Vendor\Module\Block\Example $block */ ?>
...
<h1><?php echo $block->getProductName(); ?></h1>
...
```
In this template we've moved the responsibility to get the products' name to the block class, so the template only has to worry about rendering it. The code in the block could look something like this:
#### Example.php
```php
(todo: add constructor and getProduct() methods)
/**
* @return string
*/
public function getProductName()
{
	return (string) $this->getProduct()->getName();
}
```

### Iteration

When iterating through arrays / collections you should always use sub-templates. It keeps your templates organized, ... and dumb. Take the following template for example:

#### category.phtml
```html
<?php /** @var \Vendor\Module\Block\Example $block */ ?>
<h1><?php echo $block->getCategoryName(); ?></h1>
<ul class="products">
	<?php foreach ($block->getProductCollection() as $product) : ?>
	<li>
		<?php echo $product->getName(); ?>
	</li>
	<?php endforeach; ?>
</ul>
```
You might have guessed it, but this is wrong. It starts correctly, be asking the category name from the block class, but as soon as we're iterating through the product collection, we're giving up on responsibility. As we've seen before, it's **not** the templates' responsibility to get the name of the product, but the responsibility of the block class.

But wait... There's more to it...

Our template is responsible for rendering the **category** not the individual products inside of it! So it would make more sense to break it all up and do:

#### category.phtml
```html
<?php /** @var \Vendor\Module\Block\Example $block */ ?>
<h1><?php echo $block->getCategoryName(); ?></h1>
<ul class="products">
	<?php foreach ($block->getProductCollection() as $product) : ?>
	<?php echo $block->getChildHtml('product'); ?>
	<?php endforeach; ?>
</ul>
```

But now we have another problem, we need to provide a way to attach the product to the rendered child. There are 3 options to do this:

#### category.phtml
```html
<?php /** @var \Vendor\Module\Block\Example $block */ ?>
<h1><?php echo $block->getCategoryName(); ?></h1>
<ul class="products">
	<?php foreach ($block->getProductCollection() as $product) : ?>
	<?php echo $block->getChild('product')->setProduct($product)->toHtml(); ?>
	<?php endforeach; ?>
</ul>
```
But this makes our template too smart, and we want to keep them dumb.

#### category.phtml
```html
<?php /** @var \Vendor\Module\Block\Example $block */ ?>
<h1><?php echo $block->getCategoryName(); ?></h1>
<ul class="products">
	<?php foreach ($block->getProductCollection() as $product) : ?>
	<?php $block->render($product); ?>
	<?php endforeach; ?>
</ul>
```

Or just skip the entire `foreach`-statement alltogether:

#### category.phtml
```html
<?php /** @var \Vendor\Module\Block\Example $block */ ?>
<h1><?php echo $block->getCategoryName(); ?></h1>
<ul class="products">
	<?php echo $block->renderChildren(); ?>
</ul>
```

### No helpers

(reference to chapter about when and why to use helpers)

As we've read in (helper chapter), helpers can be used throughout the code of your module. But don't use helpers in your template. Why? Once again, it's a matter of responsibility. Take the following example:

#### template.phtml
```html
<?php /** @var \Vendor\Module\Block\Example $block */ ?>
<?php $pricingHelper = $this->helper('Magento\Framework\Pricing\Helper\Data'); ?>
...
<p class="price"><?php echo $pricingHelper->currency($block->getPrice(), true, false); ?></p>
...
```
See what's wrong with the above example? Although it works, and there are plenty of resources online that will tell you that this is the solution, there is a big problem here. **It's not the responsibility of the template to format the price.** As we've seen above, the template should **only** be responsible for rendering the (formatted) price.

So what's the proper way to do this?

#### template.phtml
```html
<?php /** @var \Vendor\Module\Block\Example $block */ ?>
...
<p class="price"><?php echo $block->getFormattedPrice(); ?></p>
...
```
Now would you just look at this? We immediately can see the following benefits:

- The template is much less cluttered, and thus easier to read and maintain.
- Moving the responsibility to format the price outside the template makes it easier to alter it.
- Moving the logic outside the template makes it great for unit testing.
- Moving the logic outside the template also makes it great for a multi disciplined team workflow (more on this later on).

#
Workflow

One can imagine various workflows when you keep your template dumb. In this chapter I will show you 2 workflows:

## One man on the job

This is the workflow if the code is mostly written and maintained by one person. If you're a freelancer, or you carry most of the project alone, this will most likely suit you.

(todo)

## Multi disciplined teams

If you already have experience with working with more than one person on a Magento shop - be it colleagues or freelancers - you might have run into difficulties when working together. (crappy sentence).

For this workflow, we distinguish the backend- and the frontend developer:

### Frontend Developer

### Backend Developer


The ideal workflow looks like this:

## Block Class
Each template comes accompanied with a block class. For most situations, this block class will be extended from `Magento\Framework\View\Element\Template`. Take this class for example

## Template

## Layout