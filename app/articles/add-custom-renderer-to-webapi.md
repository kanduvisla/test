---
title: Add a Custom Renderer to the Magento 2 WebAPI
date: 2017-02-21
layout: article.html
published: true
lunr: true
tags:
  - Magento 2
  - WebAPI
  - REST API
  - Renderer
---

# Add Custom Renderer to Webapi

So I recently asked an [interesting question on Magento Stack Exchange](http://magento.stackexchange.com/questions/160969/magento-2-can-the-rest-api-return-plain-text), because I was running in a problem:

I was given the task to export a plain TXT list with SKU's and a status of some sort. I wanted
to be cool and learn something new so I decided to utilize Magentos' web API functionality for
this. How cool would that be? Just call the API and get the result you expect.

However... I bumped into one of the many hidden features of Magento 2. It turns out, that when
you're using the REST API, Magento looks at the `Accept`-header you've sent in your request to
determine what the resulted outcome should be.

For instance, if I would send my request with `Accept: application/json`, I would get a JSON result,
but if I would send my request with `Accept: application/xml`, I would get an XML result. This -
of course - is a very cool and useful feature of Magento 2 (and besides that, it's a general
aspect on how a REST API is supposed to work), but in my case I wanted always to
force my output to be `text/plain`.

After a little while of trial and error I got it to work. In this article I'll share with you
how exactly I did that.

## Step 1: Add a new renderer

Magento 2 comes by default with 2 types of renderers:

- JSON
- XML

You can see this when you open the `etc/di.xml` from the web api module:

```xml
<type name="Magento\Framework\Webapi\Rest\Response\RendererFactory">
    <arguments>
        <argument name="renders" xsi:type="array">
            <item name="default" xsi:type="array">
                <item name="type" xsi:type="string">*/*</item>
                <item name="model" xsi:type="string">Magento\Framework\Webapi\Rest\Response\Renderer\Json</item>
            </item>
            <item name="application_json" xsi:type="array">
                <item name="type" xsi:type="string">application/json</item>
                <item name="model" xsi:type="string">Magento\Framework\Webapi\Rest\Response\Renderer\Json</item>
            </item>
            <item name="text_xml" xsi:type="array">
                <item name="type" xsi:type="string">text/xml</item>
                <item name="model" xsi:type="string">Magento\Framework\Webapi\Rest\Response\Renderer\Xml</item>
            </item>
            <item name="application_xml" xsi:type="array">
                <item name="type" xsi:type="string">application/xml</item>
                <item name="model" xsi:type="string">Magento\Framework\Webapi\Rest\Response\Renderer\Xml</item>
            </item>
            <item name="application_xhtml_xml" xsi:type="array">
                <item name="type" xsi:type="string">application/xhtml+xml</item>
                <item name="model" xsi:type="string">Magento\Framework\Webapi\Rest\Response\Renderer\Xml</item>
            </item>
        </argument>
    </arguments>
</type>
```

You can see that by default, 5 mime-types are registered and assigned to 2 different types of renderers:

- `*/*` (which is a wildcard) maps to the JSON renderer.
- `application/json` maps to JSON.
- `text/xml` maps to XML.
- `application/xml` maps to XML.
- `application/xhtml+xml` maps to XML.

What's missing from this list, is the mime-type for plain text (`text/plain`) and the appropriate renderer.
So let's add these to our custom module. In our `etc/di.xml` we can add our own renderers to the `RendererFactory`
like so:

```xml
<!--
    Add plain text renderer to web api:
-->
<type name="Magento\Framework\Webapi\Rest\Response\RendererFactory">
    <arguments>
        <argument name="renders" xsi:type="array">
            <item name="txt" xsi:type="array">
                <item name="type" xsi:type="string">text/plain</item>
                <item name="model" xsi:type="string">Vendor\Module\Webapi\Rest\Response\Renderer\Txt</item>
            </item>
        </argument>
    </arguments>
</type>
```

This registers a new type of renderer to the `RendererFactory`. We register it for the MIME Type `text/plain`,
and add our own customer renderer model to it (`Vendor\Module\Webapi\Rest\Response\Renderer\Txt`).

Now, how complex it might seem, a renderer for the web API is actually a very simple thing. It only has
one requirement: it should implement `Magento\Framework\Webapi\Rest\Response\RendererInterface`. So this is
what I came up with:

```php
use Magento\Framework\Webapi\Rest\Response\RendererInterface;

/**
 * Class Txt
 */
class Txt implements RendererInterface
{
    /**
     * @return string
     */
    public function getMimeType()
    {
        return 'text/plain';
    }

    /**
     * @param array|bool|float|int|null|object|string $data
     * @return string
     * @throws \Magento\Framework\Webapi\Exception
     */
    public function render($data)
    {
        if (is_string($data)) {
            return $data;
        } else {
            throw new \Magento\Framework\Webapi\Exception(
                __('Data is not text.')
            );
        }
    }
}
```

Now, this works when I explicitly set my `Accept`-header to `text/plain`. But by default, a
browser doesn't ask for `text/plain`. In fact, if you look at the default request headers sent by
Chrome you'll see the following headers:

```none
Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
```
Now if you take a look at `\Magento\Framework\Webapi\Rest\Response\RendererFactory::_getRendererClass()`,
you'll see that this method iterates over all `Accept`-types and returns the model as soon as there's a match. 
So in this example the first match with Magento 2 will be `application/xhtml+xml`, which maps to 
the XML renderer (as we've seen above).

But in my case I want to explicitly set the response header to `text/plain`. No matter what the `Accept`-header
wants. So how can I do this?
Well, we've seen how the renderer is determined: it looks at the the `Accept`-header in my request.
So where does Magento read this `Accept`-header anyway? Well, just look at the first line of 
`_getRendererClass()`:

```php
$acceptTypes = $this->_request->getAcceptTypes();
```
    
So there is a method called `getAcceptTypes()`, and if we look at where it's declared 
(`Magento\Framework\Webapi\Rest\Request::getAcceptTypes()`) we can see that it's a public method. Yay!
Now we all know what we can do! Write a plugin and modify the outcome to our bidding!

In our `etc/di.xml`, add the plugin:

```xml   
<!--
    Explicitly set request headers for txt export:
-->
<type name="Magento\Framework\Webapi\Rest\Request">
    <plugin name="force_txt_response" 
            type="Vendor\Module\Plugin\Magento\Framework\Webapi\Rest\Request"/>
</type>
```

And in our plugin, check for the right conditions that determine whether we should force our 
response to be `text/plain`:

```php
/**
 * @param \Magento\Framework\Webapi\Rest\Request $subject
 * @param array $result
 * @return array
 */
public function afterGetAcceptTypes(\Magento\Framework\Webapi\Rest\Request $subject, array $result)
{
    if ($subject->getRequestUri() === '/rest/V1/export/txt') {
        // Force text/plain:
        $result = ['text/plain'];
    }

    return $result;
}
```

Now we're all set! If we make an API request to `/rest/V1/export/txt`, our `Accept`-headers are forced to
`text/plain`, which makes sure that the `_getRendererClass()` picks our freshly added `txt`-renderer from
Magentos' `RendererFactory`. It all just adds up.