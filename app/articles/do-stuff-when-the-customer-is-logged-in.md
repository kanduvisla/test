---
title: Do Stuff when the Customer is logged in
date: 2017-02-26
layout: article.html
published: true
tags:
  - Magento 2
  - Session
  - Customers
---

# Do stuff when the customer is logged in

So recently I had this task... To make a long story short: In Magento you can do every thing in ten different ways. One of the ways of solving my task was by adding a CSS class to the `<body>`-tag, but only when the customer is logged in.

Now one of the cool things about programming is that most of the times it are the most simple tasks that can be the most cumbersome to solve. This was one of them.

## The task

So basicly, the task was simple:

> Add a class to the `<body>`-tag, but only if the customer is logged in.

Piece of cake right?

Now, once again, there are several ways to solve this. I always like to implement my solution as close to the core as possible, so I looked up where in Magento the `<body>`-tag was rendered and check if I could hook into it.

## It always starts easy...

The entry point where the `<body>`-tag is rendered is in `vendor/magento/module-theme/view/base/templates/root.phtml`. Inside this template there is a piece of code that kind of looks like this:

    <body data-container="body" <?php echo $bodyAttributes; ?>>
    
The template itself has of course more than this, but for this article that's all you need to know.

The template is rendered by `Magento\Framework\View\Result\Page::render()`. If you look in this method, you'll see that the argument `$bodyAttributes` is build like this:

    'bodyAttributes' => $this->pageConfigRenderer->renderElementAttributes($config::ELEMENT_TYPE_BODY),

`Magento\Framework\View\Page\Config\Renderer::renderElementAttributes()` is a public method, and as we all know, we can simply write a plugin to manipulate it's outcome:

`etc/frontend/di.xml`:

    <type name="Magento\Framework\View\Page\Config\Renderer">
        <plugin name="add_class_to_body"
                type="Vendor\Module\Plugin\Magento\Framework\View\Page\Config\Renderer"/>
    </type>

And `Renderer.php`:

    /**
     * @var Session
     */
    protected $customerSession;

    /**
     * Renderer constructor.
     * @param Session $customerSession
     */
    public function __construct(
        Session $customerSession
    )
    {
        $this->customerSession = $customerSession;
    }

    /**
     * @param \Magento\Framework\View\Page\Config\Renderer $subject
     * @param callable $proceed
     * @param string $elementType
     * @return string
     */
    public function aroundRenderElementAttributes(
        \Magento\Framework\View\Page\Config\Renderer $subject,
        callable $proceed,
        string $elementType
    )
    {
        $result = $proceed($elementType);

        if ($elementType === \Magento\Framework\View\Page\Config::ELEMENT_TYPE_BODY) {
            // Prepend CSS class:
            if ($this->customerSession->isLoggedIn()) {
                $result = str_replace(
                    'class="', 
                    'class="logged-in ', 
                    $result
                );
            }
        }

        return $result;
    }

I know it's not the most elegent solution but for now it does the trick.

Well, as long as you're not using full page cache that is...

## Full Page Cache and customer sessions

Full Page cache has a very interesting functionality that you should be aware of. That is: 

> If all elements in the page qualify for caching, the customer session is 'depersonalized'.

This is done to make sure that no customer details accidentally end up in the cached pages. After all, caching is your best friend and your worst enemeny.

The method responsible for this is `Magento\PageCache\Model\DepersonalizeChecker::checkIfDepersonalize()`.

What this means for us, is that whenever a page is qualified for full page caching, our customer session is depersonalized. So we can no longer check `$this->customerSession->isLoggedIn()` in our plugin to determine whether or not to add the class to the body.

To fix this we'll have to write a plugin for the depersonalizer as well:

`di.xml`:

    <type name="Magento\PageCache\Model\DepersonalizeChecker">
        <plugin name="check_logged_in"
                type="Vendor\Module\Plugin\Magento\PageCache\Model\DepersonalizeChecker"/>
    </type>

And our `DepersonalizeChecker.php`:

    /**
     * @var Session
     */
    protected $customerSession;

    /**
     * DepersonalizeChecker constructor.
     * @param Session $customerSession
     */
    public function __construct(
        Session $customerSession
    )
    {
        $this->customerSession = $customerSession;
    }

    /**
     * @param \Magento\PageCache\Model\DepersonalizeChecker $subject
     * @param bool $result
     * @return bool
     */
    public function afterCheckIfDepersonalize(
        \Magento\PageCache\Model\DepersonalizeChecker $subject,
        bool $result
    )
    {
        if ($result === true) {
            return $this->customerSession->isLoggedIn() ? false : $result;
        }

        return $result;
    }

**BEWARE OF WHAT YOU ARE DOING HERE!** Because basically you are disabling full-page cache entirely for every logged in customer. So if you are going to mess with the outcome of the depersonalizer, you'd be best of by adding some extra additions:

- Perhaps there are only some customer groups that require a body class?
- Perhaps it's only needed on certain pages?
- Perhaps it's only needed according to some other parameters?

## In conclusion

It's funny how a simple task like _'adding a class to the body if condition x == y'_ can introduce a lot more complexity than - for example - adding a new shipping carrier or something.

It's just important that you know what you're doing and what other parts of Magento it could have conflicts with.