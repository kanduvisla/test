---
title:Manipulate the price when adding to cart
---

## Using an interceptor:

`di.xml`:

```xml
<!--
    Plugin for price manipulation
-->
<type name="Magento\Quote\Model\Quote\Item\Processor">
    <plugin name="price_manipulation" type="Vendor\Module\Plugin\Magento\Quote\Model\Quote\Item\Processor"/>
</type>
```

`Processor.php`:

```php
class Processor
{
    /**
     * Manipulate the price
     *
     * @param \Magento\Quote\Model\Quote\Item\Processor $subject
     * @param \Magento\Quote\Model\Quote\Item $item
     * @param \Magento\Framework\DataObject $request
     * @param \Magento\Catalog\Model\Product $candidate
     * @return array
     */
    public function beforePrepare(
        \Magento\Quote\Model\Quote\Item\Processor $subject,
        \Magento\Quote\Model\Quote\Item $item,
        \Magento\Framework\DataObject $request,
        \Magento\Catalog\Model\Product $candidate
    ) {
        // Do your manipulation here
        $request->setData('custom_price', 999);
    
        return [$item, $request, $candidate];
    }
}
```
